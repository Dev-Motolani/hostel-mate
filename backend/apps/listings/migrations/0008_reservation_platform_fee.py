from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("listings", "0007_reservation_referral"),
    ]

    operations = [
        migrations.AddField(
            model_name="reservation",
            name="platform_percent",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="reservation",
            name="platform_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
            preserve_default=False,
        ),
    ]
