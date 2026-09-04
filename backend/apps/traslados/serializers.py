from rest_framework import serializers

from .models import SolicitudTraslado


class SolicitudTrasladoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolicitudTraslado
        fields = [
            "id",
            "activo",
            "ubicacion_origen",
            "ubicacion_destino",
            "solicitado_por",
            "estado",
            "creado_en",
        ]
