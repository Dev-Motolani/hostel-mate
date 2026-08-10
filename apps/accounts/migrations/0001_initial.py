import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="IdentityVerification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("role", models.CharField(choices=[("student", "Student"), ("landlord", "Landlord")], max_length=10)),
                ("id_card", models.ImageField(blank=True, null=True, upload_to="verifications/ids/")),
                ("live_selfie", models.ImageField(blank=True, null=True, upload_to="verifications/selfies/")),
                ("ownership_proof", models.FileField(blank=True, null=True, upload_to="verifications/ownership/")),
                ("status", models.CharField(choices=[("pending", "Pending review"), ("approved", "Approved"), ("rejected", "Rejected")], default="pending", max_length=10)),
                ("submitted_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="identity_verification", to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
