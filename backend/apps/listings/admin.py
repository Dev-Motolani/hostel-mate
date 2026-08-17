from django.contrib import admin

from .models import Listing, ListingImage, ListingVideo, Reservation


class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 0


class ListingVideoInline(admin.TabularInline):
    model = ListingVideo
    extra = 0


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ("title", "location", "rent_amount", "payment_period", "is_available", "created_at")
    list_filter = ("is_available", "payment_period")
    search_fields = ("title", "location", "owner__email")
    inlines = [ListingImageInline, ListingVideoInline]


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ("id", "listing", "poster", "tenant", "agreed_rent_amount", "referral_amount", "processor_amount", "platform_amount", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("listing__title", "poster__email", "tenant__email")
    readonly_fields = ("referral_percent", "referral_amount", "processor_percent", "processor_amount", "platform_percent", "platform_amount", "poster")
