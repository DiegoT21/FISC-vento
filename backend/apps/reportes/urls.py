from django.urls import path

from . import views

urlpatterns = [
    path("resumen/", views.resumen, name="reportes-resumen"),
    path("por-estado/", views.resumen_por_estado, name="reportes-por-estado"),
    path("por-ubicacion/", views.resumen_por_ubicacion, name="reportes-por-ubicacion"),
]
