from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0002_identityverification_student_details")]

    operations = [
        migrations.AddField(
            model_name="identityverification",
            name="review_note",
            field=models.TextField(blank=True, help_text="Reason shown to the user when a verification is rejected."),
        ),
    ]
