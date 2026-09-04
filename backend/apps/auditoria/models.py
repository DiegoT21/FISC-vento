from django.conf import settings
from django.db import models


class Accion(models.TextChoices):
    CREACION = "CREACION", "Creación"
    MODIFICACION = "MODIFICACION", "Modificación"
    ELIMINACION = "ELIMINACION", "Eliminación"


class RegistroAuditoria(models.Model):
    """Log de cambios: quién hizo qué, sobre qué tabla, y cuándo — atiende
    el vacío señalado en el anteproyecto ("ausencia de historial de
    cambios"). Poblado vía signals (ver signals.py), no manualmente desde
    cada view.

    Evaluar reemplazar este modelo casero por `django-auditlog` (su forma
    de log calza con estas mismas columnas) o `django-simple-history`
    (versionado completo) antes de invertir en más lógica aquí — ver
    docs/decisiones/.
    """

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True
    )
    accion = models.CharField(max_length=20, choices=Accion.choices)
    tabla = models.CharField(max_length=100)
    objeto_id = models.CharField(max_length=50, blank=True)
    detalle = models.JSONField(default=dict, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Registro de auditoría"
        verbose_name_plural = "Registros de auditoría"
        ordering = ["-fecha"]

    def __str__(self):
        return f"{self.fecha:%Y-%m-%d %H:%M} — {self.usuario} — {self.accion} {self.tabla}"
