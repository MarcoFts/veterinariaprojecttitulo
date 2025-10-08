from rest_framework import serializers
from .models import Cliente, Cita
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Cliente, Mascota
from .models import Cita

class CitaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cita
        fields = '__all__'

class MascotaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mascota
        exclude = ('cliente',)

class ClienteSerializer(serializers.ModelSerializer):
    mascotas = MascotaSerializer(many=True, read_only=True)
    class Meta:
        model = Cliente
        fields = '__all__'

class RegisterSerializer(serializers.Serializer):
    # Usuario
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8, style={"input_type": "password"})
    password2 = serializers.CharField(write_only=True, min_length=8, style={"input_type": "password"})

    # Cliente
    telefono = serializers.CharField(max_length=30, allow_blank=True, required=False)
    direccion = serializers.CharField(max_length=255, allow_blank=True, required=False)
    rut_dni = serializers.CharField(max_length=30, allow_blank=True, required=False)
    acepta_comunicaciones = serializers.BooleanField(default=False)

    # Mascota
    nombre_mascota = serializers.CharField(max_length=100)
    especie = serializers.ChoiceField(choices=[("Perro","Perro"),("Gato","Gato"),("Otro","Otro")])
    sexo = serializers.ChoiceField(choices=[("Macho","Macho"),("Hembra","Hembra"),("No informado","No informado")])
    raza = serializers.CharField(max_length=100, allow_blank=True, required=False)
    fecha_nacimiento = serializers.DateField(required=False, allow_null=True)
    peso_kg = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    esterilizado = serializers.BooleanField(required=False, default=False)
    microchip = serializers.CharField(max_length=50, allow_blank=True, required=False)
    notas_salud = serializers.CharField(allow_blank=True, required=False)

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password2": "Las contraseñas no coinciden."})
        if User.objects.filter(username=data["email"]).exists():
            raise serializers.ValidationError({"email": "Ya existe un usuario con este email."})
        return data

    def create(self, v):
        full = v.pop("full_name")
        first, *rest = full.split(" ", 1)
        last = rest[0] if rest else ""
        pwd = v.pop("password"); v.pop("password2")
        email = v["email"]

        user = User.objects.create_user(
            username=email, email=email, first_name=first, last_name=last, password=pwd
        )

        cliente = Cliente.objects.create(
            user=user,
            telefono=v.get("telefono",""),
            direccion=v.get("direccion",""),
            rut_dni=v.get("rut_dni",""),
            acepta_comunicaciones=v.get("acepta_comunicaciones", False),
        )

        Mascota.objects.create(
            cliente=cliente,
            nombre=v["nombre_mascota"],
            especie=v["especie"],
            sexo=v["sexo"],
            raza=v.get("raza",""),
            fecha_nacimiento=v.get("fecha_nacimiento", None),
            peso_kg=v.get("peso_kg", None),
            esterilizado=v.get("esterilizado", False),
            microchip=v.get("microchip",""),
            notas_salud=v.get("notas_salud",""),
        )
        return user