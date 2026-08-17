from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.db import migrations, models


def fill_referral_fields(apps, schema_editor):
    Reservation = apps.get_model("listings", "Reservation")
    percent = Decimal("5")
    for reservation in Reservation.objects.select_related("listing"):
        reservation.poster_id = reservation.listing.owner_id
        reservation.referral_percent = percent
        reservation.referral_amount = (reservation.agreed_rent_amount * percent / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        reservation.save(update_fields=("poster_id", "referral_percent", "referral_amount"))


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("listings", "0006_reservation"),
    ]

    operations = [
        migrations.AddField(
            model_name="reservation",
            name="poster",
            field=models.ForeignKey(null=True, on_delete=models.PROTECT, related_name="referral_reservations", to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name="reservation",
            name="referral_percent",
            field=models.DecimalField(decimal_places=2, default=5, max_digits=5),
        ),
        migrations.AddField(
            model_name="reservation",
            name="referral_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.RunPython(fill_referral_fields, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="reservation",
            name="poster",
            field=models.ForeignKey(on_delete=models.PROTECT, related_name="referral_reservations", to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name="reservation",
            name="referral_percent",
            field=models.DecimalField(decimal_places=2, max_digits=5),
        ),
        migrations.AlterField(
            model_name="reservation",
            name="referral_amount",
            field=models.DecimalField(decimal_places=2, max_digits=12),
        ),
    ]
