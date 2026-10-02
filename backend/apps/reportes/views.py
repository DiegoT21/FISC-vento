from django.db.models import Count, F
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.activos.models import Activo, EstadoActivo


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


@api_view(["GET"])
def resumen_por_categoria(request):
    datos = Activo.objects.values("categoria__nombre").annotate(total=Count("id")).order_by("-total")
    return Response(list(datos))


@api_view(["GET"])
def resumen_general(request):
    """Todo lo que necesitan el Dashboard y Reportes en una sola llamada:
    total, conteo por estado, por departamento y por categoría."""
    por_estado = {e: 0 for e in EstadoActivo.values}
    for fila in Activo.objects.values("estado").annotate(total=Count("id")):
        por_estado[fila["estado"]] = fila["total"]
    por_departamento = list(
        Activo.objects.values(nombre=F("ubicacion__departamento__nombre"))
        .annotate(total=Count("id"))
        .order_by("-total")
    )
    por_categoria = list(
        Activo.objects.values(nombre=F("categoria__nombre"))
        .annotate(total=Count("id"))
        .order_by("-total")
    )
    return Response(
        {
            "total": sum(por_estado.values()),
            "por_estado": por_estado,
            "por_departamento": por_departamento,
            "por_categoria": por_categoria,
        }
    )
