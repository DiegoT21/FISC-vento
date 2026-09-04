from django.conf import settings
from django.db import models

from apps.ubicaciones.models import Ubicacion


class EstadoActivo(models.TextChoices):
    """Los 3 estados definidos en el anteproyecto. NOTA: el mockup del
    frontend también tenía un campo `estatus` (EXISTE/ADICIONAR/EXTRAVIADO/
    NO EXISTE) que se solapa parcialmente con esto — pendiente de reconciliar
    en el diseño real del modelo de datos, no se implementa aquí todavía."""

    ACTIVO = "ACTIVO", "Activo"
    INACTIVO = "INACTIVO", "Inactivo"
    INOPERATIVO = "INOPERATIVO", "Inoperativo"


class Categoria(models.Model):
    nombre = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nombre


class Activo(models.Model):
    codigo = models.CharField(
        max_length=50, unique=True, help_text="Código interno de inventario (p. ej. SVT-118423)."
    )
    tag_rfid = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
        help_text="ID único de la etiqueta RFID asociada, si el activo tiene una.",
    )
    descripcion = models.CharField(max_length=255)
    categoria = models.ForeignKey(
        Categoria, on_delete=models.PROTECT, related_name="activos"
    )
    ubicacion = models.ForeignKey(
        Ubicacion, on_delete=models.PROTECT, related_name="activos"
    )
    responsable = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activos_asignados",
    )
    estado = models.CharField(
        max_length=20, choices=EstadoActivo.choices, default=EstadoActivo.ACTIVO
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Activo"
        verbose_name_plural = "Activos"
        ordering = ["codigo"]

    def __str__(self):
        return f"{self.codigo} — {self.descripcion}"
