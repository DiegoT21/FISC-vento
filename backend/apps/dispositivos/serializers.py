from rest_framework import serializers

from .models import Dispositivo


class DispositivoSerializer(serializers.ModelSerializer):
    vinculado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Dispositivo
        fields = [
            "id",
            "nombre",
            "modelo",
            "android_id",
            "registrado_en",
            "ultimo_uso",
            "revocado",
            "revocado_en",
            "vinculado_por_nombre",
        ]
        read_only_fields = fields

    def get_vinculado_por_nombre(self, obj):
        return str(obj.vinculado_por) if obj.vinculado_por else None


class VincularSerializer(serializers.Serializer):
    codigo = serializers.CharField(max_length=64, trim_whitespace=True)
    nombre_dispositivo = serializers.CharField(max_length=100, trim_whitespace=True)
    modelo = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    android_id = serializers.CharField(max_length=64, required=False, allow_blank=True, default="")


class GenerarVinculacionSerializer(serializers.Serializer):
    # URL publica que ira dentro del QR; si no llega se usa la del request.
    url_base = serializers.URLField(required=False)

    def validate_url_base(self, valor):
        if not valor.lower().startswith(("http://", "https://")):
            raise serializers.ValidationError("Debe empezar con http:// o https://")
        return valor