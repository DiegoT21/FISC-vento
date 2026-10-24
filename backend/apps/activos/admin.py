from django.contrib import admin

from .models import Activo, Categoria, TagPorEditar


@admin.register(Activo)
class ActivoAdmin(admin.ModelAdmin):
    list_display = ["codigo", "descripcion", "categoria", "ubicacion", "estado"]
    list_filter = ["estado", "categoria", "ubicacion__departamento"]
    search_fields = ["codigo", "descripcion", "ref", "numero_serie", "marca", "modelo"]


admin.site.register(Categoria)


@admin.register(TagPorEditar)
class TagPorEditarAdmin(admin.ModelAdmin):
    list_display = ["epc", "leido_en", "leido_por"]
    search_fields = ["epc"]
