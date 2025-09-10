from django.db import models

class Veterinario(models.Model):
    nombre_completo = models.CharField(max_length=120)
    especialidad = models.CharField(max_length=120, blank=True, null=True)

    class Meta:
        ordering = ["nombre_completo"]
        verbose_name = "Veterinario"
        verbose_name_plural = "Veterinarios"

    def __str__(self):
        return self.nombre_completo
