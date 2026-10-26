import os

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403


def _bandera(nombre, default):
    """Lee una variable de entorno como sí/no.

    Si falta o está vacía se usa `default`. Las pruebas de producción no
    definen estas variables y deben seguir viendo la postura segura
    (sin DEBUG, con HTTPS). En los servidores, el compose y
    `scripts/preparar_env_produccion.sh` las dejan explícitas.
    """
    valor = os.environ.get(nombre)
    if valor is None or not valor.strip():
        return default
    return valor.strip().lower() in {"1", "true", "yes", "on"}


# base.py cae a una clave de desarrollo si falta la variable; en producción eso
# permitiría falsificar sesiones y tokens firmados, así que no se arranca.
if len(SECRET_KEY) < 50 or SECRET_KEY.startswith(("insecure", "django-insecure", "change-me")):  # noqa: F405
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY no está definida o es demasiado débil (mínimo 50 caracteres) para producción."
    )

# El compose de producción fuerza DJANGO_DEBUG=0. El default ya es apagado.
DEBUG = _bandera("DJANGO_DEBUG", False)

ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",")
    if host.strip()
]

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("DJANGO_CORS_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",")
    if origin.strip()
]

# Nginx termina la conexión del navegador y habla HTTP con Gunicorn.
# Sin esta cabecera, al activar HTTPS Django vería el HTTP interno y
# redirigiría en bucle.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# DJANGO_SECURE_SSL=0 mientras no haya certificado. Al activar TLS, pasarlo
# a 1: redirige a HTTPS, marca las cookies y envía HSTS.
_https = _bandera("DJANGO_SECURE_SSL", True)
SECURE_SSL_REDIRECT = _https
SESSION_COOKIE_SECURE = _https
CSRF_COOKIE_SECURE = _https
if _https:
    SECURE_HSTS_SECONDS = 60 * 60 * 24 * 7
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
else:
    SECURE_HSTS_SECONDS = 0
