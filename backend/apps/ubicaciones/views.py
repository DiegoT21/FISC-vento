from rest_framework import viewsets

from .models import Departamento, Ubicacion
from .serializers import DepartamentoSerializer, UbicacionSerializer


class DepartamentoViewSet(viewsets.ModelViewSet):
    queryset = Departamento.objects.prefetch_related("ubicaciones").all()
    serializer_class = DepartamentoSerializer


class UbicacionViewSet(viewsets.ModelViewSet):
    queryset = Ubicacion.objects.select_related("departamento").all()
    serializer_class = UbicacionSerializer
