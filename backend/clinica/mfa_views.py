from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .mfa_audit import get_client_ip, log_mfa_event
from .mfa_crypto import (
    decrypt_secret,
    encrypt_secret,
    generate_recovery_codes,
    generate_trusted_device_token,
    hash_token,
    normalize_code,
    verify_hashed_token,
)
from .mfa_models import (
    MFAAuditLog,
    MFAResetLog,
    MFASettings,
    RecoveryCode,
    TrustedDevice,
    UsuarioMFA,
)
from .mfa_tokens import (
    SCOPE_MFA_CHALLENGE,
    SCOPE_MFA_ENROL,
    FullAccessJWTAuthentication,
    FullOrEnrolJWTAuthentication,
    MFAPendingJWTAuthentication,
    issue_full_tokens,
    issue_mfa_token,
)
from .mfa_totp import build_otpauth_uri, generate_totp_secret, verify_totp_code

User = get_user_model()


def _user_is_vet(user) -> bool:
    return bool(getattr(user, "veterinario", None)) or user.groups.filter(
        name__iexact="veterinarios"
    ).exists()


def _user_is_admin(user) -> bool:
    return bool(
        user.is_superuser
        or user.is_staff
        or user.groups.filter(name__iexact="administradores").exists()
    )


def _serialize_vetcare_user(user) -> dict:
    cliente = getattr(user, "cliente", None)
    full_name = f"{user.first_name} {user.last_name}".strip() or user.username or user.email
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "name": full_name,
        "is_vet": _user_is_vet(user),
        "is_staff": user.is_staff,
        "is_admin": _user_is_admin(user),
        "cliente_id": cliente.id if cliente else None,
    }


def _classify_mfa_state(user, request) -> tuple[str, UsuarioMFA, MFASettings]:
    """Clasifica al usuario en los 5 estados MEJ-02 (S0 a S4) siempre en el servidor."""
    policy = MFASettings.get_global()
    mfa_profile, _ = UsuarioMFA.objects.get_or_create(user=user)

    if not policy.habilitado or not mfa_profile.requires_2fa:
        return "S0", mfa_profile, policy

    if mfa_profile.activo:
        cookie_name = settings.MFA_DEFAULTS["TRUSTED_DEVICE_COOKIE_NAME"]
        raw_token = request.COOKIES.get(cookie_name)
        if raw_token:
            device = TrustedDevice.objects.filter(
                user=user,
                token_hash=hash_token(raw_token),
                security_stamp=mfa_profile.security_stamp,
                revocado=False,
                fecha_expiracion__gt=timezone.now(),
            ).first()
            if device:
                return "S3", mfa_profile, policy
        return "S4", mfa_profile, policy

    now = timezone.now()
    if mfa_profile.must_reenrol:
        return "S2", mfa_profile, policy

    if mfa_profile.grace_period_until is None:
        mfa_profile.grace_period_until = now + timedelta(days=policy.grace_period_days_default)
        mfa_profile.save(update_fields=["grace_period_until"])

    if now < mfa_profile.grace_period_until:
        return "S1", mfa_profile, policy

    return "S2", mfa_profile, policy


def _issue_trusted_device_cookie(response: Response, request, user, mfa_profile: UsuarioMFA, hours: int):
    raw_token = generate_trusted_device_token()
    expires_at = timezone.now() + timedelta(hours=hours)
    label = (request.META.get("HTTP_USER_AGENT") or "Navegador")[:255]
    device = TrustedDevice.objects.create(
        user=user,
        token_hash=hash_token(raw_token),
        security_stamp=mfa_profile.security_stamp,
        device_label=label,
        ip_address=get_client_ip(request),
        fecha_expiracion=expires_at,
    )
    response.set_cookie(
        key=settings.MFA_DEFAULTS["TRUSTED_DEVICE_COOKIE_NAME"],
        value=raw_token,
        max_age=hours * 3600,
        httponly=True,
        secure=settings.MFA_DEFAULTS["TRUSTED_DEVICE_COOKIE_SECURE"],
        samesite=settings.MFA_DEFAULTS["TRUSTED_DEVICE_COOKIE_SAMESITE"],
        path="/",
    )
    return device


def _revoke_all_trusted_devices(user) -> int:
    return TrustedDevice.objects.filter(user=user, revocado=False).update(
        revocado=True,
        fecha_revocacion=timezone.now(),
    )


def _create_recovery_codes(usuario_mfa: UsuarioMFA, count: int = 10) -> list[str]:
    usuario_mfa.recovery_codes.all().delete()
    codes = generate_recovery_codes(count=count)
    RecoveryCode.objects.bulk_create(
        [RecoveryCode(usuario_mfa=usuario_mfa, codigo_hash=hash_token(c)) for c in codes]
    )
    return codes


class IsVetCareAdmin(permissions.BasePermission):
    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated and _user_is_admin(request.user))


class VetCareLoginView(APIView):
    """Login unificado de VetCare con máquina de 5 estados MEJ-02 (S0 a S4)."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        identifier = (
            request.data.get("email")
            or request.data.get("identifier")
            or request.data.get("username")
            or ""
        ).strip()
        password = request.data.get("password") or ""

        if not identifier or not password:
            return Response(
                {"detail": "Debe ingresar correo/usuario y contraseña."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(
            Q(email__iexact=identifier) | Q(username__iexact=identifier)
        ).first()

        # Mensaje genérico para no revelar existencia ni estado 2FA (MEJ-02 H-02)
        if not user or not user.is_active or not user.check_password(password):
            log_mfa_event("LOGIN_FAILED", "FAILURE", user=user, username_attempted=identifier, request=request)
            return Response(
                {"detail": "Credenciales inválidas."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        portal = (request.data.get("portal") or "").strip().lower()
        if portal == "admin" and not _user_is_admin(user):
            log_mfa_event("LOGIN_PORTAL_DENIED", "FAILURE", user=user, request=request, metadata={"portal": "admin"})
            return Response(
                {"detail": "Esta cuenta no tiene permisos de administrador."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if portal == "veterinario" and not (_user_is_vet(user) or _user_is_admin(user)):
            log_mfa_event("LOGIN_PORTAL_DENIED", "FAILURE", user=user, request=request, metadata={"portal": "veterinario"})
            return Response(
                {"detail": "Esta cuenta no tiene permiso de veterinario."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if portal == "cliente" and not getattr(user, "cliente", None):
            log_mfa_event("LOGIN_PORTAL_DENIED", "FAILURE", user=user, request=request, metadata={"portal": "cliente"})
            return Response(
                {"detail": "Esta cuenta no está registrada como cliente."},
                status=status.HTTP_403_FORBIDDEN,
            )

        state, mfa_profile, _policy = _classify_mfa_state(user, request)

        if state in {"S0", "S3"}:
            amr = ["pwd"] if state == "S0" else ["pwd", "trusted_device"]
            tokens = issue_full_tokens(user, amr=amr, security_stamp=mfa_profile.security_stamp)
            log_mfa_event(f"LOGIN_OK_{state}", "SUCCESS", user=user, request=request)
            return Response(
                {
                    "status": "authenticated",
                    "mfa_state": state,
                    "trusted_device": state == "S3",
                    "user": _serialize_vetcare_user(user),
                    **tokens,
                }
            )

        if mfa_profile.is_locked():
            log_mfa_event("LOGIN_BLOCKED_LOCKOUT", "BLOCKED", user=user, request=request)
            return Response(
                {"detail": "Cuenta bloqueada temporalmente por intentos fallidos."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if state == "S4":
            mfa_token = issue_mfa_token(
                user, scope=SCOPE_MFA_CHALLENGE, security_stamp=mfa_profile.security_stamp, ttl_minutes=5
            )
            log_mfa_event("LOGIN_MFA_REQUIRED", "SUCCESS", user=user, request=request)
            return Response(
                {
                    "status": "MFA_REQUIRED",
                    "mfa_state": "S4",
                    "mfa_token": mfa_token,
                    "user": _serialize_vetcare_user(user),
                }
            )

        # S1 (en gracia) o S2 (obligatorio)
        can_postpone = state == "S1"
        mfa_token = issue_mfa_token(
            user, scope=SCOPE_MFA_ENROL, security_stamp=mfa_profile.security_stamp, ttl_minutes=10
        )
        log_mfa_event(f"LOGIN_ENROLL_{state}", "SUCCESS", user=user, request=request)
        return Response(
            {
                "status": "MFA_ENROLL_REQUIRED",
                "mfa_state": state,
                "can_postpone": can_postpone,
                "deadline": mfa_profile.grace_period_until,
                "mfa_token": mfa_token,
                "user": _serialize_vetcare_user(user),
            }
        )


class MfaVerifyView(APIView):
    """Paso 2: valida TOTP (6 dígitos) o código de respaldo (6 alfanuméricos) en el mismo flujo."""

    authentication_classes = [MFAPendingJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.auth.get("token_scope") != SCOPE_MFA_CHALLENGE:
            return Response({"detail": "Token inválido para verificación MFA."}, status=status.HTTP_403_FORBIDDEN)

        raw_code = normalize_code(request.data.get("code") or request.data.get("recovery_code") or "")
        remember_device = bool(request.data.get("remember_device", False))
        if len(raw_code) != 6:
            return Response({"detail": "El código debe tener 6 caracteres."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        policy = MFASettings.get_global()

        with transaction.atomic():
            mfa_profile = UsuarioMFA.objects.select_for_update().filter(user=user, activo=True).first()
            if not mfa_profile or mfa_profile.security_stamp != request.auth.get("security_stamp"):
                return Response({"detail": "Desafío MFA inválido o revocado."}, status=status.HTTP_401_UNAUTHORIZED)

            if mfa_profile.is_locked():
                log_mfa_event("MFA_BLOCKED_LOCKOUT", "BLOCKED", user=user, request=request)
                return Response(
                    {"detail": "Demasiados intentos fallidos. Intente más tarde."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            # Rama 1: TOTP numérico de 6 dígitos
            if raw_code.isdigit():
                secret = decrypt_secret(mfa_profile.secret_encrypted)
                ok, matched_step = verify_totp_code(
                    secret,
                    raw_code,
                    step_seconds=policy.totp_step_seconds,
                    valid_window=policy.totp_valid_window,
                    last_used_step=mfa_profile.last_used_step,
                )
                if not ok:
                    locked = mfa_profile.register_failure(policy.max_failed_attempts, policy.lockout_minutes)
                    log_mfa_event("TOTP_VERIFY_FAILED", "BLOCKED" if locked else "FAILURE", user=user, request=request)
                    if locked:
                        return Response(
                            {"detail": "Demasiados intentos fallidos. Cuenta bloqueada temporalmente."},
                            status=status.HTTP_429_TOO_MANY_REQUESTS,
                        )
                    return Response({"detail": "Código incorrecto o vencido."}, status=status.HTTP_401_UNAUTHORIZED)

                mfa_profile.last_used_step = matched_step
                mfa_profile.fecha_ultimo_uso = timezone.now()
                mfa_profile.failed_attempts = 0
                mfa_profile.locked_until = None
                mfa_profile.save(update_fields=["last_used_step", "fecha_ultimo_uso", "failed_attempts", "locked_until"])

                tokens = issue_full_tokens(
                    user, amr=["pwd", "totp"], security_stamp=mfa_profile.security_stamp
                )
                resp = Response(
                    {
                        "status": "authenticated",
                        "user": _serialize_vetcare_user(user),
                        **tokens,
                    }
                )
                if remember_device and policy.duracion_confianza_horas > 0:
                    _issue_trusted_device_cookie(resp, request, user, mfa_profile, policy.duracion_confianza_horas)
                log_mfa_event("TOTP_VERIFY_OK", "SUCCESS", user=user, request=request)
                return resp

            # Rama 2: Código de respaldo alfanumérico de un solo uso
            unused_codes = list(
                RecoveryCode.objects.select_for_update().filter(usuario_mfa=mfa_profile, utilizado=False)
            )
            matched = next((rc for rc in unused_codes if verify_hashed_token(raw_code, rc.codigo_hash)), None)
            if not matched:
                locked = mfa_profile.register_failure(policy.max_failed_attempts, policy.lockout_minutes)
                log_mfa_event("RECOVERY_CODE_FAILED", "BLOCKED" if locked else "FAILURE", user=user, request=request)
                if locked:
                    return Response(
                        {"detail": "Demasiados intentos fallidos. Cuenta bloqueada temporalmente."},
                        status=status.HTTP_429_TOO_MANY_REQUESTS,
                    )
                return Response({"detail": "Código de respaldo inválido."}, status=status.HTTP_401_UNAUTHORIZED)

            matched.utilizado = True
            matched.fecha_uso = timezone.now()
            matched.save(update_fields=["utilizado", "fecha_uso"])

            revoked = _revoke_all_trusted_devices(user)
            mfa_profile.activo = False
            mfa_profile.secret_encrypted = ""
            mfa_profile.must_reenrol = True
            mfa_profile.security_stamp += 1
            mfa_profile.failed_attempts = 0
            mfa_profile.locked_until = None
            mfa_profile.save()

        log_mfa_event("RECOVERY_CODE_USED", "SUCCESS", user=user, request=request, metadata={"revoked_devices": revoked})
        mfa_token = issue_mfa_token(
            user, scope=SCOPE_MFA_ENROL, security_stamp=mfa_profile.security_stamp, ttl_minutes=10
        )
        return Response(
            {
                "status": "MFA_ENROLL_REQUIRED",
                "mfa_state": "S2",
                "can_postpone": False,
                "reenrol_required": True,
                "mfa_token": mfa_token,
                "user": _serialize_vetcare_user(user),
            }
        )


class MfaEnrollStartView(APIView):
    authentication_classes = [FullOrEnrolJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        with transaction.atomic():
            mfa_profile, _ = UsuarioMFA.objects.select_for_update().get_or_create(user=user)
            if mfa_profile.activo:
                return Response({"detail": "El doble factor ya está activo."}, status=status.HTTP_409_CONFLICT)

            now = timezone.now()
            if (
                mfa_profile.pending_secret_encrypted
                and mfa_profile.pending_expires_at
                and mfa_profile.pending_expires_at > now
            ):
                secret = decrypt_secret(mfa_profile.pending_secret_encrypted)
                expires_at = mfa_profile.pending_expires_at
            else:
                secret = generate_totp_secret()
                expires_at = now + timedelta(minutes=10)
                mfa_profile.pending_secret_encrypted = encrypt_secret(secret)
                mfa_profile.pending_expires_at = expires_at
                mfa_profile.save(update_fields=["pending_secret_encrypted", "pending_expires_at"])

        otpauth_uri = build_otpauth_uri(secret, account_name=user.email or user.username, issuer="VetCare")
        log_mfa_event("ENROL_STARTED", "SUCCESS", user=user, request=request)
        resp = Response({"otpauth_uri": otpauth_uri, "manual_key": secret, "expires_at": expires_at})
        resp["Cache-Control"] = "no-store"
        return resp


class MfaEnrollConfirmView(APIView):
    authentication_classes = [FullOrEnrolJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = normalize_code(request.data.get("code") or "")
        user = request.user
        policy = MFASettings.get_global()

        with transaction.atomic():
            mfa_profile = UsuarioMFA.objects.select_for_update().filter(user=user).first()
            if mfa_profile and mfa_profile.activo:
                return Response({"detail": "El doble factor ya fue activado."}, status=status.HTTP_409_CONFLICT)

            if not mfa_profile or not mfa_profile.pending_secret_encrypted or not mfa_profile.pending_expires_at:
                return Response({"detail": "No hay un enrolamiento pendiente."}, status=status.HTTP_400_BAD_REQUEST)

            if mfa_profile.pending_expires_at <= timezone.now():
                mfa_profile.pending_secret_encrypted = ""
                mfa_profile.pending_expires_at = None
                mfa_profile.save(update_fields=["pending_secret_encrypted", "pending_expires_at"])
                return Response({"detail": "El enrolamiento expiró. Vuelve a intentarlo."}, status=status.HTTP_400_BAD_REQUEST)

            secret = decrypt_secret(mfa_profile.pending_secret_encrypted)
            ok, matched_step = verify_totp_code(
                secret, code, step_seconds=policy.totp_step_seconds, valid_window=policy.totp_valid_window
            )
            if not ok:
                log_mfa_event("ENROL_CONFIRM_FAILED", "FAILURE", user=user, request=request)
                return Response(
                    {"detail": "Código TOTP inválido. Verifica la hora de tu dispositivo."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            now = timezone.now()
            mfa_profile.secret_encrypted = mfa_profile.pending_secret_encrypted
            mfa_profile.pending_secret_encrypted = ""
            mfa_profile.pending_expires_at = None
            mfa_profile.activo = True
            mfa_profile.must_reenrol = False
            mfa_profile.last_used_step = matched_step
            mfa_profile.fecha_activacion = now
            mfa_profile.fecha_ultimo_uso = now
            mfa_profile.failed_attempts = 0
            mfa_profile.locked_until = None
            mfa_profile.save()

            codes = _create_recovery_codes(mfa_profile, count=settings.MFA_DEFAULTS["RECOVERY_CODE_COUNT"])

        log_mfa_event("ENROL_CONFIRMED", "SUCCESS", user=user, request=request)
        tokens = issue_full_tokens(
            user, amr=["pwd", "totp"], security_stamp=mfa_profile.security_stamp
        )
        resp = Response(
            {
                "status": "authenticated",
                "recovery_codes": codes,
                "user": _serialize_vetcare_user(user),
                **tokens,
            }
        )
        resp["Cache-Control"] = "no-store"
        return resp


class MfaEnrollPostponeView(APIView):
    """Permite posponer solo si el usuario sigue en estado S1 (en período de gracia)."""

    authentication_classes = [MFAPendingJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.auth.get("token_scope") != SCOPE_MFA_ENROL:
            return Response({"detail": "Token inválido para posponer."}, status=status.HTTP_403_FORBIDDEN)

        state, mfa_profile, _ = _classify_mfa_state(request.user, request)
        if state != "S1":
            return Response(
                {"detail": "El enrolamiento es obligatorio y no puede posponerse."},
                status=status.HTTP_403_FORBIDDEN,
            )

        tokens = issue_full_tokens(
            request.user, amr=["pwd"], security_stamp=mfa_profile.security_stamp
        )
        log_mfa_event("ENROL_POSTPONED", "SUCCESS", user=request.user, request=request)
        return Response(
            {
                "status": "authenticated",
                "mfa_state": "S1",
                "deadline": mfa_profile.grace_period_until,
                "user": _serialize_vetcare_user(request.user),
                **tokens,
            }
        )


class MfaLogoutView(APIView):
    authentication_classes = [FullAccessJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass
        log_mfa_event("LOGOUT", "SUCCESS", user=request.user, request=request)
        return Response({"detail": "Sesión cerrada correctamente."})


class MfaStatusView(APIView):
    authentication_classes = [FullAccessJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        state, mfa_profile, policy = _classify_mfa_state(request.user, request)
        devices = TrustedDevice.objects.filter(user=request.user).order_by("-fecha_creacion")[:20]
        return Response(
            {
                "mfa_state": state,
                "activo": mfa_profile.activo,
                "requires_2fa": mfa_profile.requires_2fa,
                "grace_period_until": mfa_profile.grace_period_until,
                "fecha_activacion": mfa_profile.fecha_activacion,
                "fecha_ultimo_uso": mfa_profile.fecha_ultimo_uso,
                "recovery_codes_remaining": mfa_profile.recovery_codes.filter(utilizado=False).count(),
                "policy": {
                    "habilitado": policy.habilitado,
                    "duracion_confianza_horas": policy.duracion_confianza_horas,
                },
                "trusted_devices": [
                    {
                        "id": str(d.id),
                        "device_label": d.device_label,
                        "ip_address": d.ip_address,
                        "fecha_creacion": d.fecha_creacion,
                        "fecha_expiracion": d.fecha_expiracion,
                        "revocado": d.revocado,
                        "is_valid": d.is_valid(mfa_profile.security_stamp),
                    }
                    for d in devices
                ],
            }
        )


class MfaTrustedDeviceRevokeView(APIView):
    authentication_classes = [FullAccessJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, device_id):
        device = TrustedDevice.objects.filter(id=device_id, user=request.user).first()
        if not device:
            return Response({"detail": "Dispositivo no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        device.revoke()
        log_mfa_event("TRUSTED_DEVICE_REVOKED", "SUCCESS", user=request.user, request=request)
        return Response({"detail": "Dispositivo revocado."})


class MfaRegenerateRecoveryView(APIView):
    authentication_classes = [FullAccessJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        password = request.data.get("password") or ""
        if not password or not request.user.check_password(password):
            return Response({"detail": "Contraseña incorrecta."}, status=status.HTTP_401_UNAUTHORIZED)

        with transaction.atomic():
            mfa_profile = (
                UsuarioMFA.objects.select_for_update()
                .filter(user=request.user, activo=True)
                .first()
            )
            if not mfa_profile:
                return Response(
                    {"detail": "Debe tener doble factor activo para regenerar códigos."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            codes = _create_recovery_codes(
                mfa_profile, count=settings.MFA_DEFAULTS["RECOVERY_CODE_COUNT"]
            )

        log_mfa_event("RECOVERY_CODES_REGENERATED", "SUCCESS", user=request.user, request=request)
        resp = Response({"recovery_codes": codes})
        resp["Cache-Control"] = "no-store"
        return resp


class AdminMfaSettingsView(APIView):
    authentication_classes = [FullAccessJWTAuthentication]
    permission_classes = [IsVetCareAdmin]

    def get(self, request):
        s = MFASettings.get_global()
        return Response(
            {
                "habilitado": s.habilitado,
                "grace_period_days_default": s.grace_period_days_default,
                "duracion_confianza_horas": s.duracion_confianza_horas,
            }
        )

    def patch(self, request):
        s = MFASettings.get_global()
        for field in ("habilitado", "grace_period_days_default", "duracion_confianza_horas"):
            if field in request.data:
                setattr(s, field, request.data[field])
        s.save()
        log_mfa_event("ADMIN_MFA_SETTINGS_UPDATED", "SUCCESS", user=request.user, request=request)
        return Response(
            {
                "habilitado": s.habilitado,
                "grace_period_days_default": s.grace_period_days_default,
                "duracion_confianza_horas": s.duracion_confianza_horas,
            }
        )


class AdminMfaUsersView(APIView):
    authentication_classes = [FullAccessJWTAuthentication]
    permission_classes = [IsVetCareAdmin]

    def get(self, request):
        q = (request.GET.get("q") or "").strip()
        users = User.objects.all().order_by("id")
        if q:
            users = users.filter(
                Q(username__icontains=q)
                | Q(email__icontains=q)
                | Q(first_name__icontains=q)
                | Q(last_name__icontains=q)
            )
        result = []
        for u in users[:50]:
            mfa = UsuarioMFA.objects.filter(user=u).first()
            result.append(
                {
                    "id": u.id,
                    "username": u.username,
                    "email": u.email,
                    "name": f"{u.first_name} {u.last_name}".strip() or u.username,
                    "is_admin": _user_is_admin(u),
                    "is_vet": _user_is_vet(u),
                    "requires_2fa": mfa.requires_2fa if mfa else True,
                    "mfa_activo": bool(mfa and mfa.activo),
                    "must_reenrol": bool(mfa and mfa.must_reenrol),
                    "grace_period_until": mfa.grace_period_until if mfa else None,
                    "fecha_ultimo_uso": mfa.fecha_ultimo_uso if mfa else None,
                }
            )
        return Response(result)


class AdminMfaResetView(APIView):
    """Consola de reinicio de 2FA con motivo, cierre de exenciones y aviso por correo."""

    authentication_classes = [FullAccessJWTAuthentication]
    permission_classes = [IsVetCareAdmin]

    def post(self, request):
        target_id = request.data.get("targetUserId")
        reason = (request.data.get("reason") or "").strip()
        min_len = settings.MFA_DEFAULTS["RESET_REASON_MIN_LENGTH"]

        if len(reason) < min_len:
            return Response(
                {"detail": f"El motivo debe tener al menos {min_len} caracteres."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target = User.objects.filter(id=target_id).first()
        if not target:
            return Response({"detail": "Usuario no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        if target.id == request.user.id:
            return Response(
                {"detail": "Un administrador no puede reiniciarse su propio doble factor."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if _user_is_admin(target) and not request.user.is_superuser:
            return Response(
                {"detail": "Solo un superadministrador puede reiniciar el 2FA de otro administrador."},
                status=status.HTTP_403_FORBIDDEN,
            )

        with transaction.atomic():
            mfa_profile = UsuarioMFA.objects.select_for_update().filter(user=target).first()
            if not mfa_profile or not mfa_profile.activo:
                return Response(
                    {"detail": "El usuario no tiene doble factor activo para reiniciar."},
                    status=status.HTTP_409_CONFLICT,
                )

            mfa_profile.activo = False
            mfa_profile.secret_encrypted = ""
            mfa_profile.pending_secret_encrypted = ""
            mfa_profile.pending_expires_at = None
            mfa_profile.must_reenrol = True
            mfa_profile.grace_period_until = timezone.now()
            mfa_profile.security_stamp += 1
            mfa_profile.failed_attempts = 0
            mfa_profile.locked_until = None
            mfa_profile.save()
            mfa_profile.recovery_codes.all().delete()
            _revoke_all_trusted_devices(target)

            email_status = "SIN_CORREO"
            if target.email:
                try:
                    now_local = timezone.localtime(timezone.now())
                    send_mail(
                        subject="VetCare - Se reinició su doble factor de autenticación",
                        message=(
                            f"Estimado(a) {target.first_name or target.username}:\n\n"
                            f"El {now_local.strftime('%d-%m-%Y')} a las {now_local.strftime('%H:%M')} "
                            f"se reinició el doble factor de autenticación de su cuenta VetCare.\n"
                            f"En su próximo inicio de sesión deberá enrolar nuevamente su dispositivo.\n"
                        ),
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[target.email],
                        fail_silently=False,
                    )
                    email_status = "ENVIADO"
                except Exception:
                    email_status = "FALLIDO"

            reset_log = MFAResetLog.objects.create(
                target_user=target,
                admin_user=request.user,
                reason=reason,
                origin_ip=get_client_ip(request),
                email_status=email_status,
            )

        log_mfa_event(
            "MFA_RESET",
            "SUCCESS",
            user=request.user,
            request=request,
            metadata={"target_user_id": target.id, "email_status": email_status},
        )
        return Response({"emailStatus": email_status, "reset_id": str(reset_log.id)})


class AdminMfaResetLogView(APIView):
    authentication_classes = [FullAccessJWTAuthentication]
    permission_classes = [IsVetCareAdmin]

    def get(self, request):
        from django.utils.dateparse import parse_date

        date_from_str = (request.GET.get("from") or "").strip()
        date_to_str = (request.GET.get("to") or "").strip()
        user_q = (request.GET.get("user") or "").strip()
        try:
            page = max(1, int(request.GET.get("page") or "1"))
            page_size = min(50, max(1, int(request.GET.get("page_size") or "15")))
        except ValueError:
            return Response({"detail": "Parámetros de paginación inválidos."}, status=status.HTTP_400_BAD_REQUEST)

        date_from = parse_date(date_from_str) if date_from_str else None
        date_to = parse_date(date_to_str) if date_to_str else None
        if (date_from_str and not date_from) or (date_to_str and not date_to):
            return Response({"detail": "Formato de fecha inválido (use YYYY-MM-DD)."}, status=status.HTTP_400_BAD_REQUEST)
        if date_from and date_to and date_from > date_to:
            return Response(
                {"detail": "La fecha de inicio no puede ser posterior a la fecha de término."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = MFAResetLog.objects.select_related("target_user", "admin_user").all()
        if date_from:
            qs = qs.filter(reset_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(reset_at__date__lte=date_to)
        if user_q:
            qs = qs.filter(
                Q(target_user__username__icontains=user_q)
                | Q(target_user__email__icontains=user_q)
                | Q(admin_user__username__icontains=user_q)
            )

        total = qs.count()
        total_pages = max(1, (total + page_size - 1) // page_size)
        offset = (page - 1) * page_size
        items = qs[offset : offset + page_size]

        return Response(
            {
                "count": total,
                "page": page,
                "total_pages": total_pages,
                "results": [
                    {
                        "id": str(l.id),
                        "target_username": l.target_user.username,
                        "target_email": l.target_user.email,
                        "admin_username": l.admin_user.username if l.admin_user else "—",
                        "reason": l.reason,
                        "origin_ip": l.origin_ip,
                        "email_status": l.email_status,
                        "reset_at": l.reset_at,
                    }
                    for l in items
                ],
            }
        )
