from django.test import TestCase

from apps.activos.models import Activo, Categoria
from apps.ubicaciones.models import Departamento, Ubicacion
from apps.usuarios.models import Usuario

from .models import EstadoPrestamo, Prestamo


class PrestamoModelTests(TestCase):
    def setUp(self):
        categoria = Categoria.objects.create(nombre="Equipo")
        depto = Departamento.objects.create(nombre="Departamento de TI")
        ubicacion = Ubicacion.objects.create(departamento=depto, nombre="Lab. 3-407")
        self.activo = Activo.objects.create(
            codigo="SVT-118423",
            descripcion="CPU Dell OptiPlex 3080",
            categoria=categoria,
            ubicacion=ubicacion,
        )
        self.docente = Usuario.objects.create_user(username="mdocente", password="x")

    def test_estado_por_defecto_es_activo(self):
        prestamo = Prestamo.objects.create(activo=self.activo, prestado_a=self.docente)
        self.assertEqual(prestamo.estado, EstadoPrestamo.ACTIVO)

    def test_fecha_devolucion_es_opcional_al_crear(self):
        prestamo = Prestamo.objects.create(activo=self.activo, prestado_a=self.docente)
        self.assertIsNone(prestamo.fecha_devolucion)
