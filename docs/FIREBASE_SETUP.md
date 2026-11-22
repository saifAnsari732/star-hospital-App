# Star Hospital — Firebase Setup & Security Guide

This guide covers configuring Firebase for the **Star Hospital** React Native (Expo SDK 58) mobile application while protecting Protected Health Information (PHI) and keeping Firebase service account secrets out of the mobile bundle.

---

## 1. Firebase Services Used

| Service | Module in App | Purpose |
| --- | --- | --- |
| **Firebase Authentication** | `src/config/firebase.ts`, `src/services/firebase/auth.ts` | Phone OTP authentication for patient login and Firebase session sync |
| **Firebase Cloud Messaging (FCM)** | `src/services/firebase/messaging.ts`, `src/services/notificationService.ts` | Push notifications for appointment reminders, OPD tokens, prescriptions, and lab reports |
| **Cloud Firestore** | `src/services/firebase/firestore.ts`, `firestore.rules` | Scoped user metadata (`users/{uid}`), FCM registration (`deviceTokens/{uid}`, `fcmTokens/{tokenId}`), `notificationPreferences/{uid}`, and read-only `queueMirror/{doctorId}` OPD counters (never public PHI; clinical alert history delegates to `notificationService`) |
| **Firebase Storage** | `src/services/firebase/storage.ts`, `storage.rules` | User profile avatar images under `profile_images/{uid}/` (5 MB max, JPEG/PNG/WebP) and protected report/Rx attachment paths |
| **Firebase Analytics** | `src/services/firebase/analytics.ts` | PHI-redacted screen navigation and workflow metrics |
| **Firebase Crashlytics** | `src/services/firebase/crashlytics.ts` | PHI-redacted error reporting and diagnostic breadcrumbs (binds to `@react-native-firebase/crashlytics` in EAS native builds, with safe JS fallback in Expo Go) |

---

## 2. Create the Firebase Project

1. Open [Firebase Console](https://console.firebase.google.com/) and create a project (e.g., `star-hospital-app`).
2. Register your apps:
   - **Web / Expo Go Config**: Register a Web app to obtain the `EXPO_PUBLIC_FIREBASE_*` keys for `.env`.
   - **Android App**: Package name `com.starhospital.app` (matches `app.json` -> `expo.android.package`). Download `google-services.json` when creating native EAS builds.
   - **iOS App**: Bundle ID `com.starhospital.app` (matches `app.json` -> `expo.ios.bundleIdentifier`). Download `GoogleService-Info.plist` when creating native EAS builds.

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env` and populate your Firebase client values:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

> **CRITICAL SECURITY RULE**
> NEVER store Firebase Admin SDK service account JSON files, private keys, or FCM server keys inside the React Native / Expo app or `.env`. All `EXPO_PUBLIC_*` variables are embedded in client app bundles. Admin credentials belong strictly on your ICTHospital Laravel backend server or Firebase Cloud Functions.

---

## 4. Enable Firebase Phone OTP Authentication

1. In Firebase Console, go to **Authentication → Sign-in method**.
2. Enable **Phone** provider.
3. For Android native builds, add your **SHA-1** and **SHA-256** signing fingerprints under **Project Settings → Your Apps → Android**.
4. For automated QA / development without SMS charges, add **Phone numbers for testing** in the Phone provider panel (e.g., `+91 9876543210` with OTP `123456`).
5. When Firebase config env vars are omitted or still contain `.env.example` placeholder strings, `isFirebaseConfigured` in `src/config/firebase.ts` remains `false` so the client never sends requests to placeholder Firebase projects; in mock fallback mode (`EXPO_PUBLIC_USE_MOCK_API=true`), `firebaseAuthService` uses demo OTP fallback (`123456` or `000000`).

---

## 5. Deploy Security Rules (`firestore.rules` & `storage.rules`)

`firebase.json` wires both `firestore.rules` and `storage.rules`. Deploy them using the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use <your-firebase-project-id>
firebase deploy --only firestore:rules,storage
```

### Data Governance & Privacy Principles

- **Authoritative Source of Truth**: Medical records (diagnoses, prescriptions, lab results, pharmacy sales, billing) and clinical/user notification alerts are served by the **ICTHospital Laravel + MySQL/MariaDB** backend—never duplicated in public Firestore collections.
- **Firestore Scoped Collections (`firestore.rules`)**:
  - `users/{userId}`: Owner-only non-sensitive profile & preference metadata (`uid`, `role`, `verified`, `languagePreference`, `notificationsEnabled`, timestamps; immutable `role`/`verified`/`designation`/`entityId`).
  - `deviceTokens/{userId}` & `fcmTokens/{tokenId}`: Owner-only FCM push registration tokens (`token` 20-512 chars, `platform`).
  - `notificationPreferences/{userId}`: Owner-only push alert toggles and quiet hours.
  - `queueMirror/{doctorId}`: Authenticated read-only live OPD queue status synced via backend Admin SDK; client writes blocked.
  - `appConfig/{docId}`: Public read-only non-sensitive app configuration.
- **Storage Isolation (`storage.rules`)**:
  - `profile_images/{userId}/{fileName}`: Readable by signed-in users; write/update/delete restricted strictly to `request.auth.uid == userId` with a 5 MB limit and image MIME validation (`image/jpeg`, `image/jpg`, `image/png`, `image/webp`).
  - `lab_reports/{patientId}/{fileName}` and `prescriptions/{patientId}/{fileName}`: Client writes disabled (`allow write: if false`); reads restricted to the owning patient (`request.auth.uid == patientId`) or verified `doctor`/`staff` custom claims.
  - All unmatched paths default-deny (`allow read, write: if false`).

---

## 6. Push Notification Channels & Triggers

The mobile app registers five notification categories (`src/services/firebase/messaging.ts`):

1. `opd_token` — Live queue turn and doctor room call-in alerts (`OPD Token & Live Queue`)
2. `appointment` — Booking confirmation, check-in, and reminder alerts (`Appointment Reminders`)
3. `prescription` — Digital prescription ready and pharmacy dispense alerts (`Prescription Alerts`)
4. `lab_report` — Diagnostic report verified and ready to view (`Lab Report Availability`)
5. `general` / `billing` — Invoice updates and hospital announcements (`Hospital Announcements & Billing`)

Backend servers (ICTHospital Laravel jobs/events) should send FCM notifications using the device token registered via `POST /api/v1/notifications/push-token` (`notificationService.registerPushToken`).

---

## 7. Enabling Native Crashlytics & Native FCM in EAS Builds

`package.json` intentionally targets pure JS `firebase@^10.14.1` so the project runs cleanly in Expo Go and passes `npx expo-doctor` without native prebuild mismatches. For production store binaries requiring native `@react-native-firebase/crashlytics` and `@react-native-firebase/messaging`:

1. Add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) locally (gitignored).
2. Install `@react-native-firebase/app`, `@react-native-firebase/messaging`, `@react-native-firebase/crashlytics`, and `@react-native-firebase/analytics`.
3. Add `"@react-native-firebase/app"` and `"@react-native-firebase/crashlytics"` to `app.json` plugins and register `globalThis.__STAR_NATIVE_CRASHLYTICS__ = crashlytics` in app initialization.
4. Build via `npx eas build --platform android --profile production` / `--platform ios --profile production`.
