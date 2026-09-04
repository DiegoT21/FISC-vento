from rest_framework.routers import DefaultRouter

from .views import PrestamoViewSet

router = DefaultRouter()
router.register("", PrestamoViewSet, basename="prestamo")

urlpatterns = router.urls
