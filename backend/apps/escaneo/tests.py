from django.test import TestCase

from apps.activos.models import Activo, Categoria
from apps.ubicaciones.models import Departamento, Ubicacion

from .services import buscar_por_codigo, generar_codigo_barras


class EscaneoServiceTests(TestCase):
    def setUp(self):
        categoria = Categoria.objects.create(nombre="Equipo")
        depto = Departamento.objects.create(nombre="Departamento de TI")
        ubicacion = Ubicacion.objects.create(departamento=depto, nombre="Lab. 3-407")
        self.activo = Activo.objects.create(
            codigo="SVT-118423",
            tag_rfid="RF-118423",
            descripcion="CPU Dell OptiPlex 3080",
            categoria=categoria,
            ubicacion=ubicacion,
        )

    def test_buscar_por_codigo_de_barras(self):
        encontrado = buscar_por_codigo("SVT-118423")
        self.assertEqual(encontrado, self.activo)

    def test_buscar_por_tag_rfid(self):
        encontrado = buscar_por_codigo("RF-118423")
        self.assertEqual(encontrado, self.activo)

    def test_buscar_por_valor_inexistente_devuelve_none(self):
        self.assertIsNone(buscar_por_codigo("NO-EXISTE"))

    def test_generar_codigo_barras_devuelve_una_imagen_png(self):
        imagen = generar_codigo_barras(self.activo)
        contenido = imagen.read()
        # Firma de archivo PNG: los primeros 8 bytes son siempre estos.
        self.assertTrue(contenido.startswith(b"\x89PNG\r\n\x1a\n"))
