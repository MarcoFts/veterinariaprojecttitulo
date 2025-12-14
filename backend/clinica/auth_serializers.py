# backend/clinica/auth_serializers.py

import re
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Cliente

User = get_user_model()


# =========================================================
# LOGIN con email para JWT (se mantiene tu lógica)
# =========================================================
class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    # aceptamos email, pero no obligamos username
    email = serializers.EmailField(write_only=True, required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["username"].required = False  # que no bloquee antes del validate

    def validate(self, attrs):
        email = (attrs.get("email") or "").strip().lower()
        username = (attrs.get("username") or "").strip()
        password = attrs.get("password")

        if not password:
            raise serializers.ValidationError({"password": ["Debes enviar password."]})

        # Si viene email, convertimos a username REAL del usuario
        if email:
            user = User.objects.filter(email__iexact=email).first()
            if not user:
                raise serializers.ValidationError({"detail": ["Credenciales inválidas."]})
            attrs["username"] = user.username

        # Si NO viene email, exige username normal
        elif not username:
            raise serializers.ValidationError({"detail": ["Debes enviar email o username."]})

        return super().validate(attrs)


# =========================================================
# Helpers: normalización + validaciones (RUT / teléfono / password)
# =========================================================
RUT_ALLOWED_RE = re.compile(r"^[0-9kK.\-]+$")
EMAIL_SPACE_RE = re.compile(r"\s+")
ONLY_DIGITS_RE = re.compile(r"\D+")
NAME_VALID_RE = re.compile(r"^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'-]+$")


def _clean_email(email: str) -> str:
    email = (email or "").strip().lower()
    email = EMAIL_SPACE_RE.sub("", email)  # quita espacios en medio
    return email


def _clean_phone(phone: str) -> str:
    """
    Acepta:
      - '9 1234 5678'
      - '912345678'
      - '+56 9 1234 5678' (lo normaliza a 912345678)
    Guarda SIEMPRE: 9XXXXXXXX (9 dígitos)
    """
    raw = (phone or "").strip()
    digits = ONLY_DIGITS_RE.sub("", raw)

    # si viene con +56 (11 dígitos: 56 + 9XXXXXXXX)
    if len(digits) == 11 and digits.startswith("56"):
        digits = digits[2:]

    return digits


def _validate_phone_chile(phone_digits: str) -> None:
    if not phone_digits:
        # teléfono es opcional en tu Cliente (blank=True), pero lo estás pidiendo en el form.
        # Si lo quieres obligatorio, aquí lo hacemos obligatorio.
        raise serializers.ValidationError("El teléfono es obligatorio.")
    if len(phone_digits) != 9:
        raise serializers.ValidationError(
            "El teléfono debe tener 9 dígitos (ej: 9 1234 5678)."
        )
    if not phone_digits.startswith("9"):
        raise serializers.ValidationError(
            "El teléfono debe comenzar con 9 (ej: 9 1234 5678)."
        )


def _format_phone_chile(phone_digits: str) -> str:
    # "9 1234 5678"
    return f"{phone_digits[0]} {phone_digits[1:5]} {phone_digits[5:9]}"


def _clean_rut(rut: str) -> str:
    rut = (rut or "").strip()
    rut = rut.replace(".", "").replace(" ", "")
    return rut


def _rut_dv(cuerpo: str) -> str:
    # DV por módulo 11
    suma = 0
    multiplo = 2
    for d in reversed(cuerpo):
        suma += int(d) * multiplo
        multiplo = 2 if multiplo == 7 else multiplo + 1
    resto = 11 - (suma % 11)
    if resto == 11:
        return "0"
    if resto == 10:
        return "K"
    return str(resto)


def _validate_rut_chile(rut: str) -> str:
    """
    Valida RUT chileno.
    Acepta: 12345678-9 / 12.345.678-9 / 12345678-K
    Retorna normalizado: 12345678-9 (DV en mayúscula)
    """
    rut = _clean_rut(rut)

    if not rut:
        return ""  # opcional

    if not RUT_ALLOWED_RE.match(rut):
        raise serializers.ValidationError(
            "RUT inválido. Usa formato 12.345.678-9 o 12345678-9."
        )

    if "-" not in rut:
        raise serializers.ValidationError(
            "RUT inválido. Debe incluir guion (ej: 12.345.678-9)."
        )

    cuerpo, dv = rut.split("-", 1)
    cuerpo = ONLY_DIGITS_RE.sub("", cuerpo)
    dv = (dv or "").strip().upper()

    if len(cuerpo) < 7 or len(cuerpo) > 8:
        raise serializers.ValidationError("RUT inválido. Cuerpo incorrecto.")

    if not cuerpo.isdigit():
        raise serializers.ValidationError("RUT inválido. Cuerpo debe ser numérico.")

    if dv not in "0123456789K":
        raise serializers.ValidationError("RUT inválido. DV debe ser 0-9 o K.")

    dv_calc = _rut_dv(cuerpo)
    if dv != dv_calc:
        raise serializers.ValidationError("RUT inválido. Dígito verificador no coincide.")

    return f"{cuerpo}-{dv}"


def _password_is_strong(password: str, email: str) -> None:
    if not password:
        raise serializers.ValidationError("La contraseña es obligatoria.")

    if len(password) < 8:
        raise serializers.ValidationError("Debe tener al menos 8 caracteres.")

    if any(c.isspace() for c in password):
        raise serializers.ValidationError("No puede contener espacios.")

    has_digit = any(c.isdigit() for c in password)
    has_alpha = any(c.isalpha() for c in password)
    has_symbol = any(not c.isalnum() for c in password)

    if not has_alpha:
        raise serializers.ValidationError("Debe incluir al menos una letra.")
    if not has_digit:
        raise serializers.ValidationError("Debe incluir al menos un número.")
    if not has_symbol:
        raise serializers.ValidationError("Debe incluir al menos un símbolo (ej: ! @ # ?).")

    email = _clean_email(email)
    if email and password.lower() == email.lower():
        raise serializers.ValidationError("No puede ser igual a tu correo.")

    # Bloqueo simple de contraseñas comunes (extra a las validators de Django)
    common = {
        "12345678", "123456789", "password", "qwerty123", "admin123",
        "1234567a!", "vetyon123!", "hola12345!"
    }
    if password.lower() in common:
        raise serializers.ValidationError("La contraseña es demasiado común. Usa otra.")

    # Además, aplicar validadores configurados en Django (si los tienes en settings)
    try:
        validate_password(password)
    except DjangoValidationError as e:
        # devolvemos una lista de mensajes legibles
        raise serializers.ValidationError(list(e.messages))


def _validate_name(value: str, field_label: str) -> str:
    value = (value or "").strip()
    if not value:
        raise serializers.ValidationError(f"{field_label} es obligatorio.")
    if len(value) < 2:
        raise serializers.ValidationError(f"{field_label} debe tener al menos 2 caracteres.")
    if len(value) > 50:
        raise serializers.ValidationError(f"{field_label} es demasiado largo (máx. 50).")
    if not NAME_VALID_RE.match(value):
        raise serializers.ValidationError(
            f"{field_label} solo puede contener letras y espacios."
        )
    return value


def _generate_unique_username(email: str, first_name: str, last_name: str) -> str:
    """
    Genera username único:
      - preferimos parte local del email
      - si choca, agrega sufijo incremental
    """
    base = (email.split("@")[0] if email and "@" in email else "").strip().lower()
    base = re.sub(r"[^a-z0-9._-]+", "", base) or "user"

    username = base
    i = 1
    while User.objects.filter(username=username).exists():
        i += 1
        username = f"{base}{i}"
    return username


# =========================================================
# RegisterSerializer blindado
# =========================================================
class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField(required=False, allow_blank=True, default="")
    email = serializers.EmailField()
    telefono = serializers.CharField()
    rut_dni = serializers.CharField(required=False, allow_blank=True, default="")
    direccion = serializers.CharField(required=False, allow_blank=True, default="")
    acepta_comunicaciones = serializers.BooleanField(required=False, default=False)

    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        value = _clean_email(value)
        if not value:
            raise serializers.ValidationError("El correo es obligatorio.")
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Este correo ya está registrado. Usa otro.")
        return value

    def validate_first_name(self, value):
        return _validate_name(value, "Nombre")

    def validate_last_name(self, value):
        # apellido lo dejamos obligatorio si lo quieres así:
        value = (value or "").strip()
        if not value:
            return ""
        return _validate_name(value, "Apellido")

    def validate_telefono(self, value):
        digits = _clean_phone(value)
        _validate_phone_chile(digits)
        return digits  # guardamos limpio

    def validate_rut_dni(self, value):
        value = (value or "").strip()
        if not value:
            return ""
        return _validate_rut_chile(value)

    def validate(self, attrs):
        email = attrs.get("email", "")
        password = attrs.get("password")
        confirm = attrs.get("confirm_password")

        if password != confirm:
            raise serializers.ValidationError(
                {"confirm_password": ["Las contraseñas no coinciden."]}
            )

        # fuerza de password + validadores Django
        try:
            _password_is_strong(password, email)
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"password": e.detail})

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        email = validated_data["email"]
        first_name = validated_data["first_name"].strip()
        last_name = (validated_data.get("last_name") or "").strip()
        password = validated_data["password"]

        username = _generate_unique_username(email, first_name, last_name)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        # Cliente: tu modelo tiene estos campos (telefono, direccion, rut_dni, acepta_comunicaciones) :contentReference[oaicite:2]{index=2}
        telefono_digits = validated_data.get("telefono", "")
        rut_norm = validated_data.get("rut_dni", "")
        direccion = validated_data.get("direccion", "")
        acepta = validated_data.get("acepta_comunicaciones", False)

        cliente, _ = Cliente.objects.get_or_create(user=user)
        cliente.telefono = _format_phone_chile(telefono_digits)  # formato visible
        cliente.rut_dni = rut_norm
        cliente.direccion = (direccion or "").strip()
        cliente.acepta_comunicaciones = bool(acepta)
        cliente.save()

        return user


# =========================================================
# (Opcional) mantenemos tu serializer simple, pero ya no recomendado.
# Lo dejo por compatibilidad si algo lo está usando en otro lado.
# =========================================================
class SimpleRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)

    def create(self, validated_data):
        email = validated_data["email"].lower()
        username = email  # usamos email como username
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Ya existe un usuario con este email."})
        user = User.objects.create_user(
            username=username,
            email=email,
            password=validated_data["password"],
        )
        return user
