from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.views import CurrentUserView, EmailTokenObtainPairView, IdentityVerificationView, RegisterView
from apps.accounts.admin_views import AdminIdentityVerificationViewSet
from apps.listings.views import InspectionRequestViewSet, ListingReportViewSet, ListingViewSet, ReservationViewSet
from apps.listings.admin_views import AdminListingViewSet
from apps.payments.views import CreditTransactionViewSet, CreditWalletView, InitializeCreditPurchaseView, PaystackWebhookView

router = DefaultRouter()
router.register("listings", ListingViewSet, basename="listing")
router.register("admin/listings", AdminListingViewSet, basename="admin-listing")
router.register("reservations", ReservationViewSet, basename="reservation")
router.register("inspection-requests", InspectionRequestViewSet, basename="inspection-request")
router.register("listing-reports", ListingReportViewSet, basename="listing-report")
router.register("credit-transactions", CreditTransactionViewSet, basename="credit-transaction")
router.register("admin/users/verifications", AdminIdentityVerificationViewSet, basename="admin-user-verification")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/token/", EmailTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/me/", CurrentUserView.as_view(), name="current-user"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/verification/", IdentityVerificationView.as_view(), name="identity-verification"),
    path("api/payments/credits/wallet/", CreditWalletView.as_view(), name="credit-wallet"),
    path("api/payments/credits/initialize/", InitializeCreditPurchaseView.as_view(), name="initialize-credit-purchase"),
    path("api/payments/paystack/webhook/", PaystackWebhookView.as_view(), name="paystack-webhook"),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
