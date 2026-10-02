import re

from django.urls import URLResolver, get_resolver

from apps.usuarios.models import Rol, Usuario

# Rutas de la API que, por diseño, no exigen autenticación.
RUTAS_PUBLICAS = {"api/usuarios/login/"}

CLAVE = "Clave-segura-123"


def crear_usuarios():
    """Un usuario por rol, con contraseña conocida."""
    return {
        rol: Usuario.objects.create_user(username=f"seg_{rol.lower()}", password=CLAVE, rol=rol)
        for rol in (Rol.ADMINISTRADOR, Rol.CUSTODIO, Rol.AUDITOR)
    }


def _aplanar(patrones, prefijo=""):
    for patron in patrones:
        fragmento = str(patron.pattern)
        if isinstance(patron, URLResolver):
            yield from _aplanar(patron.url_patterns, prefijo + fragmento)
        else:
            yield prefijo + fragmento


def rutas_api():
    """Todas las rutas `api/...` registradas, con los parámetros sustituidos
    por un id de ejemplo. Se descubren desde el resolvedor de URLs para que una
    ruta nueva quede cubierta sin tocar estas pruebas."""
    rutas = set()
    for ruta in _aplanar(get_resolver().url_patterns):
        if "format" in ruta:  # variantes con sufijo (.json) del router de DRF
            continue
        ruta = re.sub(r"\(\?P<\w+>[^)]*\)", "1", ruta)  # regex de DRF
        ruta = re.sub(r"<(?:\w+:)?\w+>", "1", ruta)  # path() de Django
        ruta = ruta.replace("^", "").replace("$", "")
        if ruta.startswith("api/"):
            rutas.add(ruta)
    return sorted(rutas)
