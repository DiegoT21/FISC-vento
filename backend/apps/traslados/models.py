"""STRETCH GOAL — no está en el "Alcance" formal del anteproyecto, pero
está más cerca del problema planteado (seguimiento del movimiento de
equipos entre salones/laboratorios) que `prestamos`, así que tiene
prioridad sobre ese si sobra tiempo de sprint. Ver docs/decisiones/."""
from django.conf import settings
from django.db import models

from apps.activos.models import Activo
from apps.ubicaciones.models import Ubicacion


class EstadoTraslado(models.TextChoices):
    PENDIENTE = "PENDIENTE", "Pendiente"
    AUTORIZADO = "AUTORIZADO", "Autorizado"


class SolicitudTraslado(models.Model):
    activo = models.ForeignKey(Activo, on_delete=models.PROTECT, related_name="traslados")
    ubicacion_origen = models.ForeignKey(
        Ubicacion, on_delete=models.PROTECT, related_name="traslados_salientes"
    )
    ubicacion_destino = models.ForeignKey(
        Ubicacion, on_delete=models.PROTECT, related_name="traslados_entrantes"
    )
    solicitado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    estado = models.CharField(
        max_length=20, choices=EstadoTraslado.choices, default=EstadoTraslado.PENDIENTE
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.activo}: {self.ubicacion_origen} → {self.ubicacion_destino}"
