# backend/clinica/serializers.py  
from __future__ import annotations
from django.contrib.auth.models import Group
import re
from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from .notificaciones import notificar_cliente_registro_clinico
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from clinica.notificaciones import (
    notificar_cliente_registro_clinico,
    notificar_cliente_de_cita,
    notificar_vet_de_cita,
)

from .models import (
    Cliente,
    Mascota,
    Cita,
    Producto,
    RegistroClinicoProducto,
    MovimientoInventario,
    HorarioAtencion,
    BloqueoAgenda,
    RegistroClinico,
    MotivoConsulta,
    Veterinario,
    Notificacion,
)

User = get_user_model()

# =====================================================
# Helpers (validaciones compartidas)
# =====================================================

RUT_RE = re.compile(r"^[0-9]+-[0-9Kk]$")
PHONE_DIGITS_RE = re.compile(r"\D+")

def normalizar_telefono_cl(value: str) -> str:
    """Chile (móvil): 9 dígitos. Salida: '9 1234 5678'."""
    v = (value or "").strip()
    if not v:
        raise serializers.ValidationError("Teléfono obligatorio. Ej: 9 1234 5678")
    digits = PHONE_DIGITS_RE.sub("", v)
    if digits.startswith("56") and len(digits) > 9:
        digits = digits[-9:]
    if len(digits) != 9 or digits[0] != "9":
        raise serializers.ValidationError(
            "Teléfono inválido. Debe tener 9 dígitos y empezar con 9. Ej: 9 1234 5678"
        )
    return f"{digits[0]} {digits[1:5]} {digits[5:]}"

def rut_dv(num: str) -> str:
    s = 0
    mult = 2
    for ch in reversed(num):
        s += int(ch) * mult
        mult = 2 if mult == 7 else mult + 1
    r = 11 - (s % 11)
    if r == 11:
        return "0"
    if r == 10:
        return "K"
    return str(r)

def normalizar_y_validar_rut(value: str) -> str:
    """Normaliza a '12345678-5' y valida dígito verificador."""
    v = (value or "").strip()
    if not v:
        raise serializers.ValidationError("RUT obligatorio. Formato: 12.345.678-5")
    v = v.replace(".", "").replace(" ", "")
    if "-" not in v:
        if len(v) < 2:
            raise serializers.ValidationError("RUT inválido. Ej: 12.345.678-5")
        v = f"{v[:-1]}-{v[-1]}"
    v = v.upper()
    if not RUT_RE.match(v):
        raise serializers.ValidationError("RUT inválido. Ej: 12.345.678-5")
    num, dv = v.split("-")
    if not num.isdigit():
        raise serializers.ValidationError("RUT inválido. Ej: 12.345.678-5")
    dv_calc = rut_dv(num)
    if dv != dv_calc:
        raise serializers.ValidationError(f"RUT inválido (DV no coincide). Debe ser: {int(num)}-{dv_calc}")
    return f"{int(num)}-{dv}"

def validar_password_segura(value: str) -> str:
    pwd = value or ""
    if len(pwd) < 8:
        raise serializers.ValidationError("La contraseña debe tener mínimo 8 caracteres.")
    if re.search(r"\s", pwd):
        raise serializers.ValidationError("La contraseña no puede contener espacios.")
    if not re.search(r"[0-9]", pwd):
        raise serializers.ValidationError("La contraseña debe incluir al menos 1 número.")
    if not re.search(r"[^A-Za-z0-9]", pwd):
        raise serializers.ValidationError("La contraseña debe incluir al menos 1 símbolo (ej: !@#$).")
    if not re.search(r"[A-Za-z]", pwd):
        raise serializers.ValidationError("La contraseña debe incluir letras.")
    return pwd


# =====================================================
# ---------- Cliente / Mascota ----------
# =====================================================

class MascotaSerializer(serializers.ModelSerializer):
    microchip = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True
    )



    dueno_nombre = serializers.SerializerMethodField()
    dueno_telefono = serializers.SerializerMethodField()
    dueno_rut = serializers.SerializerMethodField()
    cliente_id = serializers.IntegerField(source="cliente.id", read_only=True)
    cliente_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Mascota
        exclude = ("cliente",)

    # -------------------------
    # VALIDACIONES Y NORMALIZACIÓN
    # -------------------------

    def validate_nombre(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError(
                "El nombre de la mascota es obligatorio."
            )
        return value.strip().capitalize()

    def validate_especie(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError(
                "Debes seleccionar una especie válida."
            )
        return value.strip().capitalize()

    def validate_raza(self, value):
        if value is None:
            return value
        return value.strip().capitalize()

    def validate_microchip(self, value):
        """
        Acepta:
        - "Si"
        - "No"
        - vacío
        - null
        """
        if value in [None, "", " ", "null"]:
            return "No"

        v = value.strip().capitalize()

        if v not in ["Si", "No"]:
            raise serializers.ValidationError(
                "El microchip solo puede ser 'Si' o 'No'."
            )

        return v

    def validate_fecha_nacimiento(self, value):
        if value is None:
            return value

        hoy = date.today()

        # no futura
        if value > hoy:
            raise serializers.ValidationError(
                "La fecha de nacimiento no puede ser futura."
            )

        # año irreal
        if value.year < 1900:
            raise serializers.ValidationError(
                "La fecha de nacimiento ingresada no es válida."
            )

        # edad máxima razonable (100 años)
        edad = hoy.year - value.year - (
            (hoy.month, hoy.day) < (value.month, value.day)
        )

        if edad > 100:
            raise serializers.ValidationError(
                "La edad de la mascota no es válida."
            )

        return value

    def validate_peso_kg(self, value):
        if value is None or value == "":
            return None

        try:
            d = Decimal(str(value))
        except (InvalidOperation, TypeError, ValueError):
            raise serializers.ValidationError("El peso ingresado no es válido.")

        d = d.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        if d <= 0:
            raise serializers.ValidationError("El peso debe ser mayor a cero.")
        if d > Decimal("200"):
            raise serializers.ValidationError("El peso ingresado no es válido.")

        return d

    # -------------------------
    # CAMPOS DEL DUEÑO

    # -------------------------
    # CAMPOS DEL DUEÑO
    # -------------------------

    def get_dueno_nombre(self, obj):
        cliente = getattr(obj, "cliente", None)
        if not cliente:
            return None
        u = getattr(cliente, "user", None)
        if not u:
            return f"Cliente {cliente.pk}"
        full = f"{u.first_name} {u.last_name}".strip()
        return full or u.email or u.username

    def get_dueno_telefono(self, obj):
        cli = getattr(obj, "cliente", None)
        return getattr(cli, "telefono", None) if cli else None

    def get_dueno_rut(self, obj):
        cli = getattr(obj, "cliente", None)
        return getattr(cli, "rut_dni", None) if cli else None

    def get_cliente_nombre(self, obj):
        return self.get_dueno_nombre(obj)


# =====================================================
# ---------- Cliente ----------
# =====================================================

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

    def validate_telefono(self, value):
        v = (value or "").strip()
        if not v:
            return v
        return normalizar_telefono_cl(v)

    def validate_rut_dni(self, value):
        v = (value or "").strip()
        if not v:
            return v
        return normalizar_y_validar_rut(v)

    def get_nombre(self, obj):
        u = getattr(obj, "user", None)
        if not u:
            return f"Cliente {obj.pk}"
        full = f"{u.first_name} {u.last_name}".strip()
        return full or u.email or u.username


# =====================================================
# ---------- Veterinario ----------
# =====================================================

class VeterinarioSerializer(serializers.ModelSerializer):
    nombre = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email", "nombre"]

    def get_nombre(self, obj):
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full or obj.email or obj.username


class VeterinarioModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Veterinario
        fields = [
            "telefono",
            "rut_dni",
            "especialidad",
            "direccion",
            "n_registro",
            "anios_experiencia",
            "bio",
            "duracion_consulta_min",
            "trabaja_con_vacunas",
            "trabaja_con_cirugias",
        ]

    def validate_telefono(self, value):
        return normalizar_telefono_cl(value)

    def validate_rut_dni(self, value):
        return normalizar_y_validar_rut(value)

    def validate_especialidad(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError(
                "La especialidad es obligatoria."
            )
        return value.strip()


# =====================================================
# ---------- Registro / Auth ----------
# =====================================================

class RegisterSerializer(serializers.Serializer):
    # Usuario
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    # Cliente
    telefono = serializers.CharField()
    direccion = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    rut_dni = serializers.CharField()
    acepta_comunicaciones = serializers.BooleanField(required=False, default=False)

    # Mascota opcional
    mascota_nombre = serializers.CharField(required=False, allow_blank=True)
    mascota_especie = serializers.CharField(required=False, allow_blank=True)
    mascota_raza = serializers.CharField(required=False, allow_blank=True)

    # -------------------------
    # Validaciones
    # -------------------------

    def validate_first_name(self, value):
        v = (value or "").strip()
        if len(v) < 2:
            raise serializers.ValidationError("Nombre obligatorio (mínimo 2 caracteres).")
        if not re.match(r"^[A-Za-zÁÉÍÓÚÑáéíóúñ\s'-]+$", v):
            raise serializers.ValidationError("Nombre inválido. Solo letras y espacios.")
        return v

    def validate_last_name(self, value):
        v = (value or "").strip()
        if len(v) < 2:
            raise serializers.ValidationError("Apellido obligatorio (mínimo 2 caracteres).")
        if not re.match(r"^[A-Za-zÁÉÍÓÚÑáéíóúñ\s'-]+$", v):
            raise serializers.ValidationError("Apellido inválido. Solo letras y espacios.")
        return v

    def validate_email(self, value):
        email = (value or "").strip().lower()
        if not email:
            raise serializers.ValidationError("Correo obligatorio. Ej: nombre@dominio.cl")
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Este correo ya está registrado.")
        return email

    def validate_telefono(self, value):
        return normalizar_telefono_cl(value)

    def validate_rut_dni(self, value):
        return normalizar_y_validar_rut(value)

    def validate_password(self, value):
        return validar_password_segura(value)

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password2"):
            raise serializers.ValidationError({"password2": "Las contraseñas no coinciden."})
        return attrs

    @transaction.atomic
    def create(self, validated):
        email = validated["email"].lower()

        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=validated.get("first_name", "").strip(),
            last_name=validated.get("last_name", "").strip(),
            password=validated["password"],
        )

        cliente = Cliente.objects.create(
            user=user,
            telefono=validated.get("telefono"),
            direccion=(validated.get("direccion") or "").strip(),
            rut_dni=validated.get("rut_dni"),
            acepta_comunicaciones=validated.get("acepta_comunicaciones", False),
        )

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


# ---------- Citas ----------

class CitaSerializer(serializers.ModelSerializer):
    cliente_id = serializers.IntegerField(write_only=True, required=True)
    mascota_id = serializers.IntegerField(write_only=True, required=True)

    veterinario_nombre = serializers.SerializerMethodField()
    mascota_nombre = serializers.SerializerMethodField()
    cliente_nombre = serializers.SerializerMethodField()


    class Meta:
        model = Cita
        fields = [
            "id",
            "cliente_id",
            "mascota_id",
            "cliente",
            "mascota",
            "veterinario",
            "veterinario_nombre",
            "cliente_nombre",
            "mascota_nombre",
            "motivo",
            "inicio",
            "fin",
            "box",
            "estado",
        ]
        read_only_fields = ["cliente", "mascota", "veterinario", "estado"]

    def get_veterinario_nombre(self, obj):
        if obj.veterinario:
            full = f"{obj.veterinario.first_name} {obj.veterinario.last_name}".strip()
            return full or obj.veterinario.email or obj.veterinario.username
        return ""

    def get_mascota_nombre(self, obj):
        return obj.mascota.nombre if obj.mascota else ""

    def get_cliente_nombre(self, obj):
        cli = getattr(obj, "cliente", None)
        if not cli:
            return ""
        u = getattr(cli, "user", None)
        if not u:
            return f"Cliente #{cli.pk}"
        full = f"{u.first_name} {u.last_name}".strip()
        return full or u.email or u.username

    def validate(self, attrs):
        """
        Validaciones de negocio para la agenda:
        - inicio < fin
        - dentro del horario de atención del veterinario
        - sin solaparse con otras citas activas
        - sin caer en bloqueos de agenda
        """
        instance = getattr(self, "instance", None)

        # Valores nuevos o, si no vienen (en update parcial), desde la instancia
        inicio = attrs.get("inicio") or getattr(instance, "inicio", None)
        fin = attrs.get("fin") or getattr(instance, "fin", None)
        veterinario = attrs.get("veterinario") or getattr(instance, "veterinario", None)
        box = attrs.get("box") or getattr(instance, "box", None)

        # Si falta info clave, dejamos que otras validaciones del serializer actúen
        if not inicio or not fin:
            return attrs

        # 1) inicio < fin
        if fin <= inicio:
            raise serializers.ValidationError(
                {"fin": "La hora de término debe ser mayor que la hora de inicio."}
            )

        # Si no tenemos veterinario aún (por ejemplo lo setea el ViewSet),
        # no podemos validar horario ni solapamiento.
        if not veterinario:
            return attrs

        # 2) Debe estar dentro del horario de atención del veterinario
        #    HorarioAtencion: veterinario, dia_semana (0=lunes), inicio (time), fin (time)
        dia_semana = inicio.weekday()  # 0=lunes ... 6=domingo
        hora_inicio = inicio.time()
        hora_fin = fin.time()

        horarios = HorarioAtencion.objects.filter(
            veterinario=veterinario,
            dia_semana=dia_semana,
        )

        dentro_horario = False
        for h in horarios:
            if h.inicio <= hora_inicio and h.fin >= hora_fin:
                dentro_horario = True
                break

        if not dentro_horario:
            raise serializers.ValidationError(
                "La cita está fuera del horario de atención definido para el veterinario."
            )

        # 3) No debe solaparse con otras citas activas del mismo veterinario
        #    Consideramos activos: pendiente, confirmada, atendida
        estados_activos = ["pendiente", "confirmada", "atendida"]

        qs_citas = Cita.objects.filter(
            veterinario=veterinario,
            estado__in=estados_activos,
            inicio__lt=fin,
            fin__gt=inicio,
        )

        # Excluirse a sí misma en caso de update
        if instance is not None:
            qs_citas = qs_citas.exclude(pk=instance.pk)

        if qs_citas.exists():
            raise serializers.ValidationError(
                "El veterinario ya tiene otra cita asignada en ese horario."
            )

        # (Opcional) control por box, si lo usas para salas físicas
        if box:
            qs_box = Cita.objects.filter(
                box=box,
                estado__in=estados_activos,
                inicio__lt=fin,
                fin__gt=inicio,
            )
            if instance is not None:
                qs_box = qs_box.exclude(pk=instance.pk)

            if qs_box.exists():
                raise serializers.ValidationError(
                    "El box seleccionado ya está ocupado en ese horario."
                )

        # 4) No debe caer en un bloqueo de agenda
        bloqueos = BloqueoAgenda.objects.filter(
            veterinario=veterinario,
            inicio__lt=fin,
            fin__gt=inicio,
        )
        if bloqueos.exists():
            raise serializers.ValidationError(
                "Existe un bloqueo de agenda en el horario seleccionado."
            )

        return attrs

    

class RegistroClinicoProductoSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    producto_codigo = serializers.CharField(source="producto.codigo", read_only=True)
    producto_categoria = serializers.CharField(source="producto.categoria", read_only=True)

    class Meta:
        model = RegistroClinicoProducto
        fields = [
            "id",
            "producto",
            "producto_nombre",
            "producto_codigo",
            "producto_categoria",
            "tipo",
            "cantidad",
        ]

class RegistroClinicoSerializer(serializers.ModelSerializer):
    items_tratamiento = RegistroClinicoProductoSerializer(many=True, read_only=True)
    items_tratamiento_in = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )

    veterinario_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = RegistroClinico
        fields = [
            "id",
            "mascota",
            "cita",
            "fecha",
            "motivo_consulta",
            "diagnostico",
            "procedimientos",
            "tratamientos",
            "medicamentos",
            "evolucion",
            "notas",
            "creado_en",
            "veterinario",
            "veterinario_nombre",
            "items_tratamiento",      
            "items_tratamiento_in",   
        ]
        read_only_fields = ["veterinario", "veterinario_nombre", "fecha", "creado_en"]

    def get_veterinario_nombre(self, obj):
        if not getattr(obj, "veterinario", None):
            return None
        full = f"{obj.veterinario.first_name} {obj.veterinario.last_name}".strip()
        return full or obj.veterinario.email or obj.veterinario.username

    def _user_is_vet(self, user):
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "is_veterinario", False):
            return True
        return user.groups.filter(name__iexact="veterinarios").exists()

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if not user or not user.is_authenticated:
            raise serializers.ValidationError({"detail": "Usuario no autenticado."})

        if not (self._user_is_vet(user) or user.is_staff or user.is_superuser):
            raise serializers.ValidationError(
                {"detail": "No tienes permisos para crear registros clínicos."}
            )

        validated_data["veterinario"] = user

        cita = validated_data.get("cita", None)

        #  items desde validated_data, con fallback
        raw_items = validated_data.pop("items_tratamiento_in", None)
        if raw_items is None:
            raw_items = request.data.get("items_tratamiento", [])

        if isinstance(raw_items, str):
            import json
            try:
                raw_items = json.loads(raw_items)
            except Exception:
                raw_items = []

        # --- PREVALIDACIÓN DE STOCK ---
        errores_stock = []
        productos_a_usar = []

        for item in raw_items or []:
            try:
                producto_id = int(item.get("producto"))
                cantidad = int(item.get("cantidad", 1))
            except Exception:
                continue

            if cantidad <= 0:
                continue

            try:
                producto = Producto.objects.select_for_update().get(pk=producto_id)
            except Producto.DoesNotExist:
                continue

            if producto.stock is not None and producto.stock < cantidad:
                errores_stock.append(
                    f"Stock insuficiente para {producto.nombre}: "
                    f"disponible {producto.stock}, solicitado {cantidad}"
                )
            else:
                productos_a_usar.append(
                    {
                        "producto": producto,
                        "cantidad": cantidad,
                        "tipo": item.get("tipo", "tratamiento") or "tratamiento",
                    }
                )

        if errores_stock:
            raise serializers.ValidationError({"items_tratamiento": errores_stock})

        registro = super().create(validated_data)

        for item in productos_a_usar:
            producto = item["producto"]
            cantidad = item["cantidad"]
            tipo = item["tipo"]

            RegistroClinicoProducto.objects.create(
                registro=registro,
                producto=producto,
                cantidad=cantidad,
                tipo=tipo,
            )

            MovimientoInventario.objects.create(
                producto=producto,
                tipo="salida",
                cantidad=cantidad,
                motivo=f"Uso en registro clínico #{registro.pk}",
            )

        if cita is not None and isinstance(cita, Cita):
            try:
                cita.estado = "atendida"
                cita.save(update_fields=["estado"])
            except Exception:
                pass

        try:
            notificar_cliente_registro_clinico(registro)
        except Exception:
            pass

        if cita is not None and isinstance(cita, Cita):
            try:
                notificar_cliente_de_cita(cita, "atendida")
            except Exception:
                pass
            try:
                notificar_vet_de_cita(cita, "atendida")
            except Exception:
                pass
                
        return registro

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
            "categoria",
            "laboratorio",
            "lote",
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

    # -------- VALIDACIONES --------

    def validate_stock(self, value):
        if value is None:
            return 0
        try:
            v = int(value)
        except Exception:
            raise serializers.ValidationError("El stock debe ser numérico.")
        if v < 0:
            raise serializers.ValidationError("El stock no puede ser negativo.")
        return v

    def validate_stock_minimo(self, value):
        if value is None:
            return 0
        try:
            v = int(value)
        except Exception:
            raise serializers.ValidationError("El stock mínimo debe ser numérico.")
        if v < 0:
            raise serializers.ValidationError("El stock mínimo no puede ser negativo.")
        return v

    def validate_fecha_vencimiento(self, value):
        if not value:
            return value
        if value < timezone.localdate():
            raise serializers.ValidationError(
                "La fecha de vencimiento no puede estar en el pasado."
            )
        return value
class MovimientoInventarioSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source="producto.nombre", read_only=True)
    producto_codigo = serializers.CharField(source="producto.codigo", read_only=True)
    producto_categoria = serializers.CharField(source="producto.categoria", read_only=True)

    class Meta:
        model = MovimientoInventario
        fields = [
            "id",
            "producto",
            "producto_nombre",
            "producto_codigo",
            "producto_categoria",
            "tipo",
            "cantidad",
            "motivo",
            "fecha",
        ]
        read_only_fields = ["id", "fecha", "producto_nombre", "producto_codigo", "producto_categoria"]

    def validate_cantidad(self, value):
        if value is None:
            raise serializers.ValidationError("La cantidad es obligatoria.")
        try:
            value = int(value)
        except Exception:
            raise serializers.ValidationError("La cantidad debe ser numérica.")
        if value <= 0:
            raise serializers.ValidationError("La cantidad debe ser mayor a 0.")
        return value

    def validate(self, attrs):
        producto = attrs.get("producto")
        tipo = attrs.get("tipo")
        cantidad = attrs.get("cantidad")

        if not producto:
            raise serializers.ValidationError({"producto": "Producto es obligatorio."})

        if tipo not in ["ingreso", "salida"]:
            raise serializers.ValidationError({"tipo": "Tipo inválido."})

        # Evitar stock negativo al crear salidas
        if tipo == "salida":
            stock_actual = int(producto.stock or 0)
            if cantidad and stock_actual < int(cantidad):
                raise serializers.ValidationError(
                    {"cantidad": f"Stock insuficiente. Disponible {stock_actual}."}
                )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        """
        Bloquea el producto para evitar condiciones de carrera.
        El ajuste real lo hace MovimientoInventario.save() cuando se crea.
        """
        producto = validated_data["producto"]
        # lock
        Producto.objects.select_for_update().filter(pk=producto.pk).first()
        return super().create(validated_data)

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

    def validate(self, attrs):
        inicio = attrs.get("inicio") or getattr(self.instance, "inicio", None)
        fin = attrs.get("fin") or getattr(self.instance, "fin", None)
        box = (attrs.get("box") if "box" in attrs else getattr(self.instance, "box", "")) or ""
        vet = attrs.get("veterinario") or getattr(self.instance, "veterinario", None)

        if inicio and fin and fin <= inicio:
            raise serializers.ValidationError({"fin": "La fecha/hora fin debe ser mayor que inicio."})

        if vet and inicio and fin:
            qs = BloqueoAgenda.objects.filter(veterinario=vet, box=box)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.filter(inicio__lt=fin, fin__gt=inicio).exists():
                raise serializers.ValidationError("Este bloqueo se solapa con otro bloqueo existente.")

        return attrs


class MotivoConsultaSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = MotivoConsulta
        fields = [
            "id",
            "nombre",
            "codigo",
            "activo",
            "creado_por",
            "creado_por_nombre",
            "creado_en",
        ]
        read_only_fields = [
            "id",
            "creado_por",
            "creado_por_nombre",
            "creado_en",
        ]

    def get_creado_por_nombre(self, obj):
        creado_por = getattr(obj, "creado_por", None)
        if not creado_por:
            return None

        full_name = getattr(creado_por, "get_full_name", None)
        if callable(full_name):
            nombre = full_name()
            if nombre:
                return nombre

        return getattr(creado_por, "username", None) or getattr(creado_por, "email", None)

    def create(self, validated_data):
        """Asigna automáticamente request.user como creado_por."""
        request = self.context.get("request")
        if request and getattr(request, "user", None) and request.user.is_authenticated:
            validated_data["creado_por"] = request.user
        return super().create(validated_data)

class AdminUserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    has_cliente = serializers.SerializerMethodField()
    has_veterinario = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "is_staff",
            "is_superuser",
            "roles",
            "has_cliente",
            "has_veterinario",
            "is_active",
            "date_joined",
        ]

    def get_full_name(self, obj):
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full or obj.email or obj.username

    def get_roles(self, obj):
        groups = list(obj.groups.values_list("name", flat=True))
        return groups

    def get_has_cliente(self, obj):
        return hasattr(obj, "cliente") and obj.cliente is not None

    def get_has_veterinario(self, obj):
        return hasattr(obj, "veterinario") and obj.veterinario is not None
    
class NotificacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notificacion
        fields = [
            "id",
            "titulo",
            "mensaje",
            "tipo",
            "url",
            "leida",
            "creada_en",
        ]
        read_only_fields = ["id", "creada_en"]