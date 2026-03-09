## Context

FlexMe has a fully implemented Cloud Functions backend (5 functions, 4 services, 4 models, security rules, indexes) but zero client-side code. The Flutter mobile app and Next.js CMS are empty directories. The TECHNICAL_REQUIREMENTS.md defines every screen, data schema, API, and integration needed. This design covers the full implementation of both client apps plus production data files.

**Current state:**
- Cloud Functions: 100% complete (genFlexShot, genFlexTale, checkGeo, handleEventRevenueCat, onUserCreate)
- Firestore rules + indexes: complete
- Seed scripts: exist for templates, stories, users
- Flutter app: empty (`mobile_app/lib/.gitkeep`)
- CMS: empty (`cms_web/src/.gitkeep`)
- Production data JSONs: not created (only seed scripts)

**Constraints:**
- Must match mockup UI 100% (docs/mockup_app/app.jsx is source of truth)
- Dark mode default, Royal Gold #F59E0B brand identity
- 6 languages (EN, VI, ES, PT, JA, KO), English-first
- Region: asia-southeast1 (Singapore)
- Backend Cloud Functions are NOT to be modified

## Goals / Non-Goals

**Goals:**
- Implement complete Flutter mobile app matching all mockup screens pixel-perfect
- Implement Next.js CMS with full CRUD for templates, stories, users, and dashboard
- Create production-ready data JSON files with full i18n
- Set up Firebase Remote Config with all required parameters
- Establish reusable Flutter architecture (Riverpod + GoRouter + design tokens)

**Non-Goals:**
- Modifying existing Cloud Functions code
- Push notifications implementation (FCM token collection only)
- AI Chat assistant (UI shell only, backend not in scope)
- Schedule post feature (flagged as future)
- Referral program (flagged as future)
- App Store / Play Store deployment

## Decisions

### D1: Flutter architecture — Riverpod + GoRouter + feature-based structure
**Choice:** Feature-based folder structure with Riverpod for state, GoRouter for navigation.
**Why:** Riverpod provides compile-safe dependency injection and reactive state. GoRouter handles deep linking and tab-based navigation natively. Feature-based structure keeps each feature self-contained.
**Alternative:** BLoC — more boilerplate, steeper learning curve, no advantage for this app size.

```
mobile_app/lib/
├── core/           # theme, constants, i18n, utils, design_tokens
├── data/           # models, repositories, services (shared)
├── providers/      # Riverpod providers (global)
├── widgets/        # shared UI components
├── screens/
│   ├── onboarding/ # splash, tour, personalize, login
│   ├── glow/       # camera, processing, result
│   ├── create/     # template list, detail, upload, processing, result
│   ├── story/      # story list, preview, processing, reader, wow
│   └── me/         # profile, settings, notifications
└── main.dart
```

### D2: Design tokens — single source of truth from mockup C object
**Choice:** Extract all colors, gradients, typography, spacing from mockup's `C` object into `core/design_tokens.dart`. All widgets reference tokens, never raw values.
**Why:** Ensures pixel-perfect match with mockup. One place to update all visual properties.

### D3: Data layer — Repository pattern with local JSON cache
**Choice:** Repository classes abstract Firestore, Storage, and Remote Config. JSON data (templates, stories) fetched from GCS URL in Remote Config, cached to local file storage with version check.
**Why:** Clean separation. Offline support. Reduces Firestore reads (JSON data is read-only).

### D4: CMS — Next.js 14 App Router + Server Actions + Firebase Admin
**Choice:** Next.js 14 with App Router, Server Components for data fetching, Server Actions for mutations. Firebase Admin SDK for auth and Firestore access. TailwindCSS for styling.
**Why:** App Router is the modern Next.js standard. Server Components reduce client bundle. Firebase Admin gives full backend access without client SDK limitations.
**Alternative:** Separate Express API — unnecessary complexity when Next.js API routes suffice.

### D5: CMS auth — Firebase Admin custom claims
**Choice:** Admin users have `admin: true` custom claim. CMS checks this on every request via Firebase Admin SDK.
**Why:** Simple, no separate auth system needed. Aligns with existing Firebase stack.

### D6: JSON publish workflow — CMS builds JSON, uploads to GCS
**Choice:** CMS reads all templates/stories from Firestore, builds the complete JSON file per TECHNICAL_REQUIREMENTS.md schema, uploads to GCS bucket. App fetches from GCS URL in Remote Config.
**Why:** Decouples app from CMS. App gets a single static JSON. CMS controls when changes are published.

### D7: i18n — flutter_localizations + intl + JSON data objects
**Choice:** Flutter's built-in localization for UI strings. JSON data uses `{ "en": "...", "vi": "...", ... }` objects resolved by device locale with `en` fallback.
**Why:** Standard Flutter pattern. Consistent with how data JSONs are structured.

### D8: Real-time listeners — Firestore onSnapshot for 3 collections
**Choice:** Listen to user profile doc, user's generations, and user's stories. Credits, subscription status, generation progress, and story progress update in real-time.
**Why:** Specified in TECHNICAL_REQUIREMENTS.md. No WebSocket needed — Firestore handles it natively.

## Risks / Trade-offs

- **[Risk] Large scope** → Mitigated by phased implementation: core → glow → create → story → CMS. Each phase is independently testable.
- **[Risk] Mockup divergence** → Mitigated by extracting design tokens from mockup C object first. All widgets built against tokens.
- **[Risk] Image consistency in FlexTale** → Already handled by Cloud Functions (reference image + style reference). Client just needs to display progress.
- **[Risk] RevenueCat IAP testing** → Requires sandbox environment setup on iOS/Android. Can develop UI with mock data first.
- **[Risk] i18n completeness** → English-first development. Translation quality for other languages can be improved iteratively. Fallback to EN ensures no blank strings.
- **[Risk] CMS JSON publish could break app** → Mitigate with JSON schema validation before upload. App caches previous JSON as fallback.
