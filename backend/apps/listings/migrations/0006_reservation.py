from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("listings", "0005_alter_listing_finder_phone_listinglike"),
    ]

    operations = [
        migrations.CreateModel(
            name="Reservation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("agreed_rent_amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("lease_months", models.PositiveSmallIntegerField()),
                ("move_in_date", models.DateField()),
                ("inspection_confirmed", models.BooleanField(default=False)),
                ("status", models.CharField(choices=[("pending_payment", "Awaiting payment"), ("paid", "Payment confirmed"), ("reserved", "Room reserved"), ("disputed", "Disputed"), ("refunded", "Refunded"), ("cancelled", "Cancelled")], default="pending_payment", max_length=20)),
                ("payment_reference", models.CharField(blank=True, max_length=120, null=True, unique=True)),
                ("gateway", models.CharField(blank=True, max_length=30)),
                ("dispute_reason", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("listing", models.ForeignKey(on_delete=models.deletion.PROTECT, related_name="reservations", to="listings.listing")),
                ("tenant", models.ForeignKey(on_delete=models.deletion.PROTECT, related_name="reservations", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
