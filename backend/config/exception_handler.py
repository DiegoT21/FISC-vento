from collections import Counter

from django.db.models import ProtectedError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def manejador_de_excepciones(exc, context):
    """Convierte el ProtectedError de Django (borrar algo que otros registros
    usan) en un 409 con un mensaje claro, en vez de un error 500."""
    if isinstance(exc, ProtectedError):
        conteo = Counter(obj._meta for obj in exc.protected_objects)
        detalle = ", ".join(
            f"{n} {(meta.verbose_name if n == 1 else meta.verbose_name_plural).lower()}"
            for meta, n in conteo.items()
        )
        return Response(
            {"detail": f"No se puede eliminar porque está en uso por: {detalle}."},
            status=status.HTTP_409_CONFLICT,
        )
    return exception_handler(exc, context)
