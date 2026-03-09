## 1. Data JSON Files & Remote Config

- [x] 1.1 Create production flexshot_templates.json with 10+ templates, full i18n (6 langs), categories, types, genders, aiConfig, stats — per Section 1 schema
- [x] 1.2 Create production flextale_stories.json with 5+ stories, 3+ chapters each, full i18n, per-story credits, durations — per Section 2 schema
- [x] 1.3 Create onboarding_VN.json with 3 slides (FlexLocket/FlexShot/FlexTale), personalizeOptions, loginConfig, Vietnamese content
- [x] 1.4 Create onboarding_US.json and onboarding_JP.json with region-appropriate content
- [x] 1.5 Update scripts/tools/validate_json.ts to validate all 3 JSON types against full schemas
- [x] 1.6 Create scripts/setup_remote_config.ts to initialize all Remote Config parameters (content URLs, feature flags, pricing, paywall_plans_json, wow_pricing_json)

## 2. Flutter App — Core Foundation

- [x] 2.1 Initialize Flutter project in mobile_app/ with pubspec.yaml, all required dependencies (firebase_*, riverpod, go_router, google_ml_kit, purchases_flutter, cached_network_image, intl, shimmer, lottie, image_picker, camera)
- [x] 2.2 Create core/design_tokens.dart — extract all colors, gradients, typography, spacing from mockup C object
- [x] 2.3 Create core/theme.dart — ThemeData with dark mode default, zinc-950 background, amber-500 accent, Inter font
- [x] 2.4 Create core/constants.dart — collection names, storage paths, brand names, tab labels
- [x] 2.5 Set up i18n with flutter_localizations + intl for 6 languages (EN, VI, ES, PT, JA, KO), generate .arb files
- [x] 2.6 Create core/utils/ — i18n helper to resolve {en/vi/es/pt/ja/ko} objects by device locale with EN fallback
- [x] 2.7 Set up Firebase initialization in main.dart (Auth, Firestore, Storage, Remote Config, Analytics, Messaging)
- [x] 2.8 Set up GoRouter with 4 main tabs (Glow /glow, Create /create, Story /story, Me /me) and all sub-routes
- [x] 2.9 Create bottom navigation bar widget with 4 tabs, active state highlighting in amber-500

## 3. Flutter App — Data Layer

- [x] 3.1 Create data/models/ — User, Generation, Story, Scene, Order, CreditLog Dart models matching Firestore schema (Section 8)
- [x] 3.2 Create data/models/ — Template, StoryData, OnboardingData models for JSON data
- [x] 3.3 Create data/repositories/auth_repository.dart — Google, Apple, Anonymous sign-in, sign-out, auth state stream
- [x] 3.4 Create data/repositories/user_repository.dart — Firestore onSnapshot for user doc, update device info, update FCM token
- [x] 3.5 Create data/repositories/template_repository.dart — fetch JSON from Remote Config URL, cache locally, version check, filter/sort
- [x] 3.6 Create data/repositories/story_repository.dart — same fetch/cache pattern for flextale_stories.json
- [x] 3.7 Create data/repositories/generation_repository.dart — call genFlexShot CF, stream generation status from Firestore, list history
- [x] 3.8 Create data/repositories/story_generation_repository.dart — call genFlexTale CF, stream story/scene status, list history
- [x] 3.9 Create data/services/remote_config_service.dart — fetch/activate, typed getters for all config params
- [x] 3.10 Create data/services/storage_service.dart — upload image to uploads/{userId}/{filename}
- [x] 3.11 Create data/services/revenuecat_service.dart — init SDK, fetch packages, purchase, restore, subscription status
- [x] 3.12 Create data/services/face_detection_service.dart — ML Kit face detection, validate face count, angle, size
- [x] 3.13 Create providers/ — authStateProvider, currentUserProvider, creditsProvider, templatesProvider, storiesProvider, remoteConfigProvider, generationStatusProvider, storyStatusProvider

## 4. Flutter App — Onboarding Screens

- [x] 4.1 Create screens/onboarding/splash_screen.dart — logo animation, Firebase init wait
- [x] 4.2 Create screens/onboarding/tour_screen.dart — 3-slide carousel from onboarding JSON, swipe/tap navigation, animations
- [x] 4.3 Create screens/onboarding/personalize_screen.dart — interest selection from onboarding JSON personalizeOptions
- [x] 4.4 Create screens/onboarding/login_screen.dart — Google SSO, Apple SSO (iOS), anonymous login, free credits label

## 5. Flutter App — Glow Tab (FlexLocket)

- [x] 5.1 Create screens/glow/glow_tab.dart — camera viewfinder full-screen, capture button, gallery button
- [x] 5.2 Integrate ML Kit face detection on captured/picked photo — validate face, show error messages
- [x] 5.3 Create screens/glow/glow_processing_screen.dart — shimmer/pulse animation during AI enhancement
- [x] 5.4 Create screens/glow/glow_result_screen.dart — before/after comparison, save to gallery, share
- [ ] 5.5 Implement daily free limit tracking (glowUsedToday, glowLastResetDate) with midnight local reset
- [ ] 5.6 Respect flexlocket_enabled Remote Config flag — hide tab if disabled

## 6. Flutter App — Create Tab (FlexShot)

- [x] 6.1 Create screens/create/create_tab.dart — template grid with cached_network_image, badge overlays, premium lock
- [x] 6.2 Create widgets for category filter bar (horizontal scroll), type/gender filters
- [x] 6.3 Implement search bar with language restriction from search_supported_langs, local search on name + tags
- [x] 6.4 Implement sort options (sortOrder, likes, views, newest)
- [x] 6.5 Create screens/create/shot_detail_screen.dart — preview carousel, template info, credit cost, Create CTA
- [x] 6.6 Create screens/create/photo_upload_screen.dart — camera/gallery picker, face detection validation, upload to Storage
- [x] 6.7 Create screens/create/shot_processing_screen.dart — animation, Firestore onSnapshot for generation status
- [x] 6.8 Create screens/create/shot_result_screen.dart — generated image display, save, share, retry options
- [ ] 6.9 Implement credit check before generation — show paywall if insufficient

## 7. Flutter App — Story Tab (FlexTale)

- [x] 7.1 Create screens/story/story_tab.dart — story grid/list with cover images, duration badges, credit costs
- [x] 7.2 Create widgets for category filter, duration filter, type/gender filters
- [x] 7.3 Implement story search with same language restriction pattern
- [x] 7.4 Create screens/story/tale_preview_screen.dart — preview images, description, chapter list, credit cost, Start CTA
- [x] 7.5 Create screens/story/tale_processing_screen.dart — scene-by-scene progress, Firestore onSnapshot for story + scenes
- [x] 7.6 Create screens/story/tale_reader_screen.dart — chapter navigation with heading, text, image, choices (all i18n)
- [x] 7.7 Implement credit check for FlexTale — per-story credits from JSON data

## 8. Flutter App — WOW Feature

- [x] 8.1 Create screens/story/wow_intro_screen.dart — WOW concept display, subscription plans from wow_pricing_json
- [x] 8.2 Create screens/story/wow_setup_screen.dart — 5-step wizard (mode, topic, source, pick packs, delivery time)
- [x] 8.3 Implement face upload during WOW setup with ML Kit validation (1 for solo, 2 for couple)
- [x] 8.4 Create screens/story/wow_dashboard_screen.dart — subscription status, days remaining, delivery history
- [x] 8.5 Create screens/story/wow_delivery_screen.dart — daily photo display, save, share
- [x] 8.6 Integrate RevenueCat for WOW subscription purchases (non-renewing + auto-renewable)
- [x] 8.7 Respect wow_everyday_enabled Remote Config flag

## 9. Flutter App — Me Tab & Overlays

- [x] 9.1 Create screens/me/me_tab.dart — profile display, credits balance (realtime), subscription badge, upgrade CTA
- [x] 9.2 Create screens/me/generation_history.dart — list from Firestore generations collection
- [x] 9.3 Create screens/me/story_history.dart — list from Firestore stories collection
- [x] 9.4 Create widgets/notif_panel.dart — notification panel overlay, FCM + in-app events
- [x] 9.5 Create widgets/settings_panel.dart — language selection, account management, sign out, about/legal
- [x] 9.6 Create widgets/paywall.dart — subscription plans from paywall_plans_json, credit packs, RevenueCat purchase flow
- [x] 9.7 Implement paywall variant support (A/B/C from paywall_variant Remote Config)
- [x] 9.8 Create widgets/ai_chat.dart — chat UI shell (no backend), respect ai_chat_enabled flag

## 10. Flutter App — Shared Widgets

- [x] 10.1 Create widgets/template_card.dart — reusable template card matching mockup design
- [x] 10.2 Create widgets/story_card.dart — reusable story card matching mockup design
- [x] 10.3 Create widgets/badge_chip.dart — HOT/NEW/TRENDING/POPULAR badge components
- [x] 10.4 Create widgets/credit_display.dart — credit balance display with icon
- [x] 10.5 Create widgets/loading_skeleton.dart — shimmer loading placeholders
- [x] 10.6 Create widgets/error_screen.dart — reusable error display with retry
- [x] 10.7 Create widgets/gold_button.dart — primary CTA button with amber-500 gradient

## 11. CMS — Foundation & Dashboard

- [ ] 11.1 Initialize Next.js 14 project in cms_web/ with App Router, TailwindCSS, firebase-admin dependency
- [ ] 11.2 Create src/lib/firebase-admin.ts — Firebase Admin SDK initialization
- [ ] 11.3 Create src/lib/auth.ts — admin auth middleware (verify token + admin custom claim)
- [ ] 11.4 Create src/lib/gcs.ts — GCS upload/download helpers
- [ ] 11.5 Create src/app/layout.tsx — dark theme sidebar layout with nav links (Dashboard, Templates, Stories, Users)
- [ ] 11.6 Create src/app/page.tsx (Dashboard) — aggregate stats cards (total users, DAU, MAU, generations, stories, revenue)
- [ ] 11.7 Create src/app/login/page.tsx — admin login page

## 12. CMS — Template Management

- [ ] 12.1 Create src/app/templates/page.tsx — template list with table, search, filter, pagination
- [ ] 12.2 Create src/app/templates/new/page.tsx — template create form (all fields + i18n name inputs)
- [ ] 12.3 Create src/app/templates/[id]/page.tsx — template edit form
- [ ] 12.4 Create src/components/template-form.tsx — shared form component with i18n fields, image upload, AI config, prompt editor
- [ ] 12.5 Create src/components/template-preview.tsx — live preview card matching app design
- [ ] 12.6 Implement template image upload to GCS at templates/{id}/cover.png and preview_*.png
- [ ] 12.7 Implement template delete with confirmation
- [ ] 12.8 Implement template reorder (drag-and-drop or manual sortOrder)
- [ ] 12.9 Implement "Publish" button — build flexshot_templates.json from Firestore, upload to GCS

## 13. CMS — Story Management

- [ ] 13.1 Create src/app/stories/page.tsx — story list with table, filter, pagination
- [ ] 13.2 Create src/app/stories/new/page.tsx — story create form
- [ ] 13.3 Create src/app/stories/[id]/page.tsx — story edit form
- [ ] 13.4 Create src/components/story-form.tsx — shared form with chapter editor (add/remove/reorder chapters, i18n text/choices/prompts)
- [ ] 13.5 Implement story image upload to GCS
- [ ] 13.6 Implement "Publish" button — build flextale_stories.json from Firestore, upload to GCS

## 14. CMS — User Management

- [ ] 14.1 Create src/app/users/page.tsx — user list with search, filter by plan, pagination
- [ ] 14.2 Create src/app/users/[id]/page.tsx — user detail with profile, subscription, credits, generation history, order history
- [ ] 14.3 Implement manual credit adjustment with reason logging

## 15. CMS — REST API

- [ ] 15.1 Create src/app/api/templates/ — CRUD endpoints (GET list, POST create, GET/:id, PUT/:id, DELETE/:id)
- [ ] 15.2 Create src/app/api/templates/publish/route.ts — publish JSON to GCS
- [ ] 15.3 Create src/app/api/stories/ — CRUD endpoints + publish
- [ ] 15.4 Create src/app/api/upload/route.ts — image upload to GCS
- [ ] 15.5 Create src/app/api/users/ — list, detail, history, orders, credit adjust endpoints
- [ ] 15.6 Create src/app/api/dashboard/stats/route.ts — aggregate stats endpoint
- [ ] 15.7 Add auth middleware to all API routes (verify Firebase token + admin claim)

## 16. Integration & Validation

- [ ] 16.1 Run JSON validation script on all production data JSONs
- [ ] 16.2 Test Flutter app builds for iOS and Android (flutter build)
- [ ] 16.3 Test CMS builds (next build)
- [ ] 16.4 Verify Firestore security rules match TECHNICAL_REQUIREMENTS.md Section 8
- [ ] 16.5 Verify all Remote Config parameters are defined in setup script
- [ ] 16.6 End-to-end flow test: onboarding → login → template browse → generate → result
