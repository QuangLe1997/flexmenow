# FlexMe Project

## Overview
FlexMe (flexmenow.com) - AI-powered social media content creation app.
Users upload their photo + choose templates to generate "flex" images and story series.

## Project Structure
```
flexmenow/
├── CLAUDE.md                      # This file
├── docs/
│   ├── PROJECT_OVERVIEW.md        # App concept, features, monetization
│   ├── SYSTEM_ARCHITECTURE.md     # Full Firebase + Vertex AI architecture
│   ├── USER_FLOW.md               # UX flows for all features
│   ├── DATABASE_SCHEMA.md         # Cloud Firestore collections/documents
│   ├── API_DESIGN.md              # Cloud Functions (callable + triggers)
│   ├── TECH_ROADMAP.md            # Phase 1-4 development plan
│   └── TEMPLATE_IDEAS.md          # Template & story pack content ideas
├── design/                        # UI mockups, wireframes
└── src/                           # Source code (upcoming)
```

## Tech Stack (Full Firebase)
- **Frontend:** Next.js 14 + TailwindCSS (PWA)
- **Hosting:** Firebase Hosting
- **Backend:** Cloud Functions Gen 2 (Node.js/TypeScript)
- **Auth:** Firebase Auth (Google/Apple SSO)
- **Database:** Cloud Firestore (NoSQL)
- **Storage:** Firebase Storage (GCS)
- **AI Logic:** Gemini AI SDK (@google/genai)
- **AI Image:** Vertex AI Imagen API
- **Realtime:** Firestore onSnapshot (built-in)
- **Payment:** Stripe (via Cloud Functions)
- **Analytics:** Firebase Analytics + Crashlytics
- **Push:** Firebase Cloud Messaging (FCM)
- **Config:** Firebase Remote Config

## Key Decisions
- Full Firebase stack (single platform, minimal ops)
- PWA instead of native app (1 codebase, no app store)
- Gemini SDK for prompt engineering + content moderation
- Vertex AI Imagen for image generation (no self-hosted GPU)
- Firestore onSnapshot for realtime (no WebSocket needed)
- Cloud Functions Gen 2 for all backend logic
- Region: asia-southeast1 (Singapore)
