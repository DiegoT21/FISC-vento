from unittest import mock

from django.core.cache import cache
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.usuarios.throttles import LoginRateThrottle

from .utilidades import CLAVE, RUTAS_PUBLICAS, crear_usuarios, rutas_api

LOGIN = "/api/usuarios/login/"


class EndpointsExigenAutenticacionTests(TestCase):
    def test_se_descubren_las_rutas_de_la_api(self):
        rutas = rutas_api()
        self.assertGreaterEqual(len(rutas), 12, rutas)
        self.assertTrue(all("(" not in r and "<" not in r for r in rutas), rutas)

    def test_ninguna_ruta_privada_responde_sin_token(self):
        cliente = APIClient()
        for ruta in rutas_api():
            if ruta in RUTAS_PUBLICAS:
                continue
            for metodo in ("get", "post", "put", "patch", "delete"):
                with self.subTest(ruta=ruta, metodo=metodo):
                    r = getattr(cliente, metodo)(f"/{ruta}", {}, format="json")
                    self.assertIn(r.status_code, (401, 403), f"{metodo.upper()} /{ruta} -> {r.status_code}")

    def test_token_invalido_o_manipulado_es_rechazado(self):
        usuarios = crear_usuarios()
        token = Token.objects.create(user=usuarios["ADMINISTRADOR"]).key
        for cabecera in (
            "Token " + "0" * 40,
            "Token " + token[:-1] + ("0" if token[-1] != "0" else "1"),
            "Token",
            "Token  ",
            "Bearer " + token,
            "Token " + token + " extra",
            "Token '; DROP TABLE activos_activo; --",
        ):
            with self.subTest(cabecera=cabecera[:30]):
                r = APIClient().get("/api/activos/", HTTP_AUTHORIZATION=cabecera)
                self.assertIn(r.status_code, (401, 403))

    def test_token_deja_de_servir_tras_cerrar_sesion(self):
        usuarios = crear_usuarios()
        token = Token.objects.create(user=usuarios["CUSTODIO"]).key
        cliente = APIClient()
        cliente.credentials(HTTP_AUTHORIZATION=f"Token {token}")
        self.assertEqual(cliente.get("/api/activos/").status_code, 200)
        self.assertEqual(cliente.post("/api/usuarios/logout/").status_code, 204)
        self.assertIn(cliente.get("/api/activos/").status_code, (401, 403))

    def test_usuario_desactivado_no_puede_usar_su_token(self):
        usuarios = crear_usuarios()
        token = Token.objects.create(user=usuarios["CUSTODIO"]).key
        usuarios["CUSTODIO"].is_active = False
        usuarios["CUSTODIO"].save()
        r = APIClient().get("/api/activos/", HTTP_AUTHORIZATION=f"Token {token}")
        self.assertIn(r.status_code, (401, 403))


class LoginTests(TestCase):
    def setUp(self):
        cache.clear()
        self.usuarios = crear_usuarios()
        self.cliente = APIClient()

    def tearDown(self):
        cache.clear()

    def test_credenciales_incorrectas_no_revelan_si_el_usuario_existe(self):
        existente = self.cliente.post(LOGIN, {"username": "seg_administrador", "password": "mala"}, format="json")
        inexistente = self.cliente.post(LOGIN, {"username": "no_existe", "password": "mala"}, format="json")
        self.assertEqual(existente.status_code, 401)
        self.assertEqual(existente.status_code, inexistente.status_code)
        self.assertEqual(existente.json(), inexistente.json())

    def test_login_exitoso_no_expone_la_contrasena(self):
        r = self.cliente.post(LOGIN, {"username": "seg_administrador", "password": CLAVE}, format="json")
        self.assertEqual(r.status_code, 200)
        cuerpo = r.content.decode().lower()
        self.assertNotIn("password", cuerpo)
        self.assertNotIn("pbkdf2", cuerpo)

    def test_usuario_desactivado_no_puede_iniciar_sesion(self):
        self.usuarios["AUDITOR"].is_active = False
        self.usuarios["AUDITOR"].save()
        r = self.cliente.post(LOGIN, {"username": "seg_auditor", "password": CLAVE}, format="json")
        self.assertEqual(r.status_code, 401)

    def test_contrasena_vacia_o_ausente_se_rechaza(self):
        for datos in ({"username": "seg_administrador"}, {"username": "seg_administrador", "password": ""}, {}):
            with self.subTest(datos=datos):
                self.assertEqual(self.cliente.post(LOGIN, datos, format="json").status_code, 400)

    def test_entradas_con_tipos_inesperados_no_provocan_error_500(self):
        # Ataques tipo NoSQL/JSON: la API debe responder 400/401, nunca 500.
        peligrosas = [
            {"email": {"$ne": ""}, "password": {"$ne": ""}},
            {"email": ["a", "b"], "password": "x"},
            {"email": 12345, "password": 67890},
            {"email": None, "password": None},
            {"email": True, "password": False},
            {"username": {"a": 1}, "password": "x"},
        ]
        for datos in peligrosas:
            with self.subTest(datos=datos):
                r = self.cliente.post(LOGIN, datos, format="json")
                self.assertIn(r.status_code, (400, 401), r.content[:200])

    def test_cuerpo_que_no_es_un_objeto_no_provoca_error_500(self):
        for cuerpo in ('["a"]', '"texto"', "123", "null", "{no es json"):
            with self.subTest(cuerpo=cuerpo):
                r = self.cliente.post(LOGIN, cuerpo, content_type="application/json")
                self.assertIn(r.status_code, (400, 401, 415), r.content[:200])

    def test_payloads_de_inyeccion_sql_en_login_se_rechazan(self):
        cargas = ["' OR '1'='1", "admin'--", '" OR ""="', "'; DROP TABLE usuarios_usuario; --"]
        for carga in cargas:
            with self.subTest(carga=carga):
                r = self.cliente.post(LOGIN, {"email": carga, "password": carga}, format="json")
                self.assertEqual(r.status_code, 401)

    def test_los_intentos_repetidos_se_limitan(self):
        with mock.patch.dict(LoginRateThrottle.THROTTLE_RATES, {"login": "3/min"}):
            codigos = [
                self.cliente.post(LOGIN, {"username": "seg_administrador", "password": "mala"}, format="json").status_code
                for _ in range(5)
            ]
        self.assertEqual(codigos[:3], [401, 401, 401])
        self.assertEqual(codigos[3:], [429, 429])

    def test_el_limite_es_por_cuenta_y_no_bloquea_a_otros_usuarios(self):
        with mock.patch.dict(LoginRateThrottle.THROTTLE_RATES, {"login": "2/min"}):
            for _ in range(3):
                self.cliente.post(LOGIN, {"username": "seg_administrador", "password": "mala"}, format="json")
            otro = self.cliente.post(LOGIN, {"username": "seg_custodio", "password": CLAVE}, format="json")
        self.assertEqual(otro.status_code, 200)


class ExposicionDeDatosTests(TestCase):
    def test_ninguna_respuesta_de_usuarios_incluye_contrasenas_ni_permisos_internos(self):
        usuarios = crear_usuarios()
        cliente = APIClient()
        cliente.force_authenticate(usuarios["ADMINISTRADOR"])
        for ruta in ("/api/usuarios/", "/api/usuarios/me/"):
            cuerpo = cliente.get(ruta).content.decode().lower()
            for prohibido in ("password", "pbkdf2", "is_superuser", "is_staff", "last_login"):
                with self.subTest(ruta=ruta, campo=prohibido):
                    self.assertNotIn(prohibido, cuerpo)
