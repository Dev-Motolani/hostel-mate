from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("listings", "0010_listing_caution_fee_and_reservation_caution_fee"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="listing",
            name="verification_date",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="listing",
            name="verification_notes",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="listing",
            name="verification_status",
            field=models.CharField(
                choices=[
                    ("submitted", "Submitted"),
                    ("under_review", "Under review"),
                    ("preliminary_verified", "Preliminary verification"),
                    ("physical_verification", "Physical verification"),
                    ("verified", "HostelMate verified"),
                    ("rejected", "Rejected"),
                    ("more_info_required", "More info required"),
                ],
                default="submitted",
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name="listing",
            name="verified_by",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="verified_listings", to=settings.AUTH_USER_MODEL),
        ),
        migrations.CreateModel(
            name="InspectionRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("accepted", "Accepted"),
                            ("inspection_scheduled", "Inspection scheduled"),
                            ("inspection_completed", "Inspection completed"),
                            ("reserved", "Reserved"),
                            ("completed", "Completed"),
                            ("cancelled", "Cancelled"),
                            ("expired", "Expired"),
                        ],
                        default="pending",
                        max_length=30,
                    ),
                ),
                ("credits_charged", models.PositiveIntegerField(default=0)),
                ("requested_at", models.DateTimeField(auto_now_add=True)),
                ("scheduled_for", models.DateTimeField(blank=True, null=True)),
                ("notes", models.TextField(blank=True)),
                ("cancelled_reason", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("listing", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="inspection_requests", to="listings.listing")),
                ("student", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="inspection_requests", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="ListingReport",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "reason",
                    models.CharField(
                        choices=[
                            ("fake_listing", "Fake listing"),
                            ("wrong_price", "Wrong price"),
                            ("fake_photos", "Fake photos"),
                            ("wrong_location", "Wrong location"),
                            ("already_occupied", "Already occupied"),
                            ("scam", "Scam"),
                            ("unauthorized", "Unauthorized listing"),
                            ("misleading", "Misleading information"),
                        ],
                        max_length=30,
                    ),
                ),
                ("details", models.TextField(blank=True)),
                ("is_resolved", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("listing", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reports", to="listings.listing")),
                ("reporter", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="listing_reports", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddConstraint(
            model_name="listingreport",
            constraint=models.UniqueConstraint(fields=("listing", "reporter"), name="unique_listing_report"),
        ),
    ]
