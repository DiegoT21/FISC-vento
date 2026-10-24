from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from urllib.parse import quote

from apps.usuarios.models import Rol
from apps.usuarios.permissions import solo_roles

from .models import CodigoVinculacion, Dispositivo, MINUTOS_VIGENCIA_CODIGO
from .serializers import DispositivoSerializer, GenerarVinculacionSerializer, VincularSerializer
from .throttles import VinculacionRateThrottle

SoloAdministrador = solo_roles(Rol.ADMINISTRADOR)

ESQUEMA_QR = "fiscvento://vincular"


def construir_payload(url_base, codigo):
    """Formato fijo del QR: fiscvento://vincular?u=<url urlencoded>&c=<codigo>."""
    return f"{ESQUEMA_QR}?u={quote(url_base, safe='')}&c={codigo}"


@api_view(["POST"])
@permission_classes([SoloAdministrador])
def generar_vinculacion(request):
    """Crea un codigo de un solo uso (vigente 10 min) y el texto que va en el QR."""
    datos = GenerarVinculacionSerializer(data=request.data)
    datos.is_valid(raise_exception=True)
    url_base = datos.validated_data.get("url_base") or request.build_absolute_uri("/")
    if not url_base.endswith("/"):
        url_base += "/"

    codigo, registro = CodigoVinculacion.generar(request.user)
    return Response(
        {
            "codigo": codigo,
            "expira_en": registro.expira_en,
            "vigencia_segundos": MINUTOS_VIGENCIA_CODIGO * 60,
            "payload": construir_payload(url_base, codigo),
        },
        status=201,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([VinculacionRateThrottle])
def vincular_dispositivo(request):
    """Publico: el TC22r canjea el codigo del QR y queda registrado."""
    datos = VincularSerializer(data=request.data)
    datos.is_valid(raise_exception=True)
    d = datos.validated_data

    registro = CodigoVinculacion.consumir(d["codigo"])
    if registro is None:
        # Mismo mensaje para inexistente, usado o vencido: no revela cual fue.
        return Response({"detail": "El código de vinculación no es válido o ya venció."}, status=400)

    dispositivo, token = Dispositivo.registrar(
        nombre=d["nombre_dispositivo"],
        modelo=d["modelo"],
        android_id=d["android_id"],
        vinculado_por=registro.creado_por,
    )
    return Response(
        {
            "dispositivo": {"id": dispositivo.id, "nombre": dispositivo.nombre},
            # Se muestra una sola vez; en base solo queda su hash.
            "token_dispositivo": token,
        },
        status=201,
    )


class DispositivoListView(generics.ListAPIView):
    permission_classes = [SoloAdministrador]
    serializer_class = DispositivoSerializer
    queryset = Dispositivo.objects.select_related("vinculado_por")


@api_view(["POST"])
@permission_classes([SoloAdministrador])
def revocar_dispositivo(request, pk):
    dispositivo = get_object_or_404(Dispositivo, pk=pk)
    if not dispositivo.revocado:
        dispositivo.revocado = True
        dispositivo.revocado_en = timezone.now()
        dispositivo.save(update_fields=["revocado", "revocado_en"])
    return Response(DispositivoSerializer(dispositivo).data)