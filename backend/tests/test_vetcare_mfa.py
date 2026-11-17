from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
import pyotp
import pytest
from rest_framework.test import APIClient

from clinica.mfa_models import MFAResetLog, MFASettings, UsuarioMFA

User = get_user_model()
pytestmark = pytest.mark.django_db


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def vet_user():
    u = User.objects.create_user(
        username="vet_mfa_test",
        email="vet_mfa_test@clinica.local",
        password="VetPassword123!",
        first_name="Sofía",
        last_name="Méndez",
    )
    UsuarioMFA.objects.create(user=u, requires_2fa=True)
    return u


@pytest.fixture
def admin_user():
    u = User.objects.create_user(
        username="admin_mfa_test",
        email="admin_mfa_test@clinica.local",
        password="AdminPassword123!",
        is_staff=True,
        is_superuser=True,
    )
    UsuarioMFA.objects.create(user=u, requires_2fa=True)
    return u


def test_s0_disabled_and_s1_grace_postpone_vs_s2_mandatory(api, vet_user):
    # S1: usuario nuevo entra en gracia de 15 días -> can_postpone=True
    r1 = api.post(
        "/api/auth/login/",
        {"email": "vet_mfa_test@clinica.local", "password": "VetPassword123!"},
        format="json",
    )
    assert r1.status_code == 200
    assert r1.data["status"] == "MFA_ENROLL_REQUIRED"
    assert r1.data["mfa_state"] == "S1"
    assert r1.data["can_postpone"] is True

    # Token temporal NO da acceso a /api/auth/me/ ni /api/citas/
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {r1.data['mfa_token']}")
    assert api.get("/api/auth/me/").status_code == 401
    assert api.get("/api/citas/").status_code == 401

    # Posponer en S1 entrega sesión
    postpone = api.post("/api/auth/mfa/enroll/postpone/")
    assert postpone.status_code == 200
    assert postpone.data["status"] == "authenticated"

    # S2: gracia vencida -> can_postpone=False y posponer responde 403
    UsuarioMFA.objects.filter(user=vet_user).update(
        grace_period_until=timezone.now() - timedelta(minutes=1)
    )
    api.credentials()
    r2 = api.post(
        "/api/auth/login/",
        {"email": "vet_mfa_test@clinica.local", "password": "VetPassword123!"},
        format="json",
    )
    assert r2.data["mfa_state"] == "S2"
    assert r2.data["can_postpone"] is False

    api.credentials(HTTP_AUTHORIZATION=f"Bearer {r2.data['mfa_token']}")
    assert api.post("/api/auth/mfa/enroll/postpone/").status_code == 403

    # S0: apagar parámetro general -> login directo
    s = MFASettings.get_global()
    s.habilitado = False
    s.save()
    api.credentials()
    r0 = api.post(
        "/api/auth/login/",
        {"email": "vet_mfa_test@clinica.local", "password": "VetPassword123!"},
        format="json",
    )
    assert r0.status_code == 200
    assert r0.data["mfa_state"] == "S0"
    assert "access" in r0.data


def test_enroll_verify_s3_s4_recovery_and_admin_reset(api, vet_user, admin_user):
    # Enrolar vet_user
    r1 = api.post(
        "/api/auth/login/",
        {"email": "vet_mfa_test@clinica.local", "password": "VetPassword123!"},
        format="json",
    )
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {r1.data['mfa_token']}")
    start = api.post("/api/auth/mfa/enroll/start/")
    assert start.status_code == 200
    assert start["Cache-Control"] == "no-store"
    secret = start.data["manual_key"]

    confirm = api.post(
        "/api/auth/mfa/enroll/confirm/",
        {"code": pyotp.TOTP(secret).now()},
        format="json",
    )
    assert confirm.status_code == 200
    codes = confirm.data["recovery_codes"]
    assert len(codes) == 10
    assert all(len(c) == 6 and any(ch.isalpha() for ch in c) for c in codes)

    # Login -> S4 -> verify con remember_device=True
    api.credentials()
    r4 = api.post(
        "/api/auth/login/",
        {"email": "vet_mfa_test@clinica.local", "password": "VetPassword123!"},
        format="json",
    )
    assert r4.data["mfa_state"] == "S4"
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {r4.data['mfa_token']}")

    mfa = UsuarioMFA.objects.get(user=vet_user)
    mfa.last_used_step -= 2
    mfa.save(update_fields=["last_used_step"])

    v = api.post(
        "/api/auth/mfa/verify/",
        {"code": pyotp.TOTP(secret).now(), "remember_device": True},
        format="json",
    )
    assert v.status_code == 200

    # Siguiente login -> S3 (exención 12h)
    api.credentials()
    r3 = api.post(
        "/api/auth/login/",
        {"email": "vet_mfa_test@clinica.local", "password": "VetPassword123!"},
        format="json",
    )
    assert r3.data["mfa_state"] == "S3"
    assert r3.data["trusted_device"] is True

    # Admin reinicia 2FA de vet_user -> invalida exención (security_stamp) y registra MFAResetLog
    adm_login = api.post(
        "/api/auth/login/",
        {"email": "admin_mfa_test@clinica.local", "password": "AdminPassword123!"},
        format="json",
    )
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {adm_login.data['mfa_token']}")
    adm_start = api.post("/api/auth/mfa/enroll/start/")
    adm_conf = api.post(
        "/api/auth/mfa/enroll/confirm/",
        {"code": pyotp.TOTP(adm_start.data["manual_key"]).now()},
        format="json",
    )
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {adm_conf.data['access']}")

    reset_resp = api.post(
        "/api/admin/mfa/reset/",
        {"targetUserId": vet_user.id, "reason": "Pérdida de teléfono verificada"},
        format="json",
    )
    assert reset_resp.status_code == 200
    assert reset_resp.data["emailStatus"] == "ENVIADO"
    assert MFAResetLog.objects.filter(target_user=vet_user).count() == 1

    # vet_user ya NO entra por S3 aunque conserve la cookie; pasa a S2 obligatorio
    api.credentials()
    r_after = api.post(
        "/api/auth/login/",
        {"email": "vet_mfa_test@clinica.local", "password": "VetPassword123!"},
        format="json",
    )
    assert r_after.data["mfa_state"] == "S2"
    assert r_after.data["can_postpone"] is False

    # CA-30: el token full_access emitido ANTES del reinicio queda invalidado inmediatamente (401)
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {v.data['access']}")
    assert api.get("/api/auth/me/").status_code == 401

    # RF-10 / CON-09: filtros y paginación en reset-log, rechazando from > to con 400
    api.credentials(HTTP_AUTHORIZATION=f"Bearer {adm_conf.data['access']}")
    assert (
        api.get("/api/admin/mfa/reset-log/?from=2026-12-01&to=2026-11-01").status_code == 400
    )
    log_resp = api.get("/api/admin/mfa/reset-log/?user=vet_mfa_test&page=1")
    assert log_resp.status_code == 200
    assert log_resp.data["count"] == 1
    assert len(log_resp.data["results"]) == 1

    # Regeneración de códigos desde perfil (admin ya tiene MFA activo)
    assert (
        api.post("/api/auth/mfa/recovery-codes/regenerate/", {"password": "wrong"}, format="json").status_code
        == 401
    )
    regen_ok = api.post(
        "/api/auth/mfa/recovery-codes/regenerate/",
        {"password": "AdminPassword123!"},
        format="json",
    )
    assert regen_ok.status_code == 200
    assert len(regen_ok.data["recovery_codes"]) == 10
