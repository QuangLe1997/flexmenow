# FlexMe - System Architecture

## High-Level Architecture

```
CLIENTS (PWA + Web)
        |
   Next.js 14 (SSR + SPA)
   TailwindCSS + Framer Motion
        |
        | HTTPS
        v
Firebase Hosting (CDN + SSL)
        |
        v
Cloud Functions (Gen 2 - Node.js/TypeScript)
   |- Auth triggers
   |- HTTPS callable functions
   |- Firestore triggers
   |- Scheduled functions
        |
   +----+----+----------+
   |         |           |
   v         v           v
Firebase   Firestore   Firebase
Auth       (NoSQL DB)  Storage
   |         |           |
   |         |           v
   |         |      Firebase CDN
   |         |      (auto cache images)
   |         |
   v         v
Gemini AI / Vertex AI (Image Generation)
   |- Gemini AI SDK (logic, prompt engineering)
   |- Vertex AI Imagen API (image gen + edit)
   |- Called via Cloud Functions
```

## Tech Stack

| Layer | Technology | Ly do |
|-------|-----------|-------|
| **Frontend** | Next.js 14 + TailwindCSS | SSR, responsive, PWA-ready |
| **Mobile** | PWA (Progressive Web App) | 1 codebase, khong can app store |
| **Hosting** | Firebase Hosting | CDN global, SSL auto, preview channels |
| **Backend** | Cloud Functions Gen 2 (Node.js/TS) | Serverless, auto-scale, tich hop Firebase |
| **Auth** | Firebase Auth | Google/Apple SSO, anonymous, OTP |
| **Database** | Cloud Firestore | NoSQL, realtime listeners, offline support |
| **Storage** | Firebase Storage (GCS) | Upload truc tiep tu client, security rules |
| **AI - Logic** | Gemini AI SDK (@google/genai) | Prompt engineering, content moderation, caption gen |
| **AI - Image** | Vertex AI Imagen API | Image generation, editing, style transfer |
| **Realtime** | Firestore onSnapshot | Realtime progress updates (thay WebSocket) |
| **Queue** | Cloud Tasks / Firestore triggers | Job queue cho AI generation |
| **Payment** | Stripe + Extensions | Firebase Stripe Extension co san |
| **Analytics** | Firebase Analytics + Crashlytics | User tracking, error monitoring |
| **Remote Config** | Firebase Remote Config | Feature flags, A/B testing |
| **Notifications** | Firebase Cloud Messaging (FCM) | Push notifications |

## AI Generation Pipeline

### Feature 1: Single Image (via Cloud Functions)

```
Client: Upload portrait -> Firebase Storage
    |
    v
Client: Call CF "generateSingle" (callable)
    |  Params: { imageUrl, templateId, style }
    |
    v
Cloud Function:
    |
    ├── 1. Validate user credits (Firestore)
    ├── 2. Deduct credits (Firestore transaction)
    ├── 3. Get template prompt (Firestore)
    ├── 4. Download user image (Firebase Storage)
    |
    ├── 5. Call Vertex AI Imagen API:
    |      |- Input: user face image + template prompt
    |      |- Model: imagen-3.0-generate / imagen-3.0-edit
    |      |- Params: style, guidance_scale, etc.
    |
    ├── 6. Upload output -> Firebase Storage
    ├── 7. Update Firestore: job status = "completed"
    |
    v
Client: onSnapshot(job_doc) -> realtime update -> show result
```

### Feature 2: Story Series (via Cloud Functions)

```
Client: Upload portrait -> Firebase Storage
Client: Call CF "generateStory" (callable)
    |
    v
Cloud Function (orchestrator):
    |
    ├── 1. Validate credits
    ├── 2. Create story doc in Firestore (status: processing)
    ├── 3. Deduct credits
    |
    ├── 4. For each scene in story pack:
    |      |
    |      ├── Build scene prompt (Gemini SDK)
    |      |   |- Gemini tao prompt chi tiet tu scene template
    |      |   |- Dam bao consistency giua cac scene
    |      |
    |      ├── Call Vertex AI Imagen API
    |      |   |- Generate image cho scene
    |      |   |- Reference image = user portrait
    |      |
    |      ├── Upload scene image -> Firebase Storage
    |      ├── Update Firestore: scene status = "completed"
    |      |   (Client nhan realtime update qua onSnapshot)
    |      |
    |      └── Next scene...
    |
    ├── 5. Update story status = "completed"
    v
Client: onSnapshot(story_doc) -> tung scene hien len realtime
```

### Gemini AI Roles

| Role | Cach dung |
|------|----------|
| **Prompt Engineering** | Gemini nhan scene template + user preferences -> tao optimized prompt cho Imagen |
| **Content Moderation** | Gemini check anh upload co appropriate khong truoc khi gen |
| **Caption Generation** | Gemini tao caption/story text cho tung anh de user post MXH |
| **Style Consistency** | Gemini phan tich scene truoc -> adjust prompt scene sau cho nhat quan |
| **Template Suggestion** | Gemini recommend template phu hop dua tren anh user upload |

### Vertex AI Imagen Roles

| Role | API |
|------|-----|
| **Image Generation** | `imagen-3.0-generate-001` - Tao anh tu prompt |
| **Image Editing** | `imagen-3.0-edit-001` - Edit anh (thay nen, them element) |
| **Subject Reference** | Reference image input - Giu nhat quan khuon mat |
| **Style Variation** | Style parameters - Realistic, Artistic, Anime |

## Firebase Project Structure

```
flexme-prod (Firebase Project)
├── Authentication
│   ├── Google Sign-In
│   ├── Apple Sign-In
│   └── Email/Password + OTP
│
├── Cloud Firestore
│   ├── users/{userId}
│   ├── templates/{templateId}
│   ├── storyPacks/{packId}
│   │   └── scenes/{sceneId}
│   ├── generations/{genId}        (single image jobs)
│   ├── stories/{storyId}          (story series jobs)
│   │   └── scenes/{sceneId}
│   ├── orders/{orderId}
│   └── creditLogs/{logId}
│
├── Firebase Storage
│   ├── uploads/{userId}/{filename}     (user uploads)
│   ├── generated/{userId}/{genId}/     (output images)
│   ├── templates/{templateId}/         (template previews)
│   └── story-packs/{packId}/           (story pack previews)
│
├── Cloud Functions (Gen 2)
│   ├── auth/
│   │   └── onUserCreate              (init user doc)
│   ├── generation/
│   │   ├── generateSingle            (callable - Feature 1)
│   │   ├── generateStory             (callable - Feature 2)
│   │   └── regenerateScene           (callable - re-gen 1 scene)
│   ├── payments/
│   │   ├── createCheckout            (callable)
│   │   └── stripeWebhook             (HTTPS)
│   ├── credits/
│   │   ├── dailyFreeCredits          (scheduled - moi ngay)
│   │   └── checkExpiredSubs          (scheduled)
│   └── admin/
│       ├── manageTemplates           (callable)
│       └── manageStoryPacks          (callable)
│
├── Firebase Hosting
│   └── Next.js app (SSR via Cloud Functions)
│
├── Firebase Analytics
├── Firebase Crashlytics
├── Firebase Remote Config
└── Firebase Cloud Messaging
```

## Security Rules

### Firestore Rules (core)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users: chi doc/sua cua minh
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow update: if request.auth.uid == userId
                    && !request.resource.data.diff(resource.data)
                       .affectedKeys()
                       .hasAny(['credits_balance', 'subscription_plan']);
      // credits & subscription chi Cloud Functions moi duoc sua
    }

    // Templates: ai cung doc duoc
    match /templates/{templateId} {
      allow read: if request.auth != null;
      allow write: if false; // chi admin qua CF
    }

    // Story Packs: ai cung doc duoc
    match /storyPacks/{packId} {
      allow read: if request.auth != null;
      match /scenes/{sceneId} {
        allow read: if request.auth != null;
      }
    }

    // Generations: chi owner doc duoc
    match /generations/{genId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create, update, delete: if false; // chi CF
    }

    // Stories: chi owner doc duoc
    match /stories/{storyId} {
      allow read: if request.auth.uid == resource.data.userId;
      match /scenes/{sceneId} {
        allow read: if request.auth.uid ==
          get(/databases/$(database)/documents/stories/$(storyId)).data.userId;
      }
    }

    // Orders: chi owner doc duoc
    match /orders/{orderId} {
      allow read: if request.auth.uid == resource.data.userId;
    }
  }
}
```

### Storage Rules (core)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // User uploads: chi owner upload, max 10MB, chi image
    match /uploads/{userId}/{fileName} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // Generated images: chi owner doc
    match /generated/{userId}/{allPaths=**} {
      allow read: if request.auth.uid == userId;
      allow write: if false; // chi CF
    }

    // Templates & story packs: public read
    match /templates/{allPaths=**} {
      allow read: if request.auth != null;
    }
    match /story-packs/{allPaths=**} {
      allow read: if request.auth != null;
    }
  }
}
```

## Estimated Monthly Cost (Launch Phase)

| Service | Free Tier | Estimated Cost |
|---------|-----------|---------------|
| Firebase Hosting | 10GB/month | $0 |
| Cloud Functions | 2M invocations/month | $0 - $20 |
| Firestore | 50K reads, 20K writes/day | $0 - $25 |
| Firebase Storage | 5GB stored, 1GB/day download | $0 - $15 |
| Firebase Auth | 10K/month free | $0 |
| Vertex AI Imagen | ~$0.02-0.04/image | $50 - $200 (tuy usage) |
| Gemini API | Free tier generous | $0 - $20 |
| Stripe fees | 2.9% + $0.30/transaction | Variable |
| Domain | flexmenow.com | ~$12/year |
| **Total** | | **~$50 - $280/thang** |

## So Sanh Voi Architecture Cu

| Aspect | Cu (Multi-service) | Moi (Full Firebase) |
|--------|-------------------|---------------------|
| Services quan ly | 6-7 (Vercel, Railway, Supabase, Redis, RunPod, R2) | 1 (Firebase + Vertex AI) |
| Deploy complexity | Cao | Thap (firebase deploy) |
| Cost | $70-300/thang | $50-280/thang |
| Realtime | WebSocket (tu build) | Firestore onSnapshot (built-in) |
| Auth | Tu integrate | Firebase Auth (built-in) |
| Scaling | Tu config | Auto (Firebase managed) |
| Vendor lock-in | Thap | Cao (Google ecosystem) |
| AI quality | Flux.1 + IP-Adapter (best) | Imagen 3 (rat tot, dang improve) |
