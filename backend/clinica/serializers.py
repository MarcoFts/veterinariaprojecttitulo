from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from .models import (
    Cliente,
    Mascota,
    Cita,
    Producto,
    MovimientoInventario,
    HorarioAtencion,
    BloqueoAgenda,
)


User = get_user_model()


# ---------- Cliente / Mascota ----------

class MascotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mascota
        # No exponemos el cliente aquí (va aparte)
        exclude = ("cliente",)


class ClienteSerializer(serializers.ModelSerializer):
    nombre = serializers.SerializerMethodField()
    mascotas = MascotaSerializer(many=True, read_only=True)

    class Meta:
        model = Cliente
        fields = [
            "id",
            "user",
            "telefono",
            "direccion",
            "rut_dni",
            "acepta_comunicaciones",
            "mascotas",
            "nombre",
        ]
        read_only_fields = ["user", "mascotas", "nombre"]

    def get_nombre(self, obj):
        u = getattr(obj, "user", None)
        if not u:
            return f"Cliente {obj.pk}"
        full = f"{u.first_name} {u.last_name}".strip()
        return full or u.email or u.username


class VeterinarioSerializer(serializers.ModelSerializer):
    nombre = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email", "nombre"]

    def get_nombre(self, obj):
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full or obj.email or obj.username


# ---------- Registro ----------

class RegisterSerializer(serializers.Serializer):
    # Usuario
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    # Cliente
    telefono = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    direccion = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    rut_dni = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    acepta_comunicaciones = serializers.BooleanField(
        required=False, default=False
    )

    # Mascota opcional
    mascota_nombre = serializers.CharField(required=False, allow_blank=True)
    mascota_especie = serializers.CharField(required=False, allow_blank=True)
    mascota_raza = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Este email ya está registrado.")
        return email

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password2": "Las contraseñas no coinciden."}
            )
        return attrs

    @transaction.atomic
    def create(self, validated):
        email = validated["email"].lower()

        # username = email
        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=validated.get("first_name", "").strip(),
            last_name=validated.get("last_name", "").strip(),
            password=validated["password"],
        )

        # Cliente asociado
        cliente = Cliente.objects.create(
            user=user,
            telefono=(validated.get("telefono") or "").strip(),
            direccion=(validated.get("direccion") or "").strip(),
            rut_dni=(validated.get("rut_dni") or "").strip(),
            acepta_comunicaciones=validated.get(
                "acepta_comunicaciones", False
            ),
        )

        # Mascota opcional
        nombre = (validated.get("mascota_nombre") or "").strip()
        especie = (validated.get("mascota_especie") or "").strip()
        if nombre and especie:
            Mascota.objects.create(
                cliente=cliente,
                nombre=nombre,
                especie=especie,
                raza=(validated.get("mascota_raza") or "").strip(),
            )

        return user


# ---------- Citas ----------

class CitaSerializer(serializers.ModelSerializer):
    veterinario_nombre = serializers.SerializerMethodField()
    mascota_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Cita
        fields = "__all__"

    def get_veterinario_nombre(self, obj):
        if obj.veterinario:
            full = f"{obj.veterinario.first_name} {obj.veterinario.last_name}".strip()
            return full or obj.veterinario.email or obj.veterinario.username
        return ""

    def get_mascota_nombre(self, obj):
        return obj.mascota.nombre if obj.mascota else ""

    def validate(self, data):
        """
        - Valida que fin > inicio
        - Valida que no se solapen citas (pendiente/confirmada) para el mismo box/veterinario
        """
        inicio = data["inicio"]
        fin = data["fin"]
        if fin <= inicio:
            raise serializers.ValidationError(
                {"fin": "La hora de término debe ser mayor al inicio."}
            )

        vet = data.get("veterinario")
        box = data.get("box") or "BOX-1"

        qs = Cita.objects.filter(
            estado__in=["pendiente", "confirmada"],
            box=box,
        )
        if vet:
            qs = qs.filter(veterinario=vet)

        # si estamos editando, excluir la cita actual
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        # ¿hay alguna cita que se cruce con [inicio, fin]?
        if qs.filter(inicio__lt=fin, fin__gt=inicio).exists():
            raise serializers.ValidationError(
                "Existe una cita solapada para ese horario/box/veterinario."
            )

        return data


# ---------- Inventario ----------

class ProductoSerializer(serializers.ModelSerializer):
    alerta_stock = serializers.SerializerMethodField()
    alerta_vencimiento = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = [
            "id",
            "nombre",
            "codigo",
            "stock",
            "stock_minimo",
            "fecha_vencimiento",
            "alerta_stock",
            "alerta_vencimiento",
        ]

    def get_alerta_stock(self, obj):
        return obj.en_alerta_stock()

    def get_alerta_vencimiento(self, obj):
        return obj.en_alerta_vencimiento()


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoInventario
        fields = "__all__"


class InventarioSerializer(serializers.Serializer):
    stock_bajo = ProductoSerializer(many=True)
    por_vencer = ProductoSerializer(many=True)

# ---------- Horarios y bloqueos de agenda ----------

class HorarioAtencionSerializer(serializers.ModelSerializer):
    veterinario = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = HorarioAtencion
        fields = "__all__"
        read_only_fields = ("veterinario",)

    def validate(self, attrs):
        request = self.context.get("request")
        vet = getattr(request, "user", None)

        dia = attrs.get("dia_semana")
        inicio = attrs.get("inicio")
        fin = attrs.get("fin")
        box = attrs.get("box", "")

        if inicio >= fin:
            raise serializers.ValidationError(
                "La hora de inicio debe ser menor a la hora fin."
            )

        # evita duplicado exacto (mismo unique_together)
        if vet and HorarioAtencion.objects.filter(
            veterinario=vet,
            dia_semana=dia,
            inicio=inicio,
            fin=fin,
            box=box,
        ).exists():
            raise serializers.ValidationError(
                "Ya existe un bloque idéntico para este día."
            )

        return attrs

class BloqueoAgendaSerializer(serializers.ModelSerializer):
    veterinario = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = BloqueoAgenda
        fields = "__all__"
        read_only_fields = ("veterinario",)
