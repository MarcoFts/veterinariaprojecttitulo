# clinica/views.py
from django.utils.dateparse import parse_date
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import VeterinarioSerializer
from .utils import user_display_name

from .models import Cliente, Mascota, Cita, Producto
from .serializers import (
    ClienteSerializer,
    MascotaSerializer,
    CitaSerializer,
    RegisterSerializer,
    ProductoSerializer,
    InventarioSerializer,
)

# ---------- helpers ----------
def user_is_vet(user):
    # Por defecto: veterinario = is_staff o miembro del grupo "veterinarios"
    return bool(
        getattr(user, "is_staff", False)
        or user.groups.filter(name__iexact="veterinarios").exists()
    )

# ---------- ViewSets ----------
class ClienteViewSet(viewsets.ModelViewSet):
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Cliente.objects.all().order_by("-id")
        u = self.request.user
        if user_is_vet(u):
            return qs
        # dueño: sólo su propio cliente
        return qs.filter(user=u)


class MascotaViewSet(viewsets.ModelViewSet):
    serializer_class = MascotaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Mascota.objects.all().order_by("-id")
        u = self.request.user
        if user_is_vet(u):
            return qs
        # dueño: sólo sus mascotas
        return qs.filter(cliente__user=u)


class CitaViewSet(viewsets.ModelViewSet):
    serializer_class = CitaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Cita.objects.all().select_related("cliente", "mascota", "veterinario")
        u = self.request.user

        # Filtro por fecha (opcional)
        fecha = self.request.query_params.get("fecha")
        estado = self.request.query_params.get("estado")
        if fecha:
            d = parse_date(fecha)
            if d:
                qs = qs.filter(inicio__date=d)
        if estado:
            qs = qs.filter(estado=estado)

        # Veterinario ve todas las citas; dueño sólo las suyas
        if user_is_vet(u):
            return qs.order_by("inicio")
        return qs.filter(cliente__user=u).order_by("inicio")

    def perform_create(self, serializer):
        """
        - Si es dueño: fuerza cliente = request.user.cliente y valida que la mascota sea suya.
        - Si es veterinario: puede crear para cualquier cliente/mascota.
        """
        u = self.request.user
        data = serializer.validated_data

        if user_is_vet(u):
            serializer.save()
            return

        # Dueño:
        cliente = getattr(u, "cliente", None)
        if not cliente:
            raise permissions.PermissionDenied("Tu usuario no tiene ficha de cliente.")
        mascota = data.get("mascota")
        if mascota and mascota.cliente_id != cliente.id:
            raise permissions.PermissionDenied("No puedes agendar con una mascota que no es tuya.")
        serializer.save(cliente=cliente)

    @action(detail=True, methods=["patch"])
    def confirmar(self, request, pk=None):
        cita = self.get_object()
        # dueño sólo puede confirmar/cancelar sus propias citas
        if not user_is_vet(request.user) and cita.cliente and cita.cliente.user != request.user:
            return Response({"detail": "No autorizado."}, status=403)
        if cita.estado == "cancelada":
            return Response({"detail": "No se puede confirmar una cita cancelada."}, status=400)
        cita.estado = "confirmada"
        cita.save(update_fields=["estado"])
        return Response(self.get_serializer(cita).data)

    @action(detail=True, methods=["patch"])
    def cancelar(self, request, pk=None):
        cita = self.get_object()
        if not user_is_vet(request.user) and cita.cliente and cita.cliente.user != request.user:
            return Response({"detail": "No autorizado."}, status=403)
        if cita.estado == "cancelada":
            return Response({"detail": "La cita ya está cancelada."}, status=400)
        cita.estado = "cancelada"
        cita.save(update_fields=["estado"])
        return Response(self.get_serializer(cita).data)


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all().order_by("nombre")
    serializer_class = ProductoSerializer
    permission_classes = [IsAuthenticated]


class InventarioViewSet(viewsets.GenericViewSet, mixins.ListModelMixin):
    serializer_class = InventarioSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        dias = int(request.query_params.get("dias", 30))
        productos = Producto.objects.all()
        stock_bajo = [p for p in productos if p.en_alerta_stock()]
        por_vencer = [p for p in productos if p.en_alerta_vencimiento(dias=dias)]
        data = {
            "stock_bajo": ProductoSerializer(stock_bajo, many=True).data,
            "por_vencer": ProductoSerializer(por_vencer, many=True).data,
        }
        s = self.get_serializer(instance=data)
        return Response(s.data)


# ---------- Registro + perfil ----------
class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        if ser.is_valid():
            user = ser.save()
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "message": "Registro exitoso",
                    "user": {"id": user.id, "email": user.email, "name": f"{user.first_name} {user.last_name}".strip()},
                    "tokens": {"access": str(refresh.access_token), "refresh": str(refresh)},
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user
    return Response({
        "id": u.id,
        "email": u.email,
        "name": user_display_name(u),
        "is_vet": user_is_vet(u),
        "is_staff": u.is_staff,
    })
from datetime import datetime, time, timedelta
from django.utils import timezone
from django.db.models import Q
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Cita, HorarioAtencion, BloqueoAgenda
from .serializers import VeterinarioSerializer

User = get_user_model()

def user_is_vet(user):
    return bool(getattr(user, "is_staff", False) or user.groups.filter(name__iexact="veterinarios").exists())

def _is_vet(user):
    return bool(user.is_staff or user.groups.filter(name__iexact="veterinarios").exists())

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def veterinarios(request):
    """
    Solo usuarios EN el grupo 'veterinarios'.
    Excluye superusuarios. Mantiene is_active=True por seguridad.
    """
    qs = (
        User.objects.filter(
            groups__name__iexact="veterinarios",
            is_active=True,
        )
        .exclude(is_superuser=True)
        .distinct()
        .order_by("first_name", "last_name", "email")
    )
    return Response(VeterinarioSerializer(qs, many=True).data)

def _overlap(a_start, a_end, b_start, b_end) -> bool:
    return a_start < b_end and b_start < a_end

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def disponibilidad(request):
    """
    GET:
      veterinario_id: int
      fecha: YYYY-MM-DD
      duracion: minutos (default 30)
      box: str (opcional)
    Devuelve: {"slots": ["09:00", "09:15", ...]}
    """
    # --- parseo params ---
    try:
        vet_id = int(request.GET.get("veterinario_id", "0"))
    except (TypeError, ValueError):
        vet_id = 0

    fecha_str = request.GET.get("fecha")
    box = request.GET.get("box") or ""
    try:
        duracion = int(request.GET.get("duracion", "30"))
    except (TypeError, ValueError):
        duracion = 30

    if not vet_id or not fecha_str:
        return Response({"slots": []})

    try:
        date_obj = datetime.strptime(fecha_str, "%Y-%m-%d").date()
    except ValueError:
        return Response({"slots": []})

    tz = timezone.get_current_timezone()
    weekday = date_obj.weekday()  # 0=Lun ... 6=Dom

    # --- helper seguro con zoneinfo ---
    def combine_aware(d, t):
        """datetime aware en TZ actual usando zoneinfo (no pytz.localize)."""
        naive = datetime.combine(d, t)
        if timezone.is_naive(naive):
            return timezone.make_aware(naive, tz)
        return naive.astimezone(tz)

    # --- horarios del día ---
    h_qs = HorarioAtencion.objects.filter(veterinario_id=vet_id, dia_semana=weekday)
    if box:
        h_qs = h_qs.filter(box=box)

    # --- citas (excluye canceladas) ---
    c_qs = Cita.objects.filter(veterinario_id=vet_id, inicio__date=date_obj).exclude(estado="cancelada")
    citas_dia = [
        (
            timezone.localtime(c.inicio, tz),
            timezone.localtime(c.fin, tz),
            getattr(c, "box", "") or "",
        )
        for c in c_qs
    ]

    # --- bloqueos ---
    b_qs = BloqueoAgenda.objects.filter(veterinario_id=vet_id, inicio__date=date_obj)
    bloques_dia = [
        (
            timezone.localtime(b.inicio, tz),
            timezone.localtime(b.fin, tz),
            getattr(b, "box", "") or "",
        )
        for b in b_qs
    ]

    # --- generación de slots ---
    step = timedelta(minutes=15)          # grilla de 15'
    need = timedelta(minutes=duracion)
    slots = []

    for h in h_qs:
        start = combine_aware(date_obj, h.inicio)
        end = combine_aware(date_obj, h.fin)

        t = start
        while t + need <= end:
            t_end = t + need
            conflict = False

            # colisión con citas (si hay box en cita y en selección, deben coincidir)
            for ci, cf, cbox in citas_dia:
                if box and cbox and cbox != box:
                    continue
                if _overlap(t, t_end, ci, cf):
                    conflict = True
                    break

            # colisión con bloqueos
            if not conflict:
                for bi, bf, bbox in bloques_dia:
                    if box and bbox and bbox != box:
                        continue
                    if _overlap(t, t_end, bi, bf):
                        conflict = True
                        break

            if not conflict:
                slots.append(timezone.localtime(t, tz).strftime("%H:%M"))

            t += step

    return Response({"slots": slots})