from rest_framework import generics, permissions
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import AccountProfile, IdentityVerification
from .serializers import CurrentUserSerializer, EmailTokenObtainPairSerializer, IdentityVerificationSerializer, RegisterSerializer


class RegisterView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": {"id": user.id, "email": user.email, "full_name": user.get_full_name()},
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=201)


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


class CurrentUserView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CurrentUserSerializer

    def get_object(self):
        return self.request.user


class IdentityVerificationView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = IdentityVerificationSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        profile, _ = AccountProfile.objects.get_or_create(user=self.request.user)
        verification, _ = IdentityVerification.objects.get_or_create(
            user=self.request.user,
            defaults={"role": profile.account_type},
        )
        return verification

    def patch(self, request, *args, **kwargs):
        verification = self.get_object()
        if verification.status == IdentityVerification.Status.REJECTED:
            verification.status = IdentityVerification.Status.PENDING
            verification.rejection_reason = ""
            verification.review_note = ""
            verification.save(update_fields=("status", "rejection_reason", "review_note", "updated_at"))
        response = self.update(request, *args, partial=True, **kwargs)
        if response.status_code < 400:
            verification.refresh_from_db()
            verification.status = IdentityVerification.Status.PENDING
            verification.rejection_reason = ""
            verification.review_note = ""
            verification.save(update_fields=("status", "rejection_reason", "review_note", "updated_at"))
            return Response(self.get_serializer(verification).data)
        return response
