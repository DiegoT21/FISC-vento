from django.test import TestCase
from rest_framework.test import APIClient

from apps.activos.models import Activo, Categoria
from apps.ubicaciones.models import Departamento, Ubicacion
from apps.usuarios.models import Rol

from .utilidades import crear_usuarios

CARGAS_SQL = [
    "' OR '1'='1",
    "' OR 1=1 --",
    "'; DROP TABLE activos_activo; --",
    "1; SELECT pg_sleep(5)",
    "\" OR \"\"=\"",
    "' UNION SELECT username, password FROM usuarios_usuario --",
    "%' AND 1=1 AND '%'='",
    "1 OR 1=1",
]
# El servidor puede reflejar lo que se le envió (p. ej. "«x» no es una opción"),
# así que no se busca SQL suelto: solo restos de errores internos.
PISTAS_DE_FUGA = ("traceback", "django.db", "psycopg", "sqlite3", "syntax error", "operationalerror", "programmingerror")


class _Base(TestCase):
    def setUp(self):
        self.usuarios = crear_usuarios()
        self.cliente = APIClient()
        self.cliente.force_authenticate(self.usuarios[Rol.ADMINISTRADOR])
        self.categoria = Categoria.objects.create(nombre="Equipo")
        self.ubicacion = Ubicacion.objects.create(departamento=Departamento.objects.create(nombre="TI"), nombre="Lab")
        self.activo = Activo.objects.create(
            codigo="SEG-1", descripcion="CPU", categoria=self.categoria, ubicacion=self.ubicacion
        )

    def _sin_fugas(self, respuesta):
        cuerpo = respuesta.content.decode(errors="replace").lower()
        for pista in PISTAS_DE_FUGA:
            self.assertNotIn(pista, cuerpo, f"la respuesta revela detalles internos: {pista!r}")


class InyeccionSqlTests(_Base):
    def test_busqueda_con_cargas_sql_no_falla_ni_devuelve_datos_ajenos(self):
        for carga in CARGAS_SQL:
            with self.subTest(carga=carga):
                r = self.cliente.get("/api/activos/", {"search": carga})
                self.assertEqual(r.status_code, 200, r.content[:200])
                self.assertEqual(r.json()["count"], 0)  # tratada como texto, no como SQL
                self._sin_fugas(r)
        self.assertTrue(Activo.objects.filter(pk=self.activo.pk).exists())

    def test_filtros_con_cargas_sql_responden_400_sin_error_interno(self):
        for parametro in ("categoria", "ubicacion", "estado", "origen"):
            for carga in CARGAS_SQL:
                with self.subTest(parametro=parametro, carga=carga):
                    r = self.cliente.get("/api/activos/", {parametro: carga})
                    self.assertIn(r.status_code, (200, 400), r.content[:200])
                    self._sin_fugas(r)

    def test_ordenar_por_campos_no_permitidos_no_filtra_informacion(self):
        for orden in ("responsable__password", "-responsable__password", "password", "responsable__is_superuser", "id; DROP TABLE x"):
            with self.subTest(orden=orden):
                r = self.cliente.get("/api/activos/", {"ordering": orden})
                self.assertEqual(r.status_code, 200)
                self._sin_fugas(r)

    def test_paginacion_con_valores_extremos(self):
        for pagina in ("-1", "0", "abc", "99999999999999999999", "1; DROP TABLE x", "%00"):
            with self.subTest(pagina=pagina):
                r = self.cliente.get("/api/activos/", {"page": pagina})
                self.assertIn(r.status_code, (200, 400, 404), r.content[:200])
                self._sin_fugas(r)

    def test_id_de_ruta_con_cargas_no_provoca_error_500(self):
        for valor in ("1%20OR%201=1", "abc", "-1", "99999999999999999999999", "1;DROP", "%00"):
            with self.subTest(valor=valor):
                r = self.cliente.get(f"/api/activos/{valor}/")
                self.assertIn(r.status_code, (400, 404), r.content[:200])
                self._sin_fugas(r)

    def test_crear_con_cargas_sql_las_guarda_como_texto_inofensivo(self):
        carga = "'); DROP TABLE activos_activo; --"
        r = self.cliente.post(
            "/api/activos/",
            {"codigo": "SEG-2", "descripcion": carga, "categoria": self.categoria.id, "ubicacion": self.ubicacion.id},
            format="json",
        )
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(Activo.objects.get(codigo="SEG-2").descripcion, carga)
        self.assertEqual(Activo.objects.count(), 2)


class EntradasMalformadasTests(_Base):
    def test_caracter_nulo_se_rechaza_con_400_en_cualquier_motor(self):
        # PostgreSQL no admite NUL en textos y lo convertiría en un error 500.
        r = self.cliente.get("/api/activos/", {"search": "a\x00b"})
        self.assertEqual(r.status_code, 400)
        r = self.cliente.post(
            "/api/activos/",
            {"codigo": "NUL\u0000", "descripcion": "x", "categoria": self.categoria.id, "ubicacion": self.ubicacion.id},
            format="json",
        )
        self.assertEqual(r.status_code, 400)
        self.assertFalse(Activo.objects.filter(codigo__startswith="NUL").exists())

    def test_textos_enormes_se_rechazan_sin_error_500(self):
        r = self.cliente.post(
            "/api/activos/",
            {"codigo": "A" * 10000, "descripcion": "B" * 100000, "categoria": self.categoria.id, "ubicacion": self.ubicacion.id},
            format="json",
        )
        self.assertEqual(r.status_code, 400)

    def test_tipos_de_dato_inesperados_se_rechazan_sin_error_500(self):
        cuerpos = [
            {"codigo": ["a"], "descripcion": {"x": 1}, "categoria": "uno", "ubicacion": None},
            {"codigo": None, "descripcion": None, "categoria": [], "ubicacion": {}},
            {"codigo": 123, "descripcion": True, "categoria": 1.5, "ubicacion": "1; DROP"},
        ]
        for cuerpo in cuerpos:
            with self.subTest(cuerpo=cuerpo):
                r = self.cliente.post("/api/activos/", cuerpo, format="json")
                self.assertIn(r.status_code, (400,), r.content[:200])
                self._sin_fugas(r)

    def test_cuerpos_que_no_son_json_valido_no_provocan_error_500(self):
        for cuerpo, tipo in (("{roto", "application/json"), ("<xml/>", "application/xml"), ("a=b", "text/plain"), ("[]", "application/json")):
            with self.subTest(tipo=tipo):
                r = self.cliente.post("/api/activos/", cuerpo, content_type=tipo)
                self.assertIn(r.status_code, (400, 415), r.content[:200])

    def test_ruta_inexistente_no_revela_informacion_de_depuracion(self):
        r = self.cliente.get("/api/no-existe/")
        self.assertEqual(r.status_code, 404)
        self._sin_fugas(r)


class XssAlmacenadoTests(_Base):
    CARGA = "<script>alert(document.cookie)</script><img src=x onerror=alert(1)>"

    def test_el_contenido_se_devuelve_como_json_y_con_nosniff(self):
        self.cliente.post(
            "/api/activos/",
            {"codigo": "XSS-1", "descripcion": self.CARGA, "categoria": self.categoria.id, "ubicacion": self.ubicacion.id},
            format="json",
        )
        r = self.cliente.get("/api/activos/", {"search": "XSS-1"})
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r["Content-Type"].startswith("application/json"))
        self.assertEqual(r["X-Content-Type-Options"], "nosniff")
        self.assertEqual(r.json()["results"][0]["descripcion"], self.CARGA)  # texto íntegro; el navegador lo escapa (React)

    def test_el_error_de_validacion_no_refleja_html_sin_escapar(self):
        r = self.cliente.get("/api/activos/", {"estado": self.CARGA})
        self.assertTrue(r["Content-Type"].startswith("application/json"))
        self.assertEqual(r["X-Content-Type-Options"], "nosniff")


class CabecerasDeSeguridadTests(_Base):
    def test_cabeceras_basicas_presentes(self):
        r = self.cliente.get("/api/activos/")
        self.assertEqual(r["X-Content-Type-Options"], "nosniff")
        self.assertEqual(r["X-Frame-Options"], "DENY")
        self.assertEqual(r["Referrer-Policy"], "same-origin")
        self.assertEqual(r["Cross-Origin-Opener-Policy"], "same-origin")
