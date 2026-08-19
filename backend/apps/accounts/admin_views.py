from rest_framework import viewsets, mixins, filters
from rest_framework.permissions import IsAdminUser
from .models import IdentityVerification
from .serializers import IdentityVerificationSerializer

class AdminIdentityVerificationViewSet(viewsets.ModelViewSet):
    serializer_class = IdentityVerificationSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["user__email", "phone_number", "business_name", "school"]
    ordering_fields = ["submitted_at"]

    def get_queryset(self):
        queryset = IdentityVerification.objects.all().select_related("user")
        status = self.request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)
        return queryset

    def perform_update(self, serializer):
        serializer.save()
