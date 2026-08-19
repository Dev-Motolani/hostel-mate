from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


LISTING_EDIT_WINDOW = timedelta(minutes=3)


class Listing(models.Model):
    class PaymentPeriod(models.TextChoices):
        YEAR = "year", "Per Year"
        SESSION = "session", "Per Session"
        SEMESTER = "semester", "Per Semester"
        MONTH = "month", "Per Month"

    class VerificationStatus(models.TextChoices):
        SUBMITTED = "submitted", "Submitted"
        UNDER_REVIEW = "under_review", "Under review"
        PRELIMINARY_VERIFIED = "preliminary_verified", "Preliminary verification"
        PHYSICAL_VERIFICATION = "physical_verification", "Physical verification"
        VERIFIED = "verified", "HostelMate verified"
        REJECTED = "rejected", "Rejected"
        MORE_INFO_REQUIRED = "more_info_required", "More info required"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="listings")
    title = models.CharField(max_length=180)
    description = models.TextField()
    location = models.CharField(max_length=180)
    rent_amount = models.DecimalField(max_digits=12, decimal_places=2)
    caution_fee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_period = models.CharField(max_length=12, choices=PaymentPeriod.choices, default=PaymentPeriod.YEAR)
    lease_months = models.PositiveSmallIntegerField(default=12, help_text="Length of the rent agreement in months.")
    finder_phone = models.CharField(max_length=30, blank=True, help_text="Phone number for the finder who posted the room.")
    contact_phone = models.CharField(max_length=30)
    is_contact_free = models.BooleanField(default=True)
    finder_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    facilities = models.JSONField(default=list, blank=True, help_text="Available facilities, for example Wi-Fi or running water.")
    is_available = models.BooleanField(default=True)
    verification_status = models.CharField(max_length=30, choices=VerificationStatus.choices, default=VerificationStatus.SUBMITTED)
    verification_notes = models.TextField(blank=True)
    verification_date = models.DateTimeField(blank=True, null=True)
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name="verified_listings")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def within_edit_window(self):
        return timezone.now() <= self.created_at + LISTING_EDIT_WINDOW

    @property
    def is_hostelmate_verified(self):
        return self.verification_status == self.VerificationStatus.VERIFIED


class ListingImage(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="listings/")
    alt_text = models.CharField(max_length=150, blank=True)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]


class ListingVideo(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="videos")
    video = models.FileField(upload_to="listings/videos/")
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["position", "id"]


class ListingLike(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="likes")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="liked_listings")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=("listing", "user"), name="unique_listing_like")]


class Reservation(models.Model):
    """Auditable tenant reservation/payment record. Gateway settlement is added separately."""

    class Status(models.TextChoices):
        PENDING_PAYMENT = "pending_payment", "Awaiting payment"
        PAID = "paid", "Payment confirmed"
        RESERVED = "reserved", "Room reserved"
        DISPUTED = "disputed", "Disputed"
        REFUNDED = "refunded", "Refunded"
        CANCELLED = "cancelled", "Cancelled"

    listing = models.ForeignKey(Listing, on_delete=models.PROTECT, related_name="reservations")
    tenant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="reservations")
    poster = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="referral_reservations")
    agreed_rent_amount = models.DecimalField(max_digits=12, decimal_places=2)
    agreed_caution_fee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    lease_months = models.PositiveSmallIntegerField()
    move_in_date = models.DateField()
    inspection_confirmed = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_PAYMENT)
    payment_reference = models.CharField(max_length=120, blank=True, unique=True, null=True)
    gateway = models.CharField(max_length=30, blank=True)
    dispute_reason = models.TextField(blank=True)
    referral_percent = models.DecimalField(max_digits=5, decimal_places=2)
    referral_amount = models.DecimalField(max_digits=12, decimal_places=2)
    processor_percent = models.DecimalField(max_digits=5, decimal_places=2)
    processor_amount = models.DecimalField(max_digits=12, decimal_places=2)
    platform_percent = models.DecimalField(max_digits=5, decimal_places=2)
    platform_amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Reservation #{self.id} — {self.listing.title}"


class InspectionRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        INSPECTION_SCHEDULED = "inspection_scheduled", "Inspection scheduled"
        INSPECTION_COMPLETED = "inspection_completed", "Inspection completed"
        RESERVED = "reserved", "Reserved"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"
        EXPIRED = "expired", "Expired"

    listing = models.ForeignKey(Listing, on_delete=models.PROTECT, related_name="inspection_requests")
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="inspection_requests")
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING)
    credits_charged = models.PositiveIntegerField(default=0)
    requested_at = models.DateTimeField(auto_now_add=True)
    scheduled_for = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True)
    cancelled_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]


class ListingReport(models.Model):
    class Reason(models.TextChoices):
        FAKE_LISTING = "fake_listing", "Fake listing"
        WRONG_PRICE = "wrong_price", "Wrong price"
        FAKE_PHOTOS = "fake_photos", "Fake photos"
        WRONG_LOCATION = "wrong_location", "Wrong location"
        ALREADY_OCCUPIED = "already_occupied", "Already occupied"
        SCAM = "scam", "Scam"
        UNAUTHORIZED = "unauthorized", "Unauthorized listing"
        MISLEADING = "misleading", "Misleading information"

    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="reports")
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="listing_reports")
    reason = models.CharField(max_length=30, choices=Reason.choices)
    details = models.TextField(blank=True)
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=("listing", "reporter"), name="unique_listing_report")]
        ordering = ["-created_at"]
