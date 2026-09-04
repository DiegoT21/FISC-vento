from rest_framework import filters, viewsets

from .models import Activo, Categoria
from .serializers import ActivoSerializer, CategoriaSerializer


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer


class ActivoViewSet(viewsets.ModelViewSet):
    queryset = Activo.objects.select_related("categoria", "ubicacion", "responsable").all()
    serializer_class = ActivoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["codigo", "descripcion"]
    ordering_fields = ["codigo", "creado_en", "estado"]
