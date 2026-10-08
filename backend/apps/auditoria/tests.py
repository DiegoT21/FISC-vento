from asgiref.sync import async_to_sync
from django.contrib.auth.models import AnonymousUser
from django.db import transaction
from django.test import RequestFactory, SimpleTestCase, TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from apps.activos.models import Activo, Categoria
from apps.ubicaciones.models import Departamento, Ubicacion
from apps.prestamos.models import Prestamo
from apps.traslados.models import SolicitudTraslado
from apps.usuarios.models import Rol, Usuario
from config.middleware import AuditoriaMiddleware, obtener_usuario_actual

from .models import Accion, RegistroAuditoria


class AuditoriaSignalTests(TestCase):
    def setUp(self):
        self.categoria = Categoria.objects.create(nombre="Equipo")
        depto = Departamento.objects.create(nombre="Departamento de TI")
        self.ubicacion = Ubicacion.objects.create(departamento=depto, nombre="Lab. 3-407")

    def test_crear_un_activo_genera_un_registro_de_creacion(self):
        activo = Activo.objects.create(
            codigo="SVT-118423",
            descripcion="CPU Dell OptiPlex 3080",
            categoria=self.categoria,
            ubicacion=self.ubicacion,
        )
        registro = RegistroAuditoria.objects.get(tabla="activos_activo", objeto_id=str(activo.pk))
        self.assertEqual(registro.accion, Accion.CREACION)
        self.assertEqual(registro.tabla, "activos_activo")

    def test_modificar_un_activo_genera_un_registro_de_modificacion(self):
        activo = Activo.objects.create(
            codigo="SVT-118423",
            descripcion="CPU Dell OptiPlex 3080",
            categoria=self.categoria,
            ubicacion=self.ubicacion,
        )
        RegistroAuditoria.objects.all().delete()  # limpiar el de creación

        activo.descripcion = "CPU Dell OptiPlex 3080 (actualizado)"
        activo.save()

        registro = RegistroAuditoria.objects.get(tabla="activos_activo", objeto_id=str(activo.pk))
        self.assertEqual(registro.accion, Accion.MODIFICACION)

    def test_borrar_un_activo_genera_un_registro_de_eliminacion(self):
        activo = Activo.objects.create(
            codigo="SVT-118423",
            descripcion="CPU Dell OptiPlex 3080",
            categoria=self.categoria,
            ubicacion=self.ubicacion,
        )
        activo_id = str(activo.pk)
        RegistroAuditoria.objects.all().delete()  # limpiar el de creación

        activo.delete()

        registro = RegistroAuditoria.objects.get(tabla="activos_activo", objeto_id=activo_id)
        self.assertEqual(registro.accion, Accion.ELIMINACION)


class AuditoriaCompletaTests(TestCase):
    def setUp(self):
        self.usuario = Usuario.objects.create_user(username="admin", rol=Rol.ADMINISTRADOR)
        self.departamento = Departamento.objects.create(nombre="TI")
        self.ubicacion = Ubicacion.objects.create(departamento=self.departamento, nombre="Laboratorio")
        self.categoria = Categoria.objects.create(nombre="Equipo")
        self.activo = Activo.objects.create(codigo="AUD-1", descripcion="Equipo", categoria=self.categoria, ubicacion=self.ubicacion)
        self.client = APIClient()
        RegistroAuditoria.objects.all().delete()

    def registros(self, objeto):
        return RegistroAuditoria.objects.filter(tabla=objeto._meta.db_table, objeto_id=str(objeto.pk))

    def test_snapshot_creacion_y_eliminacion(self):
        categoria = Categoria.objects.create(nombre="Nuevo")
        registro = self.registros(categoria).get()
        self.assertEqual(registro.detalle, {"id": categoria.pk, "nombre": "Nuevo"})
        self.assertIsNone(registro.usuario)
        categoria_id = categoria.pk
        categoria.nombre = "Cambio sin guardar"
        categoria.delete()
        registro = RegistroAuditoria.objects.get(tabla="activos_categoria", objeto_id=str(categoria_id), accion=Accion.ELIMINACION)
        self.assertEqual(registro.detalle["nombre"], "Nuevo")

    def test_cambios_con_valores_previos_y_nuevos(self):
        self.activo.descripcion = "Otra descripción"
        self.activo.responsable = self.usuario
        self.activo.save(update_fields=["descripcion", "responsable"])
        self.assertEqual(self.registros(self.activo).get().detalle, {
            "descripcion": {"anterior": "Equipo", "nuevo": "Otra descripción"},
            "responsable": {"anterior": None, "nuevo": self.usuario.pk},
        })

    def test_update_fields_ignora_cambios_no_persistidos(self):
        self.activo.descripcion = "No guardar"
        self.activo.marca = "Dell"
        self.activo.save(update_fields=["marca"])
        self.assertEqual(self.registros(self.activo).get().detalle, {"marca": {"anterior": "", "nuevo": "Dell"}})
        self.categoria.save()
        self.assertFalse(self.registros(self.categoria).exists())

    def test_cubre_modelos_de_todos_los_dominios(self):
        destino = Ubicacion.objects.create(departamento=self.departamento, nombre="Destino")
        prestamo = Prestamo.objects.create(activo=self.activo, prestado_a=self.usuario)
        traslado = SolicitudTraslado.objects.create(activo=self.activo, ubicacion_origen=self.ubicacion, ubicacion_destino=destino, solicitado_por=self.usuario)
        usuario = Usuario.objects.create_user(username="nuevo", password="clave-de-prueba")
        for objeto, campo, nuevo in (
            (destino, "nombre", "Otro destino"),
            (prestamo, "estado", "DEVUELTO"),
            (traslado, "estado", "AUTORIZADO"),
            (usuario, "first_name", "Nombre"),
        ):
            with self.subTest(modelo=objeto._meta.label):
                self.assertEqual(self.registros(objeto).get().accion, Accion.CREACION)
                anterior = getattr(objeto, campo)
                setattr(objeto, campo, nuevo)
                objeto.save(update_fields=[campo])
                registro = self.registros(objeto).get(accion=Accion.MODIFICACION)
                self.assertEqual(registro.detalle[campo], {"anterior": anterior, "nuevo": nuevo})
        self.assertNotIn("password", self.registros(usuario).get(accion=Accion.CREACION).detalle)
        usuario.set_password("otra-clave")
        usuario.save(update_fields=["password"])
        self.assertEqual(self.registros(usuario).count(), 2)
        for objeto in (prestamo, traslado, destino, usuario):
            tabla, pk = objeto._meta.db_table, str(objeto.pk)
            objeto.delete()
            self.assertTrue(RegistroAuditoria.objects.filter(tabla=tabla, objeto_id=pk, accion=Accion.ELIMINACION).exists())

    def test_actor_por_sesion_y_token_y_limpieza_del_contexto(self):
        token = Token.objects.create(user=self.usuario)
        for autenticacion in ("sesion", "token"):
            with self.subTest(autenticacion=autenticacion):
                self.client.logout()
                if autenticacion == "sesion":
                    self.client.force_login(self.usuario)
                else:
                    self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
                respuesta = self.client.patch(f"/api/activos/{self.activo.pk}/", {"descripcion": autenticacion}, format="json")
                self.assertEqual(respuesta.status_code, 200)
                self.assertEqual(self.registros(self.activo).first().usuario_id, self.usuario.pk)
                self.assertIsNone(obtener_usuario_actual())
                respuesta = self.client.post("/api/activos/", {
                    "codigo": f"AUD-{autenticacion}", "descripcion": "Nuevo",
                    "categoria": self.categoria.pk, "ubicacion": self.ubicacion.pk,
                }, format="json")
                self.assertEqual(respuesta.status_code, 201)
                pk = respuesta.data["id"]
                registro = RegistroAuditoria.objects.get(tabla="activos_activo", objeto_id=str(pk))
                self.assertEqual(registro.usuario_id, self.usuario.pk)
                self.assertEqual(registro.accion, Accion.CREACION)
                self.assertEqual(self.client.delete(f"/api/activos/{pk}/").status_code, 204)
                registro = RegistroAuditoria.objects.get(tabla="activos_activo", objeto_id=str(pk), accion=Accion.ELIMINACION)
                self.assertEqual(registro.usuario_id, self.usuario.pk)
        self.categoria.nombre = "Fuera de un request"
        self.categoria.save()
        self.assertIsNone(self.registros(self.categoria).get().usuario_id)

    def test_rollback_revierte_tambien_el_historial(self):
        try:
            with transaction.atomic():
                Categoria.objects.create(nombre="Rollback")
                raise ValueError("Revertir")
        except ValueError:
            pass
        self.assertFalse(RegistroAuditoria.objects.exists())

    def test_filtros_y_api_solo_lectura_con_permisos_existentes(self):
        self.activo.descripcion = "Editado"
        self.activo.save()
        self.categoria.nombre = "Editada"
        self.categoria.save()
        for rol in (Rol.ADMINISTRADOR, Rol.AUDITOR, Rol.CUSTODIO):
            self.usuario.rol = rol
            self.usuario.save()
            self.client.force_authenticate(self.usuario)
            respuesta = self.client.get("/api/auditoria/", {"tabla": "activos_activo", "objeto_id": str(self.activo.pk)})
            with self.subTest(rol=rol):
                if rol == Rol.CUSTODIO:
                    self.assertEqual(respuesta.status_code, 403)
                    continue
                self.assertEqual(respuesta.status_code, 200)
                self.assertEqual(respuesta.data["count"], 1)
                registro = respuesta.data["results"][0]
                self.assertEqual(self.client.get(f"/api/auditoria/{registro['id']}/").status_code, 200)
                self.assertEqual(self.client.post("/api/auditoria/", {}, format="json").status_code, 405)
                for metodo in (self.client.put, self.client.patch, self.client.delete):
                    self.assertEqual(metodo(f"/api/auditoria/{registro['id']}/").status_code, 405)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/api/auditoria/").status_code, 403)
        self.client.force_authenticate(self.usuario)
        self.usuario.rol = Rol.AUDITOR
        self.assertEqual(self.client.get("/api/auditoria/", {"tabla": "inexistente"}).data["count"], 0)
        self.assertEqual(self.client.get("/api/auditoria/", {"objeto_id": "inexistente"}).data["count"], 0)


class AuditoriaMiddlewareTests(SimpleTestCase):
    def test_limpia_contexto_ante_excepcion_y_request_anonimo(self):
        request = RequestFactory().get("/")
        request.user = Usuario(username="actor")
        def respuesta(request):
            self.assertIs(obtener_usuario_actual(), request.user)
            raise ValueError("Error de la vista")
        with self.assertRaises(ValueError):
            AuditoriaMiddleware(respuesta)(request)
        self.assertIsNone(obtener_usuario_actual())
        request.user = AnonymousUser()
        AuditoriaMiddleware(lambda request: self.assertIsNone(obtener_usuario_actual()))(request)

    def test_contextos_async_aislados_y_limpieza(self):
        import asyncio
        async def ejecutar():
            async def respuesta(request):
                await asyncio.sleep(0)
                self.assertIs(obtener_usuario_actual(), request.user)
            middleware = AuditoriaMiddleware(respuesta)
            requests = []
            for nombre in ("uno", "dos"):
                request = RequestFactory().get("/")
                request.user = Usuario(username=nombre)
                requests.append(request)
            await asyncio.gather(*(middleware(request) for request in requests))
            self.assertIsNone(obtener_usuario_actual())
        async_to_sync(ejecutar)()
