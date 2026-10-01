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
