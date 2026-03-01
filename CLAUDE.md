# FlexMe Project

## Overview
FlexMe (flexmenow.com) - AI-powered social media content creation app for global users.
3 core features: FlexLocket (subtle photo enhancement), FlexShot (template-based image generation), FlexTale (AI story series generation).
Primary language: English. Multi-language support via i18n (EN, VI, ES, PT, JA, KO).
Dark mode default. Mobile-first PWA.

## Project Structure
```
flexmenow/
├── CLAUDE.md
├── mobile_app/                    # Flutter app (iOS + Android)
│   └── lib/
│       ├── core/                  # Theme, constants, i18n, utils (SHARED FOUNDATION)
│       ├── data/                  # Models, repositories, services (DATA LAYER)
│       ├── providers/             # Riverpod state management
│       ├── widgets/               # Shared UI components (REUSABLE)
│       └── screens/               # Page-level screens (onboarding, glow, create, story, wow, profile)
├── cms_web/                       # NextJS CMS deployed on Vercel
│   └── src/
│       ├── app/                   # Pages (templates, stories, users, dashboard)
│       ├── components/            # UI components + forms
│       ├── lib/                   # Firebase Admin, GCS, auth
│       └── api/                   # REST API routes (for AI agent automation)
├── cloud_functions/               # Firebase Cloud Functions Gen 2
│   └── src/
│       ├── functions/             # genFlexShot, genFlexTale, checkGeo, handleRevenueCat, onUserCreate
│       ├── services/              # credits, AI, storage, user (shared logic)
│       ├── models/                # TypeScript interfaces
│       └── config/                # Firebase init, AI clients, constants
├── scripts/                       # Seed data, migration, deploy, tools
├── docs/
│   ├── mockup_app/                # React mockup (SOURCE OF TRUTH for UI design)
│   ├── BUILD_STRATEGY.md          # Build strategy, component architecture, design system
│   ├── PROJECT_OVERVIEW.md        # App concept, 3 features, monetization
│   ├── SYSTEM_ARCHITECTURE.md     # Firebase + Vertex AI + i18n architecture
│   ├── DATABASE_SCHEMA.md         # Cloud Firestore collections
│   ├── API_DESIGN.md              # Cloud Functions API design
│   ├── UI_SPEC_MOBILE.md          # Screen-by-screen mobile UI spec
│   ├── TECH_ROADMAP.md            # Phase 1-4 development plan
│   ├── COMPETITOR_UI_ANALYSIS.md  # Research on 12+ competitor apps
│   └── ... (other docs)
├── design/                        # UI mockups, wireframes
└── public/                        # Static assets
```

## Tech Stack
- **Mobile App:** Flutter (latest stable) — iOS + Android native
- **CMS:** Next.js 14+ (App Router) + TailwindCSS — deployed on Vercel
- **Backend:** Cloud Functions Gen 2 (Node.js 20 / TypeScript)
- **Auth:** Firebase Auth (Google/Apple SSO)
- **Database:** Cloud Firestore (NoSQL, i18n-ready)
- **Storage:** Firebase Storage (GCS) → CDN for all media
- **AI Logic:** Gemini AI SDK (@google/genai) — prompt optimization
- **AI Image:** Vertex AI Imagen API — image generation
- **Realtime:** Firestore onSnapshot (credits, generation progress, story progress)
- **Payment:** RevenueCat (IAP middleware) → webhook to Cloud Function
- **Analytics:** Firebase Analytics + Crashlytics
- **Push:** Firebase Cloud Messaging (FCM)
- **Config:** Firebase Remote Config (feature flags, pricing, content URLs)
- **Face Detection:** Google ML Kit (on-device, pre-upload validation)
- **i18n:** flutter_localizations + intl (6 languages: EN, VI, ES, PT, JA, KO)
- **State:** Riverpod (Flutter state management)
- **Navigation:** GoRouter (Flutter routing)

## Key Decisions
- Global audience, English-first, multi-language from Day 1
- Full Firebase stack (single platform, minimal ops)
- Flutter native app (iOS + Android) — NOT PWA
- RevenueCat for IAP subscription + credit packs (webhook → CF)
- Gemini SDK for prompt engineering + content moderation
- Vertex AI Imagen for image generation (no self-hosted GPU)
- Firestore onSnapshot for realtime (no WebSocket needed)
- Cloud Functions Gen 2 for all backend logic
- Region: asia-southeast1 (Singapore)
- Dark mode default (industry standard for AI photo apps)
- Royal Gold #F59E0B (Zap Amber) brand identity — "Flex" white + "Me" gold, VIP luxury
- No paywall in onboarding (FlexLocket free hook → paid upgrade later)
- Tab labels max 5 chars for i18n: Glow / Create / Story / Me
- Icon-driven UI to reduce translation burden
- Brand names never translated: FlexMe, FlexLocket, FlexShot, FlexTale
- Design tokens define 1 lần, dùng chung across Flutter + CMS + mockup
- Component-first: shared widgets → compose into screens
- Data-driven UI: templates/stories load from JSON (GCS), not hardcoded
- docs/mockup_app/app.jsx = SOURCE OF TRUTH for all UI design
- See docs/BUILD_STRATEGY.md for full architecture + component strategy

## 3 Core Features
1. **FlexLocket (Glow)** — Subtle, undetectable AI photo enhancement. Retention driver. Free 10/day.
2. **FlexShot (Create)** — Template-based AI image generation. Viral acquisition. 1-2 credits.
3. **FlexTale (Story)** — AI story series with N images + captions. Revenue driver. 5-15 credits.

## Development Priority
Phase 1 MVP (4 wks): FlexShot only + Firebase + i18n foundation
Phase 1.5 (2 wks): FlexLocket
Phase 2 (4 wks): FlexTale (preset stories)
Phase 3 (4 wks): Growth + social + FlexTale custom
