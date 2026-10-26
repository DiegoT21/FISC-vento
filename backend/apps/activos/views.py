import re

from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.usuarios.permissions import EscrituraSoloAdministrador, PuedeGestionarInventario

from .models import Activo, Categoria, DocumentoActivo, TagPorEditar
from .serializers import ActivoSerializer, CategoriaSerializer, DocumentoActivoSerializer

_EPC = re.compile(r"^[0-9A-F]{8,100}$")


class CategoriaViewSet(viewsets.ModelViewSet):
    permission_classes = [PuedeGestionarInventario]
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer


class ActivoViewSet(viewsets.ModelViewSet):
    queryset = Activo.objects.select_related(
        "categoria", "ubicacion__departamento", "responsable"
    ).all()
    serializer_class = ActivoSerializer

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["categoria", "estado", "ubicacion", "origen"]
    search_fields = [
        "codigo",
        "descripcion",
        "ref",
        "numero_serie",
        "marca",
        "modelo",
        "tag_rfid",
    ]
    ordering_fields = ["codigo", "creado_en", "estado"]

    def get_permissions(self):
        # Crear y editar: Administrador y Custodio. Borrar: solo Administrador.
        if self.action == "destroy":
            return [EscrituraSoloAdministrador()]
        return [PuedeGestionarInventario()]


def normalizar_epc(valor):
    return "".join(str(valor or "").split()).upper()


def _fila_por_editar(tag, estado):
    return {
        "id": tag.id if tag is not None else None,
        "epc": tag.epc if tag is not None else None,
        "leido_en": tag.leido_en if tag is not None else None,
        "leido_por_nombre": str(tag.leido_por) if tag is not None and tag.leido_por else None,
        "estado": estado,
    }


@api_view(["GET", "POST"])
@permission_classes([PuedeGestionarInventario])
def tags_por_editar(request):
    """Lista de tags leídos sin ficha, o el alta de uno leído por el TC22r."""
    if request.method == "GET":
        tags = TagPorEditar.objects.select_related("leido_por")
        return Response([_fila_por_editar(tag, "pendiente") for tag in tags])

    epc = normalizar_epc(request.data.get("epc", ""))
    if not _EPC.match(epc):
        return Response(
            {"epc": ["El EPC debe ser hexadecimal, de 8 a 100 caracteres."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if Activo.objects.filter(tag_rfid__iexact=epc).exists():
        return Response({**_fila_por_editar(None, "registrado"), "epc": epc})

    tag, creado = TagPorEditar.objects.get_or_create(
        epc=epc,
        defaults={"leido_por": request.user},
    )
    if not creado:
        tag.leido_en = timezone.now()
        tag.leido_por = request.user
        tag.save(update_fields=["leido_en", "leido_por"])
    return Response(
        _fila_por_editar(tag, "nuevo" if creado else "pendiente"),
        status=status.HTTP_201_CREATED if creado else status.HTTP_200_OK,
    )


@api_view(["DELETE"])
@permission_classes([PuedeGestionarInventario])
def descartar_tag_por_editar(request, pk):
    """Quita un pendiente que se leyó por error, sin crear el activo."""
    borrados, _ = TagPorEditar.objects.filter(pk=pk).delete()
    if not borrados:
        return Response({"detail": "Ese tag ya no está en Por editar."}, status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_204_NO_CONTENT)


class DocumentoActivoViewSet(viewsets.ModelViewSet):
    permission_classes = [PuedeGestionarInventario]
    queryset = DocumentoActivo.objects.all()
    serializer_class = DocumentoActivoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["activo"]
