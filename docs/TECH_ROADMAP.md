# FlexMe - Tech Roadmap

## Phase 1: MVP (4-6 tuan)
**Muc tieu:** Launch Feature 1 (Single Image Gen) + auth + payment

### Week 1-2: Firebase Foundation
- [ ] Create Firebase project (flexme-prod)
- [ ] Setup Next.js 14 + TailwindCSS + Firebase SDK
- [ ] Firebase Auth setup (Google SSO)
- [ ] Cloud Firestore schema + security rules
- [ ] Firebase Storage setup + security rules
- [ ] Cloud Functions Gen 2 scaffold (TypeScript)
- [ ] Firebase Hosting config
- [ ] Basic UI: Landing page, Login, Home dashboard
- [ ] Enable Vertex AI + Gemini API in GCP console

### Week 3-4: Feature 1 - Flex Anh
- [ ] Image upload component (crop, validate, upload to Storage)
- [ ] Template gallery UI (query Firestore)
- [ ] Cloud Function: generateSingle
  - [ ] Gemini prompt optimization
  - [ ] Vertex AI Imagen integration
  - [ ] Upload result to Storage
  - [ ] Firestore status updates
- [ ] Realtime progress UI (Firestore onSnapshot)
- [ ] Result screen: preview, download, share
- [ ] Seed 10-20 templates vao Firestore

### Week 5-6: Credits, Payment, Polish
- [ ] Credit system (Firestore transactions)
- [ ] Cloud Function: onUserCreate (init 3 free credits)
- [ ] Cloud Function: dailyFreeCredits (scheduled)
- [ ] Stripe integration (createCheckoutSession + webhook)
- [ ] Gallery page (query user's generations)
- [ ] Responsive mobile UI
- [ ] PWA manifest + service worker
- [ ] Firebase Analytics setup
- [ ] Testing + Bug fixes
- [ ] Deploy: firebase deploy

### Deliverables Phase 1:
- Web app responsive (mobile + desktop) on Firebase Hosting
- Google login (Firebase Auth)
- 10-20 templates
- Single image generation (Gemini + Vertex AI Imagen)
- Credit system + Stripe payment
- Gallery with realtime updates
- PWA installable

---

## Phase 2: Story Series (3-4 tuan)
**Muc tieu:** Launch Feature 2 (Flex Story)

### Week 7-8: Story Engine
- [ ] Firestore: storyPacks collection + scenes subcollection
- [ ] Cloud Function: generateStory (orchestrate multi-scene)
- [ ] Gemini: story prompt consistency engine
- [ ] Vertex AI: subject reference across scenes
- [ ] Cloud Function: regenerateScene
- [ ] Realtime story progress (onSnapshot scenes subcollection)

### Week 9-10: Story UX + Content
- [ ] Story pack gallery UI
- [ ] Story timeline/preview UI
- [ ] Scene-by-scene review screen
- [ ] Re-generate single scene UI
- [ ] Seed 5-10 story packs:
  - Du lich Paris 7 ngay
  - Du lich Tokyo
  - Co ny roi ne
  - CEO Lifestyle
  - Gym Transformation
- [ ] Export: download all (ZIP), share

### Deliverables Phase 2:
- 5-10 story packs
- Story series generation (5-15 anh/series)
- Realtime scene-by-scene progress
- Scene review + re-gen
- Bulk download

---

## Phase 3: Growth + Social (4-6 tuan)

### Features
- [ ] Apple SSO (Firebase Auth)
- [ ] Firebase Cloud Messaging (push notifications)
- [ ] Firebase Remote Config (feature flags, A/B test)
- [ ] Share truc tiep len IG/TikTok (Web Share API)
- [ ] #FlexMe challenge system
- [ ] Leaderboard "Flex dinh nhat tuan"
- [ ] Referral program (moi ban +5 credits)
- [ ] User feedback / rating templates
- [ ] Gemini: AI caption generator cho moi anh
- [ ] MoMo/ZaloPay integration (VN market)
- [ ] Admin dashboard (React + Firebase Admin SDK):
  - User analytics (Firebase Analytics)
  - Revenue tracking
  - Template management
  - Story pack management

---

## Phase 4: Scale + Expand (Ongoing)

### Features
- [ ] Custom story creator (user tu tao storyline)
- [ ] Video generation (Vertex AI video gen)
- [ ] Anime / Cartoon style packs
- [ ] Multi-language (EN, VI, TH, ID)
- [ ] Schedule post (Cloud Tasks + social APIs)
- [ ] AI caption + hashtag generator (Gemini)
- [ ] Brand partnerships (template sponsor)
- [ ] Firebase Extensions marketplace

### Infrastructure
- [ ] Multi-region Firestore
- [ ] Cloud CDN optimization
- [ ] Batch generation (Cloud Tasks)
- [ ] Cost optimization (Gemini caching, image compression)
- [ ] Firebase App Check (abuse prevention)

---

## KPIs Theo Phase

| Phase | KPI | Target |
|-------|-----|--------|
| Phase 1 | DAU | 100-500 |
| Phase 1 | Conversion (free -> paid) | 3-5% |
| Phase 2 | DAU | 1,000-5,000 |
| Phase 2 | Revenue | $500-2,000/thang |
| Phase 3 | DAU | 10,000+ |
| Phase 3 | Revenue | $5,000+/thang |
| Phase 4 | MAU | 100,000+ |
| Phase 4 | Revenue | $20,000+/thang |

---

## Firebase CLI Commands (Quick Reference)

```bash
# Init project
firebase init hosting functions firestore storage

# Deploy all
firebase deploy

# Deploy chi functions
firebase deploy --only functions

# Deploy chi 1 function
firebase deploy --only functions:generateSingle

# Emulator local dev
firebase emulators:start

# Preview channel (staging)
firebase hosting:channel:deploy staging
```
