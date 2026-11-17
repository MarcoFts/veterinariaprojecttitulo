"""Validación estricta de alcance JWT (token_scope) para VetCare."""

from datetime import timedelta

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

SCOPE_FULL_ACCESS = "full_access"
SCOPE_MFA_CHALLENGE = "mfa_challenge"
SCOPE_MFA_ENROL = "mfa_enrol"


class FullAccessJWTAuthentication(JWTAuthentication):
    """Autenticación por defecto: rechaza tokens temporales y sesiones con security_stamp revocado."""

    def get_validated_token(self, raw_token):
        token = super().get_validated_token(raw_token)
        scope = token.get("token_scope")
        if scope in {SCOPE_MFA_CHALLENGE, SCOPE_MFA_ENROL}:
            raise InvalidToken("Se requiere completar el segundo factor de autenticación.")
        return token

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        token_stamp = validated_token.get("security_stamp")
        if token_stamp is not None:
            mfa = getattr(user, "mfa_profile", None)
            if mfa and mfa.security_stamp != token_stamp:
                raise InvalidToken("Sesión cerrada por reinicio o recuperación de seguridad.")
        return user


class MFAPendingJWTAuthentication(JWTAuthentication):
    allowed_scopes = {SCOPE_MFA_CHALLENGE, SCOPE_MFA_ENROL}

    def get_validated_token(self, raw_token):
        token = super().get_validated_token(raw_token)
        if token.get("token_scope") not in self.allowed_scopes:
            raise InvalidToken("Token inválido para desafío MFA.")
        return token


class FullOrEnrolJWTAuthentication(JWTAuthentication):
    allowed_scopes = {SCOPE_FULL_ACCESS, SCOPE_MFA_ENROL}

    def get_validated_token(self, raw_token):
        token = super().get_validated_token(raw_token)
        scope = token.get("token_scope")
        if scope == SCOPE_MFA_CHALLENGE:
            raise InvalidToken("Token inválido para enrolamiento MFA.")
        return token


def issue_mfa_token(user, scope: str, security_stamp: int, ttl_minutes: int = 5) -> str:
    token = AccessToken.for_user(user)
    token.set_exp(lifetime=timedelta(minutes=ttl_minutes))
    token["token_scope"] = scope
    token["security_stamp"] = security_stamp
    token["amr"] = ["pwd"]
    return str(token)


def issue_full_tokens(
    user, amr: list[str] | None = None, security_stamp: int | None = None
) -> dict[str, str]:
    refresh = RefreshToken.for_user(user)
    auth_methods = amr or ["pwd", "totp"]
    refresh["token_scope"] = SCOPE_FULL_ACCESS
    refresh["amr"] = auth_methods
    if security_stamp is not None:
        refresh["security_stamp"] = security_stamp

    access = refresh.access_token
    access["token_scope"] = SCOPE_FULL_ACCESS
    access["amr"] = auth_methods
    if security_stamp is not None:
        access["security_stamp"] = security_stamp

    return {
        "access": str(access),
        "refresh": str(refresh),
    }
