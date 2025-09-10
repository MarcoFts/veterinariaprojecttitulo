from django.db import models
from mascotas.models import Mascota

class FichaClinica(models.Model):
    mascota = models.ForeignKey(Mascota, on_delete=models.CASCADE, related_name="fichas")
    fecha = models.DateTimeField(auto_now_add=True)
    diagnostico = models.TextField(blank=True, null=True)
    tratamiento = models.TextField(blank=True, null=True)
    notas = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-fecha"]
        verbose_name = "Ficha clínica"
        verbose_name_plural = "Fichas clínicas"

    def __str__(self):
        return f"Ficha #{self.id} - {self.mascota.nombre}"
