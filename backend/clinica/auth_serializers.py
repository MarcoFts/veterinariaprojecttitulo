from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers

User = get_user_model()

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    # acepta email en vez de username
    username_field = User.EMAIL_FIELD  # "email"

    def validate(self, attrs):
        # mapear email -> username internamente
        email = attrs.get("email")
        if email and "username" not in attrs:
            attrs["username"] = email
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
