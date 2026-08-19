from django.conf import settings
from django.db import models


class CreditWallet(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="credit_wallet")
    balance = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} ({self.balance} credits)"


class CreditTransaction(models.Model):
    class Type(models.TextChoices):
        PURCHASE = "purchase", "Credit purchase"
        INSPECTION_DEBIT = "inspection_debit", "Inspection request"
        RESERVATION_DEBIT = "reservation_debit", "Reservation request"
        REFUND = "refund", "Refund"
        ADJUSTMENT = "adjustment", "Manual adjustment"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"
        REVERSED = "reversed", "Reversed"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="credit_transactions")
    credits = models.IntegerField(help_text="Positive for credit-in, negative for debit.")
    naira_amount = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    transaction_type = models.CharField(max_length=30, choices=Type.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_reference = models.CharField(max_length=120, blank=True, null=True, db_index=True)
    description = models.CharField(max_length=255, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class PaymentTransaction(models.Model):
    class Provider(models.TextChoices):
        PAYSTACK = "paystack", "Paystack"

    class Status(models.TextChoices):
        INITIALIZED = "initialized", "Initialized"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payment_transactions")
    provider = models.CharField(max_length=20, choices=Provider.choices, default=Provider.PAYSTACK)
    reference = models.CharField(max_length=120, unique=True)
    amount_kobo = models.PositiveIntegerField()
    currency = models.CharField(max_length=10, default="NGN")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.INITIALIZED)
    raw_payload = models.JSONField(default=dict, blank=True)
    verified_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
