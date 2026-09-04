from rest_framework import serializers

from .models import Departamento, Ubicacion


class UbicacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ubicacion
        fields = ["id", "departamento", "nombre"]


class DepartamentoSerializer(serializers.ModelSerializer):
    ubicaciones = UbicacionSerializer(many=True, read_only=True)

    class Meta:
        model = Departamento
        fields = ["id", "nombre", "ubicaciones"]
