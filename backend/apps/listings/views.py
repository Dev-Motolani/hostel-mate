from rest_framework import filters, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Listing, ListingImage, ListingLike, ListingVideo, Reservation
from apps.accounts.models import IdentityVerification
from .permissions import IsOwnerOrReadOnly
from .referral import platform_amount, platform_percent, poster_amount, poster_percent, processor_amount, processor_percent
from .serializers import ListingImageSerializer, ListingSerializer, ListingVideoSerializer, ReservationSerializer

EDITABLE_LISTING_FIELDS = {"location", "facilities"}


class ListingViewSet(viewsets.ModelViewSet):
    serializer_class = ListingSerializer
    permission_classes = [IsOwnerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "location"]
    ordering_fields = ["created_at", "rent_amount"]

    def get_queryset(self):
        queryset = Listing.objects.select_related("owner").prefetch_related("images", "videos", "likes")
        available = self.request.query_params.get("available")
        if available in ("true", "false"):
            queryset = queryset.filter(is_available=available == "true")
        return queryset

    def perform_create(self, serializer):
        verification = getattr(self.request.user, "identity_verification", None)
        if not verification or verification.status != IdentityVerification.Status.APPROVED or not verification.verification_consent:
            raise PermissionDenied("Give consent and complete approved poster verification before posting a room. Once approved, your poster access remains active.")
        serializer.save(owner=self.request.user, is_contact_free=True, finder_fee=0)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def reserve(self, request, pk=None):
        listing = self.get_object()
        if listing.owner == request.user:
            return Response({"detail": "You cannot reserve your own listing."}, status=400)
        if not listing.is_available:
            return Response({"detail": "This room is no longer available."}, status=400)
        serializer = ReservationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reservation = serializer.save(
            listing=listing,
            tenant=request.user,
            poster=listing.owner,
            agreed_rent_amount=listing.rent_amount,
            lease_months=listing.lease_months,
            referral_percent=poster_percent(),
            referral_amount=poster_amount(listing.rent_amount),
            processor_percent=processor_percent(),
            processor_amount=processor_amount(listing.rent_amount),
            platform_percent=platform_percent(),
            platform_amount=platform_amount(listing.rent_amount),
        )
        return Response(ReservationSerializer(reservation).data, status=201)

    def update(self, request, *args, **kwargs):
        listing = self.get_object()
        if request.user != listing.owner:
            return Response({"detail": "Only the poster can edit this listing."}, status=403)
        if not listing.within_edit_window():
            return Response({"detail": "Listings can only be edited within 3 minutes of posting."}, status=403)
        if not set(request.data.keys()) <= EDITABLE_LISTING_FIELDS:
            return Response({"detail": "Only location and facilities can be edited."}, status=400)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return self._delete_listing(self.get_object())

    def _delete_listing(self, listing):
        if listing.reservations.exists():
            listing.is_available = False
            listing.save(update_fields=("is_available", "updated_at"))
            return Response({"detail": "This listing has been deleted from available rooms.", "is_available": False})
        listing.delete()
        return Response(status=204)

    def _ensure_media_editable(self, listing):
        if self.request.user != listing.owner:
            return Response({"detail": "Only the poster can change this listing's media."}, status=403)
        if not listing.within_edit_window():
            return Response({"detail": "Videos and photos can only be changed within 3 minutes of posting."}, status=403)
        return None

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, IsOwnerOrReadOnly])
    def cancel(self, request, pk=None):
        return self._delete_listing(self.get_object())

    @action(detail=True, methods=["post", "delete"], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        listing = self.get_object()
        if request.method == "POST":
            ListingLike.objects.get_or_create(listing=listing, user=request.user)
        else:
            ListingLike.objects.filter(listing=listing, user=request.user).delete()
        return Response({
            "likes_count": listing.likes.count(),
            "is_liked": ListingLike.objects.filter(listing=listing, user=request.user).exists(),
        })

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser, FormParser], permission_classes=[IsAuthenticated, IsOwnerOrReadOnly])
    def images(self, request, pk=None):
        listing = self.get_object()
        blocked = self._ensure_media_editable(listing)
        if blocked:
            return blocked
        uploaded_images = request.FILES.getlist("images")
        if not uploaded_images:
            return Response({"detail": "Provide one or more images using the 'images' field."}, status=400)
        created = [ListingImage.objects.create(listing=listing, image=image, position=index) for index, image in enumerate(uploaded_images)]
        return Response(ListingImageSerializer(created, many=True, context={"request": request}).data, status=201)

    @action(detail=True, methods=["delete"], url_path=r"images/(?P<image_id>[0-9]+)", permission_classes=[IsAuthenticated, IsOwnerOrReadOnly])
    def delete_image(self, request, pk=None, image_id=None):
        listing = self.get_object()
        blocked = self._ensure_media_editable(listing)
        if blocked:
            return blocked
        deleted, _ = listing.images.filter(pk=image_id).delete()
        if not deleted:
            return Response({"detail": "Image not found."}, status=404)
        return Response(status=204)

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser, FormParser], permission_classes=[IsAuthenticated, IsOwnerOrReadOnly])
    def videos(self, request, pk=None):
        listing = self.get_object()
        blocked = self._ensure_media_editable(listing)
        if blocked:
            return blocked
        uploaded_videos = request.FILES.getlist("videos")
        if not uploaded_videos:
            return Response({"detail": "Provide one or more videos using the 'videos' field."}, status=400)
        non_videos = [video.name for video in uploaded_videos if not (video.content_type or "").startswith("video/")]
        if non_videos:
            return Response({"detail": "Only video files can be uploaded."}, status=400)
        created = [ListingVideo.objects.create(listing=listing, video=video, position=index) for index, video in enumerate(uploaded_videos)]
        return Response(ListingVideoSerializer(created, many=True, context={"request": request}).data, status=201)

    @action(detail=True, methods=["delete"], url_path=r"videos/(?P<video_id>[0-9]+)", permission_classes=[IsAuthenticated, IsOwnerOrReadOnly])
    def delete_video(self, request, pk=None, video_id=None):
        listing = self.get_object()
        blocked = self._ensure_media_editable(listing)
        if blocked:
            return blocked
        deleted, _ = listing.videos.filter(pk=video_id).delete()
        if not deleted:
            return Response({"detail": "Video not found."}, status=404)
        return Response(status=204)


class ReservationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Reservation.objects.filter(tenant=self.request.user).select_related("listing")

    @action(detail=True, methods=["post"])
    def dispute(self, request, pk=None):
        reservation = self.get_object()
        reason = str(request.data.get("reason", "")).strip()
        if not reason:
            return Response({"detail": "Explain the problem before opening a dispute."}, status=400)
        if reservation.status in (Reservation.Status.REFUNDED, Reservation.Status.CANCELLED):
            return Response({"detail": "This reservation can no longer be disputed."}, status=400)
        reservation.status = Reservation.Status.DISPUTED
        reservation.dispute_reason = reason
        reservation.save(update_fields=("status", "dispute_reason", "updated_at"))
        return Response(ReservationSerializer(reservation).data)
