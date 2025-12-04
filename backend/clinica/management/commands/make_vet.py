# clinica/management/commands/make_vet.py
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

User = get_user_model()

class Command(BaseCommand):
    help = "Asigna rol de veterinario a un usuario por email"

    def add_arguments(self, parser):
        parser.add_argument("email")

    def handle(self, *args, **opts):
        email = opts["email"].strip().lower()
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise CommandError("Usuario no encontrado.")

        vet_group, _ = Group.objects.get_or_create(name="veterinarios")
        user.groups.add(vet_group)
        user.save()
        self.stdout.write(self.style.SUCCESS(f"{email} ahora es veterinario."))
