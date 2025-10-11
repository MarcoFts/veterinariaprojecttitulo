from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import disponibilidad, veterinarios

from .auth_views import LoginView
from .views import (
    ClienteViewSet,
    MascotaViewSet,
    CitaViewSet,
    ProductoViewSet,
    InventarioViewSet,
    RegisterView,
    me,
)

router = DefaultRouter()
router.register(r"clientes", ClienteViewSet, basename="cliente")
router.register(r"mascotas", MascotaViewSet, basename="mascota")
router.register(r"citas", CitaViewSet, basename="cita")
router.register(r"productos", ProductoViewSet, basename="producto")
router.register(r"inventario", InventarioViewSet, basename="inventario")

urlpatterns = [
    path("api/", include(router.urls)),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/login/", LoginView.as_view(), name="email_login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", me, name="me"),
    path("api/agenda/disponibilidad/", disponibilidad, name="agenda-disponibilidad"),
    path("api/veterinarios/", veterinarios, name="veterinarios"),
]
