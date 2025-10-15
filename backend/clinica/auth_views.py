from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string



User = get_user_model()

# -----------------------------
# LOGIN
# -----------------------------
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        email = (request.data.get("email") or "").strip()
        password = request.data.get("password") or ""

        if not email:
            return Response({"email": ["Este campo es requerido."]}, status=400)
        if not password:
            return Response({"password": ["Este campo es requerido."]}, status=400)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({"detail": "No existe una cuenta con ese email."}, status=401)
        if not user.is_active:
            return Response({"detail": "Usuario inactivo."}, status=401)
        if not user.has_usable_password() or not check_password(password, user.password):
            return Response({"detail": "Credenciales inválidas."}, status=401)

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {"id": user.id, "email": user.email, "username": user.username},
            },
            status=200,
        )


# -----------------------------
# REGISTRO CON ENVÍO DE CORREO
# -----------------------------
class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        print(">>> Datos recibidos:", request.data)
        email = request.data.get("email")
        password = request.data.get("password")

        # Usa nombre y apellido desde el frontend
        first_name = request.data.get("first_name", "").strip()
        last_name = request.data.get("last_name", "").strip()

        # Genera un username automático si no viene
        username = request.data.get("username") or (first_name + last_name) or email.split("@")[0]

        if not email or not password or not first_name:
            return Response({"detail": "Faltan datos requeridos."}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({"detail": "Ya existe una cuenta con ese correo."}, status=400)

        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
        except Exception as e:
            print(">>> Error al crear usuario:", e)
            return Response({"detail": str(e)}, status=400)

        # -----------------------------
        # Enviar correo de bienvenida HTML
        # -----------------------------
        try:
            html_message = render_to_string('emails/bienvenida.html', {'username': first_name})
            plain_message = f"Hola {first_name}, tu registro en VetCare fue exitoso. ¡Gracias por unirte!"

            msg = EmailMultiAlternatives(
                subject="Bienvenido a VetCare 🐾",
                body=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[email]
            )
            msg.attach_alternative(html_message, "text/html")
            msg.send()

            print(f"💌 Correo HTML enviado correctamente a {email}")

        except Exception as e:
            print("⚠️ Error enviando correo HTML:", e)

        return Response(
            {"detail": "Usuario creado correctamente y correo HTML enviado."},
            status=201,
        )




# -----------------------------
# RECUPERAR CONTRASEÑA
# -----------------------------
class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Debes ingresar un correo."}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "No existe una cuenta con ese correo."}, status=404)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # Enlace al frontend (ajústalo si usas otro dominio)
        reset_link = f"http://localhost:5173/reset-password/{uid}/{token}/"

        # 💌 Enviar correo HTML con diseño VetCare
        try:
            # Renderizar plantilla HTML
            html_message = render_to_string('emails/reset_password.html', {
                'username': user.username,
                'reset_link': reset_link,
            })
            # Versión de texto simple (por compatibilidad)
            plain_message = f"Hola {user.username}, usa este enlace para restablecer tu contraseña: {reset_link}"

            msg = EmailMultiAlternatives(
                subject="Recuperación de contraseña - VetCare 🐾",
                body=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            msg.attach_alternative(html_message, "text/html")
            msg.send()

            print(f"💌 Correo HTML de recuperación enviado correctamente a {user.email}")

        except Exception as e:
            print("⚠️ Error enviando correo HTML de recuperación:", e)
            return Response({"error": "Error al enviar el correo."}, status=500)

        return Response(
            {"message": "Se envió un enlace de recuperación al correo."},
            status=200
        )


# -----------------------------
# CONFIRMAR NUEVA CONTRASEÑA
# -----------------------------
class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        new_password = request.data.get("new_password")
        confirm_password = request.data.get("confirm_password")

        if new_password != confirm_password:
            return Response({"error": "Las contraseñas no coinciden."}, status=400)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({"error": "El enlace no es válido."}, status=400)

        if not default_token_generator.check_token(user, token):
            return Response({"error": "El token ha expirado o es inválido."}, status=400)

        user.set_password(new_password)
        user.save()

        try:
            send_mail(
                subject="Tu contraseña ha sido actualizada - VetCare 🐾",
                message=f"Hola {user.username}, tu contraseña fue cambiada correctamente.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            print("Error enviando correo de confirmación:", e)

        return Response(
            {"message": "Contraseña actualizada correctamente."}, status=200
        )
