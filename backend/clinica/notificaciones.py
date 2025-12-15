# backend/clinica/notificaciones.py
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import Notificacion, Cliente

User = get_user_model()

def _safe_url(url: str) -> str:
    return (url or "").strip()

def crear_notificacion(
    usuario: User,
    titulo: str,
    mensaje: str = "",
    url: str = "",
    tipo: str = "info",
):
    """
    Crea una notificación para un usuario.
    Uso desde views/serializers sin duplicar lógica.
    """
    if not usuario or not getattr(usuario, "is_authenticated", True):
        return None

    titulo = (titulo or "").strip()[:180]
    if not titulo:
        return None

    n = Notificacion.objects.create(
        usuario=usuario,
        titulo=titulo,
        mensaje=(mensaje or "").strip(),
        tipo=tipo or "info",
        url=_safe_url(url),
        leida=False,
        creada_en=timezone.now(),
    )
    return n

def notificar_cliente_de_cita(cita, evento: str):
    """
    evento: creada/confirmada/cancelada/reprogramada/atendida/no_asistio
    """
    cliente = getattr(cita, "cliente", None)
    if not cliente:
        return
    user = getattr(cliente, "user", None)
    if not user:
        return

    mascota = getattr(cita, "mascota", None)
    mascota_nombre = getattr(mascota, "nombre", "tu mascota")

    # URLs sugeridas (ajústalas a tus rutas reales)
    url_cliente = "/cliente/citas"  # o /cliente/citas (según tu app)

    if evento == "creada":
        return crear_notificacion(
            user,
            "Cita creada",
            f"Se creó una cita para {mascota_nombre}.",
            url=url_cliente,
            tipo="info",
        )
    if evento == "confirmada":
        return crear_notificacion(
            user,
            "Cita confirmada",
            f"Tu cita para {mascota_nombre} fue confirmada.",
            url=url_cliente,
            tipo="success",
        )
    if evento == "cancelada":
        return crear_notificacion(
            user,
            "Cita cancelada",
            f"Tu cita para {mascota_nombre} fue cancelada.",
            url=url_cliente,
            tipo="danger",
        )
    if evento == "reprogramada":
        return crear_notificacion(
            user,
            "Cita reprogramada",
            f"Tu cita para {mascota_nombre} fue reprogramada.",
            url=url_cliente,
            tipo="warning",
        )
    if evento == "atendida":
        return crear_notificacion(
            user,
            "Cita atendida",
            f"Se marcó como atendida la cita de {mascota_nombre}.",
            url="/cliente/mis-mascotas",
            tipo="success",
        )
    if evento == "no_asistio":
        return crear_notificacion(
            user,
            "Inasistencia registrada",
            f"Se marcó como no asistida la cita de {mascota_nombre}.",
            url=url_cliente,
            tipo="warning",
        )

def notificar_vet_de_cita(cita, evento: str):
    vet = getattr(cita, "veterinario", None)
    if not vet:
        return

    mascota = getattr(cita, "mascota", None)
    mascota_nombre = getattr(mascota, "nombre", "Mascota")

    url_vet = "/veterinario/citas"  # o /veterinario/agenda-dia etc.

    if evento == "creada":
        return crear_notificacion(
            vet,
            "Nueva cita registrada",
            f"Tienes una nueva cita para {mascota_nombre}.",
            url=url_vet,
            tipo="info",
        )
    if evento == "confirmada":
        return crear_notificacion(
            vet,
            "Cita confirmada",
            f"Se confirmó la cita de {mascota_nombre}.",
            url=url_vet,
            tipo="success",
        )
    if evento == "cancelada":
        return crear_notificacion(
            vet,
            "Cita cancelada",
            f"Se canceló la cita de {mascota_nombre}.",
            url=url_vet,
            tipo="danger",
        )
    if evento == "reprogramada":
        return crear_notificacion(
            vet,
            "Cita reprogramada",
            f"Se reprogramó la cita de {mascota_nombre}.",
            url=url_vet,
            tipo="warning",
        )
    if evento == "atendida":
        return crear_notificacion(
            vet,
            "Cita atendida",
            f"Marcaste como atendida la cita de {mascota_nombre}.",
            url=url_vet,
            tipo="success",
        )
    if evento == "no_asistio":
        return crear_notificacion(
            vet,
            "No asistió",
            f"Marcaste no asistida la cita de {mascota_nombre}.",
            url=url_vet,
            tipo="warning",
        )

def notificar_cliente_registro_clinico(registro):
    mascota = getattr(registro, "mascota", None)
    if not mascota:
        return
    cliente = getattr(mascota, "cliente", None)
    if not cliente:
        return
    user = getattr(cliente, "user", None)
    if not user:
        return

    mascota_nombre = getattr(mascota, "nombre", "tu mascota")

    return crear_notificacion(
        user,
        "Nuevo registro clínico",
        f"Se agregó un registro clínico para {mascota_nombre}.",
        url=f"/veterinario/paciente/{mascota.id}",  # si el cliente no tiene esa ruta, cámbiala por su ficha
        tipo="info",
    )
