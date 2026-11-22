# STAR HOSPITAL — Mobile Application

> **Care Today... Healthier Tomorrow...**

**STAR HOSPITAL** is a production-structured React Native + Expo SDK 58 + TypeScript mobile healthcare application built exclusively for **Patients**, **Doctors**, and **Hospital Staff**, integrated with Firebase services and the **ICTHospital** Laravel/MySQL backend.

---

## Key Features by Role

- **Patient Portal (`PATIENT`)**
  - Home dashboard with live OPD token status, upcoming appointments, and quick medical actions
  - Live OPD queue tracker (1-2-3 progress steps + estimated wait times)
  - Doctor search, specialty filters, slot selection, booking confirmation, reschedule & cancellation
  - Digital prescriptions, lab & radiology reports, medical history, allergies, billing & payment history
  - Firebase Phone OTP login, push alerts, profile photo upload, and 24/7 hospital helpdesk

- **Doctor Portal (`DOCTOR`)**
  - Doctor schedule & daily appointment overview
  - Interactive OPD Queue Caller (`call-next`, mark consultation complete)
  - Clinical consultation workspace & digital prescription builder
  - Patient clinical history, allergies, vitals, and diagnostic reports view

- **Hospital Staff Portal (`STAFF`)**
  - Role-scoped workflows (`nurse`, `receptionist`, `pharmacist`, `laboratorist`, `billing`, `admin`)
  - Front-desk OPD token generation and check-in
  - Nurse vitals intake (`BP`, `Pulse`, `Temp`, `SpO2`, `Weight`)
  - Lab technician diagnostic result entry
  - Pharmacist worklist & medicine dispensing with inventory checks
  - Billing invoice creation, payment recording, and ward/bed admission & discharge management

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | React Native `0.88.1` + Expo SDK `58` + React `19.3` |
| Language | TypeScript `~6.0.3` (`strict: true`) |
| Navigation | React Navigation v7 (Native Stack + Bottom Tabs) |
| Icons & Illustrations | `lucide-react-native`, `@expo/vector-icons`, `react-native-svg` |
| Firebase | Firebase JS SDK v10 (Auth Phone OTP, Firestore, Storage, Analytics) + FCM/Crashlytics wrappers |
| Payments | Razorpay Checkout config (`src/config/razorpay.ts`) + server-verified `razorpayService` (`INR`, `#0866C6`) |
| Backend Client | Axios with Bearer token interceptor & mock fallback (`ICTHospital` Laravel API) |
| Persistence | `@react-native-async-storage/async-storage` |

---

## Project Structure

```text
src/
├── assets/            # Branding logos & themed medical SVG illustrations
├── components/        # Reusable Star Hospital UI library (Icon, MedicalIllustration, EmptyState, StarButton, ...)
├── config/            # Firebase & Razorpay public client configuration
├── constants/         # Roles, staff permissions, route constants, statuses, hospital info
├── context/           # Hardened AuthContext (strict role isolation) & OPDTokenContext
├── fixtures/          # Deterministic domain fixtures for offline demo & testing
├── hooks/             # useAuth, useOPDToken, useDebounce, useApiRequest
├── navigation/        # Role-isolated RootNavigator, AuthNavigator, Patient/Doctor/Staff navigators
├── screens/           # Role-scoped screens across Auth, Patient, Doctor, Staff
├── services/          # REST API layer (auth, patient, doctor, staff, appointment, opdToken, prescription, lab, pharmacy, billing, razorpay, notification, profile, bed)
│   ├── firebase/      # auth, messaging, firestore, storage, analytics, crashlytics wrappers
│   └── mock/          # Stateful in-memory MockAdapter & simulated delay helpers
├── store/             # Typed AsyncStorage-backed UI preferences & non-PHI store
├── theme/             # Star Hospital colors (#0866C6, #064A91, #2196F3, #F5F9FF, #13B8A6), spacing, typography, shadows
├── types/             # Strict TypeScript domain & API interfaces
└── utils/             # Date/time formatters, clinical validators, PHI-redacting secureLogger
```

---

## Getting Started

### Prerequisites

- Node.js `>= 20`
- npm `>= 10`
- Expo CLI / Android Studio (Android Emulator) or Xcode (iOS Simulator)

### 1. Install Dependencies

```bash
npm install
```

*(Note: `.npmrc` includes `legacy-peer-deps=true` for React 19 + Expo SDK 58 peer compatibility.)*

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your ICTHospital API URL, Firebase client project settings, and public Razorpay Key ID (`EXPO_PUBLIC_RAZORPAY_KEY_ID`). Leave `EXPO_PUBLIC_USE_MOCK_API=true` for standalone offline demo mode, or set it to `false` when pointing `EXPO_PUBLIC_API_BASE_URL` at a live ICTHospital API server.

> **Razorpay Secret Hygiene**: Keep `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` strictly in the ICTHospital Laravel backend `.env`—NEVER in Expo `.env`, `app.json`, or `src/`. Mobile checkout only uses `EXPO_PUBLIC_RAZORPAY_KEY_ID`, while orders (`POST /api/v1/payments/razorpay/order`), HMAC verification (`POST /api/v1/payments/razorpay/verify`), and webhooks (`POST /api/v1/webhooks/razorpay`) run server-side.

See:
- [Firebase Setup & Security Guide](docs/FIREBASE_SETUP.md)
- [ICTHospital API Integration Guide](docs/API_INTEGRATION.md)

### 3. Run the Mobile Application

```bash
# Start Metro bundler
npm start

# Launch Android emulator / connected device
npm run android

# Launch iOS simulator (macOS)
npm run ios
```

---

## Verification & Quality Checks

```bash
# TypeScript strict type check
npm run type-check

# Expo SDK & configuration health check (20/20 checks)
npm run doctor

# Run core verification test suite (auth, role isolation, OPD tokens, services, mock adapter, E2E flows)
npm test

# Run Jest unit, component, navigation, and E2E suites
npm run test:jest
```

---

## Building Native Android & iOS Releases (EAS Build)

Build profiles are configured in `eas.json` (`development`, `preview`, `production`) and native permissions/identifiers are configured in `app.json` (`com.starhospital.app`).

```bash
# Development APK / Simulator build
npx eas build --platform android --profile development
npx eas build --platform ios --profile development

# Preview internal QA builds
npx eas build --platform all --profile preview

# Production store builds (Android AAB & iOS IPA)
npx eas build --platform android --profile production
npx eas build --platform ios --profile production
```

---

## Security & Licenses

- **Role Isolation**: Authenticated role is strictly bound to verified session state; local privilege switching is disabled in `AuthContext` and `authService`.
- **PHI Protection**: `secureLogger`, Firebase Analytics, and Crashlytics breadcrumbs automatically redact tokens, passwords, OTPs, emails, phone numbers, and medical payloads.
- **Firebase Rules**: `firestore.rules` and `storage.rules` enforce owner/claim isolation with zero public access to patient medical records.
- **Payment Security**: `src/config/razorpay.ts` and `src/services/razorpayService.ts` enforce public-key-only mobile configuration and delegate order creation, HMAC verification, and webhooks strictly to the Laravel backend.
- **Third-Party Attributions**: See [LICENSES.md](LICENSES.md).
