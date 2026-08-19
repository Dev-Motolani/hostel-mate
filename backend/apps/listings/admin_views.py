from rest_framework import viewsets, mixins, filters
from rest_framework.permissions import IsAdminUser
from .models import Listing
from .serializers import AdminListingSerializer

class AdminListingViewSet(viewsets.ModelViewSet):
    serializer_class = AdminListingSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "owner__email"]
    ordering_fields = ["created_at"]

    def get_queryset(self):
        queryset = Listing.objects.all().select_related("owner")
        verification_status = self.request.query_params.get("verification_status")
        if verification_status:
            queryset = queryset.filter(verification_status=verification_status)
        return queryset

    def perform_update(self, serializer):
        # Allow admins to manually update verification_status
        serializer.save()
