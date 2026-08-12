from django.contrib import admin

from .models import AccountProfile, IdentityVerification


@admin.register(AccountProfile)
class AccountProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "account_type")
    list_filter = ("account_type",)
    search_fields = ("user__email", "user__first_name", "user__last_name")


@admin.register(IdentityVerification)
class IdentityVerificationAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "school", "department", "verification_consent", "status", "rejection_reason", "submitted_at")
    list_filter = ("role", "status")
    search_fields = ("user__email", "user__first_name", "user__last_name")
    fields = (
        "user", "role", "phone_number", "business_name", "property_location", "school", "department", "level", "id_card", "live_selfie",
        "ownership_proof", "verification_consent", "verification_consent_at", "status", "rejection_reason", "review_note",
    )
