from rest_framework import generics, permissions
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import IdentityVerification
from .serializers import EmailTokenObtainPairSerializer, IdentityVerificationSerializer, RegisterSerializer


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


class IdentityVerificationView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = IdentityVerificationSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        verification, _ = IdentityVerification.objects.get_or_create(
            user=self.request.user,
            defaults={"role": IdentityVerification.Role.STUDENT},
        )
        return verification

    def patch(self, request, *args, **kwargs):
        return self.update(request, *args, partial=True, **kwargs)
