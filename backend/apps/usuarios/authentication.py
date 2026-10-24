from datetime import timedelta

from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

# El texto del login promete «30 días». El modelo Token de DRF no caduca solo:
# `created` se renueva en cada ingreso y aquí se rechaza si ya pasó el plazo.
DIAS_VIGENCIA_TOKEN = 30


class TokenConVigencia(TokenAuthentication):
    def authenticate_credentials(self, key):
        usuario, token = super().authenticate_credentials(key)
        if timezone.now() - token.created >= timedelta(days=DIAS_VIGENCIA_TOKEN):
            token.delete()
            raise AuthenticationFailed("La sesión expiró. Vuelve a ingresar.")
        return usuario, token
