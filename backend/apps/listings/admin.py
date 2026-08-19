from django.contrib import admin

from .models import InspectionRequest, Listing, ListingImage, ListingReport, ListingVideo, Reservation


class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 0


class ListingVideoInline(admin.TabularInline):
    model = ListingVideo
    extra = 0


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ("title", "location", "rent_amount", "caution_fee_amount", "verification_status", "verification_date", "payment_period", "is_available", "created_at")
    list_filter = ("is_available", "payment_period", "verification_status")
    search_fields = ("title", "location", "owner__email")
    inlines = [ListingImageInline, ListingVideoInline]


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ("id", "listing", "poster", "tenant", "agreed_rent_amount", "agreed_caution_fee_amount", "referral_amount", "processor_amount", "platform_amount", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("listing__title", "poster__email", "tenant__email")
    readonly_fields = ("referral_percent", "referral_amount", "processor_percent", "processor_amount", "platform_percent", "platform_amount", "poster")


@admin.register(InspectionRequest)
class InspectionRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "listing", "student", "status", "credits_charged", "scheduled_for", "requested_at")
    list_filter = ("status",)
    search_fields = ("listing__title", "student__email")


@admin.register(ListingReport)
class ListingReportAdmin(admin.ModelAdmin):
    list_display = ("id", "listing", "reporter", "reason", "is_resolved", "created_at")
    list_filter = ("reason", "is_resolved")
    search_fields = ("listing__title", "reporter__email")
