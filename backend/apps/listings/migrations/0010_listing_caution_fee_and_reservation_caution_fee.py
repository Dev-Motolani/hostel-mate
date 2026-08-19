from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("listings", "0009_reservation_processor_fee"),
    ]

    operations = [
        migrations.AddField(
            model_name="listing",
            name="caution_fee_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="reservation",
            name="agreed_caution_fee_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
    ]
