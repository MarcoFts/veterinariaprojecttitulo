from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from clinica.mfa_views import (
    AdminMfaResetLogView,
    AdminMfaResetView,
    AdminMfaSettingsView,
    AdminMfaUsersView,
    MfaEnrollConfirmView,
    MfaEnrollPostponeView,
    MfaEnrollStartView,
    MfaLogoutView,
    MfaRegenerateRecoveryView,
    MfaStatusView,
    MfaTrustedDeviceRevokeView,
    MfaVerifyView,
    VetCareLoginView,
)

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
    ReporteAgendaView,
    ReporteInventarioView,
    UpdateVetProfileView,
    ClienteProfileView,
    MotivoConsultaViewSet,
    MovimientoInventarioViewSet,
    AdminUsersListView, 
    AdminUserRoleUpdateView,
    AdminDashboardView,
    NotificacionViewSet,
    api_root,
)

# Vistas de autenticación
from .auth_views import (
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
router.register(r"movimientos", MovimientoInventarioViewSet, basename="movimientos")
router.register(r"motivos-consulta", MotivoConsultaViewSet, basename="motivos-consulta")
router.register(r"notificaciones", NotificacionViewSet, basename="notificaciones")



# -----------------------------
# URLS PRINCIPALES
# -----------------------------
urlpatterns = [
    # Root view
    path("", api_root, name="api-root"),

    # Endpoints principales
    path("api/", include(router.urls)),

    # Autenticación y JWT (con flujo MFA MEJ-02)
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/login/", VetCareLoginView.as_view(), name="login_email"),
    path("api/auth/logout/", MfaLogoutView.as_view(), name="logout"),
    path("api/auth/mfa/verify/", MfaVerifyView.as_view(), name="mfa_verify"),
    path("api/auth/mfa/enroll/start/", MfaEnrollStartView.as_view(), name="mfa_enroll_start"),
    path("api/auth/mfa/enroll/confirm/", MfaEnrollConfirmView.as_view(), name="mfa_enroll_confirm"),
    path("api/auth/mfa/enroll/postpone/", MfaEnrollPostponeView.as_view(), name="mfa_enroll_postpone"),
    path("api/auth/mfa/status/", MfaStatusView.as_view(), name="mfa_status"),
    path("api/auth/mfa/recovery-codes/regenerate/", MfaRegenerateRecoveryView.as_view(), name="mfa_recovery_regenerate"),
    path("api/auth/mfa/trusted-devices/<uuid:device_id>/", MfaTrustedDeviceRevokeView.as_view(), name="mfa_trusted_device_revoke"),
    path("api/admin/mfa/settings/", AdminMfaSettingsView.as_view(), name="admin_mfa_settings"),
    path("api/admin/mfa/users/", AdminMfaUsersView.as_view(), name="admin_mfa_users"),
    path("api/admin/mfa/reset/", AdminMfaResetView.as_view(), name="admin_mfa_reset"),
    path("api/admin/mfa/reset-log/", AdminMfaResetLogView.as_view(), name="admin_mfa_reset_log"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", me, name="me"),
    path("api/auth/me/update/", UpdateVetProfileView.as_view(), name="update_vet_profile"),

    # Perfil cliente
    path("api/auth/cliente/profile/", ClienteProfileView.as_view(), name="cliente_profile"),

    # Recuperación de contraseña
    path("api/auth/password-reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    path("api/auth/password-reset-confirm/<uidb64>/<token>/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),

    # Funcionalidades de agenda y veterinarios
    path("api/agenda/disponibilidad/", disponibilidad, name="agenda-disponibilidad"),
    path("api/veterinarios/", veterinarios, name="veterinarios"),

    # Reportes de gestión
    path("api/reportes/agenda/", ReporteAgendaView.as_view(), name="reporte-agenda"),
    path("api/reportes/inventario/", ReporteInventarioView.as_view(), name="reporte-inventario"),

    path("api/admin/users/", AdminUsersListView.as_view(), name="admin_users_list"),
    path("api/admin/users/<int:user_id>/role/", AdminUserRoleUpdateView.as_view(), name="admin_user_role_update"),
    path("admin/dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
]
