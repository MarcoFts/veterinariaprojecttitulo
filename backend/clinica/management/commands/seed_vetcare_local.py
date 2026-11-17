from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand

from clinica.mfa_models import MFASettings, UsuarioMFA
from clinica.models import Cliente, Veterinario

User = get_user_model()


class Command(BaseCommand):
    help = "Crea usuarios sintéticos locales para probar MFA en VetCare."

    def handle(self, *args, **options):
        MFASettings.get_global()
        admin_group, _ = Group.objects.get_or_create(name="administradores")
        vet_group, _ = Group.objects.get_or_create(name="veterinarios")

        # 1. Superadmin
        admin_u, created = User.objects.get_or_create(
            username="admin_local",
            defaults={
                "email": "admin@clinica.local",
                "first_name": "Admin",
                "last_name": "VetCare",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            admin_u.set_password("AdminLocal2026!")
            admin_u.save()
        admin_u.groups.add(admin_group)
        UsuarioMFA.objects.get_or_create(user=admin_u, defaults={"requires_2fa": True})

        # 2. Veterinario
        vet_u, created = User.objects.get_or_create(
            username="vet_local",
            defaults={
                "email": "vet@clinica.local",
                "first_name": "Dra. Sofía",
                "last_name": "Méndez",
            },
        )
        if created:
            vet_u.set_password("VetLocal2026!")
            vet_u.save()
        vet_u.groups.add(vet_group)
        Veterinario.objects.get_or_create(user=vet_u, defaults={"especialidad": "Medicina General"})
        UsuarioMFA.objects.get_or_create(user=vet_u, defaults={"requires_2fa": True})

        # 3. Cliente
        cli_u, created = User.objects.get_or_create(
            username="cliente_local",
            defaults={
                "email": "cliente@clinica.local",
                "first_name": "Carlos",
                "last_name": "Rojas",
            },
        )
        if created:
            cli_u.set_password("ClienteLocal2026!")
            cli_u.save()
        Cliente.objects.get_or_create(
            user=cli_u,
            defaults={"nombre": "Carlos Rojas", "telefono": "9 1234 5678", "rut": "12345678-9"},
        )
        UsuarioMFA.objects.get_or_create(user=cli_u, defaults={"requires_2fa": True})

        self.stdout.write(
            self.style.SUCCESS(
                "Usuarios locales VetCare listos: admin@clinica.local, vet@clinica.local, cliente@clinica.local"
            )
        )
