from django.db.models import Count
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.activos.models import Activo


@api_view(["GET"])
def resumen_por_estado(request):
    """Conteo de activos agrupados por estado — alimenta las stat cards
    del Dashboard del frontend."""
    datos = Activo.objects.values("estado").annotate(total=Count("id"))
    return Response(list(datos))


@api_view(["GET"])
def resumen_por_ubicacion(request):
    datos = Activo.objects.values(
        "ubicacion__departamento__nombre", "ubicacion__nombre"
    ).annotate(total=Count("id"))
    return Response(list(datos))
