# Generated manually for the Hostel Mate initial schema.
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="Listing",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=180)),
                ("description", models.TextField()),
                ("location", models.CharField(max_length=180)),
                ("rent_amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("payment_period", models.CharField(choices=[("year", "Per Year"), ("session", "Per Session"), ("semester", "Per Semester"), ("month", "Per Month")], default="year", max_length=12)),
                ("contact_phone", models.CharField(max_length=30)),
                ("is_contact_free", models.BooleanField(default=True)),
                ("finder_fee", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("is_available", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="listings", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="ListingImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image", models.ImageField(upload_to="listings/")),
                ("alt_text", models.CharField(blank=True, max_length=150)),
                ("position", models.PositiveSmallIntegerField(default=0)),
                ("listing", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="images", to="listings.listing")),
            ],
            options={"ordering": ["position", "id"]},
        ),
    ]
