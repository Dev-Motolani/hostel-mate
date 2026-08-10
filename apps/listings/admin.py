from django.contrib import admin

from .models import Listing, ListingImage


class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 0


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ("title", "location", "rent_amount", "payment_period", "is_available", "created_at")
    list_filter = ("is_available", "payment_period", "is_contact_free")
    search_fields = ("title", "location", "owner__email")
    inlines = [ListingImageInline]
