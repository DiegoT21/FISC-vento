from rest_framework.routers import DefaultRouter

from .views import ActivoViewSet, CategoriaViewSet

router = DefaultRouter()
router.register("categorias", CategoriaViewSet, basename="categoria")
router.register("", ActivoViewSet, basename="activo")

urlpatterns = router.urls
