from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0008_auto_approve_complete_verifications")]

    operations = [
        migrations.AddField(
            model_name="identityverification",
            name="identity_document_number",
            field=models.CharField(blank=True, max_length=80, null=True, unique=True),
        ),
    ]
