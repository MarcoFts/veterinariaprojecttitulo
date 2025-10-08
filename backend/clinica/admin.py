from django.contrib import admin
from .models import Cliente, Cita, Mascota

@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ("id", "get_nombre", "get_email", "telefono", "rut_dni", "acepta_comunicaciones")
    search_fields = ("user__first_name", "user__last_name", "user__email", "rut_dni", "telefono")
    list_filter = ("acepta_comunicaciones",)

    def get_nombre(self, obj):
        nombre = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return nombre or obj.user.username
    get_nombre.short_description = "Nombre"
    get_nombre.admin_order_field = "user__first_name"

    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = "Email"
    get_email.admin_order_field = "user__email"


@admin.register(Mascota)
class MascotaAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "especie", "sexo", "cliente")
    search_fields = ("nombre", "cliente__user__first_name", "cliente__user__last_name", "cliente__user__email")
