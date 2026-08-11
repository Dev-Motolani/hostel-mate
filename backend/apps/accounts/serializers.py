from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import IdentityVerification


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(write_only=True, max_length=150)

    class Meta:
        model = User
        fields = ("id", "full_name", "email", "password")
        read_only_fields = ("id",)

    def validate_email(self, value):
        email = value.lower().strip()
        if User.objects.filter(username=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email

    def create(self, validated_data):
        full_name = validated_data.pop("full_name").strip()
        email = validated_data["email"]
        first_name, *last_name = full_name.split(maxsplit=1)
        return User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"],
            first_name=first_name,
            last_name=last_name[0] if last_name else "",
        )


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=attrs["email"].lower().strip(),
            password=attrs["password"],
        )
        if not user or not user.is_active:
            raise AuthenticationFailed("No active account found with these credentials.")
        refresh = self.get_token(user)
        return {"refresh": str(refresh), "access": str(refresh.access_token)}


class IdentityVerificationSerializer(serializers.ModelSerializer):
    rejection_message = serializers.CharField(source="get_rejection_reason_display", read_only=True)

    class Meta:
        model = IdentityVerification
        fields = (
            "role", "phone_number", "school", "department", "level", "id_card", "live_selfie",
            "ownership_proof", "status", "rejection_reason", "rejection_message", "review_note", "submitted_at", "updated_at",
        )
        read_only_fields = ("status", "rejection_reason", "rejection_message", "review_note", "submitted_at", "updated_at")

    def validate(self, attrs):
        instance = self.instance
        role = attrs.get("role", instance.role if instance else None)
        if role == IdentityVerification.Role.STUDENT:
            required_fields = ("phone_number", "school", "department", "level")
            missing_fields = [field.replace("_", " ") for field in required_fields if not (attrs.get(field) or (instance and getattr(instance, field)))]
            if missing_fields:
                raise serializers.ValidationError(f"Complete these student details before submitting: {', '.join(missing_fields)}.")
            has_id = bool(attrs.get("id_card") or (instance and instance.id_card))
            has_selfie = bool(attrs.get("live_selfie") or (instance and instance.live_selfie))
            if not has_id or not has_selfie:
                raise serializers.ValidationError("A student ID card and a live selfie are required.")
        return attrs
