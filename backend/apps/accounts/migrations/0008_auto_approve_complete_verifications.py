from django.db import migrations


def approve_complete_verifications(apps, schema_editor):
    IdentityVerification = apps.get_model("accounts", "IdentityVerification")
    for verification in IdentityVerification.objects.filter(status="pending", verification_consent=True):
        if verification.role == "student":
            complete = all((verification.phone_number, verification.school, verification.department, verification.level, verification.id_card, verification.live_selfie))
        else:
            complete = all((verification.phone_number, verification.property_location, verification.ownership_proof))
        if complete:
            verification.status = "approved"
            verification.save(update_fields=("status", "updated_at"))


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0007_identityverification_verification_consent_and_more"),
    ]

    operations = [
        migrations.RunPython(approve_complete_verifications, migrations.RunPython.noop),
    ]
