from django.db import IntegrityError, transaction
from django.test import TestCase

from .models import Departamento, Ubicacion


class UbicacionModelTests(TestCase):
    def setUp(self):
        self.depto = Departamento.objects.create(nombre="Departamento de TI")

    def test_str_departamento(self):
        self.assertEqual(str(self.depto), "Departamento de TI")

    def test_str_ubicacion_incluye_departamento(self):
        ubicacion = Ubicacion.objects.create(departamento=self.depto, nombre="Lab. 3-407")
        self.assertEqual(str(ubicacion), "Departamento de TI / Lab. 3-407")

    def test_no_permite_ubicaciones_duplicadas_en_el_mismo_departamento(self):
        Ubicacion.objects.create(departamento=self.depto, nombre="Lab. 3-407")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Ubicacion.objects.create(departamento=self.depto, nombre="Lab. 3-407")

    def test_mismo_nombre_permitido_en_departamentos_distintos(self):
        otro_depto = Departamento.objects.create(nombre="Docencia")
        Ubicacion.objects.create(departamento=self.depto, nombre="Aula 1")
        # No debe fallar: el nombre se repite pero el departamento es distinto.
        Ubicacion.objects.create(departamento=otro_depto, nombre="Aula 1")
        self.assertEqual(Ubicacion.objects.filter(nombre="Aula 1").count(), 2)
