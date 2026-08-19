from django.conf import settings
from django.contrib.auth import authenticate
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.payments.models import CreditWallet
from .models import AccountProfile, IdentityVerification


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(write_only=True, max_length=150)
    account_type = serializers.ChoiceField(choices=AccountProfile.AccountType.choices, write_only=True)

    class Meta:
        model = User
        fields = ("id", "full_name", "email", "password", "account_type")
        read_only_fields = ("id",)

    def validate_email(self, value):
        email = value.lower().strip()
        if User.objects.filter(username=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email

    def create(self, validated_data):
        full_name = validated_data.pop("full_name").strip()
        account_type = validated_data.pop("account_type")
        email = validated_data["email"]
        first_name, *last_name = full_name.split(maxsplit=1)
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"],
            first_name=first_name,
            last_name=last_name[0] if last_name else "",
        )
        AccountProfile.objects.create(user=user, account_type=account_type)
        return user


class CurrentUserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="get_full_name", read_only=True)
    account_type = serializers.SerializerMethodField()
    is_verified_poster = serializers.SerializerMethodField()
    referral_fee_percent = serializers.SerializerMethodField()
    processor_fee_percent = serializers.SerializerMethodField()
    platform_fee_percent = serializers.SerializerMethodField()
    total_fee_percent = serializers.SerializerMethodField()
    is_student_verified = serializers.SerializerMethodField()
    hostelmate_credit_balance = serializers.SerializerMethodField()
    identity_verification_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "account_type", "is_verified_poster", "is_student_verified", "hostelmate_credit_balance", "referral_fee_percent", "processor_fee_percent", "platform_fee_percent", "total_fee_percent", "identity_verification_status")

    def get_account_type(self, user):
        profile, _ = AccountProfile.objects.get_or_create(user=user)
        return profile.account_type

    def get_is_verified_poster(self, user):
        verification = getattr(user, "identity_verification", None)
        return bool(verification and verification.status == IdentityVerification.Status.APPROVED and verification.verification_consent)

    def get_is_student_verified(self, user):
        verification = getattr(user, "identity_verification", None)
        return bool(
            verification
            and verification.role == IdentityVerification.Role.STUDENT
            and verification.status == IdentityVerification.Status.APPROVED
            and verification.verification_consent
        )

    def get_hostelmate_credit_balance(self, user):
        wallet = CreditWallet.objects.filter(user=user).only("balance").first()
        return wallet.balance if wallet else 0

    def get_referral_fee_percent(self, user):
        return settings.POSTER_REFERRAL_PERCENT

    def get_processor_fee_percent(self, user):
        return settings.PAYMENT_PROCESSOR_PERCENT

    def get_platform_fee_percent(self, user):
        return settings.HOSTELMATE_FEE_PERCENT

    def get_total_fee_percent(self, user):
        return settings.REFERRAL_FEE_PERCENT
        
    def get_identity_verification_status(self, user):
        verification = getattr(user, "identity_verification", None)
        return verification.status if verification else "none"


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
            "role", "phone_number", "identity_document_number", "business_name", "property_location", "school", "department", "level", "id_card", "live_selfie",
            "ownership_proof", "verification_consent", "verification_consent_at", "status", "rejection_reason", "rejection_message", "review_note", "submitted_at", "updated_at",
        )
        read_only_fields = ("role", "verification_consent_at", "status", "rejection_reason", "rejection_message", "review_note", "submitted_at", "updated_at")

    def validate(self, attrs):
        instance = self.instance
        role = attrs.get("role", instance.role if instance else None)
        consent_given = attrs.get("verification_consent", instance.verification_consent if instance else False)
        if not consent_given:
            raise serializers.ValidationError("Consent is required for us to review your ID card and live selfie. Without consent, you cannot complete poster verification or post a room.")
        if role == IdentityVerification.Role.STUDENT:
            required_fields = ("phone_number", "identity_document_number", "school", "department", "level")
            missing_fields = [field.replace("_", " ") for field in required_fields if not (attrs.get(field) or (instance and getattr(instance, field)))]
            if missing_fields:
                raise serializers.ValidationError(f"Complete these student details before submitting: {', '.join(missing_fields)}.")
            has_id = bool(attrs.get("id_card") or (instance and instance.id_card))
            has_selfie = bool(attrs.get("live_selfie") or (instance and instance.live_selfie))
            if not has_id or not has_selfie:
                raise serializers.ValidationError("A student ID card and a live selfie are required.")
        if role == IdentityVerification.Role.LANDLORD:
            has_phone = bool(attrs.get("phone_number") or (instance and instance.phone_number))
            has_ownership_proof = bool(attrs.get("ownership_proof") or (instance and instance.ownership_proof))
            has_location = bool(attrs.get("property_location") or (instance and instance.property_location))
            if not has_phone or not has_location or not has_ownership_proof:
                raise serializers.ValidationError("A phone number, primary property location, and proof of ownership are required for landlord verification.")
        phone_number = attrs.get("phone_number", instance.phone_number if instance else "")
        if phone_number:
            normalized_phone = self._normalize_phone_number(phone_number)
            if IdentityVerification.objects.exclude(pk=getattr(instance, "pk", None)).filter(identity_phone_number=normalized_phone).exists():
                raise serializers.ValidationError({"phone_number": "This phone number is already used by another Hostel Mate account."})
            attrs["identity_phone_number"] = normalized_phone
        return attrs

    def validate_phone_number(self, value):
        return self._normalize_phone_number(value)

    @staticmethod
    def _normalize_phone_number(value):
        digits = "".join(character for character in value if character.isdigit())
        if len(digits) < 10 or len(digits) > 15:
            raise serializers.ValidationError("Enter a valid phone number.")
        return f"234{digits[1:]}" if digits.startswith("0") else digits

    def validate_identity_document_number(self, value):
        normalized = "".join(character for character in value.upper().strip() if character.isalnum())
        if len(normalized) < 4:
            raise serializers.ValidationError("Enter the ID-card number exactly as shown on your card.")
        existing = IdentityVerification.objects.exclude(pk=getattr(self.instance, "pk", None)).filter(identity_document_number=normalized).exists()
        if existing:
            raise serializers.ValidationError("This ID card is already linked to another Hostel Mate account.")
        return normalized

    def update(self, instance, validated_data):
        if validated_data.get("verification_consent") and not instance.verification_consent:
            instance.verification_consent_at = timezone.now()
        return super().update(instance, validated_data)

    def validate_id_card(self, image):
        """Reject unusable uploads; document type is deliberately reviewed by a human."""
        from PIL import Image

        try:
            with Image.open(image) as opened_image:
                width, height = opened_image.size
        except Exception as error:
            raise serializers.ValidationError("Upload a valid image file for your student ID card.") from error
        finally:
            image.seek(0)
        if width < 800 or height < 450:
            raise serializers.ValidationError("Your ID-card photo is too small or unclear. Upload or capture a clear image of the entire physical student ID card—not a selfie.")
        return image
