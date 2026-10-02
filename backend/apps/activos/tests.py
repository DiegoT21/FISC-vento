from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APITestCase

from apps.ubicaciones.models import Departamento, Ubicacion
from apps.usuarios.models import Rol, Usuario

from .models import Activo, Categoria, EstadoActivo, OrigenActivo

URL = "/api/activos/"


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

    def test_lista_incluye_nombres_de_categoria_y_ubicacion(self):
        with self.assertNumQueries(2):
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


class PermisosPorRolTests(APITestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(username="a", password="x", rol=Rol.ADMINISTRADOR)
        self.custodio = Usuario.objects.create_user(username="c", password="x", rol=Rol.CUSTODIO)
        self.auditor = Usuario.objects.create_user(username="u", password="x", rol=Rol.AUDITOR)
        self.categoria = Categoria.objects.create(nombre="Equipo")
        depto = Departamento.objects.create(nombre="Departamento de TI")
        self.ubicacion = Ubicacion.objects.create(departamento=depto, nombre="Lab. 3-407")
        self.activo = Activo.objects.create(
            codigo="SVT-1", descripcion="CPU", categoria=self.categoria, ubicacion=self.ubicacion
        )
        self.datos = {
            "codigo": "SVT-NUEVO",
            "descripcion": "Monitor",
            "categoria": self.categoria.id,
            "ubicacion": self.ubicacion.id,
        }

    def _como(self, usuario):
        self.client.force_authenticate(usuario)

    def test_todos_los_roles_pueden_leer(self):
        for usuario in (self.admin, self.custodio, self.auditor):
            self._como(usuario)
            self.assertEqual(self.client.get(URL).status_code, 200)
            self.assertEqual(self.client.get(f"{URL}{self.activo.id}/").status_code, 200)

    def test_administrador_y_custodio_pueden_crear_y_editar(self):
        for i, usuario in enumerate((self.admin, self.custodio)):
            self._como(usuario)
            r = self.client.post(URL, {**self.datos, "codigo": f"SVT-N{i}"})
            self.assertEqual(r.status_code, 201)
            r = self.client.patch(f"{URL}{self.activo.id}/", {"descripcion": f"Editado {i}"})
            self.assertEqual(r.status_code, 200)

    def test_auditor_no_puede_crear_editar_ni_borrar(self):
        self._como(self.auditor)
        self.assertEqual(self.client.post(URL, self.datos).status_code, 403)
        self.assertEqual(self.client.patch(f"{URL}{self.activo.id}/", {"estado": "INACTIVO"}).status_code, 403)
        self.assertEqual(self.client.delete(f"{URL}{self.activo.id}/").status_code, 403)
        self.assertTrue(Activo.objects.filter(pk=self.activo.pk).exists())

    def test_custodio_no_puede_borrar(self):
        self._como(self.custodio)
        self.assertEqual(self.client.delete(f"{URL}{self.activo.id}/").status_code, 403)
        self.assertTrue(Activo.objects.filter(pk=self.activo.pk).exists())

    def test_administrador_puede_borrar(self):
        self._como(self.admin)
        self.assertEqual(self.client.delete(f"{URL}{self.activo.id}/").status_code, 204)

    def test_auditor_no_puede_crear_categorias(self):
        self._como(self.auditor)
        self.assertEqual(self.client.post(f"{URL}categorias/", {"nombre": "Nueva"}).status_code, 403)
        self._como(self.custodio)
        self.assertEqual(self.client.post(f"{URL}categorias/", {"nombre": "Nueva"}).status_code, 201)

    def test_solo_administrador_escribe_ubicaciones_pero_todos_leen(self):
        for usuario in (self.admin, self.custodio, self.auditor):
            self._como(usuario)
            self.assertEqual(self.client.get("/api/ubicaciones/departamentos/").status_code, 200)
        self._como(self.custodio)
        r = self.client.post("/api/ubicaciones/departamentos/", {"nombre": "Docencia"})
        self.assertEqual(r.status_code, 403)
        self._como(self.admin)
        r = self.client.post("/api/ubicaciones/departamentos/", {"nombre": "Docencia"})
        self.assertEqual(r.status_code, 201)

    def test_custodio_no_ve_auditoria_pero_auditor_si(self):
        self._como(self.custodio)
        self.assertEqual(self.client.get("/api/auditoria/").status_code, 403)
        self._como(self.auditor)
        self.assertEqual(self.client.get("/api/auditoria/").status_code, 200)

    def test_auditor_no_accede_a_traslados(self):
        self._como(self.auditor)
        self.assertEqual(self.client.get("/api/traslados/").status_code, 403)
        self._como(self.custodio)
        self.assertEqual(self.client.get("/api/traslados/").status_code, 200)

    def test_auditor_lee_pero_no_escribe_prestamos(self):
        self._como(self.auditor)
        self.assertEqual(self.client.get("/api/prestamos/").status_code, 200)
        self.assertEqual(self.client.post("/api/prestamos/", {}).status_code, 403)
