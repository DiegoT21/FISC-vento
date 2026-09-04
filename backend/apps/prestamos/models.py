"""STRETCH GOAL — no está en el "Alcance" formal del anteproyecto. Se deja
el esqueleto listo (app registrada, modelo mínimo) pero NO se prioriza
hasta que los módulos core (usuarios, ubicaciones, activos, escaneo,
auditoria, reportes) estén completos. Ver docs/decisiones/."""
from django.conf import settings
from django.db import models

from apps.activos.models import Activo


class EstadoPrestamo(models.TextChoices):
    ACTIVO = "ACTIVO", "Activo"
    DEVUELTO = "DEVUELTO", "Devuelto"


class Prestamo(models.Model):
    activo = models.ForeignKey(Activo, on_delete=models.PROTECT, related_name="prestamos")
    prestado_a = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    estado = models.CharField(max_length=20, choices=EstadoPrestamo.choices, default=EstadoPrestamo.ACTIVO)
    fecha_prestamo = models.DateTimeField(auto_now_add=True)
    fecha_devolucion = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.activo} → {self.prestado_a}"
