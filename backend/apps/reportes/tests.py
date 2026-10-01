from django.test import TestCase
from rest_framework.test import APIClient

from apps.activos.models import Activo, Categoria, EstadoActivo
from apps.ubicaciones.models import Departamento, Ubicacion
from apps.usuarios.models import Usuario


class ReportesAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        usuario = Usuario.objects.create_user(username="admin", password="x")
        self.client.force_authenticate(usuario)

        categoria = Categoria.objects.create(nombre="Equipo")
        depto = Departamento.objects.create(nombre="Departamento de TI")
        ubicacion = Ubicacion.objects.create(departamento=depto, nombre="Lab. 3-407")
        Activo.objects.create(
            codigo="SVT-1", descripcion="A", categoria=categoria, ubicacion=ubicacion,
            estado=EstadoActivo.ACTIVO,
        )
        Activo.objects.create(
            codigo="SVT-2", descripcion="B", categoria=categoria, ubicacion=ubicacion,
            estado=EstadoActivo.ACTIVO,
        )
        Activo.objects.create(
            codigo="SVT-3", descripcion="C", categoria=categoria, ubicacion=ubicacion,
            estado=EstadoActivo.INOPERATIVO,
        )

    def test_resumen_por_estado_agrupa_correctamente(self):
        response = self.client.get("/api/reportes/por-estado/")
        self.assertEqual(response.status_code, 200)
        por_estado = {fila["estado"]: fila["total"] for fila in response.data}
        self.assertEqual(por_estado["ACTIVO"], 2)
        self.assertEqual(por_estado["INOPERATIVO"], 1)

    def test_resumen_por_ubicacion(self):
        response = self.client.get("/api/reportes/por-ubicacion/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["total"], 3)
