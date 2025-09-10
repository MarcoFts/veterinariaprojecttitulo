from django.contrib import admin
from .models import Mascota

@admin.register(Mascota)
class MascotaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "especie", "raza", "dueno")
    list_filter = ("especie",)
    search_fields = ("nombre", "raza", "dueno__nombre_completo")
