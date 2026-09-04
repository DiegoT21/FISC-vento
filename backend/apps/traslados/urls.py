from rest_framework.routers import DefaultRouter

from .views import SolicitudTrasladoViewSet

router = DefaultRouter()
router.register("", SolicitudTrasladoViewSet, basename="traslado")

urlpatterns = router.urls
