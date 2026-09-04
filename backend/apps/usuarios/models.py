from django.contrib.auth.models import AbstractUser
from django.db import models


class Rol(models.TextChoices):
    ADMINISTRADOR = "ADMINISTRADOR", "Administrador"
    CUSTODIO = "CUSTODIO", "Custodio"
    AUDITOR = "AUDITOR", "Auditor"


class Usuario(AbstractUser):
    """Usuario del sistema: extiende el modelo de auth de Django en vez de
    reinventar autenticación/permisos. `rol` filtra la navegación y los
    permisos por API (ver apps/usuarios/permissions.py)."""

    rol = models.CharField(max_length=20, choices=Rol.choices, default=Rol.CUSTODIO)

    def __str__(self):
        return self.get_full_name() or self.username
