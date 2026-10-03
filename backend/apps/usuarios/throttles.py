from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    """Limita los intentos de inicio de sesión por IP y cuenta (frena la fuerza
    bruta sobre una contraseña sin bloquear a otros usuarios de la misma red).

    Los contadores viven en la caché del proceso: con varios workers cada uno
    cuenta por su lado, así que el límite real puede ser N veces la tasa."""

    scope = "login"

    def get_cache_key(self, request, view):
        datos = request.data if hasattr(request.data, "get") else {}
        cuenta = str(datos.get("email") or datos.get("username") or "").strip().lower()
        return self.cache_format % {"scope": self.scope, "ident": f"{self.get_ident(request)}:{cuenta}"}
