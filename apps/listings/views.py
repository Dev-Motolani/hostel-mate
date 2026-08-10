from rest_framework import filters, viewsets
from datetime import timedelta
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from .models import Listing, ListingImage, ListingLike, ListingVideo
from .permissions import IsOwnerOrReadOnly
from .serializers import ListingImageSerializer, ListingSerializer, ListingVideoSerializer


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
        serializer.save(owner=self.request.user)

    def update(self, request, *args, **kwargs):
        listing = self.get_object()
        if request.user != listing.owner:
            return Response({"detail": "Only the poster can edit this listing."}, status=403)
        if timezone.now() > listing.created_at + timedelta(hours=1):
            return Response({"detail": "Facilities can only be edited within one hour of posting."}, status=403)
        if set(request.data.keys()) != {"facilities"}:
            return Response({"detail": "Only facilities can be edited."}, status=400)
        return super().update(request, *args, **kwargs)

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
        uploaded_images = request.FILES.getlist("images")
        if not uploaded_images:
            return Response({"detail": "Provide one or more images using the 'images' field."}, status=400)
        created = [ListingImage.objects.create(listing=listing, image=image, position=index) for index, image in enumerate(uploaded_images)]
        return Response(ListingImageSerializer(created, many=True, context={"request": request}).data, status=201)

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser, FormParser], permission_classes=[IsAuthenticated, IsOwnerOrReadOnly])
    def videos(self, request, pk=None):
        listing = self.get_object()
        uploaded_videos = request.FILES.getlist("videos")
        if not uploaded_videos:
            return Response({"detail": "Provide one or more videos using the 'videos' field."}, status=400)
        non_videos = [video.name for video in uploaded_videos if not video.content_type.startswith("video/")]
        if non_videos:
            return Response({"detail": "Only video files can be uploaded."}, status=400)
        created = [ListingVideo.objects.create(listing=listing, video=video, position=index) for index, video in enumerate(uploaded_videos)]
        return Response(ListingVideoSerializer(created, many=True, context={"request": request}).data, status=201)
