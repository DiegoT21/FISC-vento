from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    ActivoViewSet,
    CategoriaViewSet,
    DocumentoActivoViewSet,
    descartar_tag_por_editar,
    tags_por_editar,
)

router = DefaultRouter()
router.register("categorias", CategoriaViewSet, basename="categoria")
router.register("documentos", DocumentoActivoViewSet, basename="documento")
router.register("", ActivoViewSet, basename="activo")

# Antes del router: si no, "por-editar" lo tomaría el detalle de un activo.
urlpatterns = [
    path("por-editar/", tags_por_editar, name="activo-por-editar"),
    path("por-editar/<int:pk>/", descartar_tag_por_editar, name="activo-por-editar-detalle"),
] + router.urls
