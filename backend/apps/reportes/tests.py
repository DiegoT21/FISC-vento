from django.test import TestCase
from rest_framework.test import APIClient

from apps.activos.models import Activo, Categoria, EstadoActivo
from apps.ubicaciones.models import Departamento, Ubicacion
from apps.prestamos.models import EstadoPrestamo, Prestamo
from apps.traslados.models import EstadoTraslado, SolicitudTraslado
from apps.usuarios.models import Rol, Usuario


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


class ResumenPanelTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = Usuario.objects.create_user(username="a", password="x", rol=Rol.ADMINISTRADOR)
        self.custodio = Usuario.objects.create_user(username="c", password="x", rol=Rol.CUSTODIO)
        self.auditor = Usuario.objects.create_user(username="u", password="x", rol=Rol.AUDITOR)

        categoria = Categoria.objects.create(nombre="Equipo")
        depto = Departamento.objects.create(nombre="Departamento de TI")
        ubicacion = Ubicacion.objects.create(departamento=depto, nombre="Lab. 3-407")

        def crear(codigo, **extra):
            return Activo.objects.create(
                codigo=codigo, descripcion=codigo, categoria=categoria, ubicacion=ubicacion, **extra
            )

        self.a1 = crear("SVT-1", responsable=self.custodio, tag_rfid="RF-1")
        crear("SVT-2", estado=EstadoActivo.INACTIVO)
        crear("SVT-3", estado=EstadoActivo.INOPERATIVO, tag_rfid="RF-3")
        Prestamo.objects.create(activo=self.a1, prestado_a=self.custodio)
        Prestamo.objects.create(
            activo=self.a1, prestado_a=self.custodio, estado=EstadoPrestamo.DEVUELTO
        )
        SolicitudTraslado.objects.create(
            activo=self.a1,
            ubicacion_origen=ubicacion,
            ubicacion_destino=ubicacion,
            solicitado_por=self.custodio,
        )
        SolicitudTraslado.objects.create(
            activo=self.a1,
            ubicacion_origen=ubicacion,
            ubicacion_destino=ubicacion,
            solicitado_por=self.custodio,
            estado=EstadoTraslado.AUTORIZADO,
        )

    def _resumen(self, usuario):
        self.client.force_authenticate(usuario)
        respuesta = self.client.get("/api/reportes/resumen/")
        self.assertEqual(respuesta.status_code, 200)
        return respuesta.data

    def test_requiere_autenticacion(self):
        self.assertEqual(self.client.get("/api/reportes/resumen/").status_code, 403)

    def test_cuenta_activos_por_estado_y_pendientes(self):
        datos = self._resumen(self.admin)
        self.assertEqual(datos["total"], 3)
        self.assertEqual(datos["activos"], 1)
        self.assertEqual(datos["inactivos"], 1)
        self.assertEqual(datos["inoperativos"], 1)
        self.assertEqual(datos["sin_responsable"], 2)
        self.assertEqual(datos["sin_rfid"], 1)

    def test_solo_cuenta_prestamos_activos_y_traslados_pendientes(self):
        datos = self._resumen(self.custodio)
        self.assertEqual(datos["prestamos_activos"], 1)
        self.assertEqual(datos["traslados_pendientes"], 1)

    def test_auditor_no_recibe_datos_de_traslados(self):
        datos = self._resumen(self.auditor)
        self.assertIsNone(datos["traslados_pendientes"])
        self.assertEqual(datos["prestamos_activos"], 1)

    def test_base_vacia_devuelve_ceros(self):
        Prestamo.objects.all().delete()
        SolicitudTraslado.objects.all().delete()
        Activo.objects.all().delete()
        datos = self._resumen(self.admin)
        self.assertEqual(datos["total"], 0)
        self.assertEqual(datos["traslados_pendientes"], 0)
        self.assertEqual(datos["prestamos_activos"], 0)

    def test_consultas_constantes(self):
        self.client.force_authenticate(self.admin)
        with self.assertNumQueries(3):
            self.client.get("/api/reportes/resumen/")


class DistribucionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        equipo = Categoria.objects.create(nombre="Equipo")
        mobiliario = Categoria.objects.create(nombre="Mobiliario")
        ti = Departamento.objects.create(nombre="Departamento de TI")
        docencia = Departamento.objects.create(nombre="Docencia")
        lab = Ubicacion.objects.create(departamento=ti, nombre="Lab. 3-407")
        aula = Ubicacion.objects.create(departamento=docencia, nombre="Aula 5-201")
        for codigo, categoria, ubicacion, estado in [
            ("SVT-1", equipo, lab, EstadoActivo.ACTIVO),
            ("SVT-2", equipo, lab, EstadoActivo.ACTIVO),
            ("SVT-3", mobiliario, aula, EstadoActivo.INOPERATIVO),
        ]:
            Activo.objects.create(
                codigo=codigo, descripcion=codigo, categoria=categoria, ubicacion=ubicacion, estado=estado
            )

    def _entrar_como(self, rol):
        usuario = Usuario.objects.create_user(username=rol.lower(), password="x", rol=rol)
        self.client.force_authenticate(usuario)

    def test_devuelve_la_distribucion_con_ceros_en_estados_vacios(self):
        self._entrar_como(Rol.AUDITOR)
        datos = self.client.get("/api/reportes/distribucion/").data
        self.assertEqual(datos["total"], 3)
        self.assertEqual(datos["por_estado"], {"ACTIVO": 2, "INACTIVO": 0, "INOPERATIVO": 1})
        self.assertEqual(
            datos["por_departamento"],
            [{"nombre": "Departamento de TI", "total": 2}, {"nombre": "Docencia", "total": 1}],
        )
        self.assertEqual(
            datos["por_categoria"],
            [{"nombre": "Equipo", "total": 2}, {"nombre": "Mobiliario", "total": 1}],
        )

    def test_administrador_puede_verla(self):
        self._entrar_como(Rol.ADMINISTRADOR)
        self.assertEqual(self.client.get("/api/reportes/distribucion/").status_code, 200)

    def test_custodio_no_puede_verla(self):
        self._entrar_como(Rol.CUSTODIO)
        self.assertEqual(self.client.get("/api/reportes/distribucion/").status_code, 403)

    def test_sin_sesion_se_rechaza(self):
        self.assertEqual(self.client.get("/api/reportes/distribucion/").status_code, 403)
