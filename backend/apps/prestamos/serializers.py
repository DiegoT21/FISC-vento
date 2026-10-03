from rest_framework import serializers

from .models import Prestamo


class PrestamoSerializer(serializers.ModelSerializer):
    activo_codigo = serializers.CharField(source="activo.codigo", read_only=True)
    prestado_a_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Prestamo
        fields = [
            "id", "activo", "activo_codigo", "prestado_a", 
            "prestado_a_nombre", "estado", "fecha_prestamo", "fecha_devolucion"
        ]
        
    def get_prestado_a_nombre(self, obj):
        # prestado_a is a direct CharField or a ForeignKey? Let's assume it's CharField in the model for the person's name or a User?
        # Wait, I didn't check the model. Let's check the model just in case, but typically we can use string representation.
        return str(obj.prestado_a) if obj.prestado_a else ""
