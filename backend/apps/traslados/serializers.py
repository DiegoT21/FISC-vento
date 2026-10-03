from rest_framework import serializers

from .models import SolicitudTraslado


class SolicitudTrasladoSerializer(serializers.ModelSerializer):
    activo_codigo = serializers.CharField(source="activo.codigo", read_only=True)
    ubicacion_origen_nombre = serializers.CharField(source="ubicacion_origen.nombre", read_only=True)
    ubicacion_destino_nombre = serializers.CharField(source="ubicacion_destino.nombre", read_only=True)
    solicitado_por_username = serializers.CharField(source="solicitado_por.username", read_only=True)

    class Meta:
        model = SolicitudTraslado
        fields = [
            "id",
            "activo",
            "activo_codigo",
            "ubicacion_origen",
            "ubicacion_origen_nombre",
            "ubicacion_destino",
            "ubicacion_destino_nombre",
            "solicitado_por",
            "solicitado_por_username",
            "estado",
            "creado_en",
        ]
        read_only_fields = ["ubicacion_origen", "solicitado_por", "estado"]
