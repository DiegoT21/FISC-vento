"""Higiene del repositorio: secretos, archivos que no deben versionarse y
patrones peligrosos en el frontend. Se salta sola si no hay un repositorio git
(por ejemplo, dentro de la imagen de Docker del backend)."""
import re
import subprocess
import unittest
from pathlib import Path

from django.conf import settings
from django.test import SimpleTestCase

RAIZ = Path(settings.BASE_DIR).parent


def _archivos_versionados():
    try:
        salida = subprocess.run(
            ["git", "ls-files", "-z"], cwd=RAIZ, capture_output=True, timeout=30, check=True
        ).stdout.decode("utf-8", errors="replace")
    except (OSError, subprocess.SubprocessError):
        return None
    return [p for p in salida.split("\0") if p]


ARCHIVOS = _archivos_versionados()
SECRETOS = {
    "clave de acceso de AWS": re.compile(r"AKIA[0-9A-Z]{16}"),
    "clave privada": re.compile(r"-----BEGIN (?:RSA |OPENSSH |EC |DSA |PGP )?PRIVATE KEY-----"),
    "token de GitHub": re.compile(r"gh[pousr]_[A-Za-z0-9]{36,}"),
    "token de Slack": re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}"),
    "clave de API de Google": re.compile(r"AIza[0-9A-Za-z_-]{35}"),
}
EXTENSIONES_BINARIAS = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".pdf", ".woff", ".woff2", ".ttf", ".zip", ".gz"}


@unittest.skipIf(ARCHIVOS is None, "no es un repositorio git")
class HigieneDelRepositorioTests(SimpleTestCase):
    def test_no_se_versionan_archivos_de_entorno_ni_llaves(self):
        prohibidos = []
        for ruta in ARCHIVOS:
            nombre = Path(ruta).name
            if (nombre == ".env" or (nombre.startswith(".env.") and nombre != ".env.example")
                    or nombre.endswith((".pem", ".key", ".p12", ".pfx", ".sqlite3", ".sql", ".dump", ".sql.gz"))
                    or nombre in {"id_rsa", "id_ed25519"}):
                prohibidos.append(ruta)
        self.assertEqual(prohibidos, [], "archivos sensibles versionados")

    def test_no_hay_secretos_incrustados_en_el_codigo(self):
        hallazgos = []
        for ruta in ARCHIVOS:
            archivo = RAIZ / ruta
            if archivo.suffix.lower() in EXTENSIONES_BINARIAS or not archivo.is_file():
                continue
            if ruta.startswith("backend/pruebas_seguridad/"):
                continue  # este mismo archivo contiene los patrones
            try:
                texto = archivo.read_text(encoding="utf-8")
            except (UnicodeDecodeError, OSError):
                continue
            for nombre, patron in SECRETOS.items():
                if patron.search(texto):
                    hallazgos.append(f"{ruta}: {nombre}")
        self.assertEqual(hallazgos, [])

    def test_los_workflows_no_incluyen_credenciales_en_claro(self):
        for ruta in ARCHIVOS:
            if not ruta.startswith(".github/workflows/"):
                continue
            texto = (RAIZ / ruta).read_text(encoding="utf-8")
            with self.subTest(workflow=ruta):
                for linea in texto.splitlines():
                    if re.search(r"(?i)\b(key|password|secret|token)\b\s*:\s*['\"]?[A-Za-z0-9+/=_-]{16,}", linea):
                        # Solo se admiten referencias a secretos de GitHub.
                        self.assertIn("secrets.", linea, f"posible credencial en claro: {linea.strip()[:80]}")

    def test_el_frontend_no_usa_apis_que_habilitan_xss(self):
        peligrosos = ("dangerouslySetInnerHTML", "innerHTML", "outerHTML", "document.write", "eval(", "new Function(", "insertAdjacentHTML")
        hallazgos = []
        for ruta in ARCHIVOS:
            if not (ruta.startswith("frontend/src/") and ruta.endswith((".js", ".jsx", ".ts", ".tsx"))):
                continue
            texto = (RAIZ / ruta).read_text(encoding="utf-8", errors="replace")
            for patron in peligrosos:
                if patron in texto:
                    hallazgos.append(f"{ruta}: {patron}")
        self.assertEqual(hallazgos, [])

    def test_el_frontend_no_escribe_el_token_en_la_consola(self):
        for ruta in ARCHIVOS:
            if not (ruta.startswith("frontend/src/") and ruta.endswith((".js", ".jsx"))):
                continue
            texto = (RAIZ / ruta).read_text(encoding="utf-8", errors="replace")
            with self.subTest(archivo=ruta):
                self.assertNotRegex(texto, r"console\.(log|debug|info)\([^)]*(token|password|contrase)", ruta)

    def test_gitignore_cubre_entornos_y_copias_de_base_de_datos(self):
        contenido = (RAIZ / ".gitignore").read_text(encoding="utf-8")
        for esperado in (".env", "backups"):
            with self.subTest(patron=esperado):
                self.assertIn(esperado, contenido)
