"""Registra automáticamente creaciones/eliminaciones de los modelos que
interesa auditar. Conectado desde AuditoriaConfig.ready().

Nota: para tener el `usuario` que hizo el cambio se necesita el request
actual, que las signals de Django no reciben directamente. La forma
recomendada es usar un middleware que guarde el usuario en un
`threading.local` (o `django-crum` / `django-simple-history`'s propio
middleware) y leerlo aquí — pendiente de implementar junto con la elección
final entre un log casero y un paquete de terceros (ver models.py)."""
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from apps.activos.models import Activo

from .models import Accion, RegistroAuditoria


@receiver(post_save, sender=Activo)
def registrar_guardado_activo(sender, instance, created, **kwargs):
    RegistroAuditoria.objects.create(
        accion=Accion.CREACION if created else Accion.MODIFICACION,
        tabla=sender._meta.db_table,
        objeto_id=str(instance.pk),
    )


@receiver(post_delete, sender=Activo)
def registrar_eliminacion_activo(sender, instance, **kwargs):
    RegistroAuditoria.objects.create(
        accion=Accion.ELIMINACION,
        tabla=sender._meta.db_table,
        objeto_id=str(instance.pk),
    )
