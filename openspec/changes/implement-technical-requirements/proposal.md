## Why

FlexMe has a complete Cloud Functions backend but zero client-side implementation. The mobile app (Flutter) and CMS (Next.js) directories are empty `.gitkeep` files. Without these, the product cannot launch. The data JSON files (flexshot_templates, flextale_stories, onboarding) exist only as seed scripts but not as validated, publishable content. This change implements everything needed to go from "backend only" to a fully functional product across all layers.

## What Changes

- **Flutter mobile app**: Full implementation of all 18+ screens, 4 overlays, 4-tab navigation, Riverpod state management, GoRouter navigation, Firebase integration, RevenueCat IAP, ML Kit face detection, i18n (6 languages), Remote Config, real-time Firestore listeners
- **CMS web app**: Next.js 14 admin dashboard with template CRUD, story CRUD, user management, dashboard analytics, JSON publish to GCS, and REST API endpoints for AI agent automation
- **Data JSON files**: Production-ready flexshot_templates.json, flextale_stories.json, and onboarding_{region}.json with full i18n and schema validation
- **Remote Config setup**: Script/config to initialize all Firebase Remote Config parameters (feature flags, pricing, content URLs, paywall plans, WOW pricing)
- **Firestore indexes & rules**: Already implemented — validate and ensure completeness against TECHNICAL_REQUIREMENTS.md

## Capabilities

### New Capabilities
- `flutter-app-core`: Flutter app foundation — Firebase init, theme, design tokens, constants, i18n setup, GoRouter navigation, Riverpod providers
- `flutter-onboarding`: Splash → Tour (3 slides) → Personalize → Login screens with Firebase Auth (Google/Apple/Anonymous)
- `flutter-glow-tab`: FlexLocket camera-first UI — camera viewfinder, photo capture/pick, ML Kit face detection, GlowProcessing, GlowResult screens
- `flutter-create-tab`: FlexShot template browsing — category/type/gender filters, search, template detail, photo upload, ShotProcessing, ShotResult screens
- `flutter-story-tab`: FlexTale story browsing — category/duration filters, TalePreview, TaleProcessing, TaleReader screens with real-time scene progress
- `flutter-me-tab`: Profile screen with stats, credit balance, subscription status, generation history, settings
- `flutter-wow-feature`: WOW Everyday subscription flow — WowIntro, WowSetup (5 steps), WowDashboard, WowDelivery screens
- `flutter-overlays`: NotifPanel, SettingsPanel, Paywall, AIChat overlay panels
- `flutter-data-layer`: Models, repositories, services for Firestore, Storage, Remote Config, RevenueCat, JSON data fetch + cache
- `cms-dashboard`: Next.js CMS dashboard with analytics (users, generations, revenue, credits)
- `cms-template-mgmt`: Template CRUD with i18n editing, image upload, AI config, JSON publish to GCS
- `cms-story-mgmt`: Story CRUD with chapter editing, i18n, per-story credits, JSON publish to GCS
- `cms-user-mgmt`: User listing, search/filter, profile view, credit adjustment, generation/order history
- `cms-api`: REST API endpoints for all CMS operations (templates, stories, users, upload, dashboard stats)
- `data-json-production`: Production-ready flexshot_templates.json, flextale_stories.json, onboarding_{region}.json
- `remote-config-setup`: Firebase Remote Config initialization with all parameters from TECHNICAL_REQUIREMENTS.md

### Modified Capabilities

## Impact

- **New directories**: `mobile_app/lib/` (full Flutter app), `cms_web/src/` (full Next.js CMS)
- **New files**: ~100+ Dart files (Flutter), ~50+ TSX/TS files (CMS), 5+ JSON data files
- **Dependencies**: Flutter packages (firebase_*, purchases_flutter, google_ml_kit, go_router, riverpod, etc.), Next.js packages (firebase-admin, tailwindcss, etc.)
- **Existing code**: Cloud Functions unchanged — already complete and production-ready
- **Infrastructure**: Firebase Remote Config parameters, GCS bucket content, Firestore indexes (already defined)
