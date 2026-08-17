from rest_framework import serializers

from .models import Listing, ListingImage, ListingVideo, Reservation
from .referral import platform_amount, platform_percent, poster_amount, poster_percent, processor_amount, processor_percent, total_amount, total_percent


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
    can_edit_listing = serializers.SerializerMethodField()
    can_manage_listing = serializers.SerializerMethodField()
    rent_duration_label = serializers.SerializerMethodField()
    referral_fee_percent = serializers.SerializerMethodField()
    referral_fee = serializers.SerializerMethodField()
    platform_fee_percent = serializers.SerializerMethodField()
    platform_fee = serializers.SerializerMethodField()
    processor_fee_percent = serializers.SerializerMethodField()
    processor_fee = serializers.SerializerMethodField()
    total_fee_percent = serializers.SerializerMethodField()
    total_fee = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = (
            "id", "owner", "owner_name", "owner_school", "owner_department", "owner_level", "title", "description", "location", "rent_amount",
            "payment_period", "lease_months", "rent_duration_label", "finder_phone", "contact_phone",
            "referral_fee_percent", "referral_fee", "processor_fee_percent", "processor_fee", "platform_fee_percent", "platform_fee", "total_fee_percent", "total_fee", "facilities", "is_available",
            "images", "videos", "likes_count", "is_liked", "can_edit_facilities", "can_edit_listing", "can_manage_listing", "created_at", "updated_at",
        )
        read_only_fields = ("id", "owner", "owner_name", "created_at", "updated_at")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        user = self.context["request"].user
        if not user.is_authenticated:
            data["finder_phone"] = None
            data["contact_phone"] = None
        return data

    def get_owner_department(self, listing):
        verification = getattr(listing.owner, "identity_verification", None)
        return verification.department if verification else ""

    def get_owner_school(self, listing):
        verification = getattr(listing.owner, "identity_verification", None)
        return verification.school if verification else ""

    def get_owner_level(self, listing):
        verification = getattr(listing.owner, "identity_verification", None)
        return verification.level if verification else ""

    def get_referral_fee_percent(self, listing):
        return poster_percent()

    def get_referral_fee(self, listing):
        return poster_amount(listing.rent_amount)

    def get_platform_fee_percent(self, listing):
        return platform_percent()

    def get_platform_fee(self, listing):
        return platform_amount(listing.rent_amount)

    def get_processor_fee_percent(self, listing):
        return processor_percent()

    def get_processor_fee(self, listing):
        return processor_amount(listing.rent_amount)

    def get_total_fee_percent(self, listing):
        return total_percent()

    def get_total_fee(self, listing):
        return total_amount(listing.rent_amount)

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
        return self.get_can_edit_listing(listing)

    def get_can_edit_listing(self, listing):
        user = self.context["request"].user
        return user.is_authenticated and user == listing.owner and listing.within_edit_window()

    def get_can_manage_listing(self, listing):
        user = self.context["request"].user
        return user.is_authenticated and user == listing.owner

    def validate_lease_months(self, value):
        if not 1 <= value <= 18:
            raise serializers.ValidationError("Choose a rental period between 1 and 18 months.")
        return value


class ReservationSerializer(serializers.ModelSerializer):
    listing_title = serializers.CharField(source="listing.title", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    poster_name = serializers.CharField(source="poster.get_full_name", read_only=True)

    class Meta:
        model = Reservation
        fields = (
            "id", "listing", "listing_title", "poster", "poster_name", "agreed_rent_amount", "lease_months", "move_in_date",
            "inspection_confirmed", "status", "status_label", "payment_reference", "gateway", "dispute_reason",
            "referral_percent", "referral_amount", "processor_percent", "processor_amount", "platform_percent", "platform_amount", "created_at", "updated_at",
        )
        read_only_fields = (
            "id", "listing", "listing_title", "poster", "poster_name", "status", "status_label", "payment_reference",
            "gateway", "dispute_reason", "referral_percent", "referral_amount", "processor_percent", "processor_amount", "platform_percent", "platform_amount", "created_at", "updated_at",
        )

    def validate_inspection_confirmed(self, value):
        if not value:
            raise serializers.ValidationError("Confirm that you inspected the room before creating a reservation.")
        return value
