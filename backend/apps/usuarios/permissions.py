from rest_framework.permissions import BasePermission

from .models import Rol


class EsAdministrador(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.rol == Rol.ADMINISTRADOR)


class EsAdministradorOCustodio(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.rol in {Rol.ADMINISTRADOR, Rol.CUSTODIO}
        )
