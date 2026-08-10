from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("listings", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="listing",
            name="facilities",
            field=models.JSONField(blank=True, default=list, help_text="Available facilities, for example Wi-Fi or running water."),
        ),
    ]
