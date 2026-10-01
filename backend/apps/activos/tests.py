from django.db import IntegrityError, transaction
from django.test import TestCase

from apps.ubicaciones.models import Departamento, Ubicacion

from .models import Activo, Categoria, EstadoActivo


class ActivoModelTests(TestCase):
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Equipo")
        depto = Departamento.objects.create(nombre="Departamento de TI")
        self.ubicacion = Ubicacion.objects.create(departamento=depto, nombre="Lab. 3-407")

    def _crear_activo(self, **kwargs):
        datos = {
            "codigo": "SVT-118423",
            "descripcion": "CPU Dell OptiPlex 3080",
            "categoria": self.categoria,
            "ubicacion": self.ubicacion,
        }
        datos.update(kwargs)
        return Activo.objects.create(**datos)

    def test_estado_por_defecto_es_activo(self):
        activo = self._crear_activo()
        self.assertEqual(activo.estado, EstadoActivo.ACTIVO)

    def test_codigo_es_unico(self):
        self._crear_activo()
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self._crear_activo()

    def test_tag_rfid_es_opcional(self):
        activo = self._crear_activo()
        self.assertIsNone(activo.tag_rfid)

    def test_tag_rfid_es_unico_cuando_se_define(self):
        self._crear_activo(tag_rfid="RF-001")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self._crear_activo(codigo="SVT-OTRO", tag_rfid="RF-001")

    def test_no_se_puede_borrar_una_categoria_con_activos(self):
        self._crear_activo()
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self.categoria.delete()

    def test_str_incluye_codigo_y_descripcion(self):
        activo = self._crear_activo()
        self.assertEqual(str(activo), "SVT-118423 — CPU Dell OptiPlex 3080")
