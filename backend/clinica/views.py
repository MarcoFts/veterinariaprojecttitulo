from datetime import datetime, timedelta, time

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import viewsets, status, mixins, serializers as drf_serializers
from rest_framework.views import APIView
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Cliente, Mascota, Cita, Producto, HorarioAtencion, BloqueoAgenda
from .serializers import (
    ClienteSerializer,
    MascotaSerializer,
    CitaSerializer,
    ProductoSerializer,
    InventarioSerializer,
    VeterinarioSerializer,
    RegisterSerializer,
    HorarioAtencionSerializer,
    BloqueoAgendaSerializer,
)
from .utils import user_display_name

User = get_user_model()


# ---------- HELPERS DE ROL ----------
def user_is_vet(user):
    """Retorna True si el usuario es veterinario (campo o grupo)."""
    return getattr(user, "es_veterinario", False) or user.groups.filter(
        name="veterinarios"
    ).exists()


def user_is_client(user):
    """
    Retorna True si el usuario tiene ficha Cliente asociada.
    Asume que Cliente tiene OneToOneField(user, related_name='cliente').
    """
    return hasattr(user, "cliente")


# ---------- CLIENTES ----------
class ClienteViewSet(viewsets.ModelViewSet):
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Cliente.objects.all().order_by("-id")
        u = self.request.user

        # Veterinario/Admin ve todos los clientes
        if user_is_vet(u) or u.is_staff or u.is_superuser:
            return qs

        # Cliente solo ve su propia ficha
        return qs.filter(user=u)


# ---------- MASCOTAS ----------
class MascotaViewSet(viewsets.ModelViewSet):
    serializer_class = MascotaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Mascota.objects.all().order_by("-id")
        u = self.request.user

        # Veterinario/Admin ve todas las mascotas
        if user_is_vet(u) or u.is_staff or u.is_superuser:
            return qs

        # Cliente: solo mascotas de su ficha
        return qs.filter(cliente__user=u)

    def perform_create(self, serializer):
        u = self.request.user

        # Vet/admin exige cliente_id explícito
        if user_is_vet(u) or u.is_staff or u.is_superuser:
            cliente_id = self.request.data.get("cliente_id")
            if not cliente_id:
                raise drf_serializers.ValidationError(
                    {"cliente_id": "Debes enviar cliente_id"}
                )
            cliente = get_object_or_404(Cliente, id=cliente_id)
            serializer.save(cliente=cliente)
            return

        # Cliente normal: buscar su ficha
        cliente = Cliente.objects.filter(user=u).first()
        if not cliente:
            raise drf_serializers.ValidationError(
                {
                    "detail": (
                        "Tu usuario no tiene ficha de cliente. "
                        "Regístrate como cliente o crea la ficha en admin."
                    )
                }
            )

        serializer.save(cliente=cliente)


# ---------- HORARIOS DE ATENCIÓN ----------
class HorarioAtencionViewSet(viewsets.ModelViewSet):
    """
    Gestiona horarios de atención.

    - Admin (is_staff): ve y gestiona todos los horarios.
    - Veterinario: ve y gestiona SOLO sus propios horarios.
    - Cliente: no puede ver ni modificar.
    """

    queryset = HorarioAtencion.objects.all()
    serializer_class = HorarioAtencionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        u = self.request.user

        # Admin ve todos
        if u.is_staff or u.is_superuser:
            return qs.order_by("veterinario_id", "dia_semana", "inicio")

        # Veterinario ve solo los suyos
        if user_is_vet(u):
            return qs.filter(veterinario=u).order_by("dia_semana", "inicio")

        # Cliente u otro rol -> nada
        return qs.none()

    def perform_create(self, serializer):
        u = self.request.user

        # Solo veterinario/admin
        if user_is_vet(u):
            serializer.save(veterinario=u)
            return

        raise PermissionDenied("No tienes permiso para crear horarios.")

    def perform_update(self, serializer):
        u = self.request.user
        instance = self.get_object()

        if not (u.is_staff or u.is_superuser) and instance.veterinario != u:
            raise PermissionDenied("No puedes modificar horarios de otro veterinario.")

        if user_is_vet(u) and not (u.is_staff or u.is_superuser):
            serializer.save(veterinario=u)
        else:
            serializer.save()

    def perform_destroy(self, instance):
        u = self.request.user
        if not (u.is_staff or u.is_superuser) and instance.veterinario != u:
            raise PermissionDenied("No puedes eliminar horarios de otro veterinario.")
        instance.delete()


# ---------- BLOQUEOS DE AGENDA ----------
class BloqueoAgendaViewSet(viewsets.ModelViewSet):
    """
    Gestiona bloqueos de agenda (vacaciones, reuniones, etc.).

    - Admin (is_staff): ve y gestiona todos los bloqueos.
    - Veterinario: ve y gestiona SOLO sus propios bloqueos.
    - Cliente: no puede ver ni modificar.
    """

    queryset = BloqueoAgenda.objects.all()
    serializer_class = BloqueoAgendaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        u = self.request.user

        if u.is_staff or u.is_superuser:
            return qs.order_by("veterinario_id", "inicio")

        if user_is_vet(u):
            return qs.filter(veterinario=u).order_by("inicio")

        return qs.none()

    def perform_create(self, serializer):
        u = self.request.user

        if user_is_vet(u) and not (u.is_staff or u.is_superuser):
            serializer.save(veterinario=u)
        elif u.is_staff or u.is_superuser:
            serializer.save()
        else:
            raise PermissionDenied("No tienes permiso para crear bloqueos.")

    def perform_update(self, serializer):
        u = self.request.user
        instance = self.get_object()

        if not (u.is_staff or u.is_superuser) and instance.veterinario != u:
            raise PermissionDenied("No puedes modificar bloqueos de otro veterinario.")

        if user_is_vet(u) and not (u.is_staff or u.is_superuser):
            serializer.save(veterinario=u)
        else:
            serializer.save()

    def perform_destroy(self, instance):
        u = self.request.user
        if not (u.is_staff or u.is_superuser) and instance.veterinario != u:
            raise PermissionDenied("No puedes eliminar bloqueos de otro veterinario.")
        instance.delete()


# ---------- CITAS ----------
class CitaViewSet(viewsets.ModelViewSet):
    """
    Citas (horas agendadas).

    Visibilidad:
      - Admin / staff: todas las citas.
      - Veterinario: solo sus citas.
      - Cliente: solo sus citas (por su ficha Cliente).

    Creación:
      - Vet/admin: puede crear para cualquier cliente/mascota.
      - Cliente: solo para sus propias mascotas.
    """

    queryset = Cita.objects.all().select_related("cliente", "mascota", "veterinario")
    serializer_class = CitaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()

        if not user.is_authenticated:
            return qs.none()

        # Admin/staff ve todo
        if user.is_superuser or user.is_staff:
            base_qs = qs
        # Veterinario: solo sus citas
        elif user_is_vet(user):
            base_qs = qs.filter(veterinario=user)
        # Cliente: solo sus citas
        elif user_is_client(user):
            base_qs = qs.filter(cliente__user=user)
        else:
            base_qs = qs.none()

        # Filtro opcional por fecha (?fecha=YYYY-MM-DD)
        fecha_str = self.request.query_params.get("fecha")
        if fecha_str:
            try:
                fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
                base_qs = base_qs.filter(inicio__date=fecha)
            except ValueError:
                # si viene mal la fecha, no filtramos
                pass

        return base_qs.order_by("inicio")

    def perform_create(self, serializer):
        """
        - Para vet/admin: crea libremente (se espera cliente/mascota en el payload).
        - Para cliente: fuerza que la cita quede asociada a su Cliente y a una mascota suya.
        """
        u = self.request.user

        # Vet/Admin: crea sin restricción de cliente/mascota (pero registra quién la creó)
        if user_is_vet(u) or u.is_staff or u.is_superuser:
            serializer.save(creada_por=u)
            return

        # Cliente: debe tener ficha Cliente
        if not user_is_client(u):
            raise PermissionDenied("Tu usuario no tiene ficha de cliente.")

        cliente = getattr(u, "cliente", None)
        if not cliente:
            raise PermissionDenied("Tu usuario no tiene ficha de cliente.")

        data = serializer.validated_data
        mascota = data.get("mascota")

        if not mascota:
            raise drf_serializers.ValidationError(
                {"mascota": "Debes seleccionar una mascota."}
            )

        # La mascota debe pertenecer a este cliente
        if mascota.cliente_id != cliente.id:
            raise PermissionDenied("No puedes agendar con una mascota que no es tuya.")

        serializer.save(cliente=cliente, creada_por=u)

    # ---------- ACCIONES SOBRE CITAS ----------
    @action(detail=True, methods=["patch"])
    def confirmar(self, request, pk=None):
        cita = self.get_object()
        u = request.user

        # Solo vet/admin o cliente dueño
        if not (user_is_vet(u) or u.is_staff or u.is_superuser):
            if not cita.cliente or cita.cliente.user_id != u.id:
                return Response({"detail": "No autorizado."}, status=403)

        if cita.estado == "cancelada":
            return Response(
                {"detail": "No se puede confirmar una cita cancelada."},
                status=400,
            )

        cita.estado = "confirmada"
        cita.save(update_fields=["estado"])
        return Response(self.get_serializer(cita).data)

    @action(detail=True, methods=["patch"])
    def cancelar(self, request, pk=None):
        cita = self.get_object()
        u = request.user

        # Solo vet/admin o cliente dueño
        if not (user_is_vet(u) or u.is_staff or u.is_superuser):
            if not cita.cliente or cita.cliente.user_id != u.id:
                return Response({"detail": "No autorizado."}, status=403)

        if cita.estado == "cancelada":
            return Response(
                {"detail": "La cita ya está cancelada."},
                status=400,
            )

        cita.estado = "cancelada"
        cita.save(update_fields=["estado"])
        return Response(self.get_serializer(cita).data)

    @action(detail=True, methods=["patch"])
    def no_asistio(self, request, pk=None):
        """Marca la cita como 'no_asistida'. Solo vet/admin."""
        cita = self.get_object()
        u = request.user

        if not (user_is_vet(u) or u.is_staff or u.is_superuser):
            return Response({"detail": "No autorizado."}, status=403)

        if cita.estado == "cancelada":
            return Response(
                {"detail": "No corresponde marcar no asistida una cita cancelada."},
                status=400,
            )

        cita.estado = "no_asistida"
        cita.save(update_fields=["estado"])
        return Response(self.get_serializer(cita).data)

    @action(detail=True, methods=["patch"])
    def reprogramar(self, request, pk=None):
        """
        Reprograma una cita a un nuevo horario.

        Espera en el body (JSON):
        {
          "inicio": "2025-11-26T10:00",   // nuevo inicio (ISO)
          "duracion": 30,                 // opcional, en minutos
          "box": "BOX-1"                  // opcional
        }
        """
        cita = self.get_object()
        u = request.user

        # Permisos: vet/admin o cliente dueño de la cita
        if not (user_is_vet(u) or u.is_staff or u.is_superuser):
            if not cita.cliente or cita.cliente.user_id != u.id:
                return Response({"detail": "No autorizado."}, status=403)

        # Datos de entrada
        inicio_str = request.data.get("inicio")
        duracion = request.data.get("duracion")
        nuevo_box = request.data.get("box") or cita.box

        if not inicio_str:
            return Response(
                {"detail": "Debes enviar 'inicio' en formato ISO."},
                status=400,
            )

        # Parsear fecha/hora
        try:
            nuevo_inicio = datetime.fromisoformat(inicio_str)
        except ValueError:
            return Response(
                {"detail": "Formato de 'inicio' inválido."},
                status=400,
            )

        # Asegurar que sea aware con la zona del proyecto
        if timezone.is_naive(nuevo_inicio):
            nuevo_inicio = timezone.make_aware(
                nuevo_inicio, timezone.get_current_timezone()
            )
        else:
            nuevo_inicio = nuevo_inicio.astimezone(timezone.get_current_timezone())

        # Duración: usa la de la cita si no viene en el body
        if duracion is None:
            duracion_min = int((cita.fin - cita.inicio).total_seconds() // 60)
        else:
            try:
                duracion_min = int(duracion)
            except (TypeError, ValueError):
                return Response(
                    {"detail": "La duración debe ser un número entero en minutos."},
                    status=400,
                )

        nuevo_fin = nuevo_inicio + timedelta(minutes=duracion_min)

        # Validar disponibilidad para ese vet/box
        vet_id = cita.veterinario_id
        tz = timezone.get_current_timezone()

        # Citas del mismo día (mismo vet), excluyendo esta cita
        citas_conflicto = Cita.objects.filter(
            veterinario_id=vet_id,
            inicio__date=nuevo_inicio.date(),
            estado__in=["pendiente", "confirmada"],
        ).exclude(id=cita.id)

        # Bloqueos de agenda del mismo día
        bloqueos_conflicto = BloqueoAgenda.objects.filter(
            veterinario_id=vet_id,
            inicio__date=nuevo_inicio.date(),
        )

        def hay_conflicto():
            from django.utils import timezone as tz_mod

            # Checar contra otras citas
            for c in citas_conflicto:
                ci = tz_mod.localtime(c.inicio, tz)
                cf = tz_mod.localtime(c.fin, tz)

                # Si se usan boxes, respetar
                if nuevo_box and c.box and nuevo_box != c.box:
                    continue

                if _overlap(nuevo_inicio, nuevo_fin, ci, cf):
                    return True

            # Checar contra bloqueos
            for b in bloqueos_conflicto:
                bi = tz_mod.localtime(b.inicio, tz)
                bf = tz_mod.localtime(b.fin, tz)

                if nuevo_box and b.box and nuevo_box != b.box:
                    continue

                if _overlap(nuevo_inicio, nuevo_fin, bi, bf):
                    return True

            return False

        if hay_conflicto():
            return Response(
                {"detail": "El horario seleccionado no está disponible."},
                status=400,
            )

        # Aplicar cambios
        cita.inicio = nuevo_inicio
        cita.fin = nuevo_fin
        cita.box = nuevo_box
        # Si estaba confirmada, la volvemos a pendiente
        if cita.estado == "confirmada":
            cita.estado = "pendiente"

        cita.save(update_fields=["inicio", "fin", "box", "estado"])

        return Response(self.get_serializer(cita).data)

    @action(detail=True, methods=["patch"])
    def atender(self, request, pk=None):
        """Marca la cita como 'atendida'. Solo vet/admin."""
        cita = self.get_object()
        u = request.user

        if not (user_is_vet(u) or u.is_staff or u.is_superuser):
            return Response({"detail": "No autorizado."}, status=403)

        if cita.estado in ["cancelada", "no_asistida"]:
            return Response(
                {
                    "detail": (
                        "No se puede marcar como atendida una cita "
                        "cancelada o no asistida."
                    )
                },
                status=400,
            )

        cita.estado = "atendida"
        cita.save(update_fields=["estado"])
        return Response(self.get_serializer(cita).data)


# ---------- PRODUCTOS ----------
class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all().order_by("nombre")
    serializer_class = ProductoSerializer
    permission_classes = [IsAuthenticated]


# ---------- INVENTARIO ----------
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
        return Response(data)


# ---------- REGISTRO ----------
class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        if ser.is_valid():
            user = ser.save()
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "message": "Registro exitoso",
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "name": f"{user.first_name} {user.last_name}".strip(),
                    },
                    "tokens": {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    },
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------- PERFIL ----------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    u = request.user
    cliente = getattr(u, "cliente", None)
    return Response(
        {
            "id": u.id,
            "email": u.email,
            "name": user_display_name(u),
            "is_vet": user_is_vet(u),
            "is_staff": u.is_staff,
            "cliente_id": cliente.id if cliente else None,
        }
    )


# ---------- VETERINARIOS ----------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def veterinarios(request):
    """
    Lista de veterinarios para agendar.
    Incluye usuarios en grupo 'veterinarios' y/o is_staff.
    """
    qs = User.objects.filter(
        Q(groups__name__iexact="veterinarios") | Q(is_staff=True)
    ).distinct()
    serializer = VeterinarioSerializer(qs, many=True)
    return Response(serializer.data)


# ---------- DISPONIBILIDAD ----------
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
    weekday = date_obj.weekday()

    def combine_aware(d, t):
        naive = datetime.combine(d, t)
        if timezone.is_naive(naive):
            return timezone.make_aware(naive, tz)
        return naive.astimezone(tz)

    h_qs = HorarioAtencion.objects.filter(
        veterinario_id=vet_id, dia_semana=weekday
    )
    if box:
        h_qs = h_qs.filter(box=box)

    c_qs = (
        Cita.objects.filter(veterinario_id=vet_id, inicio__date=date_obj)
        .exclude(estado="cancelada")
    )
    citas_dia = [
        (
            timezone.localtime(c.inicio, tz),
            timezone.localtime(c.fin, tz),
            getattr(c, "box", "") or "",
        )
        for c in c_qs
    ]

    b_qs = BloqueoAgenda.objects.filter(veterinario_id=vet_id, inicio__date=date_obj)
    bloques_dia = [
        (
            timezone.localtime(b.inicio, tz),
            timezone.localtime(b.fin, tz),
            getattr(b, "box", "") or "",
        )
        for b in b_qs
    ]

    step = timedelta(minutes=15)
    need = timedelta(minutes=duracion)
    slots = []

    for h in h_qs:
        start = combine_aware(date_obj, h.inicio)
        end = combine_aware(date_obj, h.fin)

        t = start
        while t + need <= end:
            t_end = t + need
            conflict = False

            # Conflicto con otras citas
            for ci, cf, cbox in citas_dia:
                if box and cbox and cbox != box:
                    continue
                if _overlap(t, t_end, ci, cf):
                    conflict = True
                    break

            # Conflicto con bloqueos
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
