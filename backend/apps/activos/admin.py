from django.contrib import admin

from .models import Activo, Categoria


@admin.register(Activo)
class ActivoAdmin(admin.ModelAdmin):
    list_display = ["codigo", "descripcion", "categoria", "ubicacion", "estado"]
    list_filter = ["estado", "categoria", "ubicacion__departamento"]
    search_fields = ["codigo", "descripcion"]


admin.site.register(Categoria)
