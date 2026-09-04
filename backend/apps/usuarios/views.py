from rest_framework import viewsets

from .models import Usuario
from .permissions import EsAdministrador
from .serializers import UsuarioSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by("username")
    serializer_class = UsuarioSerializer
    permission_classes = [EsAdministrador]
