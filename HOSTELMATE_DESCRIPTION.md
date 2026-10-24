# HostelMate Project Description

## 1. What HostelMate is

HostelMate is a student-focused web marketplace for finding and publishing off-campus hostel rooms. It is designed to help students discover available accommodation directly from verified students, room finders, and landlords without relying on traditional agent markups.

The product combines:

- A public room-discovery website.
- Authenticated student and landlord accounts.
- Identity and role verification.
- Hostel and room listings with photos, videos, facilities, pricing, and availability.
- HostelMate listing verification and moderation tools.
- Inspection requests, reservations, disputes, and reporting.
- A credit wallet used for inspection requests.
- Paystack payments for purchasing credits.
- An administrative interface for reviewing users and listings.

The currency and timezone are configured for Nigeria: amounts are stored in Naira and the default timezone is `Africa/Lagos`.

## 2. Main value proposition

HostelMate aims to make student housing more direct, transparent, and safer:

1. Students can browse rooms and filter for available or HostelMate-verified listings.
2. Posters can publish vacant rooms after starting the verification process and giving verification consent.
3. Students can view real listing media and request an inspection for verified rooms.
4. Users can report misleading, fraudulent, occupied, or otherwise problematic listings.
5. Payment and credit activity is recorded as auditable transactions.

Browsing is intended to be free. The current interface emphasizes direct contact, verified landlords, real listing media, and avoiding agent fees.

## 3. User types

### Students

Students can:

- Create an account and sign in with email and password.
- Submit student identity details for verification.
- Browse, search, and sort room listings.
- Filter listings by availability and HostelMate verification status.
- View listing details, photos, videos, facilities, rent, caution fee, lease length, and poster information.
- Like listings.
- Request an inspection for an available HostelMate-verified room.
- Cancel an eligible inspection request.
- Reserve a room.
- View reservations and raise a dispute when necessary.
- Buy HostelMate Credits and view their credit wallet and transaction history.
- Report listings for reasons such as scams, fake photos, wrong prices, wrong locations, or misleading information.

### Landlords and room posters

Landlords or other approved posters can:

- Submit landlord identity and property information.
- Publish available rooms.
- Add room photos and videos.
- Provide rent, caution fee, payment period, lease duration, contact information, facilities, and location.
- Manage their own listings while they remain within the allowed edit period.

The current backend uses an account profile type of either `student` or `landlord`. The listing owner is the authenticated user who posts the room, so the system also supports students or room finders posting rooms where their verification flow permits it.

### Administrators

Administrators can use Django Admin and custom admin API viewsets to:

- Review identity verification submissions.
- Approve or reject identity verifications.
- Review and manage listings.
- Apply verification statuses and review notes.
- Investigate listing reports and user activity.

## 4. Typical user journeys

### Finding a room

1. A visitor opens the Next.js home page.
2. The page loads available and verified listings from the Django API.
3. The visitor signs up or signs in to access protected listing details and contact information.
4. The student opens a listing, reviews its media and terms, and may like it.
5. For a verified available listing, the student requests an inspection.
6. The inspection request consumes the configured number of HostelMate Credits.
7. The request can move through pending, accepted, scheduled, completed, reserved, cancelled, expired, or related statuses.
8. The student can proceed to reserve the room or raise a dispute against an applicable reservation.

### Posting a room

1. The user creates an account and chooses a student or landlord role.
2. The user submits the required identity documents and verification information.
3. The verification record contains a status such as pending, approved, or rejected.
4. A rejected verification can be resubmitted after the user addresses the rejection reason or review note.
5. A user may publish a listing only when the verification requirements and consent rules are satisfied.
6. The listing starts as submitted and can progress through review and HostelMate verification.
7. The owner can update only location and facilities, and can manage media, during the first three minutes after posting.

### Buying credits

1. An authenticated user selects a credit amount in the credits page.
2. The backend initializes a Paystack transaction in NGN.
3. Paystack returns an authorization URL and payment reference.
4. Paystack calls the signed webhook after successful payment.
5. The backend verifies the transaction with Paystack, marks the payment successful, and increases the user's credit wallet atomically.

## 5. Frontend application

The frontend is a Next.js application using React, TypeScript, Tailwind CSS, Framer Motion, and Lucide icons. It lives in `src/` and communicates with the Django API using the `NEXT_PUBLIC_API_URL` environment variable.

### Frontend routes

- `/` - public landing and room discovery page.
- `/signup` - account registration.
- `/login` - user login.
- `/onboarding` - identity and account onboarding.
- `/listings` - listing browser.
- `/listings/[id]` - listing details, media, contact information, likes, inspection, and reservation actions.
- `/listings/[id]/edit` - listing editing.
- `/post` - create a room listing.
- `/account` - account information and user activity.
- `/credits` - credit wallet and credit purchase flow.
- `/payment/[id]` - payment callback or payment result flow.
- `/dashboard` - authenticated dashboard shell.
- `/dashboard/listings` - listing management dashboard.
- `/dashboard/users` - user and verification administration view.

The frontend stores the JWT access token in browser local storage under `hostel_mate_access_token`. Public listing data is requested from the API, while authenticated operations send a Bearer access token.

## 6. Backend architecture

The backend is a Django project using Django REST Framework and Simple JWT. It lives in `backend/`.

### Django applications

#### `apps.accounts`

Responsible for:

- User registration and email-based login.
- JWT token creation and refresh.
- Current-user information.
- Student and landlord account profiles.
- Identity verification records and uploaded documents.
- Verification statuses, rejection reasons, review notes, and consent timestamps.

Identity verification can store student ID cards, live selfies, landlord ownership proof, phone numbers, identity document numbers, school information, department, level, business name, and property location.

#### `apps.listings`

Responsible for:

- Listings and listing ownership.
- Listing photos and videos.
- Facilities, pricing, payment period, caution fees, and lease duration.
- Listing availability and HostelMate verification.
- Likes and saved-style listing interactions.
- Inspection requests.
- Reservations.
- Listing reports.
- Referral, processor, and platform fee calculations.

#### `apps.payments`

Responsible for:

- Per-user credit wallets.
- Credit transaction history.
- Paystack payment initialization.
- Signed Paystack webhook processing.
- Payment references, statuses, amounts, currencies, and raw provider payloads.

### Storage and deployment

The backend uses SQLite when `DATABASE_URL` is not configured and PostgreSQL when a PostgreSQL URL is supplied. Production deployments should use PostgreSQL or another managed database. Uploaded media can use local filesystem storage in development or Cloudinary when the Cloudinary environment variables are configured.

Static files are served with WhiteNoise. Django can serve media files locally while `DEBUG=True`; production media should use persistent object storage rather than an ephemeral application filesystem.

## 7. Data model summary

### Account and verification data

- `AccountProfile`: one-to-one account role and account type.
- `IdentityVerification`: identity documents, student or landlord details, consent, review status, rejection reason, and administrative notes.

### Listing data

- `Listing`: owner, title, description, location, rent, caution fee, payment period, lease length, contact data, facilities, availability, and verification state.
- `ListingImage`: listing photos with alternative text and display position.
- `ListingVideo`: listing videos with display position.
- `ListingLike`: unique user-to-listing likes.
- `ListingReport`: one report per user per listing, with a controlled reason and resolution flag.

### Inspection and reservation data

- `InspectionRequest`: student request, listing, notes, schedule, credits charged, and workflow status.
- `Reservation`: tenant, poster, agreed financial terms, move-in date, inspection confirmation, payment reference, reservation state, dispute details, and fee breakdown.

### Payment data

- `CreditWallet`: current credit balance for a user.
- `CreditTransaction`: purchases, inspection debits, reservation debits, refunds, adjustments, and their statuses.
- `PaymentTransaction`: Paystack reference, amount, currency, provider status, raw response, and verification timestamp.

## 8. Listing verification and safety rules

Listings have the following verification lifecycle values:

- Submitted.
- Under review.
- Preliminary verification.
- Physical verification.
- HostelMate verified.
- Rejected.
- More information required.

Inspection requests are restricted to listings that are both available and HostelMate verified. Users cannot inspect or reserve their own listing. Listing reports support controlled reasons including fake listing, wrong price, fake photos, wrong location, already occupied, scam, unauthorized listing, and misleading information.

The backend protects owner-only changes and uses JWT authentication for protected actions. Paystack webhooks are checked with an HMAC signature and successful payments are verified against Paystack before credits are added.

## 9. API surface

### Authentication and identity

- `POST /api/auth/register/` - register and receive access and refresh JWT tokens.
- `POST /api/auth/token/` - sign in using email and password.
- `POST /api/auth/token/refresh/` - refresh an access token.
- `GET /api/auth/me/` - retrieve the authenticated user's profile.
- `GET/PATCH /api/verification/` - retrieve or update identity verification data.

### Listings

- `GET /api/listings/` - browse listings.
- `POST /api/listings/` - publish a listing when verification requirements are met.
- `GET/PATCH/DELETE /api/listings/{id}/` - view, edit, or delete a listing.
- `POST /api/listings/{id}/images/` - upload listing images.
- `DELETE /api/listings/{id}/images/{image_id}/` - delete an image.
- `POST /api/listings/{id}/videos/` - upload listing videos.
- `DELETE /api/listings/{id}/videos/{video_id}/` - delete a video.
- `POST/DELETE /api/listings/{id}/like/` - like or unlike a listing.
- `POST /api/listings/{id}/request_inspection/` - request an inspection.
- `POST /api/listings/{id}/reserve/` - create a reservation.
- `POST /api/listings/{id}/report/` - report a listing.
- `POST /api/listings/{id}/cancel/` - remove or make a listing unavailable.

Listing browsing supports search, ordering, `available=true|false`, `verified=true|false`, and authenticated `my_listings=true` filtering.

### Inspections, reservations, and reports

- `/api/inspection-requests/` - view the authenticated user's inspection requests.
- `POST /api/inspection-requests/{id}/cancel/` - cancel an eligible inspection request.
- `/api/reservations/` - view the authenticated user's reservations.
- `POST /api/reservations/{id}/dispute/` - open a reservation dispute.
- `/api/listing-reports/` - view the authenticated user's submitted reports.

### Credits and payments

- `GET /api/payments/credits/wallet/` - view the current credit balance.
- `POST /api/payments/credits/initialize/` - initialize a credit purchase with Paystack.
- `/api/credit-transactions/` - view credit transaction history.
- `POST /api/payments/paystack/webhook/` - receive and verify Paystack payment events.

All protected endpoints require `Authorization: Bearer <access-token>`.

## 10. Configuration

Important backend environment variables include:

- `SECRET_KEY` - Django secret key.
- `DEBUG` - development or production mode.
- `DATABASE_URL` - PostgreSQL connection string; SQLite is used when absent.
- `ALLOWED_HOSTS` - permitted backend hosts.
- `CORS_ALLOWED_ORIGINS` - permitted frontend origins.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - optional Cloudinary media storage.
- `PAYSTACK_SECRET_KEY` - Paystack server credential.
- `PAYSTACK_WEBHOOK_SECRET` - webhook signature secret.
- `PAYSTACK_CALLBACK_URL` - frontend payment callback URL.
- `INSPECTION_REQUEST_CREDITS` - credit cost of an inspection request.
- `POSTER_REFERRAL_PERCENT`, `PAYMENT_PROCESSOR_PERCENT`, `HOSTELMATE_FEE_PERCENT` - fee settings used in reservation calculations.

The frontend requires:

- `NEXT_PUBLIC_API_URL` - the Django API base URL, normally ending in `/api`.

## 11. Local development

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 manage.py migrate
python3 manage.py runserver
```

The API runs at `http://127.0.0.1:8000`. Create an administrator with `python3 manage.py createsuperuser` and visit `/admin/`.

### Frontend

From the repository root:

```bash
npm install
npm run dev
```

The Next.js application runs at `http://localhost:3000`.

Useful package scripts:

- `npm run dev` - start the development server.
- `npm run build` - create a production build.
- `npm run start` - run the production build.
- `npm run lint` - run ESLint.

## 12. Current implementation notes

- The repository contains a SQLite database for local development, while the documented deployment path uses PostgreSQL.
- The frontend and backend are separate applications and must be started independently during local development.
- Media uploads are supported for both images and videos.
- The backend has stronger workflow support than the short public landing page suggests: reservations, inspection requests, reports, credits, payment webhooks, and admin review are all represented in the API and models.
- Payment settlement and some real-world verification operations depend on configured external services and administrator action.
- Production deployment requires secure environment variables, correct CORS and allowed-host configuration, persistent media storage, and a real Paystack webhook URL.

## 13. Technology summary

| Area | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, custom global styles |
| Frontend interaction | Framer Motion, Lucide React |
| Backend | Python, Django, Django REST Framework |
| Authentication | JSON Web Tokens with Simple JWT |
| Database | SQLite locally; PostgreSQL when `DATABASE_URL` is set |
| Payments | Paystack |
| Media | Local filesystem or optional Cloudinary storage |
| Static files | WhiteNoise |
| Hosting model | Next.js frontend on Vercel-compatible hosting and Django backend on a Python host |
