from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets

from apps.usuarios.permissions import EscrituraSoloAdministrador, PuedeGestionarInventario

from .models import Activo, Categoria, DocumentoActivo
from .serializers import ActivoSerializer, CategoriaSerializer, DocumentoActivoSerializer


class CategoriaViewSet(viewsets.ModelViewSet):
    permission_classes = [PuedeGestionarInventario]
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer


class ActivoViewSet(viewsets.ModelViewSet):
    queryset = Activo.objects.select_related(
        "categoria", "ubicacion__departamento", "responsable"
    ).all()
    serializer_class = ActivoSerializer

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["categoria", "estado", "ubicacion", "origen"]
    search_fields = [
        "codigo",
        "descripcion",
        "ref",
        "numero_serie",
        "marca",
        "modelo",
        "tag_rfid",
    ]
    ordering_fields = ["codigo", "creado_en", "estado"]

    def get_permissions(self):
        # Crear y editar: Administrador y Custodio. Borrar: solo Administrador.
        if self.action == "destroy":
            return [EscrituraSoloAdministrador()]
        return [PuedeGestionarInventario()]


class DocumentoActivoViewSet(viewsets.ModelViewSet):
    permission_classes = [PuedeGestionarInventario]
    queryset = DocumentoActivo.objects.all()
    serializer_class = DocumentoActivoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["activo"]
