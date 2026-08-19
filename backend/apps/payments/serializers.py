from rest_framework import serializers

from .models import CreditTransaction, CreditWallet, PaymentTransaction


class CreditWalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditWallet
        fields = ("balance", "updated_at")


class CreditTransactionSerializer(serializers.ModelSerializer):
    transaction_type_label = serializers.CharField(source="get_transaction_type_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = CreditTransaction
        fields = (
            "id", "credits", "naira_amount", "transaction_type", "transaction_type_label", "status", "status_label",
            "payment_reference", "description", "metadata", "created_at",
        )


class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = ("reference", "amount_kobo", "currency", "status", "created_at")


class InitializeCreditPurchaseSerializer(serializers.Serializer):
    credits = serializers.IntegerField(min_value=100)
