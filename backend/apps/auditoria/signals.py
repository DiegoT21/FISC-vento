"""Audita escrituras individuales; update() y bulk_create() no emiten señales."""
import json

from django.apps import apps
from django.core.serializers.json import DjangoJSONEncoder
from django.db.models.signals import post_delete, post_save, pre_delete, pre_save

from config.middleware import obtener_usuario_actual

from .models import Accion, RegistroAuditoria


def snapshot(instance):
    # Nunca persistir hashes de contraseña en un historial accesible por API.
    datos = {
        campo.name: getattr(instance, campo.attname)
        for campo in instance._meta.concrete_fields
        if campo.name != "password"
    }
    return json.loads(json.dumps(datos, cls=DjangoJSONEncoder))


def capturar_anterior(sender, instance, using, raw=False, **kwargs):
    if raw:
        return
    anterior = sender._base_manager.using(using).filter(pk=instance.pk).first()
    instance._auditoria_anterior = snapshot(anterior) if anterior else None


def registrar(sender, instance, accion, detalle, using):
    usuario = obtener_usuario_actual()
    # El actor puede haberse eliminado a sí mismo en este request.
    usuario_id = usuario.pk if usuario is not None else None
    if usuario_id is not None and not apps.get_model("usuarios", "Usuario").objects.using(using).filter(pk=usuario_id).exists():
        usuario_id = None
    RegistroAuditoria.objects.using(using).create(
        usuario_id=usuario_id,
        accion=accion,
        tabla=sender._meta.db_table,
        objeto_id=str(instance.pk),
        detalle=detalle,
    )


def registrar_guardado(sender, instance, created, using, raw=False, **kwargs):
    if raw:
        return
    # Releer respeta update_fields, expresiones F() y campos diferidos.
    actual = snapshot(sender._base_manager.using(using).get(pk=instance.pk))
    if created:
        registrar(sender, instance, Accion.CREACION, actual, using)
        return
    anterior = getattr(instance, "_auditoria_anterior", None) or {}
    cambios = {
        campo: {"anterior": anterior.get(campo), "nuevo": valor}
        for campo, valor in actual.items()
        if anterior.get(campo) != valor
    }
    if cambios:
        registrar(sender, instance, Accion.MODIFICACION, cambios, using)


def registrar_eliminacion(sender, instance, using, **kwargs):
    registrar(sender, instance, Accion.ELIMINACION, instance._auditoria_anterior, using)


for etiqueta in ("activos", "ubicaciones", "prestamos", "traslados", "usuarios"):
    for modelo in apps.get_app_config(etiqueta).get_models():
        for nombre, senal, receptor in (
            ("pre_save", pre_save, capturar_anterior),
            ("post_save", post_save, registrar_guardado),
            ("pre_delete", pre_delete, capturar_anterior),
            ("post_delete", post_delete, registrar_eliminacion),
        ):
            senal.connect(receptor, sender=modelo, dispatch_uid=f"auditoria.{modelo._meta.label}.{nombre}")
