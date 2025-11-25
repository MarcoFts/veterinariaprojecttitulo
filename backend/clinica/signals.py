# clinica/signals.py
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db.models.signals import post_migrate, post_save
from django.dispatch import receiver
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import Cliente

User = get_user_model()

@receiver(post_save, sender=User)
def crear_cliente_automaticamente(sender, instance, created, **kwargs):
    if created:
        Cliente.objects.get_or_create(user=instance)

@receiver(post_migrate)
def ensure_default_groups(sender, **kwargs):
    # Se ejecuta después de migrate; crea los grupos si no existen
    Group.objects.get_or_create(name="clientes")
    Group.objects.get_or_create(name="veterinarios")

@receiver(post_save, sender=User)
def add_user_to_clientes(sender, instance: User, created, **kwargs):
    if not created:
        return
    # Todo usuario nuevo entra a "clientes" salvo que ya sea vet/staff
    clientes, _ = Group.objects.get_or_create(name="clientes")
    veterinarios, _ = Group.objects.get_or_create(name="veterinarios")
    if instance.is_staff or instance.groups.filter(id=veterinarios.id).exists():
        return
    instance.groups.add(clientes)
