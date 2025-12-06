from django.contrib import admin
from .models import Cliente, Cita, Mascota, Producto, MovimientoInventario, Veterinario


# ----------------------------
# CLIENTE
# ----------------------------
@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "get_nombre",
        "get_email",
        "telefono",
        "rut_dni",
        "acepta_comunicaciones",
    )
    search_fields = (
        "user__first_name",
        "user__last_name",
        "user__email",
        "rut_dni",
        "telefono",
    )
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


# ----------------------------
# MASCOTA
# ----------------------------
@admin.register(Mascota)
class MascotaAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "especie", "sexo", "cliente")
    search_fields = (
        "nombre",
        "cliente__user__first_name",
        "cliente__user__last_name",
        "cliente__user__email",
    )


# ----------------------------
# CITA
# ----------------------------
@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "cliente",
        "mascota",
        "veterinario",
        "box",
        "inicio",
        "fin",
        "estado",
    )
    list_filter = ("estado", "box", "veterinario")
    search_fields = (
        "cliente__user__email",
        "mascota__nombre",
        "veterinario__email",
    )


# ----------------------------
# PRODUCTO
# ----------------------------
@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "codigo", "stock", "stock_minimo", "fecha_vencimiento")
    search_fields = ("nombre", "codigo")


# ----------------------------
# MOVIMIENTO INVENTARIO
# ----------------------------
@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = ("id", "producto", "tipo", "cantidad", "fecha", "motivo")
    list_filter = ("tipo", "fecha")
    search_fields = ("producto__nombre", "producto__codigo", "motivo")


# ----------------------------
# VETERINARIO (NUEVO)
# ----------------------------
@admin.register(Veterinario)
class VeterinarioAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "telefono",
        "rut_dni",
        "especialidad",
        "direccion",
        "n_registro",
        "anios_experiencia",
    )
    search_fields = (
        "user__email",
        "user__first_name",
        "user__last_name",
        "telefono",
        "rut_dni",
        "especialidad",
        "n_registro",
    )
    list_filter = ("especialidad", "trabaja_con_vacunas", "trabaja_con_cirugias")
