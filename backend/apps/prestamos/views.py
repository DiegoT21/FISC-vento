from rest_framework import viewsets

from apps.usuarios.permissions import PuedeGestionarInventario

from .models import Prestamo
from .serializers import PrestamoSerializer


class PrestamoViewSet(viewsets.ModelViewSet):
    queryset = Prestamo.objects.select_related("activo", "prestado_a").all()
    serializer_class = PrestamoSerializer
    permission_classes = [PuedeGestionarInventario]
