from datetime import timedelta
from django.conf import settings
from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Cliente(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cliente",
    )
    telefono = models.CharField(max_length=30, blank=True)
    direccion = models.CharField("Dirección", max_length=255, default="", blank=True)
    rut_dni = models.CharField("RUT / DNI", max_length=30, default="", blank=True)
    acepta_comunicaciones = models.BooleanField(default=False)

    def __str__(self):
        if self.user_id:
            full = f"{self.user.first_name} {self.user.last_name}".strip()
            return full or self.user.username or f"Cliente {self.pk}"
        return f"Cliente {self.pk}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["rut_dni"],
                condition=~models.Q(rut_dni=""),
                name="unique_rut_cliente"
            )
        ]

class Veterinario(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="veterinario",
    )

    # CAMPOS OBLIGATORIOS
    telefono = models.CharField(max_length=30)
    rut_dni = models.CharField(max_length=30)
    especialidad = models.CharField(max_length=100)

    # OPCIONALES
    direccion = models.CharField(max_length=255, blank=True)
    n_registro = models.CharField("N° Registro Profesional", max_length=100, blank=True)
    anios_experiencia = models.PositiveIntegerField(default=0, blank=True)
    bio = models.TextField(blank=True)

    # CONFIGURACIÓN DE AGENDA (opcionales)
    duracion_consulta_min = models.PositiveIntegerField(default=30)
    trabaja_con_vacunas = models.BooleanField(default=True)
    trabaja_con_cirugias = models.BooleanField(default=False)

    def __str__(self):
        return f"Vet {self.user.first_name} {self.user.last_name}"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["rut_dni"],
                condition=~models.Q(rut_dni=""),
                name="unique_rut_veterinario"
            )
        ]


class Mascota(models.Model):
    SEXO_CHOICES = (
        ("Macho", "Macho"),
        ("Hembra", "Hembra"),
        ("No informado", "No informado"),
    )

    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        related_name="mascotas",
    )
    nombre = models.CharField(max_length=100)
    especie = models.CharField(max_length=20)
    sexo = models.CharField(
        "Sexo",
        max_length=20,
        choices=SEXO_CHOICES,
        default="No informado",
    )
    raza = models.CharField("Raza", max_length=100, null=True, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    peso_kg = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )
    esterilizado = models.BooleanField(default=False)
    microchip = models.CharField(
        max_length=2,
        choices=[("Si", "Si"), ("No", "No")],
        default="No"
    )
    foto = models.ImageField(upload_to="mascotas/", null=True, blank=True)
    notas_salud = models.TextField(blank=True)

    def __str__(self):
        return f"{self.nombre} ({self.especie})"


class Cita(models.Model):
    ESTADOS = (
        ("pendiente", "Pendiente"),
        ("confirmada", "Confirmada"),
        ("cancelada", "Cancelada"),
        ("no_asistida", "No asistió"),
        ("atendida", "Atendida"),
    )

    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        related_name="citas",
        null=True,
        blank=True,
    )
    mascota = models.ForeignKey(
        Mascota,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="citas",
    )
    veterinario = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="citas_asignadas",
    )
    box = models.CharField(max_length=20, blank=True, default="BOX-1")

    inicio = models.DateTimeField()
    fin = models.DateTimeField()

    estado = models.CharField(
        max_length=15,
        choices=ESTADOS,
        default="pendiente",
    )
    motivo = models.CharField(max_length=255, blank=True, default="", null=True)

    creada_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="citas_creadas",
        help_text="Usuario (cliente/admin) que registró la cita",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(
                fields=["veterinario", "box", "inicio", "fin", "estado"],
            ),
        ]

    def __str__(self):
        if self.inicio:
            return f"Cita {self.pk} - {self.inicio:%Y-%m-%d %H:%M} ({self.estado})"
        return f"Cita {self.pk} ({self.estado})"

class RegistroClinico(models.Model):
    mascota = models.ForeignKey(
        Mascota,
        on_delete=models.CASCADE,
        related_name="registros_clinicos",
    )
    veterinario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="registros_clinicos",
    )
    cita = models.ForeignKey(
        "Cita",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="registros_clinicos",
    )

    fecha = models.DateTimeField(default=timezone.now)

    # Campos clínicos
    motivo_consulta = models.TextField(blank=True)
    anamnesis = models.TextField(blank=True)
    examen_fisico = models.TextField(blank=True)
    diagnostico = models.TextField(blank=True)
    procedimientos = models.TextField(blank=True)
    tratamientos = models.TextField(blank=True)
    medicamentos = models.TextField(blank=True)
    evolucion = models.TextField(blank=True)
    notas = models.TextField(blank=True)

    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha"]

    def __str__(self):
        return f"Registro {self.mascota} - {self.fecha:%Y-%m-%d %H:%M}"

class RegistroClinicoProducto(models.Model):
    TIPO_USO = (
        ("tratamiento", "Tratamiento"),
        ("vacuna", "Vacuna"),
        ("antiparasitario", "Antiparasitario"),
        ("otro", "Otro"),
    )

    registro = models.ForeignKey(
        "RegistroClinico",
        on_delete=models.CASCADE,
        related_name="items_tratamiento",
    )
    producto = models.ForeignKey(
        "Producto",                      
        on_delete=models.PROTECT,
        related_name="usos_en_registros",
    )
    cantidad = models.PositiveIntegerField(default=1)
    tipo = models.CharField(
        max_length=20,
        choices=TIPO_USO,
        default="tratamiento",
        blank=True,
    )

    def __str__(self):
        return f"{self.producto.nombre} x{self.cantidad} ({self.get_tipo_display()})"

from django.db import models
from django.utils import timezone
from datetime import timedelta


class Producto(models.Model):
    CATEGORIAS = (
        ("tratamiento", "Tratamiento / Medicamento"),
        ("vacuna", "Vacuna"),
        ("antiparasitario", "Antiparasitario"),
        ("insumo", "Insumo"),
        ("otro", "Otro"),
    )

    nombre = models.CharField(max_length=150)
    codigo = models.CharField(  # código interno opcional
        max_length=50, unique=True, null=True, blank=True
    )
    categoria = models.CharField(
        max_length=20,
        choices=CATEGORIAS,
        default="tratamiento",
    )

    # 🆕 Datos sanitarios para vacunas / medicamentos
    laboratorio = models.CharField(
        max_length=100, blank=True, null=True, help_text="Laboratorio / marca"
    )
    lote = models.CharField(
        max_length=50, blank=True, null=True, help_text="Lote del producto"
    )

    stock = models.IntegerField(default=0)
    stock_minimo = models.IntegerField(default=0)
    fecha_vencimiento = models.DateField(null=True, blank=True)

    def en_alerta_stock(self):
      return self.stock_minimo > 0 and self.stock <= self.stock_minimo

    def en_alerta_vencimiento(self, dias=30):
        if not self.fecha_vencimiento:
            return False
        return self.fecha_vencimiento <= (
            timezone.now().date() + timedelta(days=dias)
        )

    def __str__(self):
        return f"{self.nombre} ({self.codigo or 'sin código'})"

class MovimientoInventario(models.Model):
    TIPO = (
        ("ingreso", "Ingreso"),
        ("salida", "Salida"),
    )

    producto = models.ForeignKey(
        Producto,
        on_delete=models.CASCADE,
        related_name="movimientos",
    )
    tipo = models.CharField(max_length=10, choices=TIPO)
    cantidad = models.IntegerField()
    motivo = models.CharField(max_length=255, blank=True, default="")
    fecha = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        from django.db.models import F
        from django.db import transaction

        creating = self.pk is None

        with transaction.atomic():
            if creating:
                if self.tipo == "salida":
                    filas = Producto.objects.filter(
                        pk=self.producto.pk, stock__gte=self.cantidad
                    ).update(stock=F("stock") - self.cantidad)
                    
                    if filas == 0:
                        raise ValueError(f"Stock insuficiente para extraer {self.cantidad} de {self.producto.nombre}")
                elif self.tipo == "ingreso":
                    Producto.objects.filter(pk=self.producto.pk).update(stock=F("stock") + self.cantidad)

            super().save(*args, **kwargs)

    def __str__(self):
        signo = "+" if self.tipo == "ingreso" else "-"
        return (
            f"{self.producto.codigo} {signo}{self.cantidad} "
            f"@ {self.fecha:%Y-%m-%d %H:%M}"
        )

# ---- Agenda ----

class HorarioAtencion(models.Model):
    """Horario de atención recurrente por día de semana."""
    DIAS = [
        (i, d)
        for i, d in enumerate(
            ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
        )
    ]

    veterinario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="horarios",
    )
    dia_semana = models.IntegerField(
        choices=DIAS
    )  # 0 = Lunes ... 6 = Domingo
    inicio = models.TimeField()
    fin = models.TimeField()
    box = models.CharField(max_length=20, blank=True, default="")

    class Meta:
        unique_together = ("veterinario", "dia_semana", "inicio", "fin", "box")
        ordering = ["veterinario_id", "dia_semana", "inicio"]

    def __str__(self):
        box = f" [{self.box}]" if self.box else ""
        return (
            f"{self.get_dia_semana_display()} {self.inicio}-{self.fin}"
            f"{box} ({self.veterinario})"
        )


class BloqueoAgenda(models.Model):
    """Bloqueo puntual (reunión, feriado, vacaciones, etc.)."""

    veterinario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="bloqueos",
    )
    inicio = models.DateTimeField()
    fin = models.DateTimeField()
    motivo = models.CharField(max_length=255, blank=True, default="")
    box = models.CharField(max_length=20, blank=True, default="")

    def __str__(self):
        box = f" [{self.box}]" if self.box else ""
        return (
            f"Bloqueo {self.inicio:%Y-%m-%d %H:%M}-"
            f"{self.fin:%H:%M}{box} ({self.veterinario})"
        )

class MotivoConsulta(models.Model):
    nombre = models.CharField(max_length=200, unique=True)
    codigo = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        null=True,
        help_text="Código interno opcional (ej: control_general)",
    )
    activo = models.BooleanField(default=True)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="motivos_creados",
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre

class Notificacion(models.Model):
    TIPO = (
        ("info", "Info"),
        ("success", "Success"),
        ("warning", "Warning"),
        ("danger", "Danger"),
    )

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notificaciones",
    )

    titulo = models.CharField(max_length=180)
    mensaje = models.TextField(blank=True, default="")
    tipo = models.CharField(max_length=20, choices=TIPO, default="info")

    # URL interna del frontend (ej: /veterinario/citas o /cliente/citas)
    url = models.CharField(max_length=255, blank=True, default="")

    leida = models.BooleanField(default=False)
    creada_en = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-creada_en", "-id"]
        indexes = [
            models.Index(fields=["usuario", "leida", "creada_en"]),
        ]

    def __str__(self):
        return f"[{self.usuario_id}] {self.titulo} ({'leída' if self.leida else 'nueva'})"