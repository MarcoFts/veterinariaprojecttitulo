from django.db import models
from clientes.models import Cliente

class Mascota(models.Model):
    ESPECIES = [("perro","Perro"), ("gato","Gato"), ("otro","Otro")]

    nombre = models.CharField(max_length=80)
    especie = models.CharField(max_length=10, choices=ESPECIES, default="perro")
    raza = models.CharField(max_length=80, blank=True, null=True)
    fecha_nacimiento = models.DateField(blank=True, null=True)
    dueno = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name="mascotas")

    class Meta:
        ordering = ["nombre"]
        verbose_name = "Mascota"
        verbose_name_plural = "Mascotas"

    def __str__(self):
        return f"{self.nombre} ({self.dueno.nombre_completo})"
