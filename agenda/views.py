from django.contrib import admin
from .models import Cita

@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    list_display = ("mascota", "veterinario", "inicio", "fin", "estado")
    list_filter = ("estado", "veterinario")
    search_fields = ("mascota__nombre", "veterinario__nombre_completo", "motivo")

# ejemplo para mascotas/views.py
from django.http import HttpResponse
def inicio(request):
    return HttpResponse("<h1>Agenda OK</h1>")
