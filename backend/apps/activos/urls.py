from rest_framework.routers import DefaultRouter

from .views import ActivoViewSet, CategoriaViewSet, DocumentoActivoViewSet

router = DefaultRouter()
router.register("categorias", CategoriaViewSet, basename="categoria")
router.register("documentos", DocumentoActivoViewSet, basename="documento")
router.register("", ActivoViewSet, basename="activo")

urlpatterns = router.urls
