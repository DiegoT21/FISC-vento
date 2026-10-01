from django.contrib.auth import authenticate
from rest_framework import viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Usuario
from .permissions import EsAdministrador
from .serializers import UsuarioSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by("username")
    serializer_class = UsuarioSerializer
    permission_classes = [EsAdministrador]


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """Autentica por email o username + password y devuelve un token.

    El frontend pide "correo electrónico", pero el modelo de Django usa
    username como campo de login — acá se resuelve el email a su username
    antes de autenticar, así ambos funcionan.
    """
    identificador = (request.data.get("email") or request.data.get("username") or "").strip()
    password = request.data.get("password") or ""

    if not identificador or not password:
        return Response({"detail": "Correo/usuario y contraseña son requeridos."}, status=400)

    username = identificador
    usuario_por_email = Usuario.objects.filter(email__iexact=identificador).first()
    if usuario_por_email:
        username = usuario_por_email.username

    usuario = authenticate(request, username=username, password=password)
    if usuario is None or not usuario.is_active:
        return Response({"detail": "Credenciales inválidas."}, status=401)

    token, _creado = Token.objects.get_or_create(user=usuario)
    return Response({"token": token.key, "usuario": UsuarioSerializer(usuario).data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    Token.objects.filter(user=request.user).delete()
    return Response(status=204)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(UsuarioSerializer(request.user).data)
