from rest_framework import viewsets

from apps.usuarios.permissions import EscrituraSoloAdministrador

from .models import Departamento, Ubicacion
from .serializers import DepartamentoSerializer, UbicacionSerializer


class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = Departamento.objects.prefetch_related("ubicaciones").all()
    serializer_class = DepartamentoSerializer
    permission_classes = [EscrituraSoloAdministrador]


class UbicacionViewSet(viewsets.ModelViewSet):
    queryset = Ubicacion.objects.select_related("departamento").all()
    serializer_class = UbicacionSerializer
    permission_classes = [EscrituraSoloAdministrador]
