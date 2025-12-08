from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from django.shortcuts import get_object_or_404
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
)


User = get_user_model()


# ---------- Cliente / Mascota ----------

class MascotaSerializer(serializers.ModelSerializer):
    # Cambios IMPORTANTES → ahora microchip permite null y blank
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
    # NORMALIZACIÓN AUTOMÁTICA
    # -------------------------
    def validate_nombre(self, value):
        return value.strip().capitalize()

    def validate_especie(self, value):
        return value.strip().capitalize()

    def validate_raza(self, value):
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
            return None

        v = value.strip().capitalize()

        if v not in ["Si", "No"]:
            raise serializers.ValidationError(
                "El microchip debe ser 'Si', 'No' o vacío."
            )

        return v

    def validate_fecha_nacimiento(self, value):
        from datetime import date
        if value > date.today():
            raise serializers.ValidationError("La fecha no puede ser futura.")
        return value

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
        if not value.strip():
            raise serializers.ValidationError("El teléfono es obligatorio.")
        return value

    def validate_rut_dni(self, value):
        if not value.strip():
            raise serializers.ValidationError("El RUT / DNI es obligatorio.")
        return value

    def validate_especialidad(self, value):
        if not value.strip():
            raise serializers.ValidationError("La especialidad es obligatoria.")
        return value


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

    # ❌ BORRADO create() — ahora el ViewSet maneja todo
    

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
    # para lectura (GET)
    items_tratamiento = RegistroClinicoProductoSerializer(many=True, read_only=True)
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
            "veterinario",          # <- para que quede claro que existe la FK
            "veterinario_nombre",   # solo lectura
            "items_tratamiento",
        ]
        read_only_fields = ["veterinario", "veterinario_nombre", "fecha", "creado_en"]

    # ---- helpers ----
    def get_veterinario_nombre(self, obj):
        if not getattr(obj, "veterinario", None):
            return None
        full = f"{obj.veterinario.first_name} {obj.veterinario.last_name}".strip()
        return full or obj.veterinario.email or obj.veterinario.username

    def _user_is_vet(self, user):
        """
        Misma lógica que user_is_vet() de views.py,
        pero local para evitar import circular.
        """
        if not user or not user.is_authenticated:
            return False
        if getattr(user, "is_veterinario", False):
            return True
        return user.groups.filter(name__iexact="veterinarios").exists()

    @transaction.atomic
    def create(self, validated_data):
        """
        - El veterinario se toma del usuario logueado.
        - Solo veterinarios / staff / superuser pueden crear.
        - Si viene una cita asociada, la marca como 'atendida'.
        - Si vienen productos en items_tratamiento, se validan y se generan
          movimientos de inventario (salida).
        """
        request = self.context.get("request")
        user = getattr(request, "user", None)

        if not user or not user.is_authenticated:
            raise serializers.ValidationError({"detail": "Usuario no autenticado."})

        # ---- PERMISOS: misma lógica que en views.user_is_vet ----
        if not (self._user_is_vet(user) or user.is_staff or user.is_superuser):
            raise serializers.ValidationError(
                {"detail": "No tienes permisos para crear registros clínicos."}
            )

        # Asignar veterinario automáticamente (FK al User)
        validated_data["veterinario"] = user

        # Guardar referencia a cita (si viene)
        cita = validated_data.get("cita", None)

        # Leer items_tratamiento DESDE el request (puede venir como lista o JSON string)
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

        # Crear el registro clínico
        registro = super().create(validated_data)

        # Crear líneas de tratamiento + movimientos de inventario
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

        # Si había una cita asociada, marcarla como atendida
        if cita is not None:
            try:
                if isinstance(cita, Cita):
                    cita.estado = "atendida"
                    cita.save(update_fields=["estado"])
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
            "laboratorio",     # 🆕
            "lote",            # 🆕
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
        if obj.creado_por:
          # trata de usar nombre completo si tu User lo tiene
          full_name = getattr(obj.creado_por, "get_full_name", None)
          if callable(full_name):
              nombre = full_name()
              if nombre:
                  return nombre
          return obj.creado_por.username
        return None

    def create(self, validated_data):
        """
        Cuando se crea desde la API, le metemos automáticamente el usuario
        que hizo la petición como 'creado_por'.
        """
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            validated_data["creado_por"] = request.user
        return super().create(validated_data)
