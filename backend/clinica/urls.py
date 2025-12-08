from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from clinica.auth_views import EmailTokenObtainPairView
from .views import UpdateVetProfileView
from .views import (
    disponibilidad,
    veterinarios,
    ClienteViewSet,
    MascotaViewSet,
    CitaViewSet,
    HorarioAtencionViewSet,
    BloqueoAgendaViewSet,
    ProductoViewSet,
    InventarioViewSet,
    me,
    RegistroClinicoViewSet,
    MotivoConsultaListCreateAPIView,
    ReporteAgendaView,
    ReporteInventarioView,
    UpdateVetProfileView,
    ClienteProfileView,
)

# Vistas de autenticación
from .auth_views import (
    LoginView,          # si no lo usas lo puedes borrar
    RegisterView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

# -----------------------------
# RUTAS DE API REST
# -----------------------------
router = DefaultRouter()
router.register(r"clientes", ClienteViewSet, basename="cliente")
router.register(r"mascotas", MascotaViewSet, basename="mascota")
router.register(r"citas", CitaViewSet, basename="cita")
router.register(r"productos", ProductoViewSet, basename="producto")
router.register(r"inventario", InventarioViewSet, basename="inventario")
router.register(r"horarios", HorarioAtencionViewSet, basename="horario")
router.register(r"bloqueos", BloqueoAgendaViewSet, basename="bloqueo")
router.register(r"registros-clinicos", RegistroClinicoViewSet, basename="registro-clinico")

# -----------------------------
# URLS PRINCIPALES
# -----------------------------
urlpatterns = [
    # Endpoints principales
    path("api/", include(router.urls)),

    # Autenticación y JWT
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/login/", EmailTokenObtainPairView.as_view(), name="login_email"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", me, name="me"),
    path("api/auth/me/update/", UpdateVetProfileView.as_view(), name="update_vet_profile"),
    # Perfil cliente
    path(
        "api/auth/cliente/profile/",
        ClienteProfileView.as_view(),
        name="cliente_profile",
    ),
    # Recuperación de contraseña
    path("api/auth/password-reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path("api/auth/password-reset-confirm/<uidb64>/<token>/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),

    # Funcionalidades de agenda y veterinarios
    path("api/agenda/disponibilidad/", disponibilidad, name="agenda-disponibilidad"),
    path("api/veterinarios/", veterinarios, name="veterinarios"),
     # Motivos de consulta (predefinidos)
    path("api/motivos-consulta/", MotivoConsultaListCreateAPIView.as_view(), name="motivos-consulta"),
        # Reportes de gestión
    path(
        "api/reportes/agenda/",
        ReporteAgendaView.as_view(),
        name="reporte-agenda",
    ),
        path(
        "api/reportes/inventario/",
        ReporteInventarioView.as_view(),
        name="reporte-inventario",
    ),
]
