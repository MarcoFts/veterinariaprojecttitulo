from django.db import models
from django.utils import timezone
from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

class Cliente(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cliente",
        null=True,        # <- temporalmente
        blank=True        # <- temporalmente
    )
    telefono = models.CharField(max_length=30, blank=True)
    direccion = models.CharField(
        "Dirección",
        max_length=255,
        default="",   # valor para filas existentes
        blank=True    # opcional: permite vacío en formularios
        # null=False por defecto en CharField
    )
    rut_dni = models.CharField("RUT / DNI", max_length=30, default="", blank=True)
    acepta_comunicaciones = models.BooleanField(default=False)
    def __str__(self):
        if self.user_id:
            full = f"{self.user.first_name} {self.user.last_name}".strip()
            return full or self.user.username or f"Cliente {self.pk}"
        return f"Cliente {self.pk}"

class Mascota(models.Model):
    SEXO_CHOICES = (
        ("Macho", "Macho"),
        ("Hembra", "Hembra"),
        ("No informado", "No informado"),  # <- agrega esta opción
    )
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="mascotas")
    nombre = models.CharField(max_length=100)
    especie = models.CharField(max_length=20)  # Perro/Gato/Otro
    sexo = models.CharField(
        "Sexo",
        max_length=20,
        choices=SEXO_CHOICES,
        default="No informado",  # <- default para filas existentes
    )
    raza = models.CharField("Raza", max_length=100, null=True, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    peso_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    esterilizado = models.BooleanField(default=False)
    microchip = models.CharField("Microchip", max_length=50, null=True, blank=True)
    notas_salud = models.TextField(blank=True)

    def __str__(self):
        return f"{self.nombre} ({self.especie})"



class Cita(models.Model):
    ESPECIES = [('Perro', 'Perro'), ('Gato', 'Gato'), ('Exótico', 'Exótico')]
    cliente_nombre = models.CharField(max_length=120)
    cliente_email = models.EmailField(unique=True, null=True, blank=True)
    cliente_telefono = models.CharField(max_length=30)
    mascota_nombre = models.CharField(max_length=120)
    especie = models.CharField(max_length=20, choices=ESPECIES)
    fecha = models.DateField()
    hora = models.TimeField()
    motivo = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=20, default='pendiente')  # pendiente/confirmada/cancelada
    creado = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-fecha', '-hora']

    def __str__(self):
        return f"{self.fecha} {self.hora} - {self.mascota_nombre} ({self.cliente_nombre})"
