"""Criptografía MFA para VetCare (Fernet + HMAC-SHA256 + códigos de respaldo alfanuméricos)."""

import base64
import hashlib
import hmac
import secrets

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

# Alfabeto sin 0/O/1/I para evitar ambigüedad visual (MEJ-02 O-06)
LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"
DIGITS = "23456789"
RECOVERY_ALPHABET = LETTERS + DIGITS


def _get_fernet() -> Fernet:
    key = (getattr(settings, "MFA_ENCRYPTION_KEY", "") or "").strip()
    if key:
        return Fernet(key.encode("utf-8"))

    if settings.DEBUG or getattr(settings, "TESTING", False):
        digest = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
        return Fernet(base64.urlsafe_b64encode(digest))

    raise ImproperlyConfigured("MFA_ENCRYPTION_KEY debe configurarse en producción.")


def encrypt_secret(plaintext: str) -> str:
    if not plaintext:
        return ""
    return _get_fernet().encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt_secret(ciphertext: str) -> str:
    if not ciphertext:
        return ""
    try:
        return _get_fernet().decrypt(ciphertext.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise ValueError("No fue posible descifrar el secreto MFA.") from exc


def normalize_code(raw_value: str) -> str:
    return (raw_value or "").strip().replace(" ", "").replace("-", "").upper()


def hash_token(raw_value: str) -> str:
    normalized = normalize_code(raw_value)
    key = settings.SECRET_KEY.encode("utf-8")
    return hmac.new(key, normalized.encode("utf-8"), hashlib.sha256).hexdigest()


def verify_hashed_token(raw_value: str, expected_hash: str) -> bool:
    return hmac.compare_digest(hash_token(raw_value), expected_hash)


def generate_recovery_codes(count: int = 10) -> list[str]:
    """
    Genera códigos de 6 caracteres alfanuméricos (sin 0/O/1/I) garantizando
    al menos una letra por código para distinguirlos de un TOTP numérico de 6 dígitos.
    """
    codes = set()
    while len(codes) < count:
        chars = [secrets.choice(RECOVERY_ALPHABET) for _ in range(6)]
        if not any(c in LETTERS for c in chars):
            chars[secrets.randbelow(6)] = secrets.choice(LETTERS)
        codes.add("".join(chars))
    return sorted(codes)


def generate_trusted_device_token() -> str:
    return secrets.token_urlsafe(32)
