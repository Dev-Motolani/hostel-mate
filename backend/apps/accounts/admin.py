from django.contrib import admin

from .models import IdentityVerification


@admin.register(IdentityVerification)
class IdentityVerificationAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "school", "department", "status", "rejection_reason", "submitted_at")
    list_filter = ("role", "status")
    search_fields = ("user__email", "user__first_name", "user__last_name")
    fields = (
        "user", "role", "phone_number", "school", "department", "level", "id_card", "live_selfie",
        "ownership_proof", "status", "rejection_reason", "review_note",
    )
