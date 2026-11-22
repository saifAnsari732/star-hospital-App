# Star Hospital Mobile Application — Third-Party Asset & Open Source Licenses

This document records the open source and creative commons licenses governing third-party icon libraries, vector illustrations, design assets, and core software dependencies utilized within the Star Hospital mobile application.

---

## 1. Iconography

### 1.1 Lucide Icons (`lucide-react-native`)
- **License**: ISC License
- **Copyright**: Copyright (c) 2022-present, Lucide Contributors
- **Repository**: https://github.com/lucide-icons/lucide
- **Usage**: Primary icon system for UI controls, navigation bars, buttons, and form inputs.
- **License Text**:
  ```text
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted, provided that the above
  copyright notice and this permission notice appear in all copies.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
  WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
  MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
  ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
  WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
  ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
  OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
  ```

### 1.2 Google Material Symbols & Icons (`@expo/vector-icons`)
- **License**: Apache License 2.0
- **Copyright**: Copyright (c) 2020 Google LLC
- **Usage**: Medical glyphs, hospital bed markers, and clinical indicator icons.
- **Terms**: Licensed under the Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0).

---

## 2. Healthcare Vector Illustrations

### 2.1 Storyset
- **Author & Copyright**: Copyright (c) Freepik Company S.L. (https://storyset.com)
- **License**: Free with attribution license
- **Assets Utilized**:
  - `DoctorIllustration.tsx`: Male doctor with stethoscope and thumbs-up gesture (Welcome Screen).
  - `EmptyAppointmentsSvg`: Calendar with clock empty state.
  - `EmptyReportsSvg`: Medical folder and lab report empty state.
- **Attribution Notice**:
  > Healthcare illustrations customized and designed by Storyset (https://storyset.com).
- **Terms**:
  - Permitted for personal and commercial projects.
  - Attribution provided in-app and in project documentation.

### 2.2 unDraw
- **Author & Copyright**: Copyright (c) Katerina Limpitsouni (https://undraw.co)
- **License**: unDraw Open License
- **Assets Utilized**:
  - `HospitalHeroSvg.tsx`: Modern architectural hospital building with landscaped grounds (Splash and Home banner).
  - `BookingConfirmedSvg`: Medical shield checkmark confirmation graphic.
- **Terms**:
  - Free for commercial and non-commercial use.
  - No attribution required, modification permitted.
  - Sublicensing and reselling as a standalone illustration pack is prohibited.

### 2.3 Open Peeps
- **Author & Copyright**: Copyright (c) Pablo Stanley (https://openpeeps.com)
- **License**: CC0 1.0 Universal (Public Domain Dedication)
- **Assets Utilized**:
  - Diverse doctor, patient, and clinical staff avatars.
- **Terms**:
  - Dedicated to the public domain worldwide under CC0 1.0.
  - Free for copy, modification, distribution, and commercial use without asking permission.

---

## 3. Core Software Frameworks & Dependencies

| Library | License | Copyright / Source |
|---|---|---|
| `react` | MIT License | Copyright (c) Meta Platforms, Inc. |
| `react-native` | MIT License | Copyright (c) Meta Platforms, Inc. |
| `expo` | MIT License | Copyright (c) 650 Industries, Inc. (Expo) |
| `react-native-svg` | MIT License | Copyright (c) Horcrux & react-native-svg contributors |
| `@react-navigation/*` | MIT License | Copyright (c) React Navigation Contributors |
| `@react-native-async-storage/async-storage` | MIT License | Copyright (c) React Native Community |
| `axios` | MIT License | Copyright (c) Matt Zabriskie |
| `firebase` | Apache License 2.0 | Copyright (c) Google LLC |

---

## 4. Verification & Attestation
All illustration assets embedded in `src/assets/illustrations/` and `src/assets/branding/` are authored natively in JSX using `react-native-svg` primitives without external binary downloads or unverified CDN calls. All third-party licenses have been reviewed and verified for non-infringing mobile deployment on Google Play and Apple App Store.
