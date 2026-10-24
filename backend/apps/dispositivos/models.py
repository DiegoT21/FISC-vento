import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

# Sin 0/O/1/I/L para que el codigo se pueda dictar o teclear sin confusiones.
ALFABETO_CODIGO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
LONGITUD_CODIGO = 10
MINUTOS_VIGENCIA_CODIGO = 10


def normalizar_codigo(codigo):
    """Mayusculas y sin espacios ni guiones (por si se pega con formato)."""
    return "".join(c for c in str(codigo).upper() if c.isalnum())


def calcular_hash(valor):
    # Codigo y token son aleatorios de alta entropia: basta un SHA-256 sin sal.
    return hashlib.sha256(valor.encode("utf-8")).hexdigest()


class CodigoVinculacion(models.Model):
    """Codigo de un solo uso que el administrador genera desde la web (QR).

    Solo se guarda su hash: el codigo en claro se muestra una vez, en el QR."""

    codigo_hash = models.CharField(max_length=64, unique=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="codigos_vinculacion",
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    expira_en = models.DateTimeField()
    usado_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Codigo de vinculacion"
        verbose_name_plural = "Codigos de vinculacion"
        ordering = ["-creado_en"]

    @classmethod
    def generar(cls, creado_por):
        codigo = "".join(secrets.choice(ALFABETO_CODIGO) for _ in range(LONGITUD_CODIGO))
        registro = cls.objects.create(
            codigo_hash=calcular_hash(codigo),
            creado_por=creado_por,
            expira_en=timezone.now() + timedelta(minutes=MINUTOS_VIGENCIA_CODIGO),
        )
        return codigo, registro

    @classmethod
    def consumir(cls, codigo):
        """Marca el codigo como usado de forma atomica. Devuelve el registro o
        None si no existe, ya se uso o vencio (dos peticiones simultaneas no
        pueden consumir el mismo codigo: solo un UPDATE afecta la fila)."""
        codigo = normalizar_codigo(codigo)
        if len(codigo) != LONGITUD_CODIGO:
            return None
        ahora = timezone.now()
        filtro = cls.objects.filter(
            codigo_hash=calcular_hash(codigo), usado_en__isnull=True, expira_en__gt=ahora
        )
        registro = filtro.first()
        if registro is None:
            return None
        if cls.objects.filter(pk=registro.pk, usado_en__isnull=True).update(usado_en=ahora) != 1:
            return None
        registro.usado_en = ahora
        return registro


class Dispositivo(models.Model):
    """Equipo (p. ej. un TC22r) vinculado mediante QR."""

    nombre = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100, blank=True)
    android_id = models.CharField(max_length=64, blank=True)
    token_hash = models.CharField(max_length=64, unique=True)
    vinculado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="dispositivos_vinculados",
    )
    registrado_en = models.DateTimeField(auto_now_add=True)
    ultimo_uso = models.DateTimeField(null=True, blank=True)
    revocado = models.BooleanField(default=False)
    revocado_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-registrado_en"]

    def __str__(self):
        return self.nombre

    @classmethod
    def registrar(cls, nombre, modelo, android_id, vinculado_por):
        token = secrets.token_urlsafe(32)
        dispositivo = cls.objects.create(
            nombre=nombre,
            modelo=modelo,
            android_id=android_id,
            token_hash=calcular_hash(token),
            vinculado_por=vinculado_por,
        )
        return dispositivo, token