from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="CreditWallet",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("balance", models.PositiveIntegerField(default=0)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="credit_wallet", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="CreditTransaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("credits", models.IntegerField(help_text="Positive for credit-in, negative for debit.")),
                ("naira_amount", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("transaction_type", models.CharField(choices=[("purchase", "Credit purchase"), ("inspection_debit", "Inspection request"), ("reservation_debit", "Reservation request"), ("refund", "Refund"), ("adjustment", "Manual adjustment")], max_length=30)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("success", "Success"), ("failed", "Failed"), ("reversed", "Reversed")], default="pending", max_length=20)),
                ("payment_reference", models.CharField(blank=True, db_index=True, max_length=120, null=True)),
                ("description", models.CharField(blank=True, max_length=255)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="credit_transactions", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="PaymentTransaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("provider", models.CharField(choices=[("paystack", "Paystack")], default="paystack", max_length=20)),
                ("reference", models.CharField(max_length=120, unique=True)),
                ("amount_kobo", models.PositiveIntegerField()),
                ("currency", models.CharField(default="NGN", max_length=10)),
                ("status", models.CharField(choices=[("initialized", "Initialized"), ("success", "Success"), ("failed", "Failed")], default="initialized", max_length=20)),
                ("raw_payload", models.JSONField(blank=True, default=dict)),
                ("verified_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="payment_transactions", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
