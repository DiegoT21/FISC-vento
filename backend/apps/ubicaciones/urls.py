from rest_framework.routers import DefaultRouter

from .views import DepartamentoViewSet, UbicacionViewSet

router = DefaultRouter()
router.register("departamentos", DepartamentoViewSet, basename="departamento")
router.register("", UbicacionViewSet, basename="ubicacion")

urlpatterns = router.urls
