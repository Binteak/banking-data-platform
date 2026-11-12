"""Autenticación JWT sin base de datos: login demo + Microsoft Entra ID.

El backend no tiene tabla de usuarios, así que no se usa djangorestframework-
simplejwt (depende de django.contrib.auth y de la base de datos). Se aceptan
dos tipos de token en la cabecera ``Authorization: Bearer <token>``:

1. Token DEMO (HS256): lo emite api/microservices/auth_login.py tras validar
   el usuario de demostración. Se firma con JWT_SECRET.
2. Token de MICROSOFT ENTRA ID (RS256): lo emite Microsoft al iniciar sesión
   con "Iniciar sesión con Microsoft". Se verifica con las claves públicas de
   Microsoft (JWKS), y se comprueban audiencia (nuestra app), emisor y caducidad.

Roles (RBAC):
- DataAdmin: puede subir y borrar datos.
- Analyst:   solo consulta.
Un token de Entra solo obtiene DataAdmin si viene de NUESTRO tenant (claim
``tid``) y trae ese rol asignado. En una app multi-tenant el administrador de
otro tenant podría asignar nuestros roles a sus usuarios: por eso se ignoran.
"""

from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from rest_framework import exceptions
from rest_framework.authentication import BaseAuthentication, get_authorization_header

# Este módulo NO puede importar vistas de DRF (APIView): DRF lo carga al leer
# DEFAULT_AUTHENTICATION_CLASSES y se produciría un import circular.

TOKEN_TYPE = "Bearer"

ROLE_DATA_ADMIN = "DataAdmin"
ROLE_ANALYST = "Analyst"
VALID_ROLES = {ROLE_DATA_ADMIN, ROLE_ANALYST}

ENTRA_LOGIN_HOST = "https://login.microsoftonline.com"


class TokenUser:
    """Usuario mínimo construido a partir de los claims del token."""

    is_authenticated = True
    is_anonymous = False

    def __init__(self, username, role=ROLE_ANALYST, provider="demo"):
        self.username = username
        self.role = role
        self.provider = provider

    @property
    def is_data_admin(self):
        return self.role == ROLE_DATA_ADMIN

    def __str__(self):
        return self.username


# ============================================================
# TOKEN DEMO (HS256)
# ============================================================

def demo_role():
    return settings.DEMO_ROLE if settings.DEMO_ROLE in VALID_ROLES else ROLE_ANALYST


def create_access_token(username, role=None):
    now = datetime.now(timezone.utc)
    payload = {
        "sub": username,
        "iat": now,
        "nbf": now,
        "exp": now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_MINUTES),
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "type": "access",
        "roles": [role or demo_role()],
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token):
    payload = jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM],  # lista fija: evita el ataque "alg: none"
        audience=settings.JWT_AUDIENCE,
        issuer=settings.JWT_ISSUER,
        options={"require": ["exp", "iat", "sub", "iss", "aud"]},
    )
    if payload.get("type") != "access":
        raise jwt.InvalidTokenError("Tipo de token no válido")
    return payload


# ============================================================
# TOKEN MICROSOFT ENTRA ID (RS256)
# ============================================================

def entra_enabled():
    return bool(settings.ENTRA_CLIENT_ID and settings.ENTRA_TENANT_ID)


_jwks_client = None


def _entra_jwks_client():
    """Claves públicas de Microsoft, cacheadas en memoria (se renuevan solas)."""
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = jwt.PyJWKClient(
            f"{ENTRA_LOGIN_HOST}/common/discovery/v2.0/keys",
            cache_keys=True,
            lifespan=24 * 3600,
            timeout=10,
        )
    return _jwks_client


def decode_entra_token(token):
    signing_key = _entra_jwks_client().get_signing_key_from_jwt(token).key
    client_id = settings.ENTRA_CLIENT_ID

    payload = jwt.decode(
        token,
        signing_key,
        algorithms=["RS256"],
        audience=[client_id, f"api://{client_id}"],
        options={"require": ["exp", "iat", "iss", "aud", "tid"], "verify_iss": False},
        leeway=60,
    )

    # Multi-tenant: el emisor depende del tenant del usuario, así que se valida
    # el formato exacto de Microsoft para el tid que viene en el propio token.
    tenant_id = payload["tid"]
    if payload["iss"] != f"{ENTRA_LOGIN_HOST}/{tenant_id}/v2.0":
        raise jwt.InvalidIssuerError("Emisor no válido")

    allowed = settings.ENTRA_ALLOWED_TENANTS
    if allowed and tenant_id not in allowed and tenant_id != settings.ENTRA_TENANT_ID:
        raise jwt.InvalidTokenError("Tenant no permitido")

    return payload


def entra_role(payload):
    """DataAdmin solo para usuarios de nuestro tenant con ese rol asignado."""
    own_tenant = payload.get("tid") == settings.ENTRA_TENANT_ID
    if own_tenant and ROLE_DATA_ADMIN in payload.get("roles", []):
        return ROLE_DATA_ADMIN
    return ROLE_ANALYST


def entra_username(payload):
    return (
        payload.get("preferred_username")
        or payload.get("email")
        or payload.get("name")
        or payload.get("oid")
        or "microsoft-user"
    )


# ============================================================
# CLASE DE AUTENTICACIÓN DRF
# ============================================================

class JWTAuthentication(BaseAuthentication):

    def authenticate(self, request):
        header = get_authorization_header(request).split()
        if not header:
            return None  # sin credenciales: la permission IsAuthenticated devuelve 401

        if header[0].lower() != TOKEN_TYPE.lower().encode() or len(header) != 2:
            raise exceptions.AuthenticationFailed("Cabecera Authorization no válida.")

        try:
            token = header[1].decode("utf-8")
            algorithm = jwt.get_unverified_header(token).get("alg")

            if algorithm == settings.JWT_ALGORITHM:
                payload = decode_access_token(token)
                role = (payload.get("roles") or [ROLE_ANALYST])[0]
                user = TokenUser(payload["sub"], role if role in VALID_ROLES else ROLE_ANALYST, "demo")

            elif algorithm == "RS256" and entra_enabled():
                payload = decode_entra_token(token)
                user = TokenUser(entra_username(payload), entra_role(payload), "entra")

            else:
                raise jwt.InvalidTokenError("Algoritmo no admitido")

        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("La sesión ha caducado.")
        except jwt.PyJWKClientError:
            raise exceptions.AuthenticationFailed("No se pudo verificar el token de Microsoft.")
        except (jwt.InvalidTokenError, UnicodeDecodeError, KeyError):
            raise exceptions.AuthenticationFailed("Token no válido.")

        return user, payload

    def authenticate_header(self, request):
        # Hace que DRF responda 401 (con WWW-Authenticate) en lugar de 403
        return f'{TOKEN_TYPE} realm="api"'
