import os

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403

# base.py cae a una clave de desarrollo si falta la variable; en producción eso
# permitiría falsificar sesiones y tokens firmados, así que no se arranca.
if len(SECRET_KEY) < 50 or SECRET_KEY.startswith(("insecure", "django-insecure", "change-me")):  # noqa: F405
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY no está definida o es demasiado débil (mínimo 50 caracteres) para producción."
    )

DEBUG = False
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",")

CORS_ALLOWED_ORIGINS = [
    origin
    for origin in os.environ.get("DJANGO_CORS_ALLOWED_ORIGINS", "").split(",")
    if origin
]

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 7
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
