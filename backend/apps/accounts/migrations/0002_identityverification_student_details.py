from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0001_initial")]

    operations = [
        migrations.AddField(model_name="identityverification", name="department", field=models.CharField(blank=True, max_length=180)),
        migrations.AddField(model_name="identityverification", name="level", field=models.CharField(blank=True, max_length=20)),
        migrations.AddField(model_name="identityverification", name="phone_number", field=models.CharField(blank=True, max_length=25)),
        migrations.AddField(model_name="identityverification", name="school", field=models.CharField(blank=True, max_length=180)),
    ]
