from django.urls import path

from . import views

urlpatterns = [
    path("", views.DispositivoListView.as_view(), name="dispositivo-lista"),
    path("vinculacion/", views.generar_vinculacion, name="dispositivo-vinculacion"),
    path("vincular/", views.vincular_dispositivo, name="dispositivo-vincular"),
    path("<int:pk>/revocar/", views.revocar_dispositivo, name="dispositivo-revocar"),
]