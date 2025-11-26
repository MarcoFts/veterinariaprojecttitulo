from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from rest_framework import serializers

User = get_user_model()

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    # aceptamos email, pero no obligamos username
    email = serializers.EmailField(write_only=True, required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["username"].required = False  # que no bloquee antes del validate

    def validate(self, attrs):
        email = (attrs.get("email") or "").strip().lower()
        username = (attrs.get("username") or "").strip()
        password = attrs.get("password")

        if not password:
            raise serializers.ValidationError("Debes enviar password.")

        # Si viene email, convertimos a username REAL del usuario
        if email:
            user = User.objects.filter(email__iexact=email).first()
            if not user:
                raise serializers.ValidationError("Credenciales inválidas.")
            attrs["username"] = user.username

        # Si NO viene email, exige username normal
        elif not username:
            raise serializers.ValidationError("Debes enviar email o username.")

        return super().validate(attrs)
    
class SimpleRegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)

    def create(self, validated_data):
        email = validated_data["email"].lower()
        username = email  # usamos email como username
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Ya existe un usuario con este email."})
        user = User.objects.create_user(username=username, email=email,
                                        password=validated_data["password"])
        return user
