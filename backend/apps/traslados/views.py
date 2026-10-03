from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.usuarios.permissions import SoloAdministradorYCustodio

from .models import EstadoTraslado, SolicitudTraslado
from .serializers import SolicitudTrasladoSerializer


class SolicitudTrasladoViewSet(viewsets.ModelViewSet):
    queryset = SolicitudTraslado.objects.select_related(
        "activo", "ubicacion_origen", "ubicacion_destino", "solicitado_por"
    ).all()
    serializer_class = SolicitudTrasladoSerializer
    permission_classes = [SoloAdministradorYCustodio]

    def perform_create(self, serializer):
        # Asignar solicitado_por automáticamente al usuario actual
        # y origen a la ubicación actual del activo para evitar inconsistencias
        activo = serializer.validated_data["activo"]
        serializer.save(
            solicitado_por=self.request.user,
            ubicacion_origen=activo.ubicacion,
            estado=EstadoTraslado.PENDIENTE
        )

    @action(detail=True, methods=["post"])
    def autorizar(self, request, pk=None):
        traslado = self.get_object()
        if traslado.estado == EstadoTraslado.AUTORIZADO:
            return Response(
                {"detail": "El traslado ya está autorizado."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Autorizar y actualizar el activo
        traslado.estado = EstadoTraslado.AUTORIZADO
        traslado.save(update_fields=["estado"])
        
        activo = traslado.activo
        activo.ubicacion = traslado.ubicacion_destino
        activo.save(update_fields=["ubicacion", "actualizado_en"])
        
        return Response(self.get_serializer(traslado).data)
