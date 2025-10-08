# clinica/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from clinica.views import (
    ClienteViewSet,
    MascotaViewSet,
    CitaViewSet,
    RegisterView,   # <- tu vista de registro ya existente
    me,             # <- función me existente en clinica.views
)
from clinica.auth_views import LoginView   # <- login por EMAIL
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'mascotas', MascotaViewSet, basename='mascota')
router.register(r'citas', CitaViewSet, basename='cita')

urlpatterns = [
    # Endpoints REST (quedan bajo /api/…)
    path("api/", include(router.urls)),

    # AUTH por email
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/login/",    LoginView.as_view(),    name="email_login"),
    path("api/auth/refresh/",  TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/",       me, name="me"),  # <- usa la función me (no MeView)
]
