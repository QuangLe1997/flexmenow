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
├── docs/
│   ├── PROJECT_OVERVIEW.md        # App concept, 3 features, monetization
│   ├── CORE_FEATURES.md           # Detailed 3 feature specs (FlexLocket/FlexShot/FlexTale)
│   ├── SYSTEM_ARCHITECTURE.md     # Full Firebase + Vertex AI + i18n architecture
│   ├── USER_FLOW.md               # UX flows for all 3 features + onboarding
│   ├── DATABASE_SCHEMA.md         # Cloud Firestore collections (i18n-ready)
│   ├── API_DESIGN.md              # Cloud Functions (callable + triggers + preview)
│   ├── TECH_ROADMAP.md            # Phase 1-4 development plan
│   ├── TEMPLATE_IDEAS.md          # Template & story pack content ideas
│   ├── DESIGN_SYSTEM.md           # Colors, typography, components, animations
│   ├── UI_SPEC_MOBILE.md          # Screen-by-screen mobile UI spec (English-first)
│   ├── COMPETITOR_UI_ANALYSIS.md  # Research on 12+ competitor apps
│   ├── PO_REVIEW.md               # Product Owner review & recommendations
│   ├── FLEXLOCKET_ANALYSIS.md     # FlexLocket positioning deep dive
│   └── FLEXME_GIOI_THIEU.md       # Vietnamese product introduction
├── design/                        # UI mockups, wireframes
└── src/                           # Source code (upcoming)
    └── locales/                   # i18n locale JSON files
        ├── en.json                # English (primary, source of truth)
        ├── vi.json                # Vietnamese
        ├── es.json                # Spanish
        ├── pt.json                # Portuguese
        ├── ja.json                # Japanese
        └── ko.json                # Korean
```

## Tech Stack (Full Firebase)
- **Frontend:** Next.js 14 + TailwindCSS + next-intl (i18n) + Framer Motion (PWA)
- **Hosting:** Firebase Hosting (global CDN)
- **Backend:** Cloud Functions Gen 2 (Node.js/TypeScript)
- **Auth:** Firebase Auth (Google/Apple SSO)
- **Database:** Cloud Firestore (NoSQL, multi-locale content fields)
- **Storage:** Firebase Storage (GCS)
- **AI Logic:** Gemini AI SDK (@google/genai)
- **AI Image:** Vertex AI Imagen API
- **Realtime:** Firestore onSnapshot (built-in)
- **Payment:** Stripe (via Cloud Functions)
- **Analytics:** Firebase Analytics + Crashlytics
- **Push:** Firebase Cloud Messaging (FCM)
- **Config:** Firebase Remote Config
- **i18n:** next-intl (6 languages: EN, VI, ES, PT, JA, KO)

## Key Decisions
- Global audience, English-first, multi-language from Day 1
- Full Firebase stack (single platform, minimal ops)
- PWA instead of native app (1 codebase, no app store)
- Gemini SDK for prompt engineering + content moderation
- Vertex AI Imagen for image generation (no self-hosted GPU)
- Firestore onSnapshot for realtime (no WebSocket needed)
- Cloud Functions Gen 2 for all backend logic
- Region: asia-southeast1 (Singapore)
- Dark mode default (industry standard for AI photo apps)
- Royal Gold #F59E0B (Zap Amber) brand identity — "Flex" white + "Me" gold, VIP luxury
- No paywall in onboarding (FlexLocket free hook → paid upgrade later)
- Tab labels max 5 chars for i18n: Glow / Create / Story / Me (Saved merged into Me)
- RTL-ready CSS (start/end not left/right)
- Icon-driven UI to reduce translation burden
- Brand names never translated: FlexMe, FlexLocket, FlexShot, FlexTale

## 3 Core Features
1. **FlexLocket (Glow)** — Subtle, undetectable AI photo enhancement. Retention driver. Free 10/day.
2. **FlexShot (Create)** — Template-based AI image generation. Viral acquisition. 1-2 credits.
3. **FlexTale (Story)** — AI story series with N images + captions. Revenue driver. 5-15 credits.

## Development Priority
Phase 1 MVP (4 wks): FlexShot only + Firebase + i18n foundation
Phase 1.5 (2 wks): FlexLocket
Phase 2 (4 wks): FlexTale (preset stories)
Phase 3 (4 wks): Growth + social + FlexTale custom
