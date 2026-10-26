#!/usr/bin/env bash
# Deja backend/.env listo para docker-compose.prod.yml en el servidor.
# No imprime secretos y no toca un valor que ya sea el definitivo.
#
# Uso: ./scripts/preparar_env_produccion.sh <ip-o-dominio>
# Pruebas: FISC_ENV_FILE=/tmp/un.env ./scripts/preparar_env_produccion.sh 10.0.0.1
set -euo pipefail

cd "$(dirname "$0")/.."

HOST_PUBLICO="${1:?Falta el host público (IP o dominio del servidor)}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Hace falta python3 en el servidor para preparar backend/.env." >&2
  exit 1
fi

python3 - "$HOST_PUBLICO" <<'PY'
import os
import pathlib
import re
import secrets
import sys

host = sys.argv[1].strip()
if not re.fullmatch(r"[A-Za-z0-9._:-]+", host):
    sys.exit("Host público inválido. Usa una IP o un dominio, sin espacios ni barras.")

ruta = pathlib.Path(os.environ.get("FISC_ENV_FILE", "backend/.env"))
if not ruta.exists():
    ejemplo = pathlib.Path("backend/.env.example")
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_text(ejemplo.read_text(encoding="utf-8") if ejemplo.exists() else "", encoding="utf-8")
    print(f"Se creó {ruta} a partir del ejemplo.")

texto = ruta.read_text(encoding="utf-8")

def leer(clave):
    valor = None
    for linea in texto.splitlines():
        coincidencia = re.match(rf"^\s*{re.escape(clave)}\s*=(.*)$", linea)
        if coincidencia:
            valor = coincidencia.group(1).strip().strip('"').strip("'")
    return valor

def actualizar(clave, valor):
    global texto
    nueva = f"{clave}={valor}"
    visto = False
    salida = []
    for linea in texto.splitlines():
        if re.match(rf"^\s*{re.escape(clave)}\s*=", linea):
            if not visto:
                salida.append(nueva)
                visto = True
        else:
            salida.append(linea)
    if not visto:
        if salida and salida[-1].strip():
            salida.append("")
        salida.append(nueva)
    texto = "\n".join(salida).rstrip() + "\n"

clave = leer("DJANGO_SECRET_KEY") or ""
debil = len(clave) < 50 or clave.startswith(("insecure", "django-insecure", "change-me"))
if debil:
    actualizar("DJANGO_SECRET_KEY", secrets.token_urlsafe(64))
    print("DJANGO_SECRET_KEY era débil o faltaba: se generó una nueva en el servidor (no se muestra).")
else:
    print("DJANGO_SECRET_KEY ya es fuerte: no se cambia.")

hosts_de_desarrollo = {"", "localhost", "127.0.0.1", "localhost,127.0.0.1", "*"}
hosts = (leer("DJANGO_ALLOWED_HOSTS") or "").replace(" ", "")
if hosts in hosts_de_desarrollo:
    actualizar("DJANGO_ALLOWED_HOSTS", f"{host},localhost,127.0.0.1")
    print(f"DJANGO_ALLOWED_HOSTS={host},localhost,127.0.0.1")
else:
    print("DJANGO_ALLOWED_HOSTS ya estaba definido: no se cambia.")

if not (leer("DJANGO_CSRF_TRUSTED_ORIGINS") or "").strip():
    # El 80 y el 5173 publican la misma Nginx. El admin comprueba el origen.
    actualizar("DJANGO_CSRF_TRUSTED_ORIGINS", f"http://{host},http://{host}:5173")
    print(f"DJANGO_CSRF_TRUSTED_ORIGINS=http://{host},http://{host}:5173")
else:
    print("DJANGO_CSRF_TRUSTED_ORIGINS ya estaba definido: no se cambia.")

if not (leer("DJANGO_CORS_ALLOWED_ORIGINS") or "").strip() or (leer("DJANGO_CORS_ALLOWED_ORIGINS") or "").startswith("http://localhost"):
    # El ejemplo de desarrollo apunta a Vite en localhost. En el servidor
    # el navegador y la API comparten origen; se deja el host público.
    origen_actual = leer("DJANGO_CORS_ALLOWED_ORIGINS") or ""
    if origen_actual.startswith("http://localhost") or not origen_actual.strip():
        actualizar("DJANGO_CORS_ALLOWED_ORIGINS", f"http://{host},http://{host}:5173")
        print(f"DJANGO_CORS_ALLOWED_ORIGINS=http://{host},http://{host}:5173")
else:
    print("DJANGO_CORS_ALLOWED_ORIGINS ya estaba definido: no se cambia.")

if (leer("DJANGO_SECURE_SSL") or "").strip() == "":
    # HTTP hasta que haya certificado. El default del settings es 1 (HTTPS)
    # para que las pruebas sigan exigiendo la postura segura.
    actualizar("DJANGO_SECURE_SSL", "0")
    print("DJANGO_SECURE_SSL=0 (HTTP). Pasarlo a 1 cuando se active el certificado.")
else:
    print(f"DJANGO_SECURE_SSL={leer('DJANGO_SECURE_SSL')}: no se cambia.")

ruta.write_text(texto, encoding="utf-8")
ruta.chmod(0o600)
print(f"Listo: {ruta} (permisos 600).")
PY
