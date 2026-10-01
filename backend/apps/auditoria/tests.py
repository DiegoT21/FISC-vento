from django.test import TestCase

from apps.activos.models import Activo, Categoria
from apps.ubicaciones.models import Departamento, Ubicacion

from .models import Accion, RegistroAuditoria


class AuditoriaSignalTests(TestCase):
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Equipo")
        depto = Departamento.objects.create(nombre="Departamento de TI")
        self.ubicacion = Ubicacion.objects.create(departamento=depto, nombre="Lab. 3-407")

    def test_crear_un_activo_genera_un_registro_de_creacion(self):
        activo = Activo.objects.create(
            codigo="SVT-118423",
            descripcion="CPU Dell OptiPlex 3080",
            categoria=self.categoria,
            ubicacion=self.ubicacion,
        )
        registro = RegistroAuditoria.objects.get(objeto_id=str(activo.pk))
        self.assertEqual(registro.accion, Accion.CREACION)
        self.assertEqual(registro.tabla, "activos_activo")

    def test_modificar_un_activo_genera_un_registro_de_modificacion(self):
        activo = Activo.objects.create(
            codigo="SVT-118423",
            descripcion="CPU Dell OptiPlex 3080",
            categoria=self.categoria,
            ubicacion=self.ubicacion,
        )
        RegistroAuditoria.objects.all().delete()  # limpiar el de creación

        activo.descripcion = "CPU Dell OptiPlex 3080 (actualizado)"
        activo.save()

        registro = RegistroAuditoria.objects.get(objeto_id=str(activo.pk))
        self.assertEqual(registro.accion, Accion.MODIFICACION)

    def test_borrar_un_activo_genera_un_registro_de_eliminacion(self):
        activo = Activo.objects.create(
            codigo="SVT-118423",
            descripcion="CPU Dell OptiPlex 3080",
            categoria=self.categoria,
            ubicacion=self.ubicacion,
        )
        activo_id = str(activo.pk)
        RegistroAuditoria.objects.all().delete()  # limpiar el de creación

        activo.delete()

        registro = RegistroAuditoria.objects.get(objeto_id=activo_id)
        self.assertEqual(registro.accion, Accion.ELIMINACION)
