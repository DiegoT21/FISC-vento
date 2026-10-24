from django.contrib import admin

from .models import Dispositivo


@admin.register(Dispositivo)
class DispositivoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "modelo", "registrado_en", "ultimo_uso", "revocado")
    readonly_fields = ("token_hash",)