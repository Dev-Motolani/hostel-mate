from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0006_identityverification_landlord_details"),
    ]

    operations = [
        migrations.AddField(
            model_name="identityverification",
            name="verification_consent",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="identityverification",
            name="verification_consent_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
