from rest_framework.test import APITestCase

from apps.ubicaciones.models import Departamento, Ubicacion
from apps.usuarios.models import Usuario

from .models import Activo, Categoria, EstadoActivo, OrigenActivo

URL = "/api/activos/"


class ActivoAPITests(APITestCase):
    def setUp(self):
        self.usuario = Usuario.objects.create_user(username="custodio", password="x")
        self.client.force_authenticate(self.usuario)
        self.equipo = Categoria.objects.create(nombre="Equipo")
        self.mobiliario = Categoria.objects.create(nombre="Mobiliario")
        depto = Departamento.objects.create(nombre="Departamento de TI")
        self.lab = Ubicacion.objects.create(departamento=depto, nombre="Lab. 3-407")
        self.oficina = Ubicacion.objects.create(departamento=depto, nombre="Oficina 17")
        self.cpu = Activo.objects.create(
            codigo="SVT-1", descripcion="CPU Dell", categoria=self.equipo, ubicacion=self.lab
        )
        self.silla = Activo.objects.create(
            codigo="SVT-2",
            descripcion="Silla ejecutiva",
            categoria=self.mobiliario,
            ubicacion=self.oficina,
            estado=EstadoActivo.INOPERATIVO,
            origen=OrigenActivo.DONADO,
        )

    def _codigos(self, respuesta):
        return {a["codigo"] for a in respuesta.data["results"]}

    def test_requiere_autenticacion(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(URL).status_code, 403)

    def test_lista_incluye_nombres_sin_consultas_extra(self):
        with self.assertNumQueries(2):  # count + select con joins
            respuesta = self.client.get(URL)
        cpu = next(a for a in respuesta.data["results"] if a["codigo"] == "SVT-1")
        self.assertEqual(cpu["categoria_nombre"], "Equipo")
        self.assertEqual(cpu["ubicacion_nombre"], "Lab. 3-407")
        self.assertEqual(cpu["departamento_nombre"], "Departamento de TI")

    def test_filtra_por_categoria(self):
        respuesta = self.client.get(URL, {"categoria": self.equipo.id})
        self.assertEqual(self._codigos(respuesta), {"SVT-1"})

    def test_filtra_por_estado(self):
        respuesta = self.client.get(URL, {"estado": EstadoActivo.INOPERATIVO})
        self.assertEqual(self._codigos(respuesta), {"SVT-2"})

    def test_filtra_por_ubicacion(self):
        respuesta = self.client.get(URL, {"ubicacion": self.oficina.id})
        self.assertEqual(self._codigos(respuesta), {"SVT-2"})

    def test_busca_por_descripcion(self):
        respuesta = self.client.get(URL, {"search": "silla"})
        self.assertEqual(self._codigos(respuesta), {"SVT-2"})

    def test_crea_activo_con_origen(self):
        respuesta = self.client.post(
            URL,
            {
                "codigo": "SVT-3",
                "descripcion": "Proyector",
                "categoria": self.equipo.id,
                "ubicacion": self.lab.id,
                "origen": OrigenActivo.COMPRADO,
            },
        )
        self.assertEqual(respuesta.status_code, 201)
        self.assertEqual(respuesta.data["origen"], "COMPRADO")
        self.assertEqual(respuesta.data["estado"], EstadoActivo.ACTIVO)

    def test_no_crea_activo_con_codigo_duplicado(self):
        respuesta = self.client.post(
            URL,
            {
                "codigo": "SVT-1",
                "descripcion": "Otro",
                "categoria": self.equipo.id,
                "ubicacion": self.lab.id,
            },
        )
        self.assertEqual(respuesta.status_code, 400)
        self.assertIn("codigo", respuesta.data)

    def test_edita_estado(self):
        respuesta = self.client.patch(f"{URL}{self.cpu.id}/", {"estado": "INACTIVO"})
        self.assertEqual(respuesta.status_code, 200)
        self.cpu.refresh_from_db()
        self.assertEqual(self.cpu.estado, EstadoActivo.INACTIVO)

    def test_resumen_general(self):
        respuesta = self.client.get("/api/reportes/resumen/")
        self.assertEqual(respuesta.status_code, 200)
        self.assertEqual(respuesta.data["total"], 2)
        self.assertEqual(respuesta.data["por_estado"]["ACTIVO"], 1)
        self.assertEqual(respuesta.data["por_estado"]["INOPERATIVO"], 1)
        self.assertEqual(respuesta.data["por_estado"]["INACTIVO"], 0)
        self.assertEqual(
            respuesta.data["por_departamento"], [{"nombre": "Departamento de TI", "total": 2}]
        )
        self.assertEqual({c["nombre"] for c in respuesta.data["por_categoria"]}, {"Equipo", "Mobiliario"})
