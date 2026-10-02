from rest_framework import viewsets

from apps.usuarios.permissions import SoloAdministradorYCustodio

from .models import SolicitudTraslado
from .serializers import SolicitudTrasladoSerializer


class SolicitudTrasladoViewSet(viewsets.ModelViewSet):
    queryset = SolicitudTraslado.objects.select_related(
        "activo", "ubicacion_origen", "ubicacion_destino", "solicitado_por"
    ).all()
    serializer_class = SolicitudTrasladoSerializer
    permission_classes = [SoloAdministradorYCustodio]
