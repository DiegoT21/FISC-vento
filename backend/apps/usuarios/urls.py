from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views
from .views import UsuarioViewSet

router = DefaultRouter()
router.register("", UsuarioViewSet, basename="usuario")

urlpatterns = [
    path("login/", views.login_view, name="usuario-login"),
    path("logout/", views.logout_view, name="usuario-logout"),
    path("me/", views.me_view, name="usuario-me"),
] + router.urls
