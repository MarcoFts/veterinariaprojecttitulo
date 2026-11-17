from datetime import timedelta
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class MFASettings(models.Model):
    """Configuración global de MFA para VetCare (permite desactivación rápida sin redesplegar)."""

    scope_name = models.CharField(max_length=64, unique=True, default="global")
    habilitado = models.BooleanField(default=True)
    grace_period_days_default = models.PositiveIntegerField(default=15)
    duracion_confianza_horas = models.PositiveIntegerField(default=12)
    totp_step_seconds = models.PositiveIntegerField(default=30)
    totp_valid_window = models.PositiveSmallIntegerField(default=1)
    max_failed_attempts = models.PositiveIntegerField(default=5)
    lockout_minutes = models.PositiveIntegerField(default=15)
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def get_global(cls) -> "MFASettings":
        defaults = settings.MFA_DEFAULTS
        obj, _ = cls.objects.get_or_create(
            scope_name="global",
            defaults={
                "habilitado": defaults["ENABLED"],
                "grace_period_days_default": defaults["GRACE_PERIOD_DAYS"],
                "duracion_confianza_horas": defaults["TRUSTED_DEVICE_HOURS"],
                "totp_step_seconds": defaults["TOTP_STEP_SECONDS"],
                "totp_valid_window": defaults["TOTP_VALID_WINDOW"],
                "max_failed_attempts": defaults["MAX_FAILED_ATTEMPTS"],
                "lockout_minutes": defaults["LOCKOUT_MINUTES"],
            },
        )
        return obj

    def __str__(self) -> str:
        return f"MFASettings({self.scope_name}, habilitado={self.habilitado})"


class UsuarioMFA(models.Model):
    """Estado de doble factor (S0-S4), secreto TOTP cifrado y sello de seguridad."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mfa_profile",
    )
    requires_2fa = models.BooleanField(default=True)
    grace_period_until = models.DateTimeField(null=True, blank=True)
    secret_encrypted = models.TextField(blank=True, default="")
    pending_secret_encrypted = models.TextField(blank=True, default="")
    pending_expires_at = models.DateTimeField(null=True, blank=True)
    activo = models.BooleanField(default=False)
    must_reenrol = models.BooleanField(default=False)
    security_stamp = models.PositiveIntegerField(default=1)
    last_used_step = models.BigIntegerField(null=True, blank=True)
    failed_attempts = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_activacion = models.DateTimeField(null=True, blank=True)
    fecha_ultimo_uso = models.DateTimeField(null=True, blank=True)

    def is_locked(self) -> bool:
        return bool(self.locked_until and self.locked_until > timezone.now())

    def register_failure(self, max_attempts: int, lockout_minutes: int) -> bool:
        self.failed_attempts += 1
        locked = False
        if self.failed_attempts >= max_attempts:
            self.locked_until = timezone.now() + timedelta(minutes=lockout_minutes)
            self.failed_attempts = 0
            locked = True
        self.save(update_fields=["failed_attempts", "locked_until"])
        return locked

    def reset_failures(self) -> None:
        if self.failed_attempts != 0 or self.locked_until is not None:
            self.failed_attempts = 0
            self.locked_until = None
            self.save(update_fields=["failed_attempts", "locked_until"])

    def __str__(self) -> str:
        return f"UsuarioMFA(user={self.user_id}, activo={self.activo}, requires_2fa={self.requires_2fa})"


class RecoveryCode(models.Model):
    """Códigos de respaldo de 6 caracteres alfanuméricos almacenados como hash HMAC-SHA256."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario_mfa = models.ForeignKey(
        UsuarioMFA,
        on_delete=models.CASCADE,
        related_name="recovery_codes",
    )
    codigo_hash = models.CharField(max_length=128, db_index=True)
    utilizado = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_uso = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["usuario_mfa", "utilizado"]),
        ]


class TrustedDevice(models.Model):
    """Exención de 12 horas validada en servidor y ligada a security_stamp."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="trusted_devices",
    )
    token_hash = models.CharField(max_length=128, unique=True)
    security_stamp = models.PositiveIntegerField(default=1)
    device_label = models.CharField(max_length=255, blank=True, default="Navegador")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_expiracion = models.DateTimeField(db_index=True)
    revocado = models.BooleanField(default=False)
    fecha_revocacion = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "revocado", "fecha_expiracion"]),
        ]
        ordering = ["-fecha_creacion"]

    def is_valid(self, current_stamp: int | None = None) -> bool:
        if self.revocado or self.fecha_expiracion <= timezone.now():
            return False
        if current_stamp is not None and self.security_stamp != current_stamp:
            return False
        return True

    def revoke(self) -> None:
        if not self.revocado:
            self.revocado = True
            self.fecha_revocacion = timezone.now()
            self.save(update_fields=["revocado", "fecha_revocacion"])


class MFAResetLog(models.Model):
    """Registro inmutable de reinicios administrativos de doble factor (MEJ-02 RF-10)."""

    EMAIL_STATUS_CHOICES = (
        ("ENVIADO", "Enviado"),
        ("SIN_CORREO", "Sin correo"),
        ("FALLIDO", "Fallido"),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mfa_resets_received",
    )
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="mfa_resets_performed",
    )
    reason = models.CharField(max_length=500)
    origin_ip = models.GenericIPAddressField(null=True, blank=True)
    email_status = models.CharField(max_length=16, choices=EMAIL_STATUS_CHOICES)
    reset_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-reset_at"]


class MFAAuditLog(models.Model):
    """Auditoría de seguridad MFA sin secretos, códigos ni tokens."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mfa_audit_logs",
    )
    username_attempted = models.CharField(max_length=150, blank=True, default="")
    evento = models.CharField(max_length=64, db_index=True)
    resultado = models.CharField(max_length=24)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    fecha = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-fecha"]
