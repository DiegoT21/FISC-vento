from rest_framework.authentication import BaseAuthentication

from .models import Dispositivo, calcular_hash


class AutenticacionDispositivo(BaseAuthentication):
    """El QR de vinculación es el ingreso del equipo.

    Un `X-Dispositivo-Token` válido autentica como la persona que generó el
    código en la web. No crea ni pisa el token de login de esa persona.
    """

    def authenticate(self, request):
        token = request.META.get("HTTP_X_DISPOSITIVO_TOKEN")
        if not token:
            return None
        dispositivo = (
            Dispositivo.objects.select_related("vinculado_por")
            .filter(token_hash=calcular_hash(token), revocado=False)
            .first()
        )
        usuario = dispositivo.vinculado_por if dispositivo is not None else None
        if usuario is None or not usuario.is_active:
            return None
        return usuario, dispositivo
