from django.test import Client, TestCase
from rest_framework.test import APIClient

from apps.activos.models import Activo, Categoria
from apps.ubicaciones.models import Departamento, Ubicacion
from apps.usuarios.models import Rol, Usuario

from .utilidades import CLAVE, crear_usuarios

A, C, U = Rol.ADMINISTRADOR, Rol.CUSTODIO, Rol.AUDITOR
TODOS = {A, C, U}
INEXISTENTE = 999999  # los permisos se evalúan antes de buscar el objeto

# (nombre, lista, detalle, quién lee, quién escribe, quién borra)
RECURSOS = [
    ("activos", "/api/activos/", f"/api/activos/{INEXISTENTE}/", TODOS, {A, C}, {A}),
    ("categorias", "/api/activos/categorias/", f"/api/activos/categorias/{INEXISTENTE}/", TODOS, {A, C}, {A, C}),
    ("departamentos", "/api/ubicaciones/departamentos/", f"/api/ubicaciones/departamentos/{INEXISTENTE}/", TODOS, {A}, {A}),
    ("ubicaciones", "/api/ubicaciones/", f"/api/ubicaciones/{INEXISTENTE}/", TODOS, {A}, {A}),
    ("prestamos", "/api/prestamos/", f"/api/prestamos/{INEXISTENTE}/", TODOS, {A, C}, {A, C}),
    ("traslados", "/api/traslados/", f"/api/traslados/{INEXISTENTE}/", {A, C}, {A, C}, {A, C}),
    ("usuarios", "/api/usuarios/", f"/api/usuarios/{INEXISTENTE}/", {A}, {A}, {A}),
    ("auditoria", "/api/auditoria/", f"/api/auditoria/{INEXISTENTE}/", {A, U}, set(), set()),
]

# Recursos de solo lectura y los roles que tienen acceso a ellos.
SOLO_LECTURA = {"auditoria": {A, U}}


class MatrizDeAutorizacionTests(TestCase):
    """Cada combinación rol × recurso × método debe coincidir con la matriz de
    permisos del proyecto. Un permiso de más (o de menos) rompe estas pruebas."""

    def setUp(self):
        self.usuarios = crear_usuarios()

    def _cliente(self, rol):
        cliente = APIClient()
        cliente.force_authenticate(self.usuarios[rol])
        return cliente

    def _verificar(self, rol, metodo, ruta, permitidos, solo_lectura=None):
        r = getattr(self._cliente(rol), metodo)(ruta, {}, format="json")
        if solo_lectura is not None:
            # Recurso sin escritura: quien tiene acceso recibe 405 (no existe la
            # operación) y los demás 403; en ningún caso se llega a modificar.
            esperado = 405 if rol in solo_lectura else 403
            self.assertEqual(r.status_code, esperado, f"{rol} {metodo.upper()} {ruta} -> {r.status_code}")
        elif rol in permitidos:
            self.assertNotEqual(r.status_code, 403, f"{rol} debería poder {metodo.upper()} {ruta}")
        else:
            self.assertEqual(r.status_code, 403, f"{rol} NO debería poder {metodo.upper()} {ruta} (dio {r.status_code})")

    def test_lectura(self):
        for nombre, lista, detalle, lectura, _escritura, _borrado in RECURSOS:
            for rol in TODOS:
                for ruta in (lista, detalle):
                    with self.subTest(recurso=nombre, rol=rol, ruta=ruta):
                        self._verificar(rol, "get", ruta, lectura)

    def test_creacion(self):
        for nombre, lista, _detalle, _lectura, escritura, _borrado in RECURSOS:
            for rol in TODOS:
                with self.subTest(recurso=nombre, rol=rol):
                    self._verificar(rol, "post", lista, escritura, SOLO_LECTURA.get(nombre))

    def test_edicion(self):
        for nombre, _lista, detalle, _lectura, escritura, _borrado in RECURSOS:
            for rol in TODOS:
                for metodo in ("put", "patch"):
                    with self.subTest(recurso=nombre, rol=rol, metodo=metodo):
                        self._verificar(rol, metodo, detalle, escritura, SOLO_LECTURA.get(nombre))

    def test_borrado(self):
        for nombre, _lista, detalle, _lectura, _escritura, borrado in RECURSOS:
            for rol in TODOS:
                with self.subTest(recurso=nombre, rol=rol):
                    self._verificar(rol, "delete", detalle, borrado, SOLO_LECTURA.get(nombre))

    def test_reportes_y_escaneo_solo_para_usuarios_autenticados(self):
        rutas = ["/api/reportes/resumen/", "/api/reportes/por-estado/", "/api/reportes/por-ubicacion/"]
        for rol in TODOS:
            for ruta in rutas:
                with self.subTest(rol=rol, ruta=ruta):
                    self.assertEqual(self._cliente(rol).get(ruta).status_code, 200)
            with self.subTest(rol=rol, ruta="escanear"):
                r = self._cliente(rol).post("/api/escaneo/escanear/", {"valor": "NO-EXISTE"}, format="json")
                self.assertEqual(r.status_code, 404)


class EscaladaDePrivilegiosTests(TestCase):
    def setUp(self):
        self.usuarios = crear_usuarios()

    def test_el_administrador_no_puede_crear_superusuarios_por_la_api(self):
        cliente = APIClient()
        cliente.force_authenticate(self.usuarios[A])
        r = cliente.post(
            "/api/usuarios/",
            {"username": "intruso", "rol": C, "is_superuser": True, "is_staff": True},
            format="json",
        )
        self.assertEqual(r.status_code, 201, r.content)
        nuevo = Usuario.objects.get(username="intruso")
        self.assertFalse(nuevo.is_superuser)
        self.assertFalse(nuevo.is_staff)

    def test_el_custodio_no_puede_cambiar_su_propio_rol(self):
        custodio = self.usuarios[C]
        cliente = APIClient()
        cliente.force_authenticate(custodio)
        for ruta in (f"/api/usuarios/{custodio.id}/", "/api/usuarios/me/"):
            r = cliente.patch(ruta, {"rol": A}, format="json")
            self.assertIn(r.status_code, (403, 405), ruta)
        custodio.refresh_from_db()
        self.assertEqual(custodio.rol, C)

    def test_el_auditor_no_puede_modificar_activos_ni_siquiera_los_existentes(self):
        categoria = Categoria.objects.create(nombre="Equipo")
        ubicacion = Ubicacion.objects.create(departamento=Departamento.objects.create(nombre="TI"), nombre="Lab")
        activo = Activo.objects.create(codigo="X-1", descripcion="Original", categoria=categoria, ubicacion=ubicacion)
        cliente = APIClient()
        cliente.force_authenticate(self.usuarios[U])
        for metodo, cuerpo in (("patch", {"descripcion": "Hackeado"}), ("put", {}), ("delete", None)):
            r = getattr(cliente, metodo)(f"/api/activos/{activo.id}/", cuerpo, format="json")
            self.assertEqual(r.status_code, 403, metodo)
        activo.refresh_from_db()
        self.assertEqual(activo.descripcion, "Original")

    def test_los_campos_de_solo_lectura_no_se_pueden_sobrescribir(self):
        categoria = Categoria.objects.create(nombre="Equipo")
        ubicacion = Ubicacion.objects.create(departamento=Departamento.objects.create(nombre="TI"), nombre="Lab")
        cliente = APIClient()
        cliente.force_authenticate(self.usuarios[C])
        r = cliente.post(
            "/api/activos/",
            {
                "codigo": "X-2",
                "descripcion": "Prueba",
                "categoria": categoria.id,
                "ubicacion": ubicacion.id,
                "id": 777,
                "creado_en": "2000-01-01T00:00:00Z",
            },
            format="json",
        )
        self.assertEqual(r.status_code, 201, r.content)
        self.assertNotEqual(r.data["id"], 777)
        self.assertNotEqual(r.data["creado_en"][:4], "2000")


class ProteccionCsrfTests(TestCase):
    """La autenticación por sesión (admin de Django, navegador) exige CSRF; la
    de token no, porque el token no viaja solo en el navegador."""

    def setUp(self):
        self.usuarios = crear_usuarios()

    def test_peticion_con_sesion_y_sin_csrf_es_rechazada(self):
        cliente = Client(enforce_csrf_checks=True)
        self.assertTrue(cliente.login(username="seg_administrador", password=CLAVE))
        r = cliente.post("/api/activos/categorias/", {"nombre": "X"}, content_type="application/json")
        self.assertEqual(r.status_code, 403)
        self.assertFalse(Categoria.objects.filter(nombre="X").exists())

    def test_la_peticion_con_token_no_depende_de_cookies(self):
        from rest_framework.authtoken.models import Token

        token = Token.objects.create(user=self.usuarios[A]).key
        cliente = Client(enforce_csrf_checks=True)
        r = cliente.post(
            "/api/activos/categorias/",
            {"nombre": "Y"},
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Token {token}",
        )
        self.assertEqual(r.status_code, 201)
