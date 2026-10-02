from django.urls import path

from . import views

urlpatterns = [
    path("por-estado/", views.resumen_por_estado, name="reportes-por-estado"),
    path("por-ubicacion/", views.resumen_por_ubicacion, name="reportes-por-ubicacion"),
    path("por-categoria/", views.resumen_por_categoria, name="reportes-por-categoria"),
    path("resumen/", views.resumen_general, name="reportes-resumen"),
]
