from rest_framework.test import APITestCase

from apps.activos.models import Activo, Categoria
from apps.ubicaciones.models import Departamento, Ubicacion
from apps.usuarios.models import Usuario


class EscaneoAPITests(APITestCase):
    def setUp(self):
        self.client.force_authenticate(Usuario.objects.create_user(username="custodio", password="x"))
        depto = Departamento.objects.create(nombre="Departamento de TI")
        self.activo = Activo.objects.create(
            codigo="SVT-118423",
            tag_rfid="RF-118423",
            descripcion="CPU Dell OptiPlex 3080",
            categoria=Categoria.objects.create(nombre="Equipo"),
            ubicacion=Ubicacion.objects.create(departamento=depto, nombre="Lab. 3-407"),
        )

    def test_escanear_por_codigo_de_barras(self):
        respuesta = self.client.post("/api/escaneo/escanear/", {"valor": "SVT-118423"})
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["id"], self.activo.id)
        self.assertEqual(respuesta.data["ubicacion_nombre"], "Lab. 3-407")

    def test_escanear_por_tag_rfid(self):
        respuesta = self.client.post("/api/escaneo/escanear/", {"valor": "RF-118423"})
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["codigo"], "SVT-118423")

    def test_escanear_valor_inexistente_devuelve_404(self):
        respuesta = self.client.post("/api/escaneo/escanear/", {"valor": "NO-EXISTE"})
        self.assertEqual(respuesta.status_code, 404)

    def test_imagen_de_codigo_de_barras(self):
        respuesta = self.client.get(f"/api/escaneo/activos/{self.activo.id}/barras/")
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta["Content-Type"], "image/png")
        self.assertTrue(respuesta.content.startswith(b"\x89PNG"))

    def test_imagen_de_activo_inexistente_devuelve_404(self):
        self.assertEqual(self.client.get("/api/escaneo/activos/9999/barras/").status_code, 404)

    def test_requiere_autenticacion(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post("/api/escaneo/escanear/", {"valor": "x"}).status_code, 403)
        self.assertEqual(self.client.get(f"/api/escaneo/activos/{self.activo.id}/barras/").status_code, 403)
