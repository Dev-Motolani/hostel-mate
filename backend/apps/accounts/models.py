from django.conf import settings
from django.db import models


class AccountProfile(models.Model):
    """Permanent account identity; browsing and posting are separate capabilities."""

    class AccountType(models.TextChoices):
        STUDENT = "student", "Student"
        LANDLORD = "landlord", "Landlord"

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="account_profile")
    account_type = models.CharField(max_length=10, choices=AccountType.choices, default=AccountType.STUDENT)

    def __str__(self):
        return f"{self.user.email} — {self.get_account_type_display()}"


class IdentityVerification(models.Model):
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        LANDLORD = "landlord", "Landlord"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    class RejectionReason(models.TextChoices):
        INVALID_ID_CARD = "invalid_id_card", "Your student ID card could not be verified. Please upload a clear photo of a valid ID card."
        SELFIE_MISMATCH = "selfie_mismatch", "Your live selfie does not match the photograph on your student ID card. Please submit new, clear photos."
        UNREADABLE_DOCUMENTS = "unreadable_documents", "Your ID card or live selfie is unclear. Please upload well-lit, in-focus images."
        OTHER = "other", "Your verification could not be approved. Please review the note from our team and submit again."

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="identity_verification")
    role = models.CharField(max_length=10, choices=Role.choices)
    phone_number = models.CharField(max_length=25, blank=True)
    business_name = models.CharField(max_length=180, blank=True)
    property_location = models.CharField(max_length=255, blank=True)
    school = models.CharField(max_length=180, blank=True)
    department = models.CharField(max_length=180, blank=True)
    level = models.CharField(max_length=20, blank=True)
    id_card = models.ImageField(upload_to="verifications/ids/", blank=True, null=True)
    live_selfie = models.ImageField(upload_to="verifications/selfies/", blank=True, null=True)
    ownership_proof = models.FileField(upload_to="verifications/ownership/", blank=True, null=True)
    verification_consent = models.BooleanField(default=False)
    verification_consent_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    rejection_reason = models.CharField(max_length=30, choices=RejectionReason.choices, blank=True)
    review_note = models.TextField(blank=True, help_text="Reason shown to the user when a verification is rejected.")
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} — {self.get_status_display()}"
