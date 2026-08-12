from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0005_accountprofile"),
    ]

    operations = [
        migrations.AddField(
            model_name="identityverification",
            name="business_name",
            field=models.CharField(blank=True, max_length=180),
        ),
        migrations.AddField(
            model_name="identityverification",
            name="property_location",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
