from django.db import models


class Departamento(models.Model):
    """Ej: Departamento de TI, Dirección FISC, Docencia."""

    nombre = models.CharField(max_length=150, unique=True)

    class Meta:
        verbose_name = "Departamento"
        verbose_name_plural = "Departamentos"

    def __str__(self):
        return self.nombre


class Ubicacion(models.Model):
    """Sub-ubicación física dentro de un departamento (oficina, salón o
    laboratorio) a la que se asigna un Activo."""

    departamento = models.ForeignKey(
        Departamento, on_delete=models.CASCADE, related_name="ubicaciones"
    )
    nombre = models.CharField(max_length=150)

    class Meta:
        verbose_name = "Ubicación"
        verbose_name_plural = "Ubicaciones"
        unique_together = ("departamento", "nombre")

    def __str__(self):
        return f"{self.departamento.nombre} / {self.nombre}"
