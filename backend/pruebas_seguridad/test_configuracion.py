import json
import os
import subprocess
import sys
from pathlib import Path

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

CLAVE_FUERTE = "x7Kp2mQ9vL4nR8sT1wY6zA3cE5gH0jB2dF4kM7pS9uW1yZ3bN8hG5fD2sA6qX0"

LECTURA_DE_AJUSTES = """
import json
from config.settings import prod as s
print(json.dumps({
    "debug": s.DEBUG,
    "hosts": s.ALLOWED_HOSTS,
    "cors_todos": getattr(s, "CORS_ALLOW_ALL_ORIGINS", False),
    "cors": s.CORS_ALLOWED_ORIGINS,
    "ssl": s.SECURE_SSL_REDIRECT,
    "cookie_sesion": s.SESSION_COOKIE_SECURE,
    "cookie_csrf": s.CSRF_COOKIE_SECURE,
    "hsts": s.SECURE_HSTS_SECONDS,
}))
"""


def _correr_en_produccion(codigo, **entorno):
    """Ejecuta `codigo` con los ajustes de producción en un proceso aparte, para
    no contaminar la configuración de las demás pruebas."""
    env = {k: v for k, v in os.environ.items() if not k.startswith("DJANGO_")}
    env["DJANGO_SETTINGS_MODULE"] = "config.settings.prod"
    env.update(entorno)
    return subprocess.run([sys.executable, "-c", codigo], cwd=settings.BASE_DIR, env=env, capture_output=True, text=True, timeout=120)


ENTORNO_VALIDO = {
    "DJANGO_SECRET_KEY": CLAVE_FUERTE,
    "DJANGO_ALLOWED_HOSTS": "app.fisc.example",
    "DJANGO_CORS_ALLOWED_ORIGINS": "https://app.fisc.example",
}


class AjustesDeProduccionTests(SimpleTestCase):
    def _ajustes(self):
        r = _correr_en_produccion(LECTURA_DE_AJUSTES, **ENTORNO_VALIDO)
        self.assertEqual(r.returncode, 0, r.stderr[-800:])
        return json.loads(r.stdout.strip().splitlines()[-1])

    def test_produccion_no_corre_en_modo_debug(self):
        self.assertFalse(self._ajustes()["debug"])

    def test_solo_acepta_los_hosts_configurados(self):
        hosts = self._ajustes()["hosts"]
        self.assertEqual(hosts, ["app.fisc.example"])
        self.assertNotIn("*", hosts)
        self.assertNotIn("", hosts)

    def test_cors_no_esta_abierto_a_cualquier_origen(self):
        ajustes = self._ajustes()
        self.assertFalse(ajustes["cors_todos"])
        self.assertEqual(ajustes["cors"], ["https://app.fisc.example"])

    def test_cookies_seguras_https_y_hsts(self):
        ajustes = self._ajustes()
        self.assertTrue(ajustes["ssl"])
        self.assertTrue(ajustes["cookie_sesion"])
        self.assertTrue(ajustes["cookie_csrf"])
        self.assertGreaterEqual(ajustes["hsts"], 60 * 60 * 24 * 7)

    def test_se_niega_a_arrancar_sin_clave_secreta(self):
        entorno = {k: v for k, v in ENTORNO_VALIDO.items() if k != "DJANGO_SECRET_KEY"}
        r = _correr_en_produccion(LECTURA_DE_AJUSTES, **entorno)
        self.assertNotEqual(r.returncode, 0, "producción arrancó con la clave secreta de desarrollo")
        self.assertIn("ImproperlyConfigured", r.stderr)

    def test_se_niega_a_arrancar_con_clave_secreta_debil(self):
        for clave in ("change-me", "insecure-dev-key-override-in-prod", "corta"):
            with self.subTest(clave=clave):
                r = _correr_en_produccion(LECTURA_DE_AJUSTES, **{**ENTORNO_VALIDO, "DJANGO_SECRET_KEY": clave})
                self.assertNotEqual(r.returncode, 0)
                self.assertIn("ImproperlyConfigured", r.stderr)

    def test_check_deploy_de_django_no_reporta_fallos_criticos(self):
        codigo = "import django; django.setup(); from django.core.management import call_command; call_command('check', deploy=True)"
        r = _correr_en_produccion(codigo, **ENTORNO_VALIDO)
        salida = r.stdout + r.stderr
        for identificador in ("security.W004", "security.W008", "security.W009", "security.W012", "security.W016", "security.W018", "security.W020"):
            with self.subTest(aviso=identificador):
                self.assertNotIn(identificador, salida)


class AjustesComunesTests(SimpleTestCase):
    def test_middleware_de_seguridad_activo(self):
        for requerido in (
            "django.middleware.security.SecurityMiddleware",
            "django.middleware.csrf.CsrfViewMiddleware",
            "django.middleware.clickjacking.XFrameOptionsMiddleware",
            "django.contrib.auth.middleware.AuthenticationMiddleware",
        ):
            with self.subTest(middleware=requerido):
                self.assertIn(requerido, settings.MIDDLEWARE)

    def test_las_contrasenas_se_guardan_con_un_algoritmo_lento_y_con_sal(self):
        primero = settings.PASSWORD_HASHERS[0].lower()
        self.assertTrue(any(a in primero for a in ("pbkdf2", "argon2", "bcrypt", "scrypt")), primero)
        for debil in ("md5", "sha1", "crypt", "unsalted"):
            self.assertNotIn(debil, primero)

    def test_las_contrasenas_debiles_se_rechazan(self):
        for debil in ("12345678", "password", "abc", "qwertyui", "11111111"):
            with self.subTest(clave=debil):
                with self.assertRaises(ValidationError):
                    validate_password(debil)
        validate_password(CLAVE_FUERTE)

    def test_cookies_de_sesion_no_son_accesibles_desde_javascript(self):
        self.assertTrue(settings.SESSION_COOKIE_HTTPONLY)
        self.assertEqual(settings.X_FRAME_OPTIONS, "DENY")

    def test_el_login_tiene_limite_de_intentos_configurado(self):
        tasas = settings.REST_FRAMEWORK.get("DEFAULT_THROTTLE_RATES", {})
        self.assertIn("login", tasas)

    def test_la_api_exige_autenticacion_por_defecto(self):
        self.assertIn("rest_framework.permissions.IsAuthenticated", settings.REST_FRAMEWORK["DEFAULT_PERMISSION_CLASSES"])

    def test_la_clave_de_desarrollo_no_es_la_de_los_ejemplos_publicos(self):
        # No hay forma de saber qué clave usa el servidor; al menos el ejemplo
        # versionado no debe ser una clave real.
        ejemplo = (Path(settings.BASE_DIR).parent / ".env.example")
        if ejemplo.exists():
            self.assertNotRegex(ejemplo.read_text(), r"DJANGO_SECRET_KEY=[A-Za-z0-9]{32,}")
