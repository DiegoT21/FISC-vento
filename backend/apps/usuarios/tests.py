from django.test import TestCase
from rest_framework.test import APIClient

from .models import Rol, Usuario


class UsuarioModelTests(TestCase):
    def test_rol_por_defecto_es_custodio(self):
        usuario = Usuario.objects.create_user(username="jperez", password="x")
        self.assertEqual(usuario.rol, Rol.CUSTODIO)

    def test_str_usa_nombre_completo_si_existe(self):
        usuario = Usuario.objects.create_user(
            username="jperez", password="x", first_name="Juan", last_name="Pérez"
        )
        self.assertEqual(str(usuario), "Juan Pérez")

    def test_str_usa_username_si_no_hay_nombre(self):
        usuario = Usuario.objects.create_user(username="jperez", password="x")
        self.assertEqual(str(usuario), "jperez")


class UsuarioAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = Usuario.objects.create_user(
            username="admin", password="x", rol=Rol.ADMINISTRADOR
        )
        self.custodio = Usuario.objects.create_user(
            username="custodio", password="x", rol=Rol.CUSTODIO
        )

    def test_anonimo_no_puede_listar_usuarios(self):
        response = self.client.get("/api/usuarios/")
        self.assertEqual(response.status_code, 403)

    def test_custodio_no_puede_listar_usuarios(self):
        self.client.force_authenticate(self.custodio)
        response = self.client.get("/api/usuarios/")
        self.assertEqual(response.status_code, 403)

    def test_administrador_puede_listar_usuarios(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/usuarios/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 2)


class LoginAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.usuario = Usuario.objects.create_user(
            username="mdocente",
            password="clave-segura-123",
            email="maria.arrocha@utp.ac.pa",
            first_name="María",
            last_name="Arrocha",
            rol=Rol.ADMINISTRADOR,
        )

    def test_login_con_username_correcto_devuelve_token(self):
        response = self.client.post(
            "/api/usuarios/login/",
            {"email": "mdocente", "password": "clave-segura-123"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["usuario"]["rol"], Rol.ADMINISTRADOR)

    def test_login_con_email_correcto_devuelve_token(self):
        response = self.client.post(
            "/api/usuarios/login/",
            {"email": "maria.arrocha@utp.ac.pa", "password": "clave-segura-123"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.data)

    def test_login_con_contrasena_incorrecta_falla(self):
        response = self.client.post(
            "/api/usuarios/login/",
            {"email": "mdocente", "password": "incorrecta"},
        )
        self.assertEqual(response.status_code, 401)

    def test_login_sin_contrasena_falla_con_400(self):
        response = self.client.post("/api/usuarios/login/", {"email": "mdocente"})
        self.assertEqual(response.status_code, 400)

    def test_me_requiere_autenticacion(self):
        response = self.client.get("/api/usuarios/me/")
        self.assertEqual(response.status_code, 403)

    def test_me_devuelve_el_usuario_autenticado(self):
        login = self.client.post(
            "/api/usuarios/login/",
            {"email": "mdocente", "password": "clave-segura-123"},
        )
        token = login.data["token"]
        response = self.client.get(
            "/api/usuarios/me/", HTTP_AUTHORIZATION=f"Token {token}"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "mdocente")

    def test_logout_invalida_el_token(self):
        login = self.client.post(
            "/api/usuarios/login/",
            {"email": "mdocente", "password": "clave-segura-123"},
        )
        token = login.data["token"]

        self.client.post("/api/usuarios/logout/", HTTP_AUTHORIZATION=f"Token {token}")

        response = self.client.get(
            "/api/usuarios/me/", HTTP_AUTHORIZATION=f"Token {token}"
        )
        self.assertEqual(response.status_code, 403)
