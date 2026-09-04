from rest_framework import serializers

from .models import Activo, Categoria


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ["id", "nombre"]


class ActivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Activo
        fields = [
            "id",
            "codigo",
            "tag_rfid",
            "descripcion",
            "categoria",
            "ubicacion",
            "responsable",
            "estado",
            "creado_en",
            "actualizado_en",
        ]
        read_only_fields = ["creado_en", "actualizado_en"]
