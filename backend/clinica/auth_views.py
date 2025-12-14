# backend/clinica/auth_views.py

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from .auth_serializers import (
    EmailTokenObtainPairSerializer,
    RegisterSerializer,
)
from .models import Cliente

User = get_user_model()


# =========================================================
# LOGIN JWT CON EMAIL
# =========================================================
class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""

        if not email:
            return Response({"email": ["Este campo es requerido."]}, status=400)
        if not password:
            return Response({"password": ["Este campo es requerido."]}, status=400)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response(
                {"detail": "No existe una cuenta con ese correo."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {"detail": "Usuario inactivo."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.has_usable_password() or not check_password(password, user.password):
            return Response(
                {"detail": "Credenciales inválidas."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                },
            },
            status=status.HTTP_200_OK,
        )


# =========================================================
# REGISTRO DE USUARIO (CLIENTE)
# =========================================================
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            # 🔴 Errores claros por campo
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        # -----------------------------
        # Enviar correo HTML de bienvenida
        # -----------------------------
        try:
            html_message = render_to_string(
                "emails/bienvenida.html",
                {
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "full_name": f"{user.first_name} {user.last_name}".strip(),
                },
            )

            plain_message = (
                f"Hola {user.first_name},\n\n"
                f"Tu registro en Vetyon fue exitoso.\n"
                f"Ya puedes iniciar sesión en la plataforma."
            )

            msg = EmailMultiAlternatives(
                subject="Bienvenido a Vetyon",
                body=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            msg.attach_alternative(html_message, "text/html")
            msg.send()

        except Exception as e:
            # No bloqueamos el registro si el correo falla
            print("⚠️ Error enviando correo de bienvenida:", e)

        return Response(
            {
                "detail": "Usuario creado correctamente. Revisa tu correo para más información."
            },
            status=status.HTTP_201_CREATED,
        )


# =========================================================
# RECUPERAR CONTRASEÑA
# =========================================================
class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if not email:
            return Response(
                {"email": ["Debes ingresar un correo."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {"email": ["No existe una cuenta con ese correo."]},
                status=status.HTTP_404_NOT_FOUND,
            )

        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        reset_link = f"http://localhost:5173/reset-password/{uidb64}/{token}"

        try:
            html_message = render_to_string(
                "emails/reset_password.html",
                {
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "full_name": f"{user.first_name} {user.last_name}",
                    "reset_link": reset_link,
                },
            )

            plain_message = (
                f"Hola {user.first_name},\n\n"
                f"Recibimos una solicitud para restablecer tu contraseña.\n"
                f"Enlace:\n{reset_link}\n\n"
                f"Si no fuiste tú, ignora este mensaje."
            )

            msg = EmailMultiAlternatives(
                subject="Recuperación de contraseña - Vetyon",
                body=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            msg.attach_alternative(html_message, "text/html")
            msg.send()

        except Exception as e:
            print("⚠️ Error enviando correo de recuperación:", e)
            return Response(
                {"detail": "Error al enviar el correo."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {"detail": "Se envió un enlace de recuperación al correo."},
            status=status.HTTP_200_OK,
        )


# =========================================================
# CONFIRMAR NUEVA CONTRASEÑA
# =========================================================
class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if not new_password or not confirm_password:
            return Response(
                {"detail": "Debes completar ambos campos."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password != confirm_password:
            return Response(
                {"confirm_password": ["Las contraseñas no coinciden."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response(
                {"detail": "El enlace no es válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "El token ha expirado o es inválido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        # Correo HTML de confirmación
        try:
            html_message = render_to_string(
                "emails/password_changed.html",
                {
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "full_name": f"{user.first_name} {user.last_name}",
                },
            )

            msg = EmailMultiAlternatives(
                subject="Tu contraseña ha sido actualizada - Vetyon",
                body="Tu contraseña fue actualizada correctamente.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            msg.attach_alternative(html_message, "text/html")
            msg.send()

        except Exception as e:
            print("⚠️ Error enviando correo de confirmación:", e)

        return Response(
            {"detail": "Contraseña actualizada correctamente."},
            status=status.HTTP_200_OK,
        )
