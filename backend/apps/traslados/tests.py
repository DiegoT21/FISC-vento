from django.test import TestCase

from apps.activos.models import Activo, Categoria
from apps.ubicaciones.models import Departamento, Ubicacion
from apps.usuarios.models import Usuario

from .models import EstadoTraslado, SolicitudTraslado


class SolicitudTrasladoModelTests(TestCase):
    def setUp(self):
        categoria = Categoria.objects.create(nombre="Equipo")
        depto = Departamento.objects.create(nombre="Departamento de TI")
        self.origen = Ubicacion.objects.create(departamento=depto, nombre="Lab. 3-407")
        self.destino = Ubicacion.objects.create(departamento=depto, nombre="Cuarto de Redes")
        self.activo = Activo.objects.create(
            codigo="SVT-118423",
            descripcion="CPU Dell OptiPlex 3080",
            categoria=categoria,
            ubicacion=self.origen,
        )
        self.solicitante = Usuario.objects.create_user(username="mdocente", password="x")

    def test_estado_por_defecto_es_pendiente(self):
        solicitud = SolicitudTraslado.objects.create(
            activo=self.activo,
            ubicacion_origen=self.origen,
            ubicacion_destino=self.destino,
            solicitado_por=self.solicitante,
        )
        self.assertEqual(solicitud.estado, EstadoTraslado.PENDIENTE)

    def test_str_muestra_origen_y_destino(self):
        solicitud = SolicitudTraslado.objects.create(
            activo=self.activo,
            ubicacion_origen=self.origen,
            ubicacion_destino=self.destino,
            solicitado_por=self.solicitante,
        )
        self.assertIn("Lab. 3-407", str(solicitud))
        self.assertIn("Cuarto de Redes", str(solicitud))
