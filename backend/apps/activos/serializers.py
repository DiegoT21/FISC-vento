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
            "ref",
            "numero_serie",
            "marca",
            "modelo",
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
        # Los campos únicos y opcionales aceptan vacío y se guardan como NULL:
        # dos "" chocarían entre sí por la restricción de unicidad.
        extra_kwargs = {
            campo: {"allow_blank": True, "allow_null": True, "required": False}
            for campo in ("tag_rfid", "ref", "numero_serie")
        }

    def _vacio_a_none(self, valor):
        return valor.strip() or None if isinstance(valor, str) else valor

    def validate_tag_rfid(self, valor):
        return self._vacio_a_none(valor)

    def validate_ref(self, valor):
        return self._vacio_a_none(valor)

    def validate_numero_serie(self, valor):
        return self._vacio_a_none(valor)
