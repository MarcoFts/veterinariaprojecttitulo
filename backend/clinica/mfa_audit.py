"""Registro de auditoría MFA sin exposición de secretos."""

from .mfa_models import MFAAuditLog

FORBIDDEN_KEYS = {
    "password",
    "secret",
    "secret_key",
    "manual_key",
    "otpauth_uri",
    "code",
    "totp",
    "recovery_code",
    "recovery_codes",
    "token",
    "access",
    "refresh",
    "mfa_token",
}


def get_client_ip(request) -> str | None:
    if request is None:
        return None
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def log_mfa_event(
    evento: str,
    resultado: str,
    *,
    user=None,
    username_attempted: str = "",
    request=None,
    metadata: dict | None = None,
) -> MFAAuditLog:
    clean_meta = {
        k: v
        for k, v in (metadata or {}).items()
        if str(k).lower() not in FORBIDDEN_KEYS
    }
    return MFAAuditLog.objects.create(
        user=user,
        username_attempted=(username_attempted or "")[:150],
        evento=evento,
        resultado=resultado,
        ip_address=get_client_ip(request),
        metadata=clean_meta,
    )
