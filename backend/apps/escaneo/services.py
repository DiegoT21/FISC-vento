"""Servicios de generación/lectura para los 2 métodos de captura del
proyecto: código de barras y RFID (no se usa QR — ver docs/decisiones/0001).

- `generar_codigo_barras` produce una imagen a partir del `codigo` de un
  Activo (usar el paquete `python-barcode`).
- `buscar_por_codigo` resuelve un Activo a partir de lo leído por cámara
  (barras) o por un lector RFID (que entrega directamente el valor de
  `tag_rfid`) — la integración con hardware RFID en sí queda fuera de este
  paquete; aquí solo se resuelve el tag ya leído contra la base de datos.
"""
from io import BytesIO

from apps.activos.models import Activo


def generar_codigo_barras(activo: Activo) -> BytesIO:
    import barcode
    from barcode.writer import ImageWriter

    buffer = BytesIO()
    barcode.get("code128", activo.codigo, writer=ImageWriter()).write(buffer)
    buffer.seek(0)
    return buffer


def buscar_por_codigo(valor: str) -> Activo | None:
    """Resuelve un Activo por `codigo` (barras) o por `tag_rfid` (RFID)."""
    return Activo.objects.filter(codigo=valor).first() or Activo.objects.filter(
        tag_rfid=valor
    ).first()
