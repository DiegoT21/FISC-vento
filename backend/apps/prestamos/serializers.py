from rest_framework import serializers

from .models import Prestamo


class PrestamoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prestamo
        fields = ["id", "activo", "prestado_a", "estado", "fecha_prestamo", "fecha_devolucion"]
