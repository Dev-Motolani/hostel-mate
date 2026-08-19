from django.contrib import admin

from .models import CreditTransaction, CreditWallet, PaymentTransaction


@admin.register(CreditWallet)
class CreditWalletAdmin(admin.ModelAdmin):
    list_display = ("user", "balance", "updated_at")
    search_fields = ("user__email", "user__first_name", "user__last_name")


@admin.register(CreditTransaction)
class CreditTransactionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "credits", "naira_amount", "transaction_type", "status", "payment_reference", "created_at")
    list_filter = ("transaction_type", "status")
    search_fields = ("user__email", "payment_reference")


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ("reference", "user", "provider", "amount_kobo", "status", "verified_at", "created_at")
    list_filter = ("provider", "status")
    search_fields = ("reference", "user__email")
