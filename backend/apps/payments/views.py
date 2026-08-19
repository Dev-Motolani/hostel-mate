import hashlib
import hmac
import json
from datetime import datetime
from decimal import Decimal
from urllib import error, request

from django.conf import settings
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework import mixins, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CreditTransaction, CreditWallet, PaymentTransaction
from .serializers import CreditTransactionSerializer, CreditWalletSerializer, InitializeCreditPurchaseSerializer


def _paystack_request(path, payload=None):
    if not settings.PAYSTACK_SECRET_KEY:
        raise RuntimeError("PAYSTACK_SECRET_KEY is not configured.")
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = request.Request(
        f"https://api.paystack.co{path}",
        method="POST" if payload is not None else "GET",
        data=body,
        headers={
            "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
            "Content-Type": "application/json",
        },
    )
    try:
        with request.urlopen(req, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(detail or "Paystack request failed.") from exc


class CreditWalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, _ = CreditWallet.objects.get_or_create(user=request.user)
        serializer = CreditWalletSerializer(wallet)
        return Response(serializer.data)


class CreditTransactionViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CreditTransactionSerializer

    def get_queryset(self):
        return CreditTransaction.objects.filter(user=self.request.user)


class InitializeCreditPurchaseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InitializeCreditPurchaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        credits = serializer.validated_data["credits"]
        amount_kobo = credits * 100
        payload = {
            "email": request.user.email,
            "amount": amount_kobo,
            "currency": "NGN",
            "metadata": {
                "purpose": "hostelmate_credits",
                "credits": credits,
                "user_id": request.user.id,
            },
            "callback_url": settings.PAYSTACK_CALLBACK_URL,
        }
        paystack_response = _paystack_request("/transaction/initialize", payload)
        if not paystack_response.get("status"):
            return Response({"detail": "Unable to initialize payment."}, status=status.HTTP_502_BAD_GATEWAY)

        data = paystack_response.get("data", {})
        reference = data.get("reference")
        if not reference:
            return Response({"detail": "No payment reference returned by Paystack."}, status=status.HTTP_502_BAD_GATEWAY)

        PaymentTransaction.objects.update_or_create(
            reference=reference,
            defaults={
                "user": request.user,
                "amount_kobo": amount_kobo,
                "currency": "NGN",
                "status": PaymentTransaction.Status.INITIALIZED,
                "raw_payload": data,
            },
        )
        CreditTransaction.objects.get_or_create(
            user=request.user,
            payment_reference=reference,
            transaction_type=CreditTransaction.Type.PURCHASE,
            defaults={
                "credits": credits,
                "naira_amount": Decimal(amount_kobo) / Decimal("100"),
                "status": CreditTransaction.Status.PENDING,
                "description": "Credit purchase pending payment confirmation",
                "metadata": {"provider": "paystack"},
            },
        )
        return Response({
            "reference": reference,
            "authorization_url": data.get("authorization_url"),
            "access_code": data.get("access_code"),
            "credits": credits,
        })


class PaystackWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        signature = request.headers.get("x-paystack-signature", "")
        body = request.body
        expected_signature = hmac.new(
            settings.PAYSTACK_WEBHOOK_SECRET.encode("utf-8"),
            body,
            hashlib.sha512,
        ).hexdigest()
        if not signature or not hmac.compare_digest(signature, expected_signature):
            return Response({"detail": "Invalid webhook signature."}, status=status.HTTP_401_UNAUTHORIZED)

        event = json.loads(body.decode("utf-8"))
        event_name = event.get("event")
        if event_name != "charge.success":
            return Response({"detail": "Ignored."}, status=status.HTTP_200_OK)

        payload_data = event.get("data", {})
        reference = payload_data.get("reference")
        if not reference:
            return Response({"detail": "Missing reference."}, status=status.HTTP_400_BAD_REQUEST)

        verification = _paystack_request(f"/transaction/verify/{reference}")
        if not verification.get("status"):
            return Response({"detail": "Unable to verify transaction."}, status=status.HTTP_400_BAD_REQUEST)
        payment_data = verification.get("data", {})
        if payment_data.get("status") != "success":
            return Response({"detail": "Transaction not successful."}, status=status.HTTP_400_BAD_REQUEST)

        amount_kobo = int(payment_data.get("amount", 0))
        metadata = payment_data.get("metadata") or {}
        credits = int(metadata.get("credits") or amount_kobo // 100)
        user_id = metadata.get("user_id")
        if not user_id:
            return Response({"detail": "Missing user in metadata."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            payment_transaction = PaymentTransaction.objects.select_for_update().filter(reference=reference).first()
            if payment_transaction and payment_transaction.status == PaymentTransaction.Status.SUCCESS:
                return Response({"detail": "Already processed."}, status=status.HTTP_200_OK)

            if payment_transaction is None:
                return Response({"detail": "Unknown payment reference."}, status=status.HTTP_404_NOT_FOUND)

            payment_transaction.status = PaymentTransaction.Status.SUCCESS
            payment_transaction.raw_payload = payment_data
            payment_transaction.verified_at = timezone.now()
            payment_transaction.save(update_fields=("status", "raw_payload", "verified_at"))

            wallet, _ = CreditWallet.objects.select_for_update().get_or_create(user_id=user_id)
            wallet.balance = F("balance") + credits
            wallet.save(update_fields=("balance", "updated_at"))
            wallet.refresh_from_db()

            credit_tx, _ = CreditTransaction.objects.select_for_update().get_or_create(
                user_id=user_id,
                payment_reference=reference,
                transaction_type=CreditTransaction.Type.PURCHASE,
                defaults={
                    "credits": credits,
                    "naira_amount": Decimal(amount_kobo) / Decimal("100"),
                    "status": CreditTransaction.Status.SUCCESS,
                    "description": "Credit purchase successful",
                    "metadata": {"provider": "paystack", "paid_at": datetime.now(tz=timezone.get_current_timezone()).isoformat()},
                },
            )
            if credit_tx.status != CreditTransaction.Status.SUCCESS:
                credit_tx.status = CreditTransaction.Status.SUCCESS
                credit_tx.save(update_fields=("status",))

        return Response({"detail": "Processed."}, status=status.HTTP_200_OK)
