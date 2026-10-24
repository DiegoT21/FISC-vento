from datetime import timedelta

from django.http import JsonResponse
from django.utils import timezone

from .models import Dispositivo, calcular_hash

ENCABEZADO = "HTTP_X_DISPOSITIVO_TOKEN"
SEGUNDOS_ENTRE_ACTUALIZACIONES = 60


class DispositivoMiddleware:
    """Si la peticion trae `X-Dispositivo-Token` (la app del TC22r), registra el
    ultimo uso del equipo y rechaza con 403 a los equipos desvinculados.

    Sin el encabezado (web, otros clientes) no hace nada: la vinculacion es un
    registro y no reemplaza el login por usuario y contrasena."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        token = request.META.get(ENCABEZADO)
        if token:
            dispositivo = Dispositivo.objects.filter(token_hash=calcular_hash(token)).first()
            if dispositivo is not None:
                if dispositivo.revocado:
                    return JsonResponse(
                        {
                            "detail": "Este dispositivo fue desvinculado. Vuelve a vincularlo con un QR.",
                            "codigo": "dispositivo_revocado",
                        },
                        status=403,
                    )
                ahora = timezone.now()
                if dispositivo.ultimo_uso is None or ahora - dispositivo.ultimo_uso > timedelta(
                    seconds=SEGUNDOS_ENTRE_ACTUALIZACIONES
                ):
                    Dispositivo.objects.filter(pk=dispositivo.pk).update(ultimo_uso=ahora)
        return self.get_response(request)