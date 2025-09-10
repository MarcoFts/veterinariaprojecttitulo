from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from mascotas.models import Mascota
from veterinarios.models import Veterinario

class Cita(models.Model):
    ESTADOS = [
        ("reservada", "Reservada"),
        ("atendida", "Atendida"),
        ("no_asiste", "No se presentó"),
        ("cancelada", "Cancelada"),
    ]

    mascota = models.ForeignKey(Mascota, on_delete=models.CASCADE, related_name="citas")
    veterinario = models.ForeignKey(Veterinario, on_delete=models.PROTECT, related_name="citas")
    inicio = models.DateTimeField()
    fin = models.DateTimeField()
    motivo = models.CharField(max_length=200, blank=True, null=True)
    estado = models.CharField(max_length=12, choices=ESTADOS, default="reservada")
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-inicio"]
        verbose_name = "Cita"
        verbose_name_plural = "Citas"

    def clean(self):
        if self.fin and self.inicio and self.fin <= self.inicio:
            raise ValidationError("La hora de término debe ser posterior al inicio.")
        # Evitar solape para el mismo veterinario
        if self.veterinario_id and self.inicio and self.fin:
            qs = Cita.objects.filter(veterinario=self.veterinario).exclude(pk=self.pk)
            if qs.filter(inicio__lt=self.fin, fin__gt=self.inicio).exists():
                raise ValidationError("El/la veterinario/a ya tiene una cita en ese rango horario.")

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        try:
            inicio_local = timezone.localtime(self.inicio)
        except Exception:
            inicio_local = self.inicio
        return f"{self.mascota.nombre} · {self.veterinario.nombre_completo} · {inicio_local:%Y-%m-%d %H:%M}"
