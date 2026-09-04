from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/usuarios/", include("apps.usuarios.urls")),
    path("api/ubicaciones/", include("apps.ubicaciones.urls")),
    path("api/activos/", include("apps.activos.urls")),
    path("api/escaneo/", include("apps.escaneo.urls")),
    path("api/auditoria/", include("apps.auditoria.urls")),
    path("api/reportes/", include("apps.reportes.urls")),
    path("api/prestamos/", include("apps.prestamos.urls")),
    path("api/traslados/", include("apps.traslados.urls")),
]
