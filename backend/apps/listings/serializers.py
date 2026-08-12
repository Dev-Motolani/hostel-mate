from rest_framework import serializers
from datetime import timedelta
from django.utils import timezone

from .models import Listing, ListingImage, ListingVideo, Reservation


class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ("id", "image", "alt_text", "position")
        read_only_fields = ("id",)


class ListingVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingVideo
        fields = ("id", "video", "position")
        read_only_fields = ("id",)


class ListingSerializer(serializers.ModelSerializer):
    images = ListingImageSerializer(many=True, read_only=True)
    videos = ListingVideoSerializer(many=True, read_only=True)
    owner_name = serializers.CharField(source="owner.get_full_name", read_only=True)
    owner_department = serializers.SerializerMethodField()
    owner_level = serializers.SerializerMethodField()
    owner_school = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    can_edit_facilities = serializers.SerializerMethodField()
    can_manage_listing = serializers.SerializerMethodField()
    finder_phone = serializers.SerializerMethodField()
    contact_phone = serializers.SerializerMethodField()
    rent_duration_label = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = (
            "id", "owner", "owner_name", "owner_school", "owner_department", "owner_level", "title", "description", "location", "rent_amount",
            "payment_period", "lease_months", "rent_duration_label", "finder_phone", "contact_phone", "is_contact_free", "finder_fee", "facilities", "is_available",
            "images", "videos", "likes_count", "is_liked", "can_edit_facilities", "can_manage_listing", "created_at", "updated_at",
        )
        read_only_fields = ("id", "owner", "owner_name", "created_at", "updated_at")

    def get_contact_phone(self, listing):
        user = self.context["request"].user
        if listing.is_contact_free or user == listing.owner:
            return listing.contact_phone
        return None

    def get_owner_department(self, listing):
        verification = getattr(listing.owner, "identity_verification", None)
        return verification.department if verification else ""

    def get_owner_school(self, listing):
        verification = getattr(listing.owner, "identity_verification", None)
        return verification.school if verification else ""

    def get_owner_level(self, listing):
        verification = getattr(listing.owner, "identity_verification", None)
        return verification.level if verification else ""

    def get_finder_phone(self, listing):
        user = self.context["request"].user
        if listing.is_contact_free or user == listing.owner:
            return listing.finder_phone
        return None

    def get_rent_duration_label(self, listing):
        if listing.lease_months == 12:
            return "Per year"
        if listing.lease_months == 18:
            return "Per 1½ years"
        return f"Per {listing.lease_months} months"

    def get_likes_count(self, listing):
        return listing.likes.count()

    def get_is_liked(self, listing):
        user = self.context["request"].user
        return user.is_authenticated and listing.likes.filter(user=user).exists()

    def get_can_edit_facilities(self, listing):
        user = self.context["request"].user
        return user.is_authenticated and user == listing.owner and timezone.now() <= listing.created_at + timedelta(hours=1)

    def get_can_manage_listing(self, listing):
        user = self.context["request"].user
        return user.is_authenticated and user == listing.owner

    def validate_lease_months(self, value):
        if not 1 <= value <= 18:
            raise serializers.ValidationError("Choose a rental period between 1 and 18 months.")
        return value

    def validate(self, attrs):
        if attrs.get("is_contact_free") is True:
            attrs["finder_fee"] = 0
        return attrs


class ReservationSerializer(serializers.ModelSerializer):
    listing_title = serializers.CharField(source="listing.title", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Reservation
        fields = ("id", "listing", "listing_title", "agreed_rent_amount", "lease_months", "move_in_date", "inspection_confirmed", "status", "status_label", "payment_reference", "gateway", "dispute_reason", "created_at", "updated_at")
        read_only_fields = ("id", "listing", "listing_title", "status", "status_label", "payment_reference", "gateway", "dispute_reason", "created_at", "updated_at")

    def validate_inspection_confirmed(self, value):
        if not value:
            raise serializers.ValidationError("Confirm that you inspected the room before creating a reservation.")
        return value
