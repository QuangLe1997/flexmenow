# FLEXME — BUILD STRATEGY
# Chiến lược xây dựng app từ tổng quan đến chi tiết

═══════════════════════════════════════════════════════════════════════════
## TỔNG QUAN KIẾN TRÚC
═══════════════════════════════════════════════════════════════════════════

```
flexmenow/
├── mobile_app/          # Flutter app (iOS + Android)
├── cms_web/             # NextJS CMS (Vercel)
├── cloud_functions/     # Firebase Cloud Functions Gen 2
├── scripts/             # Tools, migration, seed data, deploy scripts
├── docs/                # Documentation (existing)
│   └── mockup_app/      # React mockup (source of truth for UI)
└── CLAUDE.md            # Project instructions
```

### Nguyên tắc chung:
1. **Single source of truth**: Design tokens, colors, spacing define 1 lần, dùng chung
2. **Mockup = Spec**: `docs/mockup_app/app.jsx` là bản thiết kế chuẩn, Flutter phải match 100%
3. **Data-driven UI**: Mọi content (templates, stories) load từ JSON, không hardcode
4. **Component-first**: Xây UI components nhỏ → compose thành screens
5. **Shared constants**: Colors, spacing, fonts define ở 1 file → import everywhere

═══════════════════════════════════════════════════════════════════════════
## 1. MOBILE APP (Flutter)
═══════════════════════════════════════════════════════════════════════════

### Folder Structure:

```
mobile_app/
├── pubspec.yaml
├── lib/
│   ├── main.dart                          # Entry point, Firebase init
│   ├── app.dart                           # MaterialApp, routing, theme
│   │
│   ├── core/                              # ═══ SHARED FOUNDATION ═══
│   │   ├── theme/
│   │   │   ├── app_colors.dart            # ALL colors (from C object in mockup)
│   │   │   ├── app_typography.dart        # ALL text styles (Inter, JetBrains Mono)
│   │   │   ├── app_spacing.dart           # ALL spacing constants (padding, margin, radius)
│   │   │   ├── app_gradients.dart         # ALL gradients (hero, btn, story, glow, glass)
│   │   │   ├── app_shadows.dart           # ALL box shadows
│   │   │   └── app_theme.dart             # ThemeData assembly (dark mode default)
│   │   ├── constants/
│   │   │   ├── app_constants.dart         # Magic numbers, limits (10 free glow, etc.)
│   │   │   ├── app_assets.dart            # Local asset paths (splash, onboarding only)
│   │   │   └── app_routes.dart            # Route names + GoRouter config
│   │   ├── extensions/
│   │   │   ├── context_ext.dart           # BuildContext extensions (theme, mediaQuery)
│   │   │   ├── number_ext.dart            # fmt() formatter (1000 → 1.0k)
│   │   │   └── string_ext.dart            # String helpers
│   │   ├── utils/
│   │   │   ├── face_detector.dart         # ML Kit face detection wrapper
│   │   │   ├── image_picker_util.dart     # Camera + gallery picker
│   │   │   └── cache_manager.dart         # JSON + image cache
│   │   └── i18n/
│   │       ├── app_localizations.dart     # i18n setup
│   │       └── l10n/
│   │           ├── app_en.arb             # English strings
│   │           ├── app_vi.arb             # Vietnamese
│   │           ├── app_es.arb             # Spanish
│   │           ├── app_pt.arb             # Portuguese
│   │           ├── app_ja.arb             # Japanese
│   │           └── app_ko.arb             # Korean
│   │
│   ├── data/                              # ═══ DATA LAYER ═══
│   │   ├── models/
│   │   │   ├── user_model.dart            # User profile
│   │   │   ├── template_model.dart        # FlexShot template
│   │   │   ├── story_model.dart           # FlexTale story + chapters
│   │   │   ├── generation_model.dart      # Generation job
│   │   │   ├── story_job_model.dart       # Story generation job
│   │   │   ├── order_model.dart           # Purchase order
│   │   │   ├── credit_log_model.dart      # Credit transaction
│   │   │   ├── vibe_model.dart            # FlexLocket vibe filter
│   │   │   ├── wow_config_model.dart      # WOW subscription config
│   │   │   └── localized_text.dart        # { "en": "...", "vi": "..." } wrapper
│   │   ├── repositories/
│   │   │   ├── auth_repository.dart       # Firebase Auth
│   │   │   ├── user_repository.dart       # Firestore user doc + onSnapshot
│   │   │   ├── template_repository.dart   # Fetch + cache flexshot JSON
│   │   │   ├── story_repository.dart      # Fetch + cache flextale JSON
│   │   │   ├── generation_repository.dart # Firestore generations + onSnapshot
│   │   │   ├── story_job_repository.dart  # Firestore stories + onSnapshot
│   │   │   ├── purchase_repository.dart   # RevenueCat purchases
│   │   │   └── remote_config_repo.dart    # Firebase Remote Config
│   │   └── services/
│   │       ├── firebase_service.dart      # Firebase init + callable functions
│   │       ├── storage_service.dart       # Upload images to Storage
│   │       ├── geo_service.dart           # Call checkGeo CF
│   │       ├── analytics_service.dart     # Firebase Analytics events
│   │       └── notification_service.dart  # FCM setup
│   │
│   ├── providers/                         # ═══ STATE MANAGEMENT (Riverpod) ═══
│   │   ├── auth_provider.dart
│   │   ├── user_provider.dart             # Current user state + credits stream
│   │   ├── template_provider.dart         # Templates list + filters
│   │   ├── story_provider.dart            # Stories list + filters
│   │   ├── generation_provider.dart       # Active generation jobs stream
│   │   ├── navigation_provider.dart       # Current tab, screen stack
│   │   ├── glow_provider.dart             # FlexLocket state (vibe, enhance, usage)
│   │   ├── wow_provider.dart              # WOW wizard + subscription state
│   │   └── remote_config_provider.dart    # Feature flags, pricing
│   │
│   ├── widgets/                           # ═══ SHARED UI COMPONENTS ═══
│   │   ├── common/
│   │   │   ├── flex_header.dart           # Header component (from mockup Header)
│   │   │   ├── flex_icon_btn.dart         # IconBtn (circle icon button)
│   │   │   ├── flex_badge.dart            # ShotBadge, PremiumBadge, CatPill, CreditPill
│   │   │   ├── flex_button.dart           # Primary/secondary/ghost buttons
│   │   │   ├── flex_card.dart             # Base card with border, radius, shadow
│   │   │   ├── flex_toast.dart            # Toast notification overlay
│   │   │   ├── flex_bottom_nav.dart       # BottomNav 4 tabs
│   │   │   ├── flex_filter_bar.dart       # FilterBar + FilterRow (reused in Shot & Tale)
│   │   │   ├── flex_search_bar.dart       # Search input
│   │   │   ├── flex_progress_bar.dart     # Linear progress bar
│   │   │   ├── flex_circular_progress.dart # SVG circular progress (GlowProcessing)
│   │   │   ├── flex_shimmer.dart          # Loading skeleton
│   │   │   ├── flex_cached_image.dart     # Cached network image with placeholder
│   │   │   └── flex_brand_title.dart      # "Flex" white + "Name" gold title
│   │   ├── cards/
│   │   │   ├── shot_card.dart             # Template card (grid item)
│   │   │   ├── shot_hero_card.dart        # Hero spotlight auto-cycling card
│   │   │   ├── editor_pick_card.dart      # Full-width editor's pick
│   │   │   ├── premium_card.dart          # Premium collection horizontal card
│   │   │   ├── story_card_base.dart       # Base story card (shared across 8 styles)
│   │   │   ├── story_card_styles.dart     # 8 visual styles (A-H from mockup)
│   │   │   └── wow_hero_card.dart         # WOW subscription entry card
│   │   └── overlays/
│   │       ├── notif_panel.dart           # Notifications panel
│   │       ├── settings_panel.dart        # Settings panel
│   │       ├── paywall_sheet.dart         # Paywall/subscription overlay
│   │       └── ai_chat_sheet.dart         # AI assistant chat overlay
│   │
│   └── screens/                           # ═══ SCREENS (Page-level) ═══
│       ├── onboarding/
│       │   ├── splash_screen.dart
│       │   ├── tour_screen.dart           # 3-slide onboarding with 3D animations
│       │   ├── personalize_screen.dart
│       │   └── login_screen.dart
│       ├── glow/                          # FlexLocket
│       │   ├── glow_tab.dart              # Camera-first tab (viewfinder + vibes + shutter)
│       │   ├── glow_processing_screen.dart
│       │   └── glow_result_screen.dart
│       ├── create/                        # FlexShot
│       │   ├── create_tab.dart            # Template gallery with filters
│       │   ├── shot_detail_screen.dart
│       │   ├── photo_upload_screen.dart
│       │   ├── shot_processing_screen.dart
│       │   └── shot_result_screen.dart
│       ├── story/                         # FlexTale
│       │   ├── story_tab.dart             # Story gallery with filters
│       │   ├── tale_preview_screen.dart
│       │   ├── tale_processing_screen.dart
│       │   └── tale_reader_screen.dart
│       ├── wow/                           # WOW Everyday
│       │   ├── wow_intro_screen.dart
│       │   ├── wow_setup_screen.dart      # 5-step wizard (steps as internal state)
│       │   ├── wow_dashboard_screen.dart
│       │   └── wow_delivery_screen.dart
│       └── profile/
│           └── me_tab.dart                # Profile + saved + upgrade CTA
```

### Design System Strategy — Define 1 lần, dùng mãi:

#### `app_colors.dart` — SINGLE SOURCE cho tất cả colors:
```dart
class AppColors {
  // Brand
  static const brand     = Color(0xFFF59E0B);
  static const brand400  = Color(0xFFFBBF24);
  static const brand600  = Color(0xFFB45309);
  static const brand800  = Color(0xFF78350F);

  // Semantic
  static const blue      = Color(0xFF3B82F6);
  static const purple    = Color(0xFF7C3AFF);
  static const green     = Color(0xFF10B981);
  static const red       = Color(0xFFEF4444);

  // Surface
  static const bg        = Color(0xFF050505);
  static const card      = Color(0xFF121212);
  static const input     = Color(0xFF1A1A1A);

  // Text
  static const text      = Color(0xFFFFFFFF);
  static const textSec   = Color(0xFFA3A3A3);
  static const textTer   = Color(0xFF525252);

  // Border
  static const border    = Color(0x0FFFFFFF); // 6%
  static const borderMed = Color(0x1AFFFFFF); // 10%
}
```

#### `app_typography.dart` — SINGLE SOURCE cho tất cả text styles:
```dart
class AppTypo {
  static const _inter = 'Inter';
  static const _mono  = 'JetBrains Mono';

  // Headers
  static final h1 = TextStyle(fontFamily: _inter, fontSize: 26, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, letterSpacing: -2);
  static final h2 = TextStyle(fontFamily: _inter, fontSize: 22, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, letterSpacing: -0.5);
  static final h3 = TextStyle(fontFamily: _inter, fontSize: 18, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, letterSpacing: -1);
  static final h4 = TextStyle(fontFamily: _inter, fontSize: 16, fontWeight: FontWeight.w900, fontStyle: FontStyle.italic, letterSpacing: -0.5);

  // Body
  static final body   = TextStyle(fontFamily: _inter, fontSize: 14, fontWeight: FontWeight.w800);
  static final bodyS  = TextStyle(fontFamily: _inter, fontSize: 12, fontWeight: FontWeight.w800);
  static final bodyXs = TextStyle(fontFamily: _inter, fontSize: 11, fontWeight: FontWeight.w700);

  // Caption
  static final caption  = TextStyle(fontFamily: _inter, fontSize: 10, fontWeight: FontWeight.w700);
  static final captionS = TextStyle(fontFamily: _inter, fontSize: 9, fontWeight: FontWeight.w600);
  static final micro    = TextStyle(fontFamily: _inter, fontSize: 8, fontWeight: FontWeight.w700);
  static final nano     = TextStyle(fontFamily: _inter, fontSize: 7, fontWeight: FontWeight.w900, letterSpacing: 1.5);

  // Mono (credits, numbers, code)
  static final mono   = TextStyle(fontFamily: _mono, fontSize: 14, fontWeight: FontWeight.w900);
  static final monoS  = TextStyle(fontFamily: _mono, fontSize: 11, fontWeight: FontWeight.w800);
  static final monoXs = TextStyle(fontFamily: _mono, fontSize: 10, fontWeight: FontWeight.w800);

  // Badge
  static final badge = TextStyle(fontFamily: _inter, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1.5);
}
```

#### `app_spacing.dart` — SINGLE SOURCE cho spacing:
```dart
class AppSpacing {
  // Padding
  static const screenH = 20.0;     // horizontal screen padding
  static const screenTop = 52.0;   // top safe area + padding
  static const sectionGap = 20.0;  // gap between sections

  // Border Radius
  static const radiusXs = 8.0;
  static const radiusS  = 12.0;
  static const radiusM  = 16.0;
  static const radiusL  = 20.0;
  static const radiusXl = 24.0;
  static const radius2xl = 28.0;
  static const radiusFull = 999.0;

  // Icon sizes
  static const iconS  = 12.0;
  static const iconM  = 16.0;
  static const iconL  = 20.0;
  static const iconXl = 24.0;

  // Component sizes
  static const iconBtnSize = 40.0;
  static const shutterSize = 72.0;
  static const avatarSize  = 68.0;
  static const bottomNavH  = 80.0;
  static const headerH     = 56.0;
}
```

### Component Inheritance Strategy:

```
SHARED COMPONENTS (widgets/common/)
      │
      ├── FlexHeader ──────── used by ALL tabs + sub-screens
      ├── FlexIconBtn ─────── used EVERYWHERE (40+ places)
      ├── FlexBadge ─────────┬── ShotBadge (HOT/NEW)
      │                      ├── PremiumBadge (Crown)
      │                      ├── CatPill (category)
      │                      └── CreditPill (Zap + credits)
      ├── FlexButton ────────┬── Primary (gold gradient)
      │                      ├── Secondary (card bg + border)
      │                      └── Ghost (transparent)
      ├── FlexCard ──────────┬── Base card style
      │                      ├── → ShotCard extends
      │                      ├── → StoryCard extends
      │                      └── → WowHeroCard extends
      ├── FlexFilterBar ─────── used by CreateTab + StoryTab (SAME component)
      ├── FlexProgressBar ───── used by Processing screens + WOW dashboard
      ├── FlexBrandTitle ────── "Flex" white + "X" gold (all 3 tab headers)
      └── FlexCachedImage ───── ALL online images go through this
```

### Tại sao component-first quan trọng:

❌ **WRONG**: Define border radius, colors, shadows inline mỗi widget
```dart
// BAD — copy-paste 50 lần
Container(
  decoration: BoxDecoration(
    color: Color(0xFF121212),
    borderRadius: BorderRadius.circular(20),
    border: Border.all(color: Color(0x1AFFFFFF)),
  ),
)
```

✅ **RIGHT**: Dùng shared component
```dart
// GOOD — define 1 lần
FlexCard(
  child: ...,
  variant: CardVariant.elevated, // or .outlined, .ghost
)
```

### Screen Build Order (từ foundation lên):

```
PHASE 0: Foundation (không có UI)
  ├── core/theme/* (colors, typography, spacing, gradients, shadows)
  ├── core/constants/*
  ├── data/models/* (all models)
  └── data/services/firebase_service.dart

PHASE 1: Shared Components
  ├── widgets/common/* (header, button, badge, card, nav, filter, toast)
  └── Test: render mỗi component isolated

PHASE 2: Onboarding Flow
  ├── screens/onboarding/* (splash → tour → personalize → login)
  ├── data/repositories/auth_repository.dart
  └── data/repositories/remote_config_repo.dart

PHASE 3: FlexShot (Create Tab) — FIRST FEATURE
  ├── screens/create/* (tab → detail → upload → processing → result)
  ├── widgets/cards/shot_*.dart
  ├── data/repositories/template_repository.dart
  ├── data/repositories/generation_repository.dart
  └── providers/template_provider.dart, generation_provider.dart

PHASE 4: FlexLocket (Glow Tab)
  ├── screens/glow/* (tab → processing → result)
  ├── providers/glow_provider.dart
  └── core/utils/face_detector.dart

PHASE 5: FlexTale (Story Tab)
  ├── screens/story/* (tab → preview → processing → reader)
  ├── widgets/cards/story_*.dart
  ├── data/repositories/story_repository.dart
  └── providers/story_provider.dart

PHASE 6: WOW Everyday
  ├── screens/wow/* (intro → setup → dashboard → delivery)
  ├── widgets/cards/wow_hero_card.dart
  └── providers/wow_provider.dart

PHASE 7: Profile + Overlays
  ├── screens/profile/me_tab.dart
  ├── widgets/overlays/* (notif, settings, paywall, ai chat)
  └── data/repositories/purchase_repository.dart

PHASE 8: Polish
  ├── Animations (3D card effects, parallax, crossfade)
  ├── i18n (all .arb files)
  ├── RevenueCat integration
  └── Performance optimization (lazy loading, image cache)
```

═══════════════════════════════════════════════════════════════════════════
## 2. CLOUD FUNCTIONS
═══════════════════════════════════════════════════════════════════════════

```
cloud_functions/
├── package.json
├── tsconfig.json
├── .env                               # Secrets (API keys, RevenueCat secret)
├── src/
│   ├── index.ts                       # Export all functions
│   │
│   ├── config/
│   │   ├── firebase.ts                # Firebase Admin init
│   │   ├── ai.ts                      # Gemini + Vertex AI client init
│   │   └── constants.ts               # ENV-based constants (credit costs, etc.)
│   │
│   ├── functions/
│   │   ├── gen_flexshot.ts            # genFlexShot callable
│   │   ├── gen_flextale.ts            # genFlexTale callable
│   │   ├── check_geo.ts              # checkGeo callable
│   │   ├── handle_revenuecat.ts      # handleEventRevenueCat HTTPS
│   │   └── on_user_create.ts         # Auth trigger
│   │
│   ├── services/
│   │   ├── credits_service.ts         # Credit check + deduct (transaction)
│   │   ├── ai_service.ts             # Gemini prompt optimize + Imagen generate
│   │   ├── storage_service.ts        # Download/upload from GCS
│   │   └── user_service.ts           # User doc CRUD
│   │
│   ├── models/
│   │   ├── user.ts                    # User type/interface
│   │   ├── generation.ts              # Generation type
│   │   ├── story.ts                   # Story type
│   │   └── order.ts                   # Order type
│   │
│   └── utils/
│       ├── validators.ts              # Input validation helpers
│       ├── errors.ts                  # Custom HttpsError wrappers
│       └── logger.ts                  # Structured logging
│
├── tests/                             # Unit + integration tests
│   ├── gen_flexshot.test.ts
│   ├── gen_flextale.test.ts
│   └── credits_service.test.ts
│
└── firestore/
    ├── firestore.rules                # Security rules
    ├── firestore.indexes.json         # Composite indexes
    └── storage.rules                  # Storage security rules
```

### Shared Services Pattern:
```
credits_service.ts → used by genFlexShot, genFlexTale, handleRevenueCat
ai_service.ts      → used by genFlexShot, genFlexTale
storage_service.ts → used by genFlexShot, genFlexTale
user_service.ts    → used by onUserCreate, handleRevenueCat
```

═══════════════════════════════════════════════════════════════════════════
## 3. CMS WEB (NextJS)
═══════════════════════════════════════════════════════════════════════════

```
cms_web/
├── package.json
├── next.config.js
├── tailwind.config.js                 # Reuse SAME design tokens as mobile
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout (sidebar nav)
│   │   ├── page.tsx                   # Dashboard
│   │   ├── templates/
│   │   │   ├── page.tsx               # Template list
│   │   │   ├── [id]/page.tsx          # Template edit
│   │   │   └── new/page.tsx           # Template create
│   │   ├── stories/
│   │   │   ├── page.tsx               # Story list
│   │   │   ├── [id]/page.tsx          # Story edit (with chapter editor)
│   │   │   └── new/page.tsx           # Story create
│   │   ├── users/
│   │   │   ├── page.tsx               # User list
│   │   │   └── [id]/page.tsx          # User detail (history, orders)
│   │   └── settings/
│   │       └── page.tsx               # Remote Config, feature flags
│   │
│   ├── components/
│   │   ├── ui/                        # Shadcn/ui or custom primitives
│   │   ├── forms/
│   │   │   ├── template-form.tsx      # Template CRUD form
│   │   │   ├── story-form.tsx         # Story CRUD form
│   │   │   ├── chapter-editor.tsx     # Chapter text + choices + prompt editor
│   │   │   └── localized-input.tsx    # Multi-language input (tabs: EN/VI/ES/...)
│   │   └── layout/
│   │       ├── sidebar.tsx
│   │       └── header.tsx
│   │
│   ├── lib/
│   │   ├── firebase-admin.ts          # Firebase Admin SDK init
│   │   ├── storage.ts                 # GCS upload helpers
│   │   ├── json-publisher.ts          # Generate + upload JSON files to GCS
│   │   └── auth.ts                    # Admin auth check (custom claims)
│   │
│   └── api/                           # API routes (for AI agent)
│       ├── templates/route.ts         # GET/POST /api/templates
│       ├── templates/[id]/route.ts    # GET/PUT/DELETE /api/templates/:id
│       ├── templates/publish/route.ts # POST — generate JSON → GCS
│       ├── stories/route.ts
│       ├── stories/[id]/route.ts
│       ├── stories/publish/route.ts
│       ├── upload/route.ts            # POST — upload image → GCS
│       ├── users/route.ts
│       ├── users/[id]/route.ts
│       └── dashboard/stats/route.ts
│
└── tailwind.config.js
    // QUAN TRỌNG: dùng CHUNG color tokens với mobile_app
    // colors: { brand: '#F59E0B', brand400: '#FBBF24', ... }
```

### CMS chia sẻ design tokens với mobile:
```
Tailwind config colors = AppColors trong Flutter = C object trong mockup
→ Consistency across ALL platforms
```

═══════════════════════════════════════════════════════════════════════════
## 4. SCRIPTS
═══════════════════════════════════════════════════════════════════════════

```
scripts/
├── seed/
│   ├── seed_templates.ts              # Tạo template data từ mockup shots[]
│   ├── seed_stories.ts                # Tạo story data từ mockup tales[]
│   └── seed_users.ts                  # Test users
├── migrate/
│   ├── migrate_schema.ts             # Schema migration scripts
│   └── backfill_i18n.ts              # Backfill translations
├── deploy/
│   ├── deploy_functions.sh           # Deploy Cloud Functions
│   ├── deploy_cms.sh                 # Deploy CMS to Vercel
│   ├── deploy_rules.sh              # Deploy Firestore/Storage rules
│   └── publish_json.sh              # Generate + upload data JSONs to GCS
├── tools/
│   ├── generate_mock_images.ts       # Placeholder image generator
│   ├── validate_json.ts             # Validate template/story JSON schema
│   └── extract_mockup_data.ts       # Extract data from mockup app.jsx → JSON
└── README.md
```

═══════════════════════════════════════════════════════════════════════════
## 5. DESIGN TOKEN FLOW — 1 LẦN DEFINE, 3 NƠI DÙNG
═══════════════════════════════════════════════════════════════════════════

```
SOURCE OF TRUTH: docs/mockup_app/app.jsx → C object + grad object
       │
       ├──→ mobile_app/lib/core/theme/app_colors.dart     (Flutter)
       ├──→ cms_web/tailwind.config.js → colors            (NextJS)
       └──→ cloud_functions/src/config/constants.ts        (nếu cần)

MAPPING:
  Mockup C.brand      = Flutter AppColors.brand    = Tailwind brand
  Mockup C.card       = Flutter AppColors.card     = Tailwind card
  Mockup C.text       = Flutter AppColors.text     = Tailwind text-primary
  ...v.v...
```

### Không bao giờ:
❌ Hardcode `Color(0xFFF59E0B)` trực tiếp trong widget
❌ Define `fontSize: 12, fontWeight: FontWeight.w800` inline
❌ Copy-paste border radius, padding values
❌ Tạo component mới khi đã có component tương tự

### Luôn luôn:
✅ `AppColors.brand` thay vì hex code
✅ `AppTypo.bodyS` thay vì inline TextStyle
✅ `AppSpacing.radiusL` thay vì magic number `20.0`
✅ `FlexCard(child: ...)` thay vì custom Container with decoration

═══════════════════════════════════════════════════════════════════════════
## 6. COMPONENT REUSE MAP
═══════════════════════════════════════════════════════════════════════════

### Mockup component → Flutter widget mapping:

```
MOCKUP COMPONENT          FLUTTER WIDGET              USED IN SCREENS
─────────────────────    ──────────────────────────   ─────────────────────────
Header                →  FlexHeader                →  ALL tabs + sub-screens
IconBtn               →  FlexIconBtn               →  Header, overlays, cards
Banner (gold/glass)   →  FlexCard(variant: ...)    →  Multiple sections
BottomNav             →  FlexBottomNav             →  MainScreen only
ShotBadge             →  FlexBadge.shot(badge)     →  ShotCard, HeroCard
PremiumBadge          →  FlexBadge.premium()       →  ShotCard, detail
CatPill               →  FlexBadge.category(cat)   →  StoryCard
CreditPill            →  FlexBadge.credits(n)      →  ShotCard, StoryCard, detail
FilterBar + FilterRow →  FlexFilterBar             →  CreateTab, StoryTab (SAME)
ShotCard              →  ShotCard                  →  CreateTab grid
EditorPickCard        →  EditorPickCard            →  CreateTab
ShotHero              →  ShotHeroCard              →  CreateTab top
StoryStyleA-H         →  StoryCardBase + variants  →  StoryTab
WowHeroCard           →  WowHeroCard               →  StoryTab top
Toast                 →  FlexToast                 →  Global overlay
```

### Key reuse opportunities:

1. **FlexFilterBar** — CreateTab và StoryTab dùng CHUNG 1 component
   - Khác nhau chỉ ở items[] config (categories, durations)
   - Cùng UI: filter row + search + clear + count

2. **FlexBadge** — Factory pattern cho tất cả badge types
   - `FlexBadge.shot("HOT")` — gold gradient
   - `FlexBadge.premium()` — crown icon
   - `FlexBadge.category("Travel")` — text pill
   - `FlexBadge.credits(2)` — zap + number

3. **Processing screens** — ShotProcessing, TaleProcessing, GlowProcessing
   - Share: progress logic, animation base, cancel button
   - Differ: step labels, icon, layout

4. **Result screens** — ShotResult, GlowResult
   - Share: save/share buttons, action bar pattern
   - Differ: content area (single image vs before/after)

═══════════════════════════════════════════════════════════════════════════
## 7. BUILD & DEPLOY WORKFLOW
═══════════════════════════════════════════════════════════════════════════

```
Development:
  mobile_app   → flutter run (iOS Simulator / Android Emulator)
  cms_web      → npm run dev (localhost:3000)
  cloud_func   → firebase emulators:start (local emulator suite)

Testing:
  mobile_app   → flutter test + integration tests
  cms_web      → npm test (Jest/Vitest)
  cloud_func   → npm test (Jest with Firebase emulator)

Deploy:
  cloud_func   → firebase deploy --only functions
  cms_web      → vercel deploy (auto via git push)
  mobile_app   → flutter build ios / flutter build apk
  data JSONs   → scripts/deploy/publish_json.sh
  rules        → firebase deploy --only firestore:rules,storage
```

═══════════════════════════════════════════════════════════════════════════
## 8. ANTI-PATTERNS — TRÁNH TUYỆT ĐỐI
═══════════════════════════════════════════════════════════════════════════

### ❌ DON'T:
1. Define colors inline: `Color(0xFF121212)` — dùng `AppColors.card`
2. Define text styles inline: `TextStyle(fontSize: 12, ...)` — dùng `AppTypo.bodyS`
3. Copy-paste widget code between screens — extract shared component
4. Hardcode strings — dùng i18n `.arb` files
5. Put business logic in widgets — dùng providers/repositories
6. Import Firebase directly in widgets — go through repository layer
7. Define filter items differently in CreateTab vs StoryTab — dùng chung FlexFilterBar
8. Create separate processing screen widgets when they share 80% code
9. Hardcode image URLs — load from JSON data
10. Put AI prompt logic in client — ALL AI logic stays in Cloud Functions

### ✅ DO:
1. Mọi widget chỉ biết `AppColors`, `AppTypo`, `AppSpacing`
2. Mọi data access qua repository pattern
3. Mọi state management qua Riverpod providers
4. Mọi navigation qua GoRouter
5. Mọi image qua FlexCachedImage (handles loading, error, placeholder)
6. Test mỗi component isolated trước khi compose vào screen
7. Keep mockup_app/app.jsx as the SINGLE SOURCE OF TRUTH for UI design
