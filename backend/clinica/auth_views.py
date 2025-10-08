# clinica/auth_views.py
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

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

        # Busca por email, ignorando mayúsculas/minúsculas:
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({"detail": "No existe una cuenta con ese email."}, status=401)
        if not user.is_active:
            return Response({"detail": "Usuario inactivo."}, status=401)
        if not user.has_usable_password() or not check_password(password, user.password):
            return Response({"detail": "Credenciales inválidas."}, status=401)

        refresh = RefreshToken.for_user(user)
        return Response(
            {"access": str(refresh.access_token), "refresh": str(refresh)},
            status=200,
        )
