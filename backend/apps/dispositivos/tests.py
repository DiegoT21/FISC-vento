from datetime import timedelta
from urllib.parse import parse_qs, urlparse

from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.usuarios.models import Rol, Usuario

from .models import CodigoVinculacion, Dispositivo, calcular_hash

URL_GENERAR = "/api/dispositivos/vinculacion/"
URL_VINCULAR = "/api/dispositivos/vincular/"
URL_LISTA = "/api/dispositivos/"


class BaseVinculacionTests(TestCase):
    def setUp(self):
        cache.clear()  # el throttle del endpoint publico vive en cache
        self.client = APIClient()
        self.admin = Usuario.objects.create_user(username="admin", password="x", rol=Rol.ADMINISTRADOR)
        self.custodio = Usuario.objects.create_user(username="custodio", password="x", rol=Rol.CUSTODIO)

    def generar_codigo(self):
        self.client.force_authenticate(self.admin)
        respuesta = self.client.post(URL_GENERAR, {"url_base": "http://3.149.4.52/"}, format="json")
        self.client.force_authenticate(None)
        return respuesta.data["codigo"]

    def vincular(self, codigo, **extra):
        datos = {"codigo": codigo, "nombre_dispositivo": "TC22R", "modelo": "Zebra TC22R"}
        datos.update(extra)
        return APIClient().post(URL_VINCULAR, datos, format="json")


class GenerarVinculacionTests(BaseVinculacionTests):
    def test_solo_administrador_puede_generar(self):
        self.assertEqual(self.client.post(URL_GENERAR).status_code, 403)
        self.client.force_authenticate(self.custodio)
        self.assertEqual(self.client.post(URL_GENERAR).status_code, 403)
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(URL_GENERAR).status_code, 201)

    def test_devuelve_codigo_vigencia_y_payload(self):
        self.client.force_authenticate(self.admin)
        r = self.client.post(URL_GENERAR, {"url_base": "https://fisc.utp.ac.pa"}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(len(r.data["codigo"]), 10)
        self.assertEqual(r.data["vigencia_segundos"], 600)
        self.assertLess(r.data["expira_en"], timezone.now() + timedelta(minutes=10, seconds=5))

        payload = urlparse(r.data["payload"])
        self.assertEqual(f"{payload.scheme}://{payload.netloc}{payload.path}", "fiscvento://vincular")
        consulta = parse_qs(payload.query)
        self.assertEqual(consulta["u"], ["https://fisc.utp.ac.pa/"])
        self.assertEqual(consulta["c"], [r.data["codigo"]])

    def test_sin_url_base_usa_la_del_request(self):
        self.client.force_authenticate(self.admin)
        r = self.client.post(URL_GENERAR, HTTP_HOST="staging.example.com")
        self.assertEqual(parse_qs(urlparse(r.data["payload"]).query)["u"], ["http://staging.example.com/"])

    def test_url_base_con_esquema_invalido_se_rechaza(self):
        self.client.force_authenticate(self.admin)
        r = self.client.post(URL_GENERAR, {"url_base": "ftp://x.com/"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_el_codigo_no_se_guarda_en_claro(self):
        codigo = self.generar_codigo()
        registro = CodigoVinculacion.objects.get()
        self.assertNotEqual(registro.codigo_hash, codigo)
        self.assertEqual(registro.codigo_hash, calcular_hash(codigo))
        self.assertEqual(registro.creado_por, self.admin)


class VincularTests(BaseVinculacionTests):
    def test_vincula_y_devuelve_token_de_dispositivo(self):
        codigo = self.generar_codigo()
        r = self.vincular(codigo, android_id="abc123")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["dispositivo"]["nombre"], "TC22R")
        dispositivo = Dispositivo.objects.get()
        self.assertEqual(dispositivo.modelo, "Zebra TC22R")
        self.assertEqual(dispositivo.android_id, "abc123")
        self.assertEqual(dispositivo.vinculado_por, self.admin)
        self.assertEqual(dispositivo.token_hash, calcular_hash(r.data["token_dispositivo"]))
        self.assertNotEqual(dispositivo.token_hash, r.data["token_dispositivo"])

    def test_el_codigo_es_de_un_solo_uso(self):
        codigo = self.generar_codigo()
        self.assertEqual(self.vincular(codigo).status_code, 201)
        r = self.vincular(codigo)
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Dispositivo.objects.count(), 1)

    def test_codigo_vencido_se_rechaza(self):
        codigo = self.generar_codigo()
        CodigoVinculacion.objects.update(expira_en=timezone.now() - timedelta(seconds=1))
        self.assertEqual(self.vincular(codigo).status_code, 400)
        self.assertEqual(Dispositivo.objects.count(), 0)

    def test_codigo_inexistente_o_con_formato_malo_da_el_mismo_error(self):
        codigo = self.generar_codigo()
        for malo in ("ZZZZZZZZZZ", "corto", "x" * 40):
            r = self.vincular(malo)
            self.assertEqual(r.status_code, 400)
            self.assertEqual(r.data["detail"], "El código de vinculación no es válido o ya venció.")
        # el codigo bueno sigue vigente tras los intentos fallidos
        self.assertEqual(self.vincular(codigo).status_code, 201)

    def test_acepta_codigo_en_minusculas_y_con_guion(self):
        codigo = self.generar_codigo()
        formateado = f"{codigo[:5]}-{codigo[5:]}".lower()
        self.assertEqual(self.vincular(formateado).status_code, 201)

    def test_faltan_campos(self):
        r = APIClient().post(URL_VINCULAR, {"codigo": "ABCDEFGHJK"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_limita_los_intentos_por_ip(self):
        for _ in range(10):
            self.assertEqual(self.vincular("ZZZZZZZZZZ").status_code, 400)
        self.assertEqual(self.vincular("ZZZZZZZZZZ").status_code, 429)


class AdministracionDispositivosTests(BaseVinculacionTests):
    def vincular_uno(self):
        r = self.vincular(self.generar_codigo())
        return r.data["dispositivo"]["id"], r.data["token_dispositivo"]

    def test_lista_y_revocacion_solo_para_administrador(self):
        dispositivo_id, _ = self.vincular_uno()
        self.assertEqual(self.client.get(URL_LISTA).status_code, 403)
        self.client.force_authenticate(self.custodio)
        self.assertEqual(self.client.get(URL_LISTA).status_code, 403)
        self.assertEqual(self.client.post(f"{URL_LISTA}{dispositivo_id}/revocar/").status_code, 403)

        self.client.force_authenticate(self.admin)
        lista = self.client.get(URL_LISTA)
        self.assertEqual(lista.status_code, 200)
        self.assertEqual(len(lista.data["results"]), 1)
        self.assertNotIn("token_hash", lista.data["results"][0])
        self.assertFalse(lista.data["results"][0]["revocado"])

        r = self.client.post(f"{URL_LISTA}{dispositivo_id}/revocar/")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data["revocado"])
        self.assertIsNotNone(r.data["revocado_en"])

    def test_revocar_dispositivo_inexistente_da_404(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.client.post(f"{URL_LISTA}999/revocar/").status_code, 404)

    def test_token_de_dispositivo_actualiza_ultimo_uso(self):
        dispositivo_id, token = self.vincular_uno()
        self.assertIsNone(Dispositivo.objects.get(pk=dispositivo_id).ultimo_uso)
        APIClient().get("/api/usuarios/me/", HTTP_X_DISPOSITIVO_TOKEN=token)
        self.assertIsNotNone(Dispositivo.objects.get(pk=dispositivo_id).ultimo_uso)

    def test_dispositivo_revocado_recibe_403_con_codigo(self):
        dispositivo_id, token = self.vincular_uno()
        Dispositivo.objects.filter(pk=dispositivo_id).update(revocado=True)
        r = APIClient().get("/api/usuarios/me/", HTTP_X_DISPOSITIVO_TOKEN=token)
        self.assertEqual(r.status_code, 403)
        self.assertEqual(r.json()["codigo"], "dispositivo_revocado")

    def test_sin_encabezado_o_con_token_desconocido_no_cambia_nada(self):
        self.vincular_uno()
        sin = APIClient().get("/api/usuarios/me/")
        desconocido = APIClient().get("/api/usuarios/me/", HTTP_X_DISPOSITIVO_TOKEN="no-existe")
        # no autenticado: el mismo 403 normal de DRF, no el de dispositivo revocado
        self.assertEqual(sin.status_code, 403)
        self.assertEqual(desconocido.status_code, 403)
        self.assertNotIn("codigo", desconocido.json())