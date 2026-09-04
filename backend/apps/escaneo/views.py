from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.activos.models import Activo
from apps.activos.serializers import ActivoSerializer

from .services import buscar_por_codigo, generar_codigo_barras, generar_qr


@api_view(["GET"])
def qr_de_activo(request, activo_id):
    activo = get_object_or_404(Activo, pk=activo_id)
    imagen = generar_qr(activo)
    return HttpResponse(imagen.getvalue(), content_type="image/png")


@api_view(["GET"])
def barras_de_activo(request, activo_id):
    activo = get_object_or_404(Activo, pk=activo_id)
    imagen = generar_codigo_barras(activo)
    return HttpResponse(imagen.getvalue(), content_type="image/png")


@api_view(["POST"])
def escanear(request):
    """Recibe { "valor": "<lo leído por cámara QR/barras o por el lector RFID>" }
    y devuelve el Activo correspondiente, si existe."""
    valor = request.data.get("valor", "")
    activo = buscar_por_codigo(valor)
    if activo is None:
        return Response({"detail": "No se encontró un activo con ese código."}, status=404)
    return Response(ActivoSerializer(activo).data)
