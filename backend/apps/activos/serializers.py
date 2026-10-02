from rest_framework import serializers

from .models import Activo, Categoria


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ["id", "nombre"]


class ActivoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source="categoria.nombre", read_only=True)
    ubicacion_nombre = serializers.CharField(source="ubicacion.nombre", read_only=True)
    departamento_nombre = serializers.CharField(
        source="ubicacion.departamento.nombre", read_only=True
    )

    class Meta:
        model = Activo
        fields = [
            "id",
            "codigo",
            "tag_rfid",
            "descripcion",
            "categoria",
            "categoria_nombre",
            "ubicacion",
            "ubicacion_nombre",
            "departamento_nombre",
            "responsable",
            "origen",
            "estado",
            "creado_en",
            "actualizado_en",
        ]
        read_only_fields = ["creado_en", "actualizado_en"]
