# Star Hospital — ICTHospital Backend API Integration Guide

This document maps the mobile app's service layer (`src/services/`) against the **ICTHospital** Laravel + MySQL/MariaDB repository (`https://github.com/ictinnovations/ICTHospital`).

Following strict API honesty requirements:
- **Verified live backend endpoints** from `ICTHospital` are documented separately from unexposed mobile endpoints.
- **Unexposed mobile endpoints** use clean `/api/v1/...` integration contracts in `src/services/` backed by `withMockFallback` (`src/services/apiClient.ts`) so the mobile app works seamlessly in offline/demo mode while defining exact payloads required from Laravel API controllers.

---

## 1. Architecture & Request Pipeline

- **HTTP Client**: `src/services/apiClient.ts` (Axios instance with `EXPO_PUBLIC_API_BASE_URL` and `EXPO_PUBLIC_API_TIMEOUT_MS`).
- **Authentication Header**: Axios request interceptor automatically reads `@star_hospital_auth_token` from `AsyncStorage` and attaches `Authorization: Bearer <token>` (compatible with Laravel Passport `auth:api` middleware).
- **Mock Fallback Switch**: Controlled via `EXPO_PUBLIC_USE_MOCK_API` (defaults to `true`; set to `false` in `.env` when targeting a live ICTHospital API server).
- **Role Security**: `AuthContext` (`src/context/AuthContext.tsx`) validates session role-token binding on startup and prohibits unverified local role switching (`authService.switchRole` rejects privilege escalation attempts).

---

## 2. Verified Existing ICTHospital Backend Endpoints

Inspection of `ictinnovations/ICTHospital` (`routes/api.php`, `routes/web.php`, and Laravel controllers) confirms that ICTHospital is primarily a **server-rendered Laravel Blade + Passport** application with two directly usable JSON routes:

| Method | Verified Route | Laravel Middleware / Controller | Used In Mobile App | Notes |
| --- | --- | --- | --- | --- |
| `GET` | `/api/user` | `auth:api` (`routes/api.php`) | `authService.getCurrentUser()` (`src/services/authService.ts`) | Returns authenticated Laravel user object using Passport Bearer token (`laravel/passport ^13.2`). |
| `GET` | `/opd/free-slots` | `OpdController@freeSlots` (`routes/web.php`) | `doctorService.getDoctorSlots(doctorId, date)` (`src/services/doctorService.ts`) | Accepts `doctor` and `date` query parameters; returns available time slots as JSON. |

### Existing ICTHospital Web Controllers (Currently Serving Blade Views, Not JSON)

The backend already implements rich Eloquent models and controllers in `routes/web.php` under session auth (`web` + Spatie permissions) that can expose JSON responses via thin `routes/api.php` API wrapper resources:

- **Auth & Users**: `LoginController`, `RegisterController`, `ForgotPasswordController`, `ResetPasswordController` (`User`, `Role`, `Permission`)
- **Patients & Admissions**: `PatientController`, `PatientAdmissionController`, `HealthRecordController`, `MedicalHistoryController`, `AllergiesController`
- **Doctors & Schedules**: `DoctorController`, `DoctorSchedulesController`
- **Appointments & OPD Queue**: `AppointmentController`, `OpdController`, `HospitalVisitController`
- **Prescriptions & Pharmacy**: `PrescriptionController`, `PrescriptionMedicinesController`, `PharmacyController`, `PharmacySalesController`, `MedicinesController`
- **Laboratory & Radiology**: `LabTestController`, `DiagnosticReportController`
- **Billing & Wards**: `BillingController`, `InvoiceController`, `PaymentController`, `WardController`, `BedController`
- **Staff**: `StaffController`, `DepartmentController`

---

## 3. Service Layer Contracts & Missing Backend REST Endpoints

To enable full native mobile workflows without HTML scraping, the following `/api/v1/*` JSON endpoints are integrated in `src/services/` and must be exposed in ICTHospital `routes/api.php` (`auth:api` + role middleware):

### 3.1 `authService` (`src/services/authService.ts`)
- `POST /api/v1/auth/login` — Email/phone + password login returning `{ token, refreshToken, expiresIn, user }`
- `POST /api/v1/auth/otp/request` — Request SMS/Firebase OTP verification challenge
- `POST /api/v1/auth/otp/verify` — Verify 6-digit OTP (or exchange Firebase ID token) for Passport Bearer token
- `POST /api/v1/auth/register` — Patient self-registration
- `GET /api/user` — **(Verified)** Fetch authenticated user profile
- `POST /api/v1/auth/forgot-password` / `POST /api/v1/auth/reset-password`

### 3.2 `patientService` (`src/services/patientService.ts`)
- `GET /api/v1/patients` — Paginated/searchable patient directory (Doctor/Staff)
- `GET /api/v1/patients/{patientId}` — Full patient clinical profile
- `PUT /api/v1/patients/{patientId}` — Update demographic/contact details
- `GET /api/v1/patients/{patientId}/history` & `POST /api/v1/patients/{patientId}/history`
- `GET /api/v1/patients/{patientId}/allergies`
- `GET /api/v1/patients/{patientId}/records`
- `GET /api/v1/patients/{patientId}/admissions`

### 3.3 `doctorService` (`src/services/doctorService.ts`)
- `GET /api/v1/doctors` — Filterable by specialty, search query, availability
- `GET /api/v1/doctors/{doctorId}` — Doctor profile details
- `GET /opd/free-slots` — **(Verified)** Free slots for doctor & date
- `GET /api/v1/doctors/{doctorId}/schedule` — Weekly schedule template
- `GET /api/v1/doctors/{doctorId}/reviews` — Verified patient reviews

### 3.4 `staffService` (`src/services/staffService.ts`) & `bedService` (`src/services/bedService.ts`)
- `GET /api/v1/staff` & `GET /api/v1/staff/{staffId}`
- `GET /api/v1/staff/kpi-metrics` — Daily OPD, admissions, pending lab/pharmacy KPIs (mock adapter also supports `/staff/kpis`)
- `GET /api/v1/staff/tasks` & `PUT /api/v1/staff/tasks/{taskId}`
- `GET /api/v1/beds`, `GET /api/v1/beds/wards`, `POST /api/v1/beds/admit`, `POST /api/v1/beds/discharge`

### 3.5 `appointmentService` (`src/services/appointmentService.ts`)
- `GET /api/v1/appointments` & `GET /api/v1/appointments/{id}`
- `POST /api/v1/appointments`
- `PUT /api/v1/appointments/{appointmentId}/reschedule`
- `DELETE /api/v1/appointments/{appointmentId}`
- `PUT /api/v1/appointments/{appointmentId}/vitals` — Nurse vitals intake (`BP`, `Pulse`, `Temp`, `SpO2`, `Weight`)
- `POST /api/v1/appointments/{appointmentId}/check-in` — Front-desk check-in

### 3.6 `opdTokenService` (`src/services/opdTokenService.ts`)
- `POST /api/v1/opd/tokens/generate` — Issue next sequential doctor OPD token (`OpdQueue` table)
- `GET /api/v1/opd/tokens/{tokenIdentifier}` — Live tracker status & estimated wait
- `GET /api/v1/opd/queue/{doctorId}` — Doctor/staff full live queue view
- `POST /api/v1/opd/queue/{doctorId}/call-next` — Advance queue & notify patient
- `POST /api/v1/opd/tokens/{tokenId}/complete` — Close consultation token

### 3.7 `prescriptionService` (`src/services/prescriptionService.ts`) & `pharmacyService` (`src/services/pharmacyService.ts`)
- `GET /api/v1/prescriptions`, `GET /api/v1/prescriptions/{id}`, `POST /api/v1/prescriptions`
- `GET /api/v1/medicines/search`
- `GET /api/v1/pharmacy/worklist`, `POST /api/v1/pharmacy/dispense`
- `GET /api/v1/pharmacy/inventory`, `GET /api/v1/pharmacy/inventory/{medicineId}`

### 3.8 `laboratoryService` (`src/services/laboratoryService.ts`)
- `GET /api/v1/lab/reports` & `GET /api/v1/lab/reports/{reportId}`
- `GET /api/v1/lab/tests`
- `POST /api/v1/lab/reports/{reportId}/results` — Lab technician parameter upload
- `GET /api/v1/lab/reports/{reportId}/download` — Signed report PDF link

### 3.9 `billingService` (`src/services/billingService.ts`) & `razorpayService` (`src/services/razorpayService.ts`)
- `GET /api/v1/billing/invoices` & `GET /api/v1/billing/invoices/{invoiceId}`
- `POST /api/v1/billing/invoices`
- `POST /api/v1/billing/invoices/{invoiceId}/payments`
- `POST /api/v1/payments/razorpay/order` — Server-side Razorpay Order creation (`order_id`, `amountInPaise`, `INR`, public `keyId`, merchant `Star Hospital`)
- `POST /api/v1/payments/razorpay/verify` — Server-side HMAC-SHA256 signature verification & authoritative payment capture confirmation
- `POST /api/v1/webhooks/razorpay` — Server-to-server Razorpay webhook (`payment.captured`, `order.paid`, `payment.failed`) verified with `RAZORPAY_WEBHOOK_SECRET`

### 3.10 `notificationService` (`src/services/notificationService.ts`) & `profileService` (`src/services/profileService.ts`)
- `GET /api/v1/notifications`, `PUT /api/v1/notifications/{notificationId}/read`, `PUT /api/v1/notifications/read-all`
- `POST /api/v1/notifications/push-token` — Register FCM device token with Laravel user record
- `PUT /api/v1/profile`, `POST /api/v1/profile/change-password`, `POST /api/v1/profile/avatar`

---

## 4. Razorpay Payment Gateway Architecture (Mobile + ICTHospital Laravel)

> **CRITICAL SECURITY RULE**
> Only the publishable Key ID (`EXPO_PUBLIC_RAZORPAY_KEY_ID`) is configured on the mobile client (`src/config/razorpay.ts`).
> `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` MUST reside **exclusively** in the ICTHospital Laravel backend `.env`—NEVER in Expo `.env`, `.env.example` assignments, `app.json`, or `src/`.

### 4.1 Mobile-to-Laravel Secure Payment Sequence

1. **Order Creation (`POST /api/v1/payments/razorpay/order`)**:
   - Mobile client (`razorpayService.createOrder`) sends `{ invoiceId, amount?, currency: 'INR', notes? }` with Bearer auth.
   - Laravel validates invoice ownership and balance due from MySQL, calls Razorpay Orders API using server-only `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET`, stores the pending order mapped to `invoice_id`, and returns `{ orderId, invoiceId, invoiceNumber, amount, amountInPaise, currency: 'INR', receipt, keyId, merchantName: 'Star Hospital', themeColor: '#0866C6', status: 'created' }`.
2. **Checkout Presentation (`razorpayService.openCheckout`)**:
   - Mobile builds Checkout options via `buildCheckoutOptions(order, prefill)` using **only** the public `keyId`, `orderId`, `amountInPaise`, `currency: 'INR'`, `name: 'Star Hospital'`, and `theme: { color: '#0866C6' }`.
   - Placeholder keys (`rzp_test_your_razorpay_key_id`, empty values, etc.) cause `isRazorpayConfigured` in `src/config/razorpay.ts` to evaluate to `false` and block live Checkout.
   - Checkout success returns `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }`—the mobile client **never** computes HMAC signatures or marks an invoice captured locally.
3. **Server-Side Signature Verification (`POST /api/v1/payments/razorpay/verify`)**:
   - Mobile client (`razorpayService.verifyPayment`) forwards `{ invoiceId, razorpayOrderId, razorpayPaymentId, razorpaySignature }` to Laravel.
   - Laravel computes `hash_hmac('sha256', $razorpayOrderId . '|' . $razorpayPaymentId, config('services.razorpay.key_secret'))`, compares with `hash_equals(...)`, confirms payment status with Razorpay Orders/Payments API, records the payment inside a database transaction (`PaymentController` / `Invoice`), and returns `{ verified: true, verificationStatus: 'verified', verifiedByServer: true, capturedOnServer: true, invoice }`.
4. **Asynchronous Webhook Reconciliation (`POST /api/v1/webhooks/razorpay`)**:
   - Laravel validates the `X-Razorpay-Signature` header against `RAZORPAY_WEBHOOK_SECRET` using raw request body HMAC-SHA256 (`hash_equals`) to idempotently reconcile `payment.captured`, `order.paid`, and `payment.failed` even if the mobile app disconnects mid-checkout.

### 4.2 Laravel Server Environment Variables (Backend Only)

```env
# ICTHospital Laravel backend .env (NEVER place in Expo mobile repo)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_server_only_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_server_only_razorpay_webhook_secret
```

When `EXPO_PUBLIC_USE_MOCK_API=true` (offline/demo mode) or when live backend Razorpay endpoints are not deployed yet, `razorpayService` and `MockAdapterEngine` (`src/services/mock/mockAdapter.ts`) return explicit `backendMetadata` (`integrationMode: 'mock_placeholder'`, `isLiveBackendEndpoint: false`, `capturedOnServer: false`, `verifiedByServer: false`) so no caller mistakes offline simulation for live server-verified funds capture.

---

## 5. Recommended Laravel Backend Implementation Checklist

To switch `EXPO_PUBLIC_USE_MOCK_API=false` in production against ICTHospital:
1. Run `php artisan passport:install` and configure personal access/password grant clients.
2. Add Sanctum/Passport `auth:api` routes in `routes/api.php` mirroring the `/api/v1/*` paths above, backed by existing `App\Http\Controllers\*` domain logic wrapped with Laravel `JsonResource` transformers.
3. Configure `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` in Laravel `.env` and implement `/api/v1/payments/razorpay/order`, `/api/v1/payments/razorpay/verify`, and `/api/v1/webhooks/razorpay`.
4. Enforce server-side RBAC checks (`patient` self-only scope, `doctor` clinical access, `staff` designation permissions) matching `firestore.rules` and `storage.rules`—never trust client-submitted role headers.
5. Dispatch FCM notifications on OPD token call-in, appointment reminders, prescription creation, and diagnostic report verification.
