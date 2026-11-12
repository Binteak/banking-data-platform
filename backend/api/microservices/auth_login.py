"""Login: valida el usuario de demostración y devuelve un access token JWT."""

import hmac

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from api.auth import TOKEN_TYPE, create_access_token, demo_role


def _credentials_match(username, password):
    # compare_digest: comparación en tiempo constante (sin fugas por tiempos)
    user_ok = hmac.compare_digest(username.encode(), settings.DEMO_USERNAME.encode())
    pass_ok = hmac.compare_digest(password.encode(), settings.DEMO_PASSWORD.encode())
    return user_ok and pass_ok


class LoginView(APIView):
    """POST /api/auth/login/  {username, password}  ->  {access_token, ...}"""

    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_scope = "login"  # limita intentos de fuerza bruta

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not isinstance(username, str) or not isinstance(password, str) or not username or not password:
            return Response(
                {"detail": "Usuario y contraseña son obligatorios."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not _credentials_match(username, password):
            return Response(
                {"detail": "Usuario o contraseña incorrectos."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response({
            "access_token": create_access_token(username),
            "token_type": TOKEN_TYPE,
            "expires_in": settings.JWT_ACCESS_TOKEN_MINUTES * 60,
            "username": username,
            "role": demo_role(),
        })
