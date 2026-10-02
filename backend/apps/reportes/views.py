from django.db.models import Count, Q
from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.activos.models import Activo, EstadoActivo
from apps.prestamos.models import EstadoPrestamo, Prestamo
from apps.traslados.models import EstadoTraslado, SolicitudTraslado
from apps.usuarios.models import Rol
from apps.usuarios.permissions import tiene_rol


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
def resumen(request):
    """Todo lo que necesita el Panel principal en una sola petición.

    `traslados_pendientes` es `null` para los roles que no tienen acceso al
    módulo de Traslados (Auditor): así el panel no filtra datos que la API
    de traslados les negaría."""
    activos = Activo.objects.aggregate(
        total=Count("id"),
        activos=Count("id", filter=Q(estado=EstadoActivo.ACTIVO)),
        inactivos=Count("id", filter=Q(estado=EstadoActivo.INACTIVO)),
        inoperativos=Count("id", filter=Q(estado=EstadoActivo.INOPERATIVO)),
        sin_responsable=Count("id", filter=Q(responsable__isnull=True)),
        sin_rfid=Count("id", filter=Q(tag_rfid__isnull=True)),
    )
    ve_traslados = tiene_rol(request, {Rol.ADMINISTRADOR, Rol.CUSTODIO})
    traslados = (
        SolicitudTraslado.objects.filter(estado=EstadoTraslado.PENDIENTE).count()
        if ve_traslados
        else None
    )
    return Response(
        {
            **activos,
            "traslados_pendientes": traslados,
            "prestamos_activos": Prestamo.objects.filter(estado=EstadoPrestamo.ACTIVO).count(),
        }
    )
