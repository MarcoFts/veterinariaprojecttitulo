"""Motor TOTP RFC 6238 con anti-reutilización (last_used_step)."""

import hmac
import time

import pyotp


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def build_otpauth_uri(secret: str, account_name: str, issuer: str = "VetCare") -> str:
    return pyotp.TOTP(secret).provisioning_uri(name=account_name, issuer_name=issuer)


def verify_totp_code(
    secret: str,
    code: str,
    step_seconds: int = 30,
    valid_window: int = 1,
    last_used_step: int | None = None,
    now_ts: int | None = None,
) -> tuple[bool, int | None]:
    cleaned = (code or "").strip().replace(" ", "").replace("-", "")
    if not cleaned.isdigit() or len(cleaned) != 6:
        return False, None

    current_ts = int(now_ts if now_ts is not None else time.time())
    current_step = current_ts // step_seconds
    totp = pyotp.TOTP(secret, interval=step_seconds)

    for offset in range(-valid_window, valid_window + 1):
        candidate_step = current_step + offset
        if candidate_step < 0:
            continue
        expected = totp.at(candidate_step * step_seconds)
        if hmac.compare_digest(expected, cleaned):
            if last_used_step is not None and candidate_step <= last_used_step:
                return False, None
            return True, candidate_step

    return False, None
