# backend/clinica/email_utils.py

from datetime import datetime
import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.template import TemplateDoesNotExist
from django.utils import timezone

logger = logging.getLogger(__name__)


def _to_aware_datetime(value):
    """
    Convierte value a datetime aware en la zona horaria actual.
    Acepta:
      - datetime (naive o aware)
      - string ISO (ej: "2025-12-04T09:45:00" o "2025-12-04 09:45:00")
    Devuelve None si no se puede convertir.
    """
    if not value:
        return None

    # Ya es datetime
    if isinstance(value, datetime):
        if timezone.is_naive(value):
            return timezone.make_aware(value, timezone.get_current_timezone())
        return value.astimezone(timezone.get_current_timezone())

    # String -> datetime
    if isinstance(value, str):
        dt = None
        # Intento 1: ISO con "T"
        try:
            dt = datetime.fromisoformat(value)
        except ValueError:
            # Intento 2: formato "YYYY-MM-DD HH:MM[:SS]"
            for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"):
                try:
                    dt = datetime.strptime(value, fmt)
                    break
                except ValueError:
                    continue

        if dt is None:
            logger.warning(f"No se pudo parsear datetime desde: {value!r}")
            return None

        if timezone.is_naive(dt):
            return timezone.make_aware(dt, timezone.get_current_timezone())
        return dt.astimezone(timezone.get_current_timezone())

    logger.warning(f"Valor de fecha/hora no soportado: {value!r} ({type(value)})")
    return None


def enviar_notificacion_cita(cita, evento):
    """
    Envía un correo HTML al cliente según el evento de la cita.
    evento = "creada", "confirmada", "reprogramada", "cancelada"
    NUNCA debe lanzar excepción hacia afuera (protege el flujo de la API).
    """
    try:
        # -------------------------
        # 1) Template según evento
        # -------------------------
        template_map = {
            "creada": "emails/cita_creada.html",
            "confirmada": "emails/cita_confirmada.html",
            "reprogramada": "emails/cita_reprogramada.html",
            "cancelada": "emails/cita_cancelada.html",
        }
        template = template_map.get(evento)
        if not template:
            logger.warning(f"Evento de cita desconocido para email: {evento!r}")
            return

        # -------------------------
        # 2) Datos seguros del cliente
        # -------------------------
        cliente = getattr(cita, "cliente", None)
        user = getattr(cliente, "user", None)

        first_name = getattr(user, "first_name", "") if user else ""
        last_name = getattr(user, "last_name", "") if user else ""
        full_name = f"{first_name} {last_name}".strip() or "cliente"

        email_to = getattr(user, "email", None)
        if not email_to:
            logger.warning("Cita sin email de cliente, no se envía correo.")
            return

        # -------------------------
        # 3) Fechas/horas seguras
        # -------------------------
        inicio_dt = _to_aware_datetime(getattr(cita, "inicio", None))
        fin_dt = _to_aware_datetime(getattr(cita, "fin", None))

        if inicio_dt:
            fecha = inicio_dt.strftime("%d/%m/%Y")
            hora = inicio_dt.strftime("%H:%M")
        else:
            fecha = "—"
            hora = "—"

        if fin_dt:
            hora_fin = fin_dt.strftime("%H:%M")
        else:
            hora_fin = "—"

        # -------------------------
        # 4) Otros datos de la cita
        # -------------------------
        mascota = getattr(getattr(cita, "mascota", None), "nombre", "Mascota")
        vet_first = getattr(getattr(cita, "veterinario", None), "first_name", "")
        vet_last = getattr(getattr(cita, "veterinario", None), "last_name", "")
        veterinario = f"{vet_first} {vet_last}".strip() or "Veterinario"

        motivo = getattr(cita, "motivo", "") or "Sin motivo registrado"
        box = getattr(cita, "box", "") or "No asignado"

        context = {
            "full_name": full_name,
            "mascota": mascota,
            "veterinario": veterinario,
            "fecha": fecha,
            "hora": hora,
            "hora_fin": hora_fin,
            "motivo": motivo,
            "box": box,
        }

        # -------------------------
        # 5) Render del HTML
        # -------------------------
        try:
            html_content = render_to_string(template, context)
        except TemplateDoesNotExist:
            logger.error(f"Template de email no encontrado: {template}")
            return

        # -------------------------
        # 6) Asunto según evento
        # -------------------------
        subject_map = {
            "creada": "Cita agendada exitosamente",
            "confirmada": "Tu cita ha sido confirmada",
            "reprogramada": "Tu cita ha sido reprogramada",
            "cancelada": "Tu cita ha sido cancelada",
        }
        subject = subject_map.get(evento, "Actualización de cita")

        # -------------------------
        # 7) Envío del correo
        # -------------------------
        email = EmailMultiAlternatives(
            subject=subject,
            body="",  # todo va en HTML
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None)
            or getattr(settings, "EMAIL_HOST_USER", None),
            to=[email_to],
        )
        email.attach_alternative(html_content, "text/html")
        email.send(fail_silently=False)

    except Exception as e:
        # Cualquier fallo de correo NO rompe la API, solo se loguea.
        logger.exception(f"Error al enviar notificación de cita (evento={evento!r}): {e}")
        return
