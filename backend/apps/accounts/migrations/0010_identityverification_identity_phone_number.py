from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0009_identityverification_identity_document_number")]

    operations = [
        migrations.AddField(
            model_name="identityverification",
            name="identity_phone_number",
            field=models.CharField(blank=True, max_length=15, null=True, unique=True),
        ),
    ]
