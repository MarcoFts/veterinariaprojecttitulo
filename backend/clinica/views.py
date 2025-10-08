from rest_framework import viewsets
from .models import Cliente, Cita
from .serializers import ClienteSerializer, CitaSerializer
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Cliente, Mascota
from .serializers import ClienteSerializer, MascotaSerializer
from .serializers import RegisterSerializer
from rest_framework_simplejwt.tokens import RefreshToken

class CitaViewSet(viewsets.ModelViewSet):
    queryset = Cita.objects.all()
    serializer_class = CitaSerializer


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all().order_by('-id')
    serializer_class = ClienteSerializer

class MascotaViewSet(viewsets.ModelViewSet):
    queryset = Mascota.objects.all().order_by('-id')
    serializer_class = MascotaSerializer

class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        if ser.is_valid():
            user = ser.save()
            # si quieres logear automáticamente tras registrarse:
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Registro exitoso",
                "user": {"id": user.id, "email": user.email, "name": f"{user.first_name} {user.last_name}".strip()},
                "tokens": {"access": str(refresh.access_token), "refresh": str(refresh)},
            }, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
    
from rest_framework.decorators import api_view, permission_classes
@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    u = request.user
    return Response({"id": u.id, "email": u.email, "name": f"{u.first_name} {u.last_name}".strip()})