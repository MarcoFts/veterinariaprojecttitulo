from django.db import models

class Cliente(models.Model):
    nombre = models.CharField(max_length=120)
    email = models.EmailField(blank=True, null=True)

    def __str__(self):
        return self.nombre
