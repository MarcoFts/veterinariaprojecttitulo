from datetime import datetime, timedelta, time

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .email_utils import enviar_notificacion_cita
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from rest_framework import viewsets, status, mixins, serializers as drf_serializers
from rest_framework import serializers, permissions
from rest_framework.views import APIView
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Cliente,
    Mascota,
    Cita,
    Producto,
    HorarioAtencion,
    BloqueoAgenda,
    RegistroClinico,
)
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
    RegistroClinicoSerializer,
)
from .utils import user_display_name

User = get_user_model()

# ---------- DISPONIBILIDAD ----------
def _overlap(a_start, a_end, b_start, b_end) -> bool:
    return a_start < b_end and b_start < a_end


# ---------- HELPERS DE ROL ----------
def user_is_vet(user):
    """Retorna True si el usuario es veterinario (campo o grupo)."""
    return getattr(user, "is_veterinario", False) or user.groups.filter(
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

        if user_is_vet(u) or u.is_staff or u.is_superuser:
            return qs

        return qs.filter(user=u)


# ---------- MASCOTAS ----------
class MascotaViewSet(viewsets.ModelViewSet):
    serializer_class = MascotaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Mascota.objects.all().order_by("-id")
        u = self.request.user

        if user_is_vet(u) or u.is_staff or u.is_superuser:
            base_qs = qs
        else:
            base_qs = qs.filter(cliente__user=u)

        cliente_id = (
            self.request.query_params.get("cliente")
            or self.request.query_params.get("cliente_id")
        )
        if cliente_id:
            base_qs = base_qs.filter(cliente_id=cliente_id)

        return base_qs

    def perform_create(self, serializer):
        u = self.request.user

        if user_is_vet(u) or u.is_staff or u.is_superuser:
            cliente_id = self.request.data.get("cliente_id")
            if not cliente_id:
                raise drf_serializers.ValidationError(
                    {"cliente_id": "Debes enviar cliente_id"}
                )
            cliente = get_object_or_404(Cliente, id=cliente_id)
            serializer.save(cliente=cliente)
            return

        cliente = Cliente.objects.filter(user=u).first()
        if not cliente:
            raise drf_serializers.ValidationError(
                {"detail": "Tu usuario no tiene ficha de cliente."}
            )

        serializer.save(cliente=cliente)


# ---------- HORARIOS DE ATENCIÓN ----------
class HorarioAtencionViewSet(viewsets.ModelViewSet):
    queryset = HorarioAtencion.objects.all()
    serializer_class = HorarioAtencionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        u = self.request.user

        # 1 Veterinario logeado → solo sus horarios
        if user_is_vet(u) and not u.is_superuser:
            return qs.filter(veterinario=u).order_by("dia_semana", "inicio")

        # 2 Admin / staff → pueden ver todo
        if u.is_superuser or u.is_staff:
            return qs.order_by("veterinario_id", "dia_semana", "inicio")

        # 3 Otros → nada
        return qs.none()

    def perform_create(self, serializer):
        u = self.request.user

        if user_is_vet(u):
            serializer.save(veterinario=u)
            return

        raise PermissionDenied("No tienes permiso para crear horarios.")

    def perform_update(self, serializer):
        u = self.request.user
        instance = self.get_object()

        if not (u.is_staff or u.is_superuser) and instance.veterinario != u:
            raise PermissionDenied("No puedes modificar horarios ajenos.")

        if user_is_vet(u) and not (u.is_staff or u.is_superuser):
            serializer.save(veterinario=u)
        else:
            serializer.save()

    def perform_destroy(self, instance):
        u = self.request.user
        if not (u.is_staff or u.is_superuser) and instance.veterinario != u:
            raise PermissionDenied("No puedes eliminar horarios ajenos.")
        instance.delete()


# ---------- BLOQUEOS ----------
class BloqueoAgendaViewSet(viewsets.ModelViewSet):

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
            raise PermissionDenied("No puedes crear bloqueos.")

    def perform_update(self, serializer):
        u = self.request.user
        instance = self.get_object()

        if not (u.is_staff or u.is_superuser) and instance.veterinario != u:
            raise PermissionDenied("No puedes modificar bloqueos ajenos.")

        if user_is_vet(u) and not (u.is_staff or u.is_superuser):
            serializer.save(veterinario=u)
        else:
            serializer.save()

    def perform_destroy(self, instance):
        u = self.request.user
        if not (u.is_staff or u.is_superuser) and instance.veterinario != u:
            raise PermissionDenied("No puedes borrar bloqueos ajenos.")
        instance.delete()


# ---------- CITAS ----------
class CitaViewSet(viewsets.ModelViewSet):
    queryset = Cita.objects.all().select_related("cliente", "mascota", "veterinario")
    serializer_class = CitaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()

        if not user.is_authenticated:
            return qs.none()

        # 1 Primero: si es veterinario (aunque tenga is_staff)
        if user_is_vet(user) and not user.is_superuser:
            base_qs = qs.filter(veterinario=user)

        # 2 Luego: admin / staff de la clínica
        elif user.is_superuser or user.is_staff:
            base_qs = qs

        # 3 Cliente: solo sus propias citas
        elif user_is_client(user):
            base_qs = qs.filter(cliente__user=user)
        else:
            base_qs = qs.none()

        # Filtro por fecha opcional ?fecha=YYYY-MM-DD
        fecha_str = self.request.query_params.get("fecha")
        if fecha_str:
            try:
                fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
                base_qs = base_qs.filter(inicio__date=fecha)
            except ValueError:
                pass

        return base_qs.order_by("inicio")

    # ---------- 🔥 PERFORM_CREATE ARREGLADO + ENVÍO DE CORREO ----------
    def perform_create(self, serializer):
        data = self.request.data

        cliente_id = data.get("cliente_id")
        mascota_id = data.get("mascota_id")
        veterinario_id = data.get("veterinario_id")
        motivo = data.get("motivo")
        inicio = data.get("inicio")
        fin = data.get("fin")
        box = data.get("box", None)

        if not cliente_id:
            raise drf_serializers.ValidationError(
                {"cliente_id": "El cliente es obligatorio."}
            )

        if not mascota_id:
            raise drf_serializers.ValidationError(
                {"mascota_id": "La mascota es obligatoria."}
            )

        if not veterinario_id:
            raise drf_serializers.ValidationError(
                {"veterinario_id": "El veterinario es obligatorio."}
            )

        cliente = get_object_or_404(Cliente, pk=cliente_id)
        mascota = get_object_or_404(Mascota, pk=mascota_id)
        veterinario = get_object_or_404(User, pk=veterinario_id)

        # Validación: un cliente solo puede agendar con sus mascotas
        if user_is_client(self.request.user):
            if mascota.cliente_id != cliente.id:
                raise PermissionDenied(
                    "No puedes agendar con una mascota que no es tuya."
                )

        cita = serializer.save(
            cliente=cliente,
            mascota=mascota,
            veterinario=veterinario,
            motivo=motivo,
            inicio=inicio,
            fin=fin,
            box=box,
            estado="pendiente",
        )

        # 📧 Enviar correo de creación de cita
        enviar_notificacion_cita(cita, "creada")

        return cita

    # ---------- ACCIONES ----------
    @action(detail=True, methods=["patch"])
    def confirmar(self, request, pk=None):
        cita = self.get_object()
        u = request.user

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

        # 📧 Enviar correo
        enviar_notificacion_cita(cita, "confirmada")

        return Response(self.get_serializer(cita).data)

    @action(detail=True, methods=["patch"])
    def cancelar(self, request, pk=None):
        cita = self.get_object()
        u = request.user

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

        # 📧 Enviar correo
        enviar_notificacion_cita(cita, "cancelada")

        return Response(self.get_serializer(cita).data)

    @action(detail=True, methods=["patch"])
    def no_asistio(self, request, pk=None):
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
        cita = self.get_object()
        u = request.user

        if not (user_is_vet(u) or u.is_staff or u.is_superuser):
            if not cita.cliente or cita.cliente.user_id != u.id:
                return Response({"detail": "No autorizado."}, status=403)

        inicio_str = request.data.get("inicio")
        duracion = request.data.get("duracion")
        nuevo_box = request.data.get("box") or cita.box

        if not inicio_str:
            return Response(
                {"detail": "Debes enviar 'inicio' en formato ISO."},
                status=400,
            )

        try:
            nuevo_inicio = datetime.fromisoformat(inicio_str)
        except ValueError:
            return Response(
                {"detail": "Formato de 'inicio' inválido."},
                status=400,
            )

        if timezone.is_naive(nuevo_inicio):
            nuevo_inicio = timezone.make_aware(
                nuevo_inicio, timezone.get_current_timezone()
            )
        else:
            nuevo_inicio = nuevo_inicio.astimezone(
                timezone.get_current_timezone()
            )

        if duracion is None:
            duracion_min = int(
                (cita.fin - cita.inicio).total_seconds() // 60
            )
        else:
            try:
                duracion_min = int(duracion)
            except (TypeError, ValueError):
                return Response(
                    {
                        "detail": "La duración debe ser un número entero en minutos."
                    },
                    status=400,
                )

        nuevo_fin = nuevo_inicio + timedelta(minutes=duracion_min)

        vet_id = cita.veterinario_id
        tz = timezone.get_current_timezone()

        citas_conflicto = Cita.objects.filter(
            veterinario_id=vet_id,
            inicio__date=nuevo_inicio.date(),
            estado__in=["pendiente", "confirmada"],
        ).exclude(id=cita.id)

        bloqueos_conflicto = BloqueoAgenda.objects.filter(
            veterinario_id=vet_id,
            inicio__date=nuevo_inicio.date(),
        )

        # Chequeo de conflictos
        def hay_conflicto():
            from django.utils import timezone as tz_mod

            for c in citas_conflicto:
                ci = tz_mod.localtime(c.inicio, tz)
                cf = tz_mod.localtime(c.fin, tz)
                if nuevo_box and c.box and c.box != nuevo_box:
                    continue
                if _overlap(nuevo_inicio, nuevo_fin, ci, cf):
                    return True

            for b in bloqueos_conflicto:
                bi = tz_mod.localtime(b.inicio, tz)
                bf = tz_mod.localtime(b.fin, tz)
                if nuevo_box and b.box and b.box != nuevo_box:
                    continue
                if _overlap(nuevo_inicio, nuevo_fin, bi, bf):
                    return True

            return False

        if hay_conflicto():
            return Response(
                {"detail": "El horario seleccionado no está disponible."},
                status=400,
            )

        cita.inicio = nuevo_inicio
        cita.fin = nuevo_fin
        cita.box = nuevo_box

        if cita.estado == "confirmada":
            cita.estado = "pendiente"

        cita.save(update_fields=["inicio", "fin", "box", "estado"])

        # 📧 Enviar correo
        enviar_notificacion_cita(cita, "reprogramada")

        return Response(self.get_serializer(cita).data)

    @action(detail=True, methods=["patch"])
    def atender(self, request, pk=None):
        cita = self.get_object()
        u = request.user

        if not (user_is_vet(u) or u.is_staff or u.is_superuser):
            return Response({"detail": "No autorizado."}, status=403)

        if cita.estado in ["cancelada", "no_asistida"]:
            return Response(
                {"detail": "No se puede marcar como atendida."},
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
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        print(">>> Datos recibidos:", request.data)

        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        password2 = request.data.get("password2") or ""

        first_name = (request.data.get("first_name") or "").strip()
        last_name = (request.data.get("last_name") or "").strip()

        telefono = (request.data.get("telefono") or "").strip()
        direccion = (request.data.get("direccion") or "").strip()
        rut_dni = (request.data.get("rut_dni") or "").strip()
        acepta_comunicaciones = bool(request.data.get("acepta_comunicaciones", True))

        errors = {}

        if not first_name:
            errors["first_name"] = "Obligatorio."
        if not last_name:
            errors["last_name"] = "Obligatorio."
        if not email:
            errors["email"] = "Obligatorio."
        if not password:
            errors["password"] = "Obligatorio."
        elif len(password) < 8:
            errors["password"] = "Mínimo 8 caracteres."
        if not password2:
            errors["password2"] = "Repite tu contraseña."
        elif password2 != password:
            errors["password2"] = "Las contraseñas no coinciden."

        if email and User.objects.filter(email=email).exists():
            errors["email"] = "Ya existe una cuenta con ese correo."

        if errors:
            return Response(errors, status=400)

        username = email  # 👈 así evitamos usernames duplicados

        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
            )
        except Exception as e:
            print(">>> Error al crear usuario:", e)
            return Response({"detail": "Error al crear usuario."}, status=400)

        Cliente.objects.update_or_create(
            user=user,
            defaults={
                "telefono": telefono,
                "direccion": direccion,
                "rut_dni": rut_dni,
                "acepta_comunicaciones": acepta_comunicaciones,
            },
        )

        # (correo de bienvenida opcional...)

        return Response(
            {"detail": "Usuario creado correctamente."},
            status=201,
        )

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
    qs = User.objects.filter(
        groups__name__iexact="veterinarios",
        is_superuser=False,
    ).distinct()
    serializer = VeterinarioSerializer(qs, many=True)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def disponibilidad(request):

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

    b_qs = BloqueoAgenda.objects.filter(
        veterinario_id=vet_id, inicio__date=date_obj
    )
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

            for ci, cf, cbox in citas_dia:
                if box and cbox and cbox != box:
                    continue
                if _overlap(t, t_end, ci, cf):
                    conflict = True
                    break

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


# ---------- REGISTRO CLÍNICO ----------
class RegistroClinicoViewSet(viewsets.ModelViewSet):
    queryset = (
        RegistroClinico.objects.select_related("mascota", "veterinario", "cita")
        .order_by("-fecha", "-id")
    )
    serializer_class = RegistroClinicoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = self.queryset

        mascota_id = self.request.query_params.get("mascota")
        cita_id = self.request.query_params.get("cita")
        if mascota_id:
            qs = qs.filter(mascota_id=mascota_id)
        if cita_id:
            qs = qs.filter(cita_id=cita_id)

        if user.is_staff or user_is_vet(user) or user.is_superuser:
            return qs

        if hasattr(user, "cliente"):
            return qs.filter(mascota__cliente=user.cliente)

        return qs.none()

# ---------- MOTIVOS DE CONSULTA ----------
MOTIVOS_CONSULTA_OPCIONES = [
    {"codigo": "control_general", "nombre": "Control general / chequeo sano"},
    {"codigo": "control_anual", "nombre": "Control anual de rutina"},
    {"codigo": "control_postoperatorio", "nombre": "Control postoperatorio"},
    {"codigo": "control_cronico", "nombre": "Control de enfermedad crónica"},
    {"codigo": "vacunacion", "nombre": "Vacunación"},
    {"codigo": "desparasitacion", "nombre": "Desparasitación"},
    {"codigo": "esterilizacion_castracion", "nombre": "Esterilización / castración"},
    {"codigo": "certificado_salud", "nombre": "Certificado de salud / viaje"},
    {"codigo": "problema_digestivo", "nombre": "Problemas digestivos"},
    {"codigo": "problema_respiratorio", "nombre": "Problemas respiratorios"},
    {"codigo": "problema_piel", "nombre": "Problemas de piel"},
    {"codigo": "problema_oidos", "nombre": "Problemas de oídos"},
    {"codigo": "problema_ojos", "nombre": "Problemas de ojos"},
    {"codigo": "problema_locomotor", "nombre": "Problemas locomotores"},
    {"codigo": "problema_urinario", "nombre": "Problemas urinarios"},
    {"codigo": "problema_conducta", "nombre": "Problemas de conducta"},
    {"codigo": "urgencia", "nombre": "Urgencia"},
    {"codigo": "asesoria", "nombre": "Asesoría"},
    {"codigo": "otro", "nombre": "Otro motivo"},
]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def motivos_consulta(request):
    return Response(MOTIVOS_CONSULTA_OPCIONES)
