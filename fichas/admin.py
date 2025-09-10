from django.contrib import admin
from .models import FichaClinica

@admin.register(FichaClinica)
class FichaClinicaAdmin(admin.ModelAdmin):
    list_display = ("mascota", "fecha")
    search_fields = ("mascota__nombre", "diagnostico", "tratamiento", "notas")
