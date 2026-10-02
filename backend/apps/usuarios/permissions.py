from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import Rol


class EsAdministrador(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.rol == Rol.ADMINISTRADOR
        )


class EsAdministradorOCustodio(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.rol in {Rol.ADMINISTRADOR, Rol.CUSTODIO}
        )


def _tiene_rol(request, roles):
    user = request.user
    return bool(
        user and user.is_authenticated and (user.is_superuser or user.rol in roles)
    )


def lectura_todos_escritura_roles(*roles):
    """Cualquier usuario autenticado puede leer; solo `roles` pueden crear,
    editar o borrar. Los superusuarios de Django siempre pasan."""

    class LecturaTodosEscrituraRoles(BasePermission):
        def has_permission(self, request, view):
            if request.method in SAFE_METHODS:
                return bool(request.user and request.user.is_authenticated)
            return _tiene_rol(request, roles)

    return LecturaTodosEscrituraRoles


def solo_roles(*roles):
    """Lectura y escritura restringidas a `roles` (p. ej. Auditoría no la ve el Custodio)."""

    class SoloRoles(BasePermission):
        def has_permission(self, request, view):
            return _tiene_rol(request, roles)

    return SoloRoles


PuedeGestionarInventario = lectura_todos_escritura_roles(Rol.ADMINISTRADOR, Rol.CUSTODIO)
EscrituraSoloAdministrador = lectura_todos_escritura_roles(Rol.ADMINISTRADOR)
SoloAdministradorYAuditor = solo_roles(Rol.ADMINISTRADOR, Rol.AUDITOR)
SoloAdministradorYCustodio = solo_roles(Rol.ADMINISTRADOR, Rol.CUSTODIO)
