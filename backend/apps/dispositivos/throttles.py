from rest_framework.throttling import SimpleRateThrottle


class VinculacionRateThrottle(SimpleRateThrottle):
    """Frena el adivinado de codigos en el endpoint publico de vinculacion (por IP)."""

    scope = "vinculacion"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}