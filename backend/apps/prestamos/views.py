from rest_framework import viewsets

from .models import Prestamo
from .serializers import PrestamoSerializer


class PrestamoViewSet(viewsets.ModelViewSet):
    queryset = Prestamo.objects.select_related("activo", "prestado_a").all()
    serializer_class = PrestamoSerializer
