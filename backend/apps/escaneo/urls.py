from django.urls import path

from . import views

urlpatterns = [
    path("activos/<int:activo_id>/qr/", views.qr_de_activo, name="escaneo-qr"),
    path("activos/<int:activo_id>/barras/", views.barras_de_activo, name="escaneo-barras"),
    path("escanear/", views.escanear, name="escaneo-escanear"),
]
