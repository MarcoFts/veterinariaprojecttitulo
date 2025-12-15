from datetime import datetime, timedelta, time

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q, Count, F
from django.shortcuts import get_object_or_404
from .email_utils import enviar_notificacion_cita
from django.core.mail import EmailMultiAlternatives
from django.contrib.auth.models import Group
from django.template.loader import render_to_string
from rest_framework import viewsets, status, mixins, serializers as drf_serializers
from rest_framework import serializers, permissions, generics
from rest_framework.views import APIView
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from .notificaciones import notificar_cliente_de_cita, notificar_vet_de_cita
from .models import (
    Cliente,
    Mascota,
    Cita,
    Producto,
    HorarioAtencion,
    BloqueoAgenda,
    RegistroClinico,
    RegistroClinicoProducto,
    MotivoConsulta,
    Veterinario,
    MovimientoInventario,
    Notificacion,
)
from .serializers import (
    ClienteSerializer,
    MascotaSerializer,
    CitaSerializer,
    ProductoSerializer,
    InventarioSerializer,
    VeterinarioSerializer,
    VeterinarioModelSerializer,
    RegisterSerializer,
    HorarioAtencionSerializer,
    BloqueoAgendaSerializer,
    RegistroClinicoSerializer,
    MotivoConsultaSerializer,
    MovimientoInventarioSerializer,
    AdminUserSerializer,
    NotificacionSerializer,
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
    
def user_is_admin(user):
    if not user or not user.is_authenticated:
        return False
    return user.is_staff or user.is_superuser


def user_is_client(user):
    """
    Retorna True si el usuario tiene ficha Cliente asociada.
    Asume que Cliente tiene OneToOneField(user, related_name='cliente').
    """
    return hasattr(user, "cliente")

def _ensure_group(name: str) -> Group:
    g, _ = Group.objects.get_or_create(name=name)
    return g

def _is_admin(user):
    return user and user.is_authenticated and (user.is_staff or user.is_superuser)

def crear_notificacion(usuario, *, tipo="sistema", titulo="", mensaje="", url="", data=None):
    if not usuario:
        return
    Notificacion.objects.create(
        usuario=usuario,
        tipo=tipo,
        titulo=titulo[:120],
        mensaje=mensaje or "",
        url=url or "",
        data=data or {},
    )

def _notify_cita(cita, evento: str):
    """
    Crea notificaciones internas (BD) para cliente y veterinario.
    evento: "creada" | "confirmada" | "cancelada" | "reprogramada" | "no_asistida" | "atendida"
    """
    try:
        # estos vienen de .notificaciones (ya los importas arriba)
        notificar_cliente_de_cita(cita, evento)
    except Exception:
        pass

    try:
        notificar_vet_de_cita(cita, evento)
    except Exception:
        pass

# ---------- REPORTES DE GESTIÓN ----------

class ReporteAgendaView(APIView):
    """
    Reporte de ocupación de agenda y no-shows en un rango de fechas.

    - Filtra por fecha de inicio/fin (param GET: desde, hasta)
    - Opcional: veterinario_id
    - Si es veterinario logueado, solo ve sus citas.
    - Incluye reportes extra:
        * Motivos de consulta más solicitados (Cita.motivo)
        * Motivos por mes (para tendencia)
        * Top mascotas recurrentes
        * Top clientes recurrentes
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        hoy = timezone.localdate()

        desde_str = request.GET.get("desde")
        hasta_str = request.GET.get("hasta")
        vet_id = request.GET.get("veterinario_id")

        try:
            desde = datetime.strptime(desde_str, "%Y-%m-%d").date() if desde_str else hoy - timedelta(days=30)
        except ValueError:
            return Response({"detail": "Formato de 'desde' inválido. Usa YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            hasta = datetime.strptime(hasta_str, "%Y-%m-%d").date() if hasta_str else hoy
        except ValueError:
            return Response({"detail": "Formato de 'hasta' inválido. Usa YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        if desde > hasta:
            return Response({"detail": "La fecha 'desde' no puede ser mayor que 'hasta'."}, status=status.HTTP_400_BAD_REQUEST)

        # --- construir queryset base ---
        qs = Cita.objects.filter(inicio__date__gte=desde, inicio__date__lte=hasta)

        # si viene veterinario_id por parámetro
        if vet_id:
            qs = qs.filter(veterinario_id=vet_id)

        # si el usuario es veterinario (no admin), restringimos a sus propias citas
        if user_is_vet(user) and not user.is_staff:
            qs = qs.filter(veterinario=user)

        # ---------------- RESUMEN POR ESTADO ----------------
        resumen = {
            "total_citas": qs.count(),
            "pendientes": qs.filter(estado="pendiente").count(),
            "confirmadas": qs.filter(estado="confirmada").count(),
            "atendidas": qs.filter(estado="atendida").count(),
            "no_asistidas": qs.filter(estado="no_asistida").count(),
            "canceladas": qs.filter(estado="cancelada").count(),
        }

        # ---------------- AGRUPADO POR DÍA ----------------
        por_dia_qs = (
            qs.values("inicio__date")
            .annotate(
                total=Count("id"),
                atendidas=Count("id", filter=Q(estado="atendida")),
                no_asistidas=Count("id", filter=Q(estado="no_asistida")),
                canceladas=Count("id", filter=Q(estado="cancelada")),
                pendientes=Count("id", filter=Q(estado="pendiente")),
                confirmadas=Count("id", filter=Q(estado="confirmada")),
            )
            .order_by("inicio__date")
        )

        por_dia = [
            {
                "fecha": item["inicio__date"].isoformat(),
                "total_citas": item["total"],
                "pendientes": item["pendientes"],
                "confirmadas": item["confirmadas"],
                "atendidas": item["atendidas"],
                "no_asistidas": item["no_asistidas"],
                "canceladas": item["canceladas"],
            }
            for item in por_dia_qs
        ]

        # ---------------- AGRUPADO POR VETERINARIO ----------------
        por_vet_qs = (
            qs.values("veterinario_id", "veterinario__first_name", "veterinario__last_name")
            .annotate(
                total=Count("id"),
                pendientes=Count("id", filter=Q(estado="pendiente")),
                confirmadas=Count("id", filter=Q(estado="confirmada")),
                atendidas=Count("id", filter=Q(estado="atendida")),
                no_asistidas=Count("id", filter=Q(estado="no_asistida")),
            )
            .order_by("veterinario__last_name", "veterinario__first_name")
        )

        por_veterinario = [
            {
                "id": item["veterinario_id"],
                "nombre": (f"{item['veterinario__first_name']} {item['veterinario__last_name']}").strip(),
                "total_citas": item["total"],
                "pendientes": item["pendientes"],
                "confirmadas": item["confirmadas"],
                "atendidas": item["atendidas"],
                "no_asistidas": item["no_asistidas"],
            }
            for item in por_vet_qs
            if item["veterinario_id"] is not None
        ]
        # (si quieres incluir canceladas en motivos, elimina el exclude)
        qs_act = qs.exclude(estado="cancelada")

        # ---------------- MOTIVOS TOP (Cita.motivo) ----------------
        motivos_top_qs = (
            qs_act
            .exclude(Q(motivo__isnull=True) | Q(motivo__exact=""))
            .values("motivo")
            .annotate(total=Count("id"))
            .order_by("-total", "motivo")[:10]
        )

        motivos_top = [{"motivo": m["motivo"], "total": m["total"]} for m in motivos_top_qs]

        # opcional: contar "Sin motivo" (cuando viene vacío)
        sin_motivo_count = qs_act.filter(Q(motivo__isnull=True) | Q(motivo__exact="")).count()

        # ---------------- MOTIVOS POR MES (tendencia) ----------------
        # formato: [{mes:'2025-12', motivo:'Vacunación', total: 3}, ...]
        motivos_por_mes_qs = (
            qs_act
            .exclude(Q(motivo__isnull=True) | Q(motivo__exact=""))
            .values("inicio__year", "inicio__month", "motivo")
            .annotate(total=Count("id"))
            .order_by("inicio__year", "inicio__month", "-total")
        )

        motivos_por_mes = [
            {
                "mes": f"{r['inicio__year']}-{int(r['inicio__month']):02d}",
                "motivo": r["motivo"],
                "total": r["total"],
            }
            for r in motivos_por_mes_qs
        ]

        # ---------------- TOP MASCOTAS RECURRENTES ----------------
        # (solo si hay mascota asociada)
        top_mascotas_qs = (
            qs_act
            .exclude(mascota__isnull=True)
            .values("mascota_id", "mascota__nombre", "mascota__especie")
            .annotate(total=Count("id"))
            .order_by("-total", "mascota__nombre")[:10]
        )

        top_mascotas = [
            {
                "id": r["mascota_id"],
                "nombre": r["mascota__nombre"],
                "especie": r["mascota__especie"],
                "total_citas": r["total"],
            }
            for r in top_mascotas_qs
        ]

        # ---------------- TOP CLIENTES RECURRENTES ----------------
        # (solo si hay cliente asociado)
        top_clientes_qs = (
            qs_act
            .exclude(cliente__isnull=True)
            .values("cliente_id", "cliente__user__first_name", "cliente__user__last_name", "cliente__user__email")
            .annotate(total=Count("id"))
            .order_by("-total", "cliente__user__last_name")[:10]
        )

        top_clientes = [
            {
                "id": r["cliente_id"],
                "nombre": (f"{r['cliente__user__first_name']} {r['cliente__user__last_name']}").strip() or r["cliente__user__email"],
                "email": r["cliente__user__email"],
                "total_citas": r["total"],
            }
            for r in top_clientes_qs
        ]
        # ---------------- AGRUPADO POR RAZA (Top 10) ----------------
        por_raza_qs = (
            qs_act
            .exclude(mascota__isnull=True)
            .exclude(Q(mascota__raza__isnull=True) | Q(mascota__raza__exact=""))
            .values("mascota__raza")
            .annotate(total=Count("id"))
            .order_by("-total", "mascota__raza")[:10]
        )

        por_raza = [
            {
                "raza": r["mascota__raza"],
                "total": r["total"],
            }
            for r in por_raza_qs
        ]

        data = {
            "desde": desde.isoformat(),
            "hasta": hasta.isoformat(),
            "resumen": resumen,
            "por_dia": por_dia,
            "por_veterinario": por_veterinario,
            "motivos": {
                "top": motivos_top,
                "sin_motivo": sin_motivo_count,
                "por_mes": motivos_por_mes,
            },
            "top_mascotas": top_mascotas,
            "top_clientes": top_clientes,
            "por_raza": por_raza,
        }

        return Response(data, status=status.HTTP_200_OK)

# ---------- REPORTE DE INVENTARIO ----------

class ReporteInventarioView(APIView):
    """
    Reporte de stock de productos / insumos.

    - Resumen general de stock.
    - Productos con stock bajo (<= stock_minimo).
    - Productos sin stock.
    - Productos próximos a vencer (por defecto dentro de 30 días).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        hoy = timezone.localdate()
        # Permitir configurar ventana de alerta por query param (opcional)
        try:
            dias_alerta = int(request.GET.get("dias_alerta", 30))
        except ValueError:
            dias_alerta = 30

        productos = Producto.objects.all().order_by("nombre")

        # --- Resumen general ---
        total_productos = productos.count()
        con_stock = productos.filter(stock__gt=0).count()
        sin_stock = productos.filter(stock__lte=0).count()

        bajo_stock_qs = productos.filter(
            stock_minimo__gt=0,
            stock__lte=F("stock_minimo"),
        )

        bajo_stock = bajo_stock_qs.count()

        proximos_vencer_qs = productos.filter(
            fecha_vencimiento__isnull=False,
            fecha_vencimiento__lte=hoy + timedelta(days=dias_alerta),
        )

        proximos_vencer = proximos_vencer_qs.count()

        # --- Listas detalladas (recortadas para no explotar el JSON) ---
        criticos = [
            {
                "id": p.id,
                "nombre": p.nombre,
                "categoria": p.categoria,
                "stock": p.stock,
                "stock_minimo": p.stock_minimo,
            }
            for p in bajo_stock_qs[:50]
        ]

        sin_stock_lista = [
            {
                "id": p.id,
                "nombre": p.nombre,
                "categoria": p.categoria,
                "stock": p.stock,
            }
            for p in productos.filter(stock__lte=0)[:50]
        ]

        proximos_vencer_lista = [
            {
                "id": p.id,
                "nombre": p.nombre,
                "categoria": p.categoria,
                "stock": p.stock,
                "fecha_vencimiento": (
                    p.fecha_vencimiento.isoformat() if p.fecha_vencimiento else None
                ),
            }
            for p in proximos_vencer_qs[:50]
        ]

        data = {
            "hoy": hoy.isoformat(),
            "dias_alerta": dias_alerta,
            "resumen": {
                "total_productos": total_productos,
                "con_stock": con_stock,
                "sin_stock": sin_stock,
                "bajo_stock": bajo_stock,
                "proximos_a_vencer": proximos_vencer,
            },
            "criticos": criticos,
            "sin_stock": sin_stock_lista,
            "proximos_a_vencer": proximos_vencer_lista,
        }

        return Response(data, status=status.HTTP_200_OK)

# ---------- CLIENTES ----------
class ClienteViewSet(viewsets.ModelViewSet):
    serializer_class = ClienteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Cliente.objects.all().order_by("-id")
        u = self.request.user

        # Veterinarios, staff y superuser ven SOLO clientes reales
        if user_is_vet(u) or u.is_staff or u.is_superuser:
            return qs.filter(user__cliente__isnull=False)

        # Clientes normales ven solo su propia ficha
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

    def perform_destroy(self, instance):
        """
        ❌ No permitir eliminar mascota con citas activas.
        """
        citas_bloqueantes = instance.citas.filter(
            estado__in=["pendiente", "confirmada", "atendida"]
        )

        if citas_bloqueantes.exists():
            raise drf_serializers.ValidationError(
                {
                    "detail": (
                        "No puedes eliminar esta mascota porque tiene "
                        "citas pendientes, confirmadas o atendidas."
                    )
                }
            )

        instance.delete()



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

        # --- VISIBILIDAD SEGÚN ROL ---
        if user_is_vet(user) and not user.is_superuser:
            base_qs = qs.filter(veterinario=user)              # vet ve sus citas
        elif user.is_superuser or user.is_staff:
            base_qs = qs                                      # staff ve todo
        elif user_is_client(user):
            base_qs = qs.filter(cliente__user=user)           # cliente ve las suyas
        else:
            base_qs = qs.none()

        params = self.request.query_params

        # --- FILTROS OPCIONALES ---
        fecha_str = params.get("fecha")
        if fecha_str:
            try:
                fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
                base_qs = base_qs.filter(inicio__date=fecha)
            except ValueError:
                pass

        desde_str = params.get("desde")
        hasta_str = params.get("hasta")

        if desde_str:
            try:
                d = datetime.strptime(desde_str, "%Y-%m-%d").date()
                base_qs = base_qs.filter(inicio__date__gte=d)
            except ValueError:
                pass

        if hasta_str:
            try:
                h = datetime.strptime(hasta_str, "%Y-%m-%d").date()
                base_qs = base_qs.filter(inicio__date__lte=h)
            except ValueError:
                pass

        cliente_id = params.get("cliente") or params.get("cliente_id")
        mascota_id = params.get("mascota") or params.get("mascota_id")

        if cliente_id:
            base_qs = base_qs.filter(cliente_id=cliente_id)

        if mascota_id:
            base_qs = base_qs.filter(mascota_id=mascota_id)

        estado = params.get("estado")
        if estado:
            base_qs = base_qs.filter(estado=estado)

        return base_qs.order_by("-inicio")

    # ---------- CREAR CITA ----------
    def perform_create(self, serializer):
        data = self.request.data

        cliente_id = data.get("cliente_id")
        mascota_id = data.get("mascota_id")
        veterinario_id = data.get("veterinario_id")

        if not cliente_id:
            raise drf_serializers.ValidationError({"cliente_id": "El cliente es obligatorio."})
        if not mascota_id:
            raise drf_serializers.ValidationError({"mascota_id": "La mascota es obligatoria."})
        if not veterinario_id:
            raise drf_serializers.ValidationError({"veterinario_id": "El veterinario es obligatorio."})

        cliente = get_object_or_404(Cliente, pk=cliente_id)
        mascota = get_object_or_404(Mascota, pk=mascota_id)
        veterinario = get_object_or_404(User, pk=veterinario_id)

        # Validación: un cliente solo puede agendar con sus mascotas
        if user_is_client(self.request.user) and mascota.cliente_id != cliente.id:
            raise PermissionDenied("No puedes agendar con una mascota que no es tuya.")

        cita = serializer.save(
            cliente=cliente,
            mascota=mascota,
            veterinario=veterinario,
            estado="pendiente",
        )

        # 📧 correo
        enviar_notificacion_cita(cita, "creada")

        # 🔔 notificaciones internas (BD)
        _notify_cita(cita, "creada")

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
            return Response({"detail": "No se puede confirmar una cita cancelada."}, status=400)

        cita.estado = "confirmada"
        cita.save(update_fields=["estado"])

        enviar_notificacion_cita(cita, "confirmada")
        _notify_cita(cita, "confirmada")

        return Response(self.get_serializer(cita).data)

    @action(detail=True, methods=["patch"])
    def cancelar(self, request, pk=None):
        cita = self.get_object()
        u = request.user

        if not (user_is_vet(u) or u.is_staff or u.is_superuser):
            if not cita.cliente or cita.cliente.user_id != u.id:
                return Response({"detail": "No autorizado."}, status=403)

        if cita.estado == "cancelada":
            return Response({"detail": "La cita ya está cancelada."}, status=400)

        cita.estado = "cancelada"
        cita.save(update_fields=["estado"])

        enviar_notificacion_cita(cita, "cancelada")
        _notify_cita(cita, "cancelada")

        return Response(self.get_serializer(cita).data)

    @action(detail=True, methods=["patch"])
    def no_asistio(self, request, pk=None):
        cita = self.get_object()
        u = request.user

        if not (user_is_vet(u) or u.is_staff or u.is_superuser):
            return Response({"detail": "No autorizado."}, status=403)

        if cita.estado == "cancelada":
            return Response({"detail": "No corresponde marcar no asistida una cita cancelada."}, status=400)

        cita.estado = "no_asistida"
        cita.save(update_fields=["estado"])

        # (correo opcional)
        _notify_cita(cita, "no_asistio")  # OJO: en notificaciones.py usas "no_asistio"

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
            return Response({"detail": "Debes enviar 'inicio' en formato ISO."}, status=400)

        try:
            nuevo_inicio = datetime.fromisoformat(inicio_str)
        except ValueError:
            return Response({"detail": "Formato de 'inicio' inválido."}, status=400)

        if timezone.is_naive(nuevo_inicio):
            nuevo_inicio = timezone.make_aware(nuevo_inicio, timezone.get_current_timezone())
        else:
            nuevo_inicio = nuevo_inicio.astimezone(timezone.get_current_timezone())

        if duracion is None:
            duracion_min = int((cita.fin - cita.inicio).total_seconds() // 60)
        else:
            try:
                duracion_min = int(duracion)
            except (TypeError, ValueError):
                return Response({"detail": "La duración debe ser un número entero en minutos."}, status=400)

        nuevo_fin = nuevo_inicio + timedelta(minutes=duracion_min)

        partial_data = {"inicio": nuevo_inicio, "fin": nuevo_fin, "box": nuevo_box}
        serializer = self.get_serializer(cita, data=partial_data, partial=True)
        serializer.is_valid(raise_exception=True)
        cita = serializer.save()

        if cita.estado == "confirmada":
            cita.estado = "pendiente"
            cita.save(update_fields=["estado"])

        enviar_notificacion_cita(cita, "reprogramada")
        _notify_cita(cita, "reprogramada")

        return Response(self.get_serializer(cita).data)

    @action(detail=True, methods=["patch"])
    def atender(self, request, pk=None):
        cita = self.get_object()
        u = request.user

        if not (user_is_vet(u) or u.is_staff or u.is_superuser):
            return Response({"detail": "No autorizado."}, status=403)

        if cita.estado in ["cancelada", "no_asistida"]:
            return Response({"detail": "No se puede marcar como atendida."}, status=400)

        cita.estado = "atendida"
        cita.save(update_fields=["estado"])

        # (correo opcional)
        _notify_cita(cita, "atendida")

        return Response(self.get_serializer(cita).data)

# ---------- PRODUCTOS ----------
class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all().order_by("nombre")
    serializer_class = ProductoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        - Vet/Admin: pueden ver productos
        - Cliente: no ve nada
        """
        u = self.request.user
        if user_is_vet(u) or user_is_admin(u):
            return Producto.objects.all().order_by("nombre")
        return Producto.objects.none()

    def get_permissions(self):
        """
        - Administrador (is_staff / is_superuser): CRUD completo
        - Veterinario: solo LIST / RETRIEVE
        - Cliente: sin acceso
        """
        u = self.request.user

        # ADMIN → todo permitido
        if user_is_admin(u):
            return [IsAuthenticated()]

        # VET → solo lectura
        if user_is_vet(u):
            if self.action in ["list", "retrieve"]:
                return [IsAuthenticated()]
            raise PermissionDenied(
                "Solo el administrador puede crear, editar o eliminar productos."
            )

        # CLIENTE → nada
        raise PermissionDenied("No autorizado.")
    
    @action(detail=True, methods=["post"])
    def ajustar_stock(self, request, pk=None):
        producto = self.get_object()
        u = request.user

        if not user_is_admin(u):
            raise PermissionDenied("Solo el administrador puede ajustar stock.")

        raw_delta = request.data.get("delta", None)
        if raw_delta is None:
            return Response({"detail": "Debes enviar 'delta' (entero)."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            delta = int(raw_delta)
        except (TypeError, ValueError):
            return Response({"detail": "delta debe ser un número entero."}, status=status.HTTP_400_BAD_REQUEST)

        if delta == 0:
            return Response({"detail": "delta no puede ser 0."}, status=status.HTTP_400_BAD_REQUEST)

        motivo = (request.data.get("motivo") or "").strip()

        # stock previo
        stock_anterior = int(producto.stock or 0)

        # validar no negativo
        if stock_anterior + delta < 0:
            return Response({"detail": "No puedes dejar el stock en negativo."}, status=status.HTTP_400_BAD_REQUEST)

        # crear movimiento (esto ajusta stock por el save() del modelo)
        MovimientoInventario.objects.create(
            producto=producto,
            tipo="ingreso" if delta > 0 else "salida",
            cantidad=abs(delta),
            motivo=motivo or "Ajuste de stock",
        )

        # refrescar producto
        producto.refresh_from_db()

        return Response(
            {
                "id": producto.id,
                "nombre": producto.nombre,
                "stock_anterior": stock_anterior,
                "delta": delta,
                "stock": producto.stock,
                "motivo": motivo,
            },
            status=status.HTTP_200_OK,
        )

class MovimientoInventarioViewSet(viewsets.ModelViewSet):
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [IsAuthenticated]
    queryset = MovimientoInventario.objects.select_related("producto").order_by("-fecha", "-id")

    def get_queryset(self):
        u = self.request.user

        # Admin y Vet pueden ver movimientos
        if user_is_admin(u) or user_is_vet(u):
            qs = self.queryset
        else:
            return MovimientoInventario.objects.none()

        # Filtros opcionales:
        producto_id = self.request.query_params.get("producto") or self.request.query_params.get("producto_id")
        if producto_id:
            qs = qs.filter(producto_id=producto_id)

        tipo = self.request.query_params.get("tipo")
        if tipo in ["ingreso", "salida"]:
            qs = qs.filter(tipo=tipo)

        return qs

    def create(self, request, *args, **kwargs):
        # Solo admin puede crear movimientos (porque cambia stock)
        u = request.user
        if not user_is_admin(u):
            raise PermissionDenied("Solo el administrador puede registrar movimientos de inventario.")
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        # No permitir editar movimientos ya creados (si lo editas, el stock quedaría inconsistente)
        raise PermissionDenied("No se permite editar movimientos. Crea uno nuevo para corregir.")

    def partial_update(self, request, *args, **kwargs):
        raise PermissionDenied("No se permite editar movimientos. Crea uno nuevo para corregir.")

    def destroy(self, request, *args, **kwargs):
        # Tampoco borrar, por auditoría y consistencia de stock
        raise PermissionDenied("No se permite eliminar movimientos (auditoría de inventario).")

# ---------- INVENTARIO ----------
class InventarioViewSet(viewsets.GenericViewSet, mixins.ListModelMixin):
    serializer_class = InventarioSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        user = request.user
        if not (user_is_vet(user) or user_is_admin(user)):
            raise PermissionDenied("No autorizado.")

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

        username = email  

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
    vet = getattr(u, "veterinario", None)

    vet_data = None
    if vet:
        vet_data = VeterinarioModelSerializer(vet).data

    return Response({
        "id": u.id,
        "email": u.email,
        "name": user_display_name(u),
        "first_name": u.first_name,
        "last_name": u.last_name,
        "is_vet": user_is_vet(u),
        "is_staff": u.is_staff,
        "is_admin": user_is_admin(request.user),
        "cliente_id": cliente.id if cliente else None,
        "vet_profile": vet_data,
    })



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
    serializer_class = RegistroClinicoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        - Por defecto trae registros ordenados por fecha.
        - Si viene ?mascota=ID o ?mascota_id=ID, filtra por esa mascota.
        - Si es cliente normal, solo ve registros de SUS mascotas.
        - Veterinarios / staff / superuser ven todo (o filtrado por query param).
        """
        qs = (
            RegistroClinico.objects
            .select_related("mascota", "cita", "veterinario")
            .order_by("-fecha", "-id")
        )

        u = self.request.user
        if not u.is_authenticated:
            return RegistroClinico.objects.none()

        # --- filtro por mascota (para la ficha clínica) ---
        mascota_id = (
            self.request.query_params.get("mascota")
            or self.request.query_params.get("mascota_id")
        )
        if mascota_id:
            qs = qs.filter(mascota_id=mascota_id)

        # --- control de acceso por rol ---
        es_vet = (
            getattr(u, "is_veterinario", False)
            or u.groups.filter(name__iexact="veterinarios").exists()
        )

        # Clientes normales: solo registros de sus propias mascotas
        if hasattr(u, "cliente") and not (es_vet or u.is_staff or u.is_superuser):
            qs = qs.filter(mascota__cliente=u.cliente)

        return qs

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
class MotivoConsultaListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = MotivoConsultaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = MotivoConsulta.objects.filter(activo=True).order_by("nombre")

        # Si aún no hay nada en BD, sembramos con la constante
        if not qs.exists():
            for item in MOTIVOS_CONSULTA_OPCIONES:
                MotivoConsulta.objects.get_or_create(
                    codigo=item["codigo"],
                    defaults={"nombre": item["nombre"], "activo": True},
                )
            qs = MotivoConsulta.objects.filter(activo=True).order_by("nombre")

        return qs

    def perform_create(self, serializer):
        u = self.request.user
        # Solo veterinarios / staff / superuser pueden crear motivos
        if not (user_is_vet(u) or u.is_staff or u.is_superuser):
            raise PermissionDenied(
                "Solo el equipo veterinario puede crear nuevos motivos de consulta."
            )

        serializer.save(creado_por=u)
        
class UpdateVetProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user

        # --- Datos personales ---
        first_name = request.data.get("first_name", "").strip()
        last_name = request.data.get("last_name", "").strip()
        email = request.data.get("email", "").strip()

        # validación básica
        if not first_name or not last_name or not email:
            return Response({"error": "Todos los campos personales son obligatorios."}, status=400)

        # validar email duplicado
        if User.objects.filter(email=email).exclude(id=user.id).exists():
            return Response({"error": "El correo ya está registrado por otro usuario."}, status=400)

        # guardar datos personales
        user.first_name = first_name
        user.last_name = last_name
        user.email = email
        user.username = email
        user.save()

        # --- Datos profesionales ---
        telefono = request.data.get("telefono", "").strip()
        rut_dni = request.data.get("rut_dni", "").strip()
        especialidad = request.data.get("especialidad", "").strip()

        if not telefono or not rut_dni or not especialidad:
            return Response({"error": "Teléfono, RUT y especialidad son obligatorios."}, status=400)

        direccion = request.data.get("direccion", "")
        n_registro = request.data.get("n_registro", "")
        # --- Años de experiencia (evitar None que genera error 500) ---
        raw_exp = (request.data.get("anios_experiencia") or "").strip()

        if raw_exp == "":
            anios_exp = 0
        else:
            try:
                anios_exp = int(raw_exp)
            except ValueError:
                return Response(
                    {"error": "Años de experiencia debe ser un número entero."},
                    status=400
                )

        bio = request.data.get("bio", "")

        # CAMPOS ADICIONALES QUE EL FRONT ENVÍA
        duracion = request.data.get("duracion_consulta_min", 30)
        vacunas = request.data.get("trabaja_con_vacunas", True)
        cirugias = request.data.get("trabaja_con_cirugias", False)

        # asegurar que el perfil exista
        vet, created = Veterinario.objects.get_or_create(user=user)

        vet.telefono = telefono
        vet.rut_dni = rut_dni
        vet.especialidad = especialidad
        vet.direccion = direccion
        vet.n_registro = n_registro
        vet.anios_experiencia = anios_exp
        vet.bio = bio
        vet.duracion_consulta_min = duracion
        vet.trabaja_con_vacunas = vacunas
        vet.trabaja_con_cirugias = cirugias

        vet.save()

        return Response({"detail": "Perfil actualizado correctamente."}, status=200)

# ---------- PERFIL CLIENTE ----------
class ClienteProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        cliente = getattr(u, "cliente", None)

        if not cliente:
            return Response(
                {"detail": "Tu usuario no tiene ficha de cliente."},
                status=400,
            )

        data = {
            "first_name": u.first_name or "",
            "last_name": u.last_name or "",
            "email": u.email or "",
            "telefono": cliente.telefono or "",
            "direccion": cliente.direccion or "",
            "rut_dni": cliente.rut_dni or "",
            "acepta_comunicaciones": cliente.acepta_comunicaciones,
        }
        return Response(data, status=200)

    def put(self, request):
        u = request.user
        cliente = getattr(u, "cliente", None)

        if not cliente:
            return Response(
                {"detail": "Tu usuario no tiene ficha de cliente."},
                status=400,
            )

        first_name = (request.data.get("first_name") or "").strip()
        last_name = (request.data.get("last_name") or "").strip()
        email = (request.data.get("email") or "").strip().lower()

        telefono = (request.data.get("telefono") or "").strip()
        direccion = (request.data.get("direccion") or "").strip()
        rut_dni = (request.data.get("rut_dni") or "").strip()
        acepta_comunicaciones = bool(
            request.data.get("acepta_comunicaciones", cliente.acepta_comunicaciones)
        )

        errors = {}

        if not first_name:
            errors["first_name"] = "El nombre es obligatorio."
        if not last_name:
            errors["last_name"] = "El apellido es obligatorio."
        if not email:
            errors["email"] = "El correo es obligatorio."

        # correo único (excluyendo al propio usuario)
        if email and User.objects.filter(email=email).exclude(id=u.id).exists():
            errors["email"] = "Este correo ya está registrado por otro usuario."

        if errors:
            return Response(errors, status=400)

        # Actualizar usuario
        u.first_name = first_name
        u.last_name = last_name
        u.email = email
        u.username = email  # mantenemos username = email
        u.save()

        # Actualizar ficha cliente
        cliente.telefono = telefono
        cliente.direccion = direccion
        cliente.rut_dni = rut_dni
        cliente.acepta_comunicaciones = acepta_comunicaciones
        cliente.save()

        data = {
            "first_name": u.first_name,
            "last_name": u.last_name,
            "email": u.email,
            "telefono": cliente.telefono,
            "direccion": cliente.direccion,
            "rut_dni": cliente.rut_dni,
            "acepta_comunicaciones": cliente.acepta_comunicaciones,
        }
        return Response(data, status=200)

class MotivoConsultaViewSet(viewsets.ModelViewSet):
    serializer_class = MotivoConsultaSerializer
    permission_classes = [IsAuthenticated]
    queryset = MotivoConsulta.objects.all().order_by("nombre")

    def get_queryset(self):
        """
        - Admin/Staff/Superuser: ve TODOS (activos e inactivos)
        - Vet: ve TODOS (activos e inactivos) -> para poder administrar
        - Cliente: SOLO activos
        - Si quieres filtrar: /api/motivos-consulta/?solo_activos=1
        """
        u = self.request.user
        qs = MotivoConsulta.objects.all().order_by("nombre")

        # Si aún no hay motivos, sembrar
        if not qs.exists():
            for item in MOTIVOS_CONSULTA_OPCIONES:
                MotivoConsulta.objects.get_or_create(
                    codigo=item["codigo"],
                    defaults={"nombre": item["nombre"], "activo": True},
                )
            qs = MotivoConsulta.objects.all().order_by("nombre")

        # Query param opcional
        solo_activos = self.request.query_params.get("solo_activos")
        if solo_activos in ["1", "true", "True"]:
            return qs.filter(activo=True)

        # Cliente normal: solo activos
        if user_is_client(u) and not (user_is_vet(u) or u.is_staff or u.is_superuser):
            return qs.filter(activo=True)

        return qs

    def _check_perm(self, u):
        # Solo vet/staff/superuser puede crear/editar/eliminar
        if not (user_is_vet(u) or u.is_staff or u.is_superuser):
            raise PermissionDenied(
                "Solo el equipo veterinario o administrador puede modificar motivos."
            )

    def perform_create(self, serializer):
        u = self.request.user
        self._check_perm(u)
        serializer.save(creado_por=u)

    def perform_update(self, serializer):
        u = self.request.user
        self._check_perm(u)
        serializer.save()

    def perform_destroy(self, instance):
        u = self.request.user
        self._check_perm(u)
        instance.delete()

class AdminUsersListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            raise PermissionDenied("Solo administrador.")

        q = (request.GET.get("q") or "").strip().lower()

        qs = User.objects.all().order_by("-date_joined")

        if q:
            qs = qs.filter(
                Q(email__icontains=q)
                | Q(username__icontains=q)
                | Q(first_name__icontains=q)
                | Q(last_name__icontains=q)
            )

        data = AdminUserSerializer(qs, many=True).data
        return Response(data, status=status.HTTP_200_OK)


class AdminUserRoleUpdateView(APIView):
    """
    PATCH /api/admin/users/<id>/role/
    body: { "role": "cliente" | "veterinario" | "admin" }
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        if not _is_admin(request.user):
            raise PermissionDenied("Solo administrador.")

        target = get_object_or_404(User, pk=user_id)

        role = (request.data.get("role") or "").strip().lower()
        if role not in ["cliente", "veterinario", "admin"]:
            return Response(
                {"detail": "role inválido. Usa: cliente | veterinario | admin"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # grupos base
        g_clientes = _ensure_group("clientes")
        g_vets = _ensure_group("veterinarios")

        # limpiar roles de grupo (cliente/vet)
        target.groups.remove(g_clientes)
        target.groups.remove(g_vets)

        if role == "cliente":
            # admin off
            target.is_staff = False
            target.is_superuser = False  # opcional: si no quieres tocar superuser, quita esta línea
            target.groups.add(g_clientes)

            # asegurar perfil Cliente
            if not hasattr(target, "cliente"):
                Cliente.objects.create(user=target, telefono="", direccion="", rut_dni="", acepta_comunicaciones=False)

        elif role == "veterinario":
            target.is_staff = False
            target.is_superuser = False  # opcional
            target.groups.add(g_vets)

            # asegurar perfil Veterinario (tu modelo exige campos)
            if not hasattr(target, "veterinario"):
                Veterinario.objects.create(
                    user=target,
                    telefono="9 0000 0000",
                    rut_dni="11111111-1",
                    especialidad="General",
                    direccion="",
                    n_registro="",
                    anios_experiencia=0,
                    bio="",
                    duracion_consulta_min=30,
                    trabaja_con_vacunas=True,
                    trabaja_con_cirugias=False,
                )

        elif role == "admin":
            # admin = staff
            target.is_staff = True
            # NOTA: superuser lo puedes dejar intacto si quieres
            # target.is_superuser = False  # opcional
            # (no necesita grupo)

        target.save()

        return Response(AdminUserSerializer(target).data, status=status.HTTP_200_OK)
    
class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        u = request.user
        if not user_is_admin(u):
            raise PermissionDenied("Solo administrador puede ver el dashboard.")

        hoy = timezone.localdate()
        dias_venc = 30

        # ---------------- KPIs usuarios ----------------
        total_usuarios = User.objects.count()
        total_clientes = Cliente.objects.count()
        total_veterinarios = User.objects.filter(groups__name__iexact="veterinarios").distinct().count()
        total_admins = User.objects.filter(Q(is_staff=True) | Q(is_superuser=True)).distinct().count()

        # ---------------- Inventario ----------------
        productos = Producto.objects.all()

        total_productos = productos.count()
        stock_bajo_qs = productos.filter(stock_minimo__gt=0, stock__lte=F("stock_minimo")).order_by("stock", "nombre")
        sin_stock_qs = productos.filter(stock__lte=0).order_by("nombre")
        por_vencer_qs = productos.filter(
            fecha_vencimiento__isnull=False,
            fecha_vencimiento__lte=hoy + timedelta(days=dias_venc),
        ).order_by("fecha_vencimiento", "nombre")

        # listas cortas (para UI)
        stock_bajo = [
            {
                "id": p.id,
                "nombre": p.nombre,
                "categoria": p.categoria,
                "stock": p.stock,
                "stock_minimo": p.stock_minimo,
            }
            for p in stock_bajo_qs[:8]
        ]
        sin_stock = [
            {
                "id": p.id,
                "nombre": p.nombre,
                "categoria": p.categoria,
                "stock": p.stock,
            }
            for p in sin_stock_qs[:8]
        ]
        por_vencer = [
            {
                "id": p.id,
                "nombre": p.nombre,
                "categoria": p.categoria,
                "stock": p.stock,
                "fecha_vencimiento": p.fecha_vencimiento.isoformat() if p.fecha_vencimiento else None,
            }
            for p in por_vencer_qs[:8]
        ]

        # ---------------- Movimientos recientes ----------------
        movs = (
            MovimientoInventario.objects
            .select_related("producto")
            .order_by("-fecha")[:10]
        )

        movimientos_recientes = [
            {
                "id": m.id,
                "fecha": m.fecha.isoformat() if m.fecha else None,
                "tipo": m.tipo,
                "cantidad": m.cantidad,
                "motivo": m.motivo,
                "producto_id": m.producto_id,
                "producto_nombre": m.producto.nombre if m.producto else None,
                "producto_codigo": m.producto.codigo if m.producto else None,
                "producto_categoria": m.producto.categoria if m.producto else None,
            }
            for m in movs
        ]

        # ---------------- Resumen agenda ----------------
        citas_hoy_qs = Cita.objects.filter(inicio__date=hoy)
        citas_hoy = citas_hoy_qs.count()
        pendientes_hoy = citas_hoy_qs.filter(estado="pendiente").count()
        confirmadas_hoy = citas_hoy_qs.filter(estado="confirmada").count()

        desde_30 = hoy - timedelta(days=30)
        no_asistidas_30 = Cita.objects.filter(
            inicio__date__gte=desde_30,
            inicio__date__lte=hoy,
            estado="no_asistida",
        ).count()

        data = {
            "hoy": hoy.isoformat(),
            "kpis": {
                "usuarios": total_usuarios,
                "clientes": total_clientes,
                "veterinarios": total_veterinarios,
                "admins": total_admins,
            },
            "inventario": {
                "total_productos": total_productos,
                "bajo_stock": stock_bajo_qs.count(),
                "sin_stock": sin_stock_qs.count(),
                "por_vencer": por_vencer_qs.count(),
                "listas": {
                    "stock_bajo": stock_bajo,
                    "sin_stock": sin_stock,
                    "por_vencer": por_vencer,
                },
            },
            "agenda": {
                "citas_hoy": citas_hoy,
                "pendientes_hoy": pendientes_hoy,
                "confirmadas_hoy": confirmadas_hoy,
                "no_asistidas_30d": no_asistidas_30,
            },
            "movimientos_recientes": movimientos_recientes,
        }

        return Response(data, status=status.HTTP_200_OK)

class NotificacionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Solo lectura + acciones para marcar leído.
    - LIST/RETRIEVE: OK
    - resumen: OK
    - leer / marcar_todas_leidas: OK
    """
    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # cada usuario ve solo sus notificaciones
        return (
            Notificacion.objects
            .filter(usuario=self.request.user)
            .order_by("-creada_en", "-id")
        )

    @action(detail=False, methods=["get"])
    def resumen(self, request):
        """
        GET /api/notificaciones/resumen/
        Devuelve:
          - no_leidas
          - ultimas (últimas 12)
        """
        qs = self.get_queryset()
        no_leidas = qs.filter(leida=False).count()
        ultimas = qs[:12]
        data = {
            "no_leidas": no_leidas,
            "ultimas": NotificacionSerializer(ultimas, many=True).data,
        }
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["patch"])
    def leer(self, request, pk=None):
        """
        PATCH /api/notificaciones/{id}/leer/
        """
        n = self.get_object()
        if not n.leida:
            n.leida = True
            n.save(update_fields=["leida"])
        return Response(self.get_serializer(n).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def marcar_todas_leidas(self, request):
        """
        POST /api/notificaciones/marcar_todas_leidas/
        """
        qs = self.get_queryset().filter(leida=False)
        qs.update(leida=True)
        return Response({"detail": "OK"}, status=status.HTTP_200_OK)
