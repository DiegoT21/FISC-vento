from rest_framework import mixins, viewsets
from django_filters.rest_framework import DjangoFilterBackend

from apps.usuarios.permissions import SoloAdministradorYAuditor

from .models import RegistroAuditoria
from .serializers import RegistroAuditoriaSerializer


class RegistroAuditoriaViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Solo lectura: el log de auditoría no se edita a mano."""

    queryset = RegistroAuditoria.objects.select_related("usuario").all()
    serializer_class = RegistroAuditoriaSerializer
    permission_classes = [SoloAdministradorYAuditor]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["tabla", "objeto_id"]
