from django.contrib import admin
from .models import Veterinario

@admin.register(Veterinario)
class VeterinarioAdmin(admin.ModelAdmin):
    list_display = ("nombre_completo", "especialidad")
    search_fields = ("nombre_completo", "especialidad")
