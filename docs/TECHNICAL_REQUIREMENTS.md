# FLEXME — TECHNICAL REQUIREMENTS SPECIFICATION
# Version 2.0 — March 2026
# Based on: docs/mockup_app/app.jsx + existing architecture docs

═══════════════════════════════════════════════════════════════════════════
## 1. DATA JSON — FlexShot Templates
═══════════════════════════════════════════════════════════════════════════

File: `flexshot_templates.json` (hosted on GCS, URL in Remote Config)
App fetches this JSON on launch → caches locally → renders UI.

### Schema per template item:

```json
{
  "id": "t001",
  "name": {
    "en": "Paris Eiffel",
    "vi": "Paris Eiffel",
    "es": "París Eiffel",
    "pt": "Paris Eiffel",
    "ja": "パリ エッフェル",
    "ko": "파리 에펠"
  },
  "category": "travel",         // "travel" | "luxury" | "lifestyle" | "art" | "seasonal"
  "type": "travel",             // "travel" | "sexy" | "business" | "trend" | "traditional"
  "gender": "female",           // "male" | "female" | "couple" | "all"
  "style": "Realistic",         // "Realistic" | "Cinematic" | "Corporate" | "Anime" | "Bright" | "Warm" | "Cyberpunk" | "Strong" | "Festive" | "Fashion"
  "credits": 1,                 // cost per generation (overridden by Remote Config default price)
  "badge": "HOT",               // "HOT" | "NEW" | "TRENDING" | null
  "premium": false,             // requires paid subscription
  "isActive": true,             // false = hidden from app
  "sortOrder": 1,               // display order
  "coverImage": "https://cdn.flexmenow.com/templates/t001/cover.png",
  "previewImages": [
    "https://cdn.flexmenow.com/templates/t001/preview_1.png",
    "https://cdn.flexmenow.com/templates/t001/preview_2.png",
    "https://cdn.flexmenow.com/templates/t001/preview_3.png"
  ],
  "prompt": {
    "base": "A photo of {subject} standing in front of the Eiffel Tower in Paris, golden hour lighting, cinematic composition, 8k",
    "negative": "blurry, distorted face, extra limbs, watermark, text, low quality",
    "styleHint": "warm tones, film grain, shallow depth of field"
  },
  "aiConfig": {
    "model": "imagen-3.0-generate-001",
    "guidanceScale": 7.5,
    "aspectRatio": "3:4",
    "numberOfImages": 1,
    "safetyFilterLevel": "BLOCK_MEDIUM_AND_ABOVE",
    "referenceType": "SUBJECT_REFERENCE",
    "seed": null
  },
  "stats": {
    "likes": 12345,
    "views": 45200,
    "generates": 8900
  },
  "tags": ["paris", "eiffel", "travel", "france", "golden hour"],
  "createdAt": "2026-01-15T00:00:00Z",
  "updatedAt": "2026-02-20T00:00:00Z"
}
```

### Top-level JSON structure:

```json
{
  "version": "1.0.0",
  "updatedAt": "2026-03-01T00:00:00Z",
  "defaults": {
    "creditsPerTemplate": 1,
    "premiumCreditsPerTemplate": 2
  },
  "categories": [
    { "id": "travel", "name": { "en": "Travel", "vi": "Du lịch", ... }, "icon": "camera", "sortOrder": 1 },
    { "id": "luxury", "name": { "en": "Luxury", "vi": "Sang trọng", ... }, "icon": "crown", "sortOrder": 2 },
    { "id": "lifestyle", "name": { "en": "Lifestyle", "vi": "Phong cách", ... }, "icon": "sparkles", "sortOrder": 3 },
    { "id": "art", "name": { "en": "Art", "vi": "Nghệ thuật", ... }, "icon": "palette", "sortOrder": 4 },
    { "id": "seasonal", "name": { "en": "Seasonal", "vi": "Mùa lễ", ... }, "icon": "flame", "sortOrder": 5 }
  ],
  "types": [
    { "id": "travel", "name": { "en": "Travel", "vi": "Du lịch", ... } },
    { "id": "sexy", "name": { "en": "Sexy", "vi": "Quyến rũ", ... } },
    { "id": "business", "name": { "en": "Business", "vi": "Doanh nhân", ... } },
    { "id": "trend", "name": { "en": "Trending", "vi": "Xu hướng", ... } },
    { "id": "traditional", "name": { "en": "Traditional", "vi": "Truyền thống", ... } }
  ],
  "genders": [
    { "id": "all", "name": { "en": "All", "vi": "Tất cả", ... } },
    { "id": "male", "name": { "en": "Male", "vi": "Nam", ... } },
    { "id": "female", "name": { "en": "Female", "vi": "Nữ", ... } },
    { "id": "couple", "name": { "en": "Couple", "vi": "Cặp đôi", ... } }
  ],
  "templates": [
    { ... template items ... }
  ]
}
```

### Filter & Search (processed locally on device):
- Filter by: `category`, `type`, `gender`, `premium`, `badge`
- Search by: `name[deviceLang]`, `tags[]`
- Search enable/disable: based on device language (Remote Config `searchSupportedLangs`)
- Sort by: `sortOrder` (default), `stats.likes`, `stats.views`, `createdAt`
- All filtering, sorting, text rendering happen on-device from cached JSON

═══════════════════════════════════════════════════════════════════════════
## 2. DATA JSON — FlexTale Stories
═══════════════════════════════════════════════════════════════════════════

File: `flextale_stories.json` (hosted on GCS, URL in Remote Config)
Separate file from FlexShot. Same fetch + cache pattern.

### Schema per story item:

```json
{
  "id": "paris7",
  "title": {
    "en": "PARIS 7 DAYS",
    "vi": "PARIS 7 NGÀY",
    "es": "PARIS 7 DÍAS",
    "pt": "PARIS 7 DIAS",
    "ja": "パリ 7日間",
    "ko": "파리 7일"
  },
  "description": {
    "en": "A 7-day journey through Paris — from the airport to Eiffel Tower, through Louvre and along the Seine.",
    "vi": "Hành trình 7 ngày qua Paris — từ sân bay đến tháp Eiffel, qua Louvre và dọc sông Seine.",
    ...
  },
  "category": "Travel",          // "Travel" | "Cyberpunk" | "Paradise" | "Romance" | "Career" | "Fitness" | "Luxury" | "Fantasy" | "Seasonal" | "Lifestyle" | "Sci-Fi"
  "type": "travel",              // "travel" | "trend" | "sexy" | "business" | "traditional"
  "gender": "female",            // "male" | "female" | "couple"
  "duration": "many",            // "moment" (instant) | "once" (one day) | "many" (multi-day)
  "totalPics": 10,               // number of AI images generated
  "credits": 8,                  // credits cost (varies per story, NOT from Remote Config)
  "badge": null,                 // "NEW" | "HOT" | "TRENDING" | null
  "premium": false,
  "isActive": true,
  "sortOrder": 1,
  "coverImage": "https://cdn.flexmenow.com/stories/paris7/cover.png",
  "previewImages": [
    "https://cdn.flexmenow.com/stories/paris7/preview_1.png",
    "https://cdn.flexmenow.com/stories/paris7/preview_2.png",
    "https://cdn.flexmenow.com/stories/paris7/preview_3.png"
  ],
  "chapters": [
    {
      "order": 1,
      "heading": {
        "en": "The Beginning",
        "vi": "Khởi đầu",
        ...
      },
      "text": {
        "en": "In 2024, you leave everything behind and buy a one-way ticket to Paris...",
        "vi": "Năm 2024, bạn bỏ lại tất cả và mua vé một chiều đến Paris...",
        ...
      },
      "choices": {
        "en": ["Find a side job", "Meet a stranger"],
        "vi": ["Tìm việc tay trái", "Gặp người lạ"],
        ...
      },
      "prompt": {
        "base": "A cinematic photo of {subject} standing at Charles de Gaulle airport, holding a suitcase, golden sunset through the terminal windows",
        "negative": "blurry, distorted, watermark, text",
        "styleHint": "warm cinematic, film look"
      },
      "aiConfig": {
        "model": "imagen-3.0-generate-001",
        "guidanceScale": 8.0,
        "aspectRatio": "3:4",
        "referenceType": "SUBJECT_REFERENCE"
      }
    },
    {
      "order": 2,
      "heading": { "en": "The Turning Point", ... },
      "text": { "en": "A French photographer needs an assistant...", ... },
      "choices": { "en": ["Accept immediately", "Negotiate terms"], ... },
      "prompt": { ... },
      "aiConfig": { ... }
    },
    {
      "order": 3,
      "heading": { "en": "The Peak", ... },
      "text": { "en": "Your first photo exhibition in Paris receives rave reviews...", ... },
      "choices": { "en": ["Open your own studio", "Return home to share"], ... },
      "prompt": { ... },
      "aiConfig": { ... }
    }
  ],
  "tags": ["paris", "travel", "photography", "france"],
  "stats": {
    "likes": 9200,
    "views": 31000,
    "generates": 4500
  },
  "createdAt": "2026-01-10T00:00:00Z",
  "updatedAt": "2026-02-18T00:00:00Z"
}
```

### Top-level JSON structure:

```json
{
  "version": "1.0.0",
  "updatedAt": "2026-03-01T00:00:00Z",
  "categories": [
    { "id": "Travel", "name": { "en": "Travel", ... }, "sortOrder": 1 },
    { "id": "Romance", "name": { "en": "Romance", ... }, "sortOrder": 2 },
    ...
  ],
  "types": [ ... ],       // same as FlexShot
  "genders": [ ... ],     // same as FlexShot
  "durations": [
    { "id": "moment", "name": { "en": "Moment", "vi": "Khoảnh khắc", ... }, "icon": "zap" },
    { "id": "once", "name": { "en": "One Day", "vi": "Một ngày", ... }, "icon": "sparkles" },
    { "id": "many", "name": { "en": "Many Days", "vi": "Nhiều ngày", ... }, "icon": "layers" }
  ],
  "stories": [
    { ... story items ... }
  ]
}
```

### Key difference from FlexShot:
- FlexShot templates: credits đồng giá (lấy từ Remote Config)
- FlexTale stories: credits khác nhau mỗi story (từ data JSON, field `credits`)

═══════════════════════════════════════════════════════════════════════════
## 3. REMOTE CONFIG
═══════════════════════════════════════════════════════════════════════════

Firebase Remote Config parameters:

### Content URLs
```
flexshot_json_url          : string  = "https://storage.googleapis.com/flexme-prod.appspot.com/config/flexshot_templates.json"
flextale_json_url          : string  = "https://storage.googleapis.com/flexme-prod.appspot.com/config/flextale_stories.json"
onboarding_json_url        : string  = "https://storage.googleapis.com/flexme-prod.appspot.com/config/onboarding_{region}.json"
```
→ `onboarding_json_url` có condition theo region: mỗi region (VN, US, JP, KR, BR...) trả URL JSON onboarding khác nhau.

### Feature Flags
```
wow_everyday_enabled       : boolean = true           // on/off "Make Me WOW Everyday" feature
search_enabled             : boolean = true           // on/off search trong template/story
search_supported_langs     : string  = "en,vi,es,pt"  // device lang nào được search
ai_chat_enabled            : boolean = true           // on/off AI chat assistant
flexlocket_enabled         : boolean = true           // on/off FlexLocket tab
schedule_post_enabled      : boolean = false          // on/off schedule post (future)
referral_enabled           : boolean = false          // on/off referral program
maintenance_mode           : boolean = false          // app-wide maintenance
```

### Pricing & Credits
```
default_template_credits   : int     = 1              // FlexShot default credit cost
premium_template_credits   : int     = 2              // FlexShot premium credit cost
new_user_free_credits      : int     = 12             // credits cộng cho user mới
daily_free_glow_limit      : int     = 10             // FlexLocket free uses/day
glow_credit_cost           : double  = 0.5            // FlexLocket credit cost (after free limit)
```

### Paywall Config
```
paywall_variant            : string  = "A"            // "A" | "B" | "C" — A/B test paywall UI
paywall_show_trial         : boolean = true           // show free trial option
paywall_trial_days         : int     = 3              // trial duration
paywall_plans_json         : string  = '{...}'        // JSON string of plan configs for dynamic paywall
```

### Paywall Plans JSON (inside `paywall_plans_json`):
```json
{
  "plans": [
    {
      "id": "starter",
      "name": { "en": "Starter", "vi": "Khởi đầu", ... },
      "price": "$2.99",
      "priceId": "price_starter_monthly",
      "period": "month",
      "credits": "10 Credits",
      "color": "#525252",
      "badge": null,
      "features": {
        "en": ["10 credits/month", "FlexShot access", "HD export", "Basic AI"],
        "vi": ["10 credits/tháng", "Truy cập FlexShot", "Xuất HD", "AI cơ bản"],
        ...
      }
    },
    {
      "id": "pro",
      "name": { "en": "Pro", ... },
      "price": "$7.99",
      "priceId": "price_pro_monthly",
      "period": "month",
      "credits": "50 Credits",
      "color": "#F59E0B",
      "badge": "POPULAR",
      "features": { "en": ["50 credits/month", "All features", "4K export", "Priority AI", "Pro badge"], ... }
    },
    {
      "id": "elite",
      "name": { "en": "Elite", ... },
      "price": "$19.99",
      "priceId": "price_elite_monthly",
      "period": "month",
      "credits": "Unlimited",
      "color": "#FBBF24",
      "badge": "BEST VALUE",
      "features": { "en": ["Unlimited credits", "Early access", "Creator tools", "Custom AI style", "Dedicated support"], ... }
    }
  ]
}
```

### WOW Subscription (only shown when wow_everyday_enabled = true)
```
wow_pricing_json           : string  = '{...}'        // WOW subscription plans
```

```json
{
  "plans": [
    { "id": "3d", "days": 3, "price": "$2.99", "perDay": "$1.00", "badge": "TRIAL", "iapProductId": "wow_3d" },
    { "id": "7d", "days": 7, "price": "$4.99", "perDay": "$0.71", "badge": "POPULAR", "iapProductId": "wow_7d" },
    { "id": "30d", "days": 30, "price": "$14.99", "perDay": "$0.50", "badge": null, "iapProductId": "wow_30d" },
    { "id": "forever", "days": -1, "price": "$29.99", "perDay": "", "badge": "VIP", "sub": "/mo", "iapProductId": "wow_forever" }
  ]
}
```

### Onboarding JSON (per region):
```json
{
  "version": "1.0.0",
  "region": "VN",
  "slides": [
    {
      "badge": "FlexLocket",
      "icon": "camera",
      "title": { "en": "Glow different.", "vi": "Tỏa sáng khác biệt.", ... },
      "slogan": { "en": "Main character energy, zero filter.", ... },
      "subtitle": { "en": "AI glow-up so clean even your ex won't know.", ... },
      "accentColor": "#A855F7",
      "images": [
        "https://cdn.flexmenow.com/onboarding/vn/glow_1.png",
        "https://cdn.flexmenow.com/onboarding/vn/glow_2.png"
      ],
      "animation": "flip3d"
    },
    { "badge": "FlexShot", ... },
    { "badge": "FlexTale", ... }
  ],
  "personalizeOptions": [
    {
      "label": { "en": "Glow up my pics", "vi": "Làm đẹp ảnh", ... },
      "tabTarget": "glow",
      "accentColor": "#A855F7"
    },
    { ... },
    { ... }
  ],
  "loginConfig": {
    "freeCreditsLabel": { "en": "Get 12 free credits to start", ... },
    "showGoogle": true,
    "showApple": true,
    "showAnonymous": true
  }
}
```

═══════════════════════════════════════════════════════════════════════════
## 4. IAP SUBSCRIPTION & CREDIT PACKS (via RevenueCat)
═══════════════════════════════════════════════════════════════════════════

App là Flutter (native) → dùng IAP (In-App Purchase) qua RevenueCat.
RevenueCat làm trung gian quản lý subscription + webhook callback.

### RevenueCat Products:

#### Subscriptions (auto-renewable):
```
flexme_starter_monthly     : $2.99/month  → 10 credits/month
flexme_pro_monthly         : $7.99/month  → 50 credits/month
flexme_elite_monthly       : $19.99/month → unlimited credits
```

#### WOW Subscriptions (auto-renewable):
```
wow_3d                     : $2.99 (non-renewing, 3 days)
wow_7d                     : $4.99 (non-renewing, 7 days)
wow_30d                    : $14.99 (non-renewing, 30 days)
wow_forever                : $29.99/month (auto-renewable)
```

#### Credit Packs (consumable):
```
credits_10                 : $1.99  → 10 credits
credits_50                 : $7.99  → 50 credits
credits_100                : $14.99 → 100 credits
```

### RevenueCat Webhook → Cloud Function:

Endpoint: `https://asia-southeast1-flexme-prod.cloudfunctions.net/handleEventRevenueCat`
Method: POST
Auth: RevenueCat webhook secret (verified in CF)

#### Events handled:
```
INITIAL_PURCHASE           → activate subscription, add credits, update user doc
RENEWAL                    → renew subscription, add monthly credits
CANCELLATION               → mark subscription as cancelled (still active until expiry)
EXPIRATION                 → downgrade to free plan, clear subscription fields
NON_RENEWING_PURCHASE      → activate WOW subscription for N days
PRODUCT_CHANGE             → upgrade/downgrade plan, adjust credits
```

#### Webhook payload processing:
```
1. Verify webhook secret
2. Extract: userId (app_user_id), productId, event type, expiration date
3. Map productId → plan/credits:
   - flexme_starter_monthly → plan: "starter", credits: +10
   - flexme_pro_monthly     → plan: "pro", credits: +50
   - flexme_elite_monthly   → plan: "elite", credits: +999 (unlimited marker)
   - wow_*                  → activate WOW, set expiry
   - credits_*              → add credits
4. Firestore transaction: update user doc (plan, credits, subscription dates)
5. Write to creditLogs collection
6. Write to orders collection
7. Return 200 OK
```

═══════════════════════════════════════════════════════════════════════════
## 5. i18n — MULTI-LANGUAGE SUPPORT
═══════════════════════════════════════════════════════════════════════════

### Strategy:
- All text in JSON data dùng object `{ "en": "...", "vi": "...", ... }`
- Device language (`Localizations.localeOf(context).languageCode`) quyết định text nào hiển thị
- Fallback: nếu lang không có → dùng `en`
- 6 supported languages: en, vi, es, pt, ja, ko

### What is localized:
- Template names, story titles, descriptions, chapter text, choices
- Category names, type names, gender labels, duration labels
- Onboarding slides (title, slogan, subtitle)
- Paywall plan names and features
- UI labels (trong Flutter app dùng i18n package, e.g. `flutter_localizations` + `intl`)

### What is NOT localized:
- Brand names: FlexMe, FlexLocket, FlexShot, FlexTale (always English)
- AI prompts (always English — sent to Gemini/Imagen)
- Technical fields: IDs, URLs, colors, config values

### Search language restriction:
- Remote Config `search_supported_langs` = "en,vi,es,pt"
- If device lang NOT in this list → hide search bar entirely
- Search runs locally on `name[deviceLang]` and `tags[]`

═══════════════════════════════════════════════════════════════════════════
## 6. USER INIT FLOW (App Open)
═══════════════════════════════════════════════════════════════════════════

```
1. App launch
   ├── Show splash screen (hardcoded local assets)
   ├── Init Firebase (Auth, Firestore, Storage, Remote Config, Analytics)
   ├── Fetch Remote Config → activate
   │
2. Check auth state
   ├── NOT logged in → show onboarding → login
   └── Logged in → continue
   │
3. Post-auth init (parallel):
   ├── a. Get device info (platform, version, locale, timezone)
   ├── b. Call CF `checkGeo` → get country code, region
   ├── c. Fetch flexshot_templates.json from Remote Config URL → cache locally
   ├── d. Fetch flextale_stories.json from Remote Config URL → cache locally
   ├── e. Subscribe to user profile doc (onSnapshot):
   │      → listen for: credits changes, subscription updates, plan expiry
   ├── f. Subscribe to generations collection (onSnapshot):
   │      → listen for: task status changes (pending → processing → completed/failed)
   ├── g. Subscribe to stories collection (onSnapshot):
   │      → listen for: story progress, scene completion
   │
4. If NEW user (first login):
   ├── CF `onUserCreate` trigger creates user doc
   ├── User doc gets `creditsBalance: {new_user_free_credits}` (from Remote Config, default 12)
   └── Show personalize screen → enter main app
   │
5. Ready → show main app with tabs
```

═══════════════════════════════════════════════════════════════════════════
## 7. CLOUD FUNCTIONS (Gen 2)
═══════════════════════════════════════════════════════════════════════════

100% Firebase services. Cloud Functions Gen 2. Region: asia-southeast1.
Runtime: Node.js 20.

### CF 1: `genFlexShot` (Callable, Auth Required)

```
Input:
  - inputImagePath: string     // Storage path: "uploads/{userId}/{filename}"
  - templateId: string         // template ID from JSON
  - style: string (optional)   // style override

Process:
  1. Verify auth, get userId
  2. Load template data (from cached config or Firestore)
  3. Get credit cost from ENV config (TEMPLATE_CREDIT_COST)
  4. Firestore transaction:
     - Read user.creditsBalance
     - Check creditsBalance >= cost → throw INSUFFICIENT_CREDITS if not
     - Deduct credits
     - Write creditLog entry
  5. Create generation doc in Firestore (status: "processing")
  6. Download input image from Storage → base64
  7. Call Gemini SDK to optimize prompt:
     - Input: template.prompt.base + template.prompt.styleHint
     - Output: optimized detailed prompt for Imagen
  8. Call Vertex AI Imagen:
     - Model: template.aiConfig.model
     - Prompt: optimized prompt
     - Reference image: base64 (SUBJECT_REFERENCE)
     - Config: guidanceScale, aspectRatio, safetyFilter from template.aiConfig
  9. Upload generated image to Storage: "generated/{userId}/{genId}/output.png"
  10. Update generation doc: status="completed", outputImageUrl, generationTimeMs
  11. Return { generationId, status, creditsSpent, creditsRemaining }

Output:
  - generationId: string
  - status: "completed" | "failed"
  - creditsSpent: number
  - creditsRemaining: number

Error codes:
  - UNAUTHENTICATED: not logged in
  - INSUFFICIENT_CREDITS: not enough credits
  - INVALID_ARGUMENT: missing/invalid templateId or image
  - INTERNAL: AI generation failed

Timeout: 300 seconds
```

### CF 2: `genFlexTale` (Callable, Auth Required)

```
Input:
  - inputImagePath: string     // Storage path
  - storyId: string            // story ID from JSON
  - selectedChapters: int[]    // optional, subset of chapters to generate (default: all)

Process:
  1. Verify auth, get userId
  2. Load story data (from cached config)
  3. Credit cost = story.credits (from data JSON, NOT Remote Config)
  4. Firestore transaction: check & deduct credits
  5. Create story doc in Firestore (status: "processing", totalScenes, completedScenes: 0)
  6. Download input image from Storage → base64
  7. For each chapter (sequential, NOT parallel):
     a. Call Gemini SDK to optimize chapter prompt
        - IMPORTANT: include previous generated images context
        - Prompt includes: "{subject} must look consistent across all scenes"
        - Pass previous scene descriptions for continuity
     b. Call Vertex AI Imagen with:
        - Optimized prompt
        - SAME reference image (original user photo) for face consistency
        - Previous outputs as style reference for visual continuity
     c. Upload scene image to Storage: "generated/{userId}/{storyDocId}/scene_{order}.png"
     d. Update story doc: completedScenes++, write scene subcollection doc
     e. User receives realtime update via onSnapshot
  8. After all scenes complete:
     - Update story doc: status="completed"
  9. Return { storyDocId, status, totalScenes, creditsSpent, creditsRemaining }

KEY REQUIREMENT — Image Consistency:
  - Tất cả image trong cùng 1 story PHẢI dùng chung reference image (ảnh user upload)
  - Các image kế tiếp phải được feed context của image trước đó
  - Face, clothing style, color palette phải consistent across all scenes
  - Gemini prompt optimization phải include: "maintain visual consistency with previous scenes"

Timeout: 600 seconds (longer because multi-scene)
```

### CF 3: `checkGeo` (Callable, Auth Required)

```
Input: none (uses request IP)

Process:
  1. Get client IP from request headers
  2. Use Google Cloud IP Geolocation or MaxMind GeoIP
  3. Return country code, region, city, timezone

Output:
  - countryCode: string    // "VN", "US", "JP", ...
  - region: string         // "Asia", "Americas", "Europe", ...
  - city: string
  - timezone: string       // "Asia/Ho_Chi_Minh"

Use cases:
  - Determine onboarding content (region-specific JSON)
  - Currency display
  - Content localization hints
  - Analytics
```

### CF 4: `handleEventRevenueCat` (HTTPS, webhook)

```
Endpoint: POST /handleEventRevenueCat
Auth: RevenueCat webhook authorization header

Input: RevenueCat webhook payload (JSON)

Process: (see Section 4 above for full detail)
  1. Verify authorization header matches ENV secret
  2. Parse event type and subscriber info
  3. Map product_id → plan/credits
  4. Firestore transaction: update user doc
  5. Write creditLog + order entries
  6. Return 200 OK

Events: INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION,
        NON_RENEWING_PURCHASE, PRODUCT_CHANGE
```

### CF 5: `onUserCreate` (Auth Trigger)

```
Trigger: Firebase Auth — new user created

Process:
  1. Get user data from auth record (email, displayName, photoURL, providerId)
  2. Get new_user_free_credits from ENV config
  3. Create user doc at users/{uid}:
     - email, displayName, avatarUrl
     - authProvider: 'google' | 'apple' | 'anonymous'
     - creditsBalance: {new_user_free_credits}
     - subscriptionPlan: 'free'
     - subscriptionExpiresAt: null
     - totalGenerations: 0
     - totalStories: 0
     - createdAt: serverTimestamp()
     - updatedAt: serverTimestamp()
     - lastActiveAt: serverTimestamp()
     - geo: null (populated by checkGeo later)
     - deviceInfo: null
     - fcmToken: null
  4. Write initial creditLog entry (type: "bonus", description: "Welcome credits")
```

═══════════════════════════════════════════════════════════════════════════
## 8. FIRESTORE SCHEMA (Chi tiết)
═══════════════════════════════════════════════════════════════════════════

### Collection: `users/{userId}`
```
{
  // Identity
  email: string,
  displayName: string,
  avatarUrl: string | null,
  authProvider: "google" | "apple" | "anonymous",

  // Credits & Subscription (SERVER-ONLY writes)
  creditsBalance: number,                    // current credit balance
  subscriptionPlan: "free" | "starter" | "pro" | "elite",
  subscriptionExpiresAt: Timestamp | null,
  subscriptionProductId: string | null,      // RevenueCat product ID

  // WOW Subscription
  wowActive: boolean,
  wowExpiresAt: Timestamp | null,
  wowProductId: string | null,
  wowConfig: {                               // null if not subscribed
    mode: "solo" | "couple",
    topic: string,                           // topic ID
    source: "surprise" | "pick",
    pickedPacks: string[],                   // story IDs if source="pick"
    deliveryTime: string,                    // time slot ID
    facePaths: string[],                     // Storage paths to face images
  } | null,

  // Stats
  totalGenerations: number,
  totalStories: number,
  glowUsedToday: number,                     // resets daily
  glowLastResetDate: string,                 // "2026-03-01" for daily reset check

  // Device & Geo
  deviceInfo: {
    platform: "ios" | "android",
    osVersion: string,
    appVersion: string,
    locale: string,                          // "en", "vi", etc.
  } | null,
  geo: {
    countryCode: string,
    region: string,
    city: string,
    timezone: string,
  } | null,

  // Metadata
  fcmToken: string | null,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastActiveAt: Timestamp,
}
```

### Security rules for `users/{userId}`:
```
- read: request.auth.uid == userId
- write: request.auth.uid == userId
         AND NOT changing: creditsBalance, subscriptionPlan, subscriptionExpiresAt,
                           subscriptionProductId, wowActive, wowExpiresAt, wowProductId,
                           totalGenerations, totalStories, createdAt
```

### Collection: `generations/{genId}`
```
{
  userId: string,
  templateId: string,
  templateName: string,                      // denormalized for UI
  inputImageUrl: string,                     // Storage path
  outputImageUrl: string | null,             // Storage URL (set on completion)
  outputHdUrl: string | null,
  status: "pending" | "processing" | "completed" | "failed",
  progress: number,                          // 0-100
  errorMessage: string | null,
  promptUsed: string,
  generationTimeMs: number | null,
  creditsSpent: number,
  aiConfig: {
    model: string,
    guidanceScale: number,
    aspectRatio: string,
    seed: number | null,
  },
  createdAt: Timestamp,
  completedAt: Timestamp | null,
}
```

### Indexes for `generations`:
```
- userId ASC, createdAt DESC    → user gallery query
- status ASC, createdAt ASC     → processing queue
```

### Collection: `stories/{storyId}`
```
{
  userId: string,
  storyDataId: string,                       // story ID from JSON data
  storyTitle: string,                        // denormalized
  inputImageUrl: string,
  status: "pending" | "processing" | "completed" | "failed",
  totalScenes: number,
  completedScenes: number,
  creditsSpent: number,
  errorMessage: string | null,
  createdAt: Timestamp,
  completedAt: Timestamp | null,
}
```

### Subcollection: `stories/{storyId}/scenes/{sceneId}`
```
{
  sceneOrder: number,
  sceneName: string,
  status: "pending" | "processing" | "completed" | "failed",
  outputImageUrl: string | null,
  promptUsed: string,
  generationTimeMs: number | null,
  createdAt: Timestamp,
  completedAt: Timestamp | null,
}
```

### Index for `stories`:
```
- userId ASC, createdAt DESC    → user story history
```

### Collection: `orders/{orderId}`
```
{
  userId: string,
  orderType: "subscription" | "credits_pack" | "wow_subscription",
  productId: string,                         // RevenueCat product ID
  plan: string | null,                       // "starter" | "pro" | "elite" | null
  amount: number,                            // price in cents
  currency: string,                          // "USD"
  status: "pending" | "completed" | "failed" | "refunded",
  creditsAdded: number,
  revenuecatEventId: string | null,
  createdAt: Timestamp,
  completedAt: Timestamp | null,
}
```

### Collection: `creditLogs/{logId}`
```
{
  userId: string,
  amount: number,                            // positive (add) or negative (deduct)
  type: "bonus" | "purchase" | "subscription_renewal" | "spend_flexshot" | "spend_flextale" | "spend_glow" | "refund",
  referenceId: string | null,               // genId, storyId, orderId
  referenceType: "generation" | "story" | "order" | null,
  balanceAfter: number,
  description: string,
  createdAt: Timestamp,
}
```

═══════════════════════════════════════════════════════════════════════════
## 9. MEDIA & IMAGE STRATEGY
═══════════════════════════════════════════════════════════════════════════

### Hardcoded in app build (local assets):
- Splash screen images
- Onboarding animation assets (if not using remote)
- App icon, logo
- Placeholder/skeleton images

### Online images (GCS → CDN URL):
- ALL template cover images & previews
- ALL story cover images & previews
- ALL generated AI images
- User avatars
- Banner images
- Onboarding slides (fetched per region from Remote Config URL)

### GCS Bucket Structure:
```
gs://flexme-prod.appspot.com/
  ├── config/
  │   ├── flexshot_templates.json
  │   ├── flextale_stories.json
  │   └── onboarding/
  │       ├── onboarding_VN.json
  │       ├── onboarding_US.json
  │       └── onboarding_JP.json
  ├── templates/
  │   └── {templateId}/
  │       ├── cover.png
  │       ├── preview_1.png
  │       ├── preview_2.png
  │       └── preview_3.png
  ├── stories/
  │   └── {storyId}/
  │       ├── cover.png
  │       ├── preview_1.png
  │       ├── preview_2.png
  │       └── preview_3.png
  ├── onboarding/
  │   └── {region}/
  │       ├── glow_1.png ... glow_4.png
  │       ├── shot_1.png ... shot_5.png
  │       └── tale_*.png
  ├── uploads/
  │   └── {userId}/
  │       └── {filename}
  └── generated/
      └── {userId}/
          ├── {genId}/
          │   └── output.png
          └── {storyDocId}/
              ├── scene_1.png
              ├── scene_2.png
              └── scene_3.png
```

### CDN URLs:
All public images served via Firebase Hosting CDN or Storage public URLs.
Format: `https://storage.googleapis.com/flexme-prod.appspot.com/templates/{id}/cover.png`
Or custom domain: `https://cdn.flexmenow.com/templates/{id}/cover.png`

═══════════════════════════════════════════════════════════════════════════
## 10. FLUTTER APP REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════

### Framework: Flutter (latest stable)
### Target: iOS + Android native

### Key packages (research latest versions):
```
firebase_core, firebase_auth, cloud_firestore, firebase_storage
firebase_remote_config, firebase_analytics, firebase_messaging
purchases_flutter (RevenueCat)
google_ml_kit (face detection — local, on-device)
cached_network_image (image caching)
flutter_localizations + intl (i18n)
go_router (navigation)
riverpod or bloc (state management)
shimmer (loading skeleton)
lottie (animations)
image_picker + camera (photo capture)
```

### Face detection (local, pre-upload):
- Use Google ML Kit Face Detection
- Check: at least 1 face detected
- Check: face is front-facing (not extreme angle)
- Check: face is large enough in frame
- Show error if no face / face too small / face turned away
- This runs ON-DEVICE, no network call

### UI Match 100% with mockup:
- Mọi screen trong mockup_app phải được replicate chính xác trong Flutter
- Colors: exact hex values from design tokens (C object)
- Fonts: Inter (main), JetBrains Mono (monospace)
- Border radius, padding, margin: match pixel-perfect
- Animations: fadeIn, pulse, bounce, shimmer, 3D card effects
- Dark mode default
- Bottom nav: 4 tabs (Glow, Create, Story, Me)
- All overlay panels: Notifications, Settings, Paywall, AI Chat

### Screens to implement (from mockup):
1. Splash → Tour (3 slides) → Personalize → Login
2. Main (4 tabs): GlowTab, CreateTab, StoryTab, MeTab
3. Sub-screens: ShotDetail, PhotoUpload, ShotProcessing, ShotResult
4. Sub-screens: TalePreview, TaleProcessing, TaleReader
5. Sub-screens: GlowProcessing, GlowResult
6. Sub-screens: WowIntro, WowSetup (5 steps), WowDashboard, WowDelivery
7. Overlays: NotifPanel, SettingsPanel, Paywall, AIChat

═══════════════════════════════════════════════════════════════════════════
## 11. CMS (NextJS + Vercel)
═══════════════════════════════════════════════════════════════════════════

### Stack: Next.js 14+ (App Router) deployed on Vercel
### Auth: Firebase Admin SDK (admin users only)

### CMS Features:

#### Template Management:
- CRUD templates (create, edit, delete, reorder)
- Upload cover image + preview images → GCS
- Edit prompt, negative prompt, style hint
- Configure AI params (model, guidance, aspect ratio)
- Set category, type, gender, style, badge, premium
- Multi-language name editing (en, vi, es, pt, ja, ko)
- Preview template card as it appears in app
- Publish: generate + upload flexshot_templates.json to GCS

#### Story Management:
- CRUD stories with chapters
- Edit chapter text, choices (multi-language)
- Configure per-chapter AI prompts
- Set credits per story
- Upload cover + preview images
- Publish: generate + upload flextale_stories.json to GCS

#### Onboarding Management:
- Edit onboarding slides per region
- Upload region-specific images
- Publish per-region onboarding JSON

#### User Management (read-only + limited actions):
- List users with search/filter
- View user profile, credits, subscription status
- View user generation history
- View user transaction/order history
- Manually adjust credits (with reason log)

#### Dashboard:
- Total users, active users (DAU/MAU)
- Total generations, total stories
- Revenue (from orders)
- Credits usage stats

### CMS API Endpoints (for AI agent automation):

```
POST   /api/templates              → create template
GET    /api/templates              → list templates
GET    /api/templates/:id          → get template
PUT    /api/templates/:id          → update template
DELETE /api/templates/:id          → delete template
POST   /api/templates/publish      → generate & upload JSON to GCS

POST   /api/stories                → create story
GET    /api/stories                → list stories
GET    /api/stories/:id            → get story
PUT    /api/stories/:id            → update story
DELETE /api/stories/:id            → delete story
POST   /api/stories/publish        → generate & upload JSON to GCS

POST   /api/upload                 → upload image to GCS, return URL
GET    /api/users                  → list users (paginated)
GET    /api/users/:id              → get user detail
GET    /api/users/:id/history      → get user generation history
GET    /api/users/:id/orders       → get user orders
POST   /api/users/:id/credits      → adjust credits (admin action)

GET    /api/dashboard/stats        → aggregate stats
```

All APIs return JSON. Auth via Firebase Admin custom claims.
APIs designed for both CMS UI and AI agent consumption.

═══════════════════════════════════════════════════════════════════════════
## 12. SUMMARY — CHECKLIST
═══════════════════════════════════════════════════════════════════════════

### Data JSONs:
☐ flexshot_templates.json — full schema with i18n, aiConfig, stats
☐ flextale_stories.json — full schema with chapters, i18n, per-story credits
☐ onboarding_{region}.json — per-region onboarding content

### Remote Config:
☐ Content URLs (flexshot, flextale, onboarding per region)
☐ Feature flags (wow_enabled, search_enabled, maintenance_mode, etc.)
☐ Pricing config (credit costs, free limits, paywall plans JSON)
☐ WOW pricing JSON
☐ Search language restriction

### Cloud Functions:
☐ genFlexShot — single image generation with credit deduction
☐ genFlexTale — multi-scene story with image consistency
☐ checkGeo — IP geolocation
☐ handleEventRevenueCat — IAP webhook handler
☐ onUserCreate — auth trigger for new user setup

### Firestore:
☐ users collection — full schema with subscription, WOW, device, geo
☐ generations collection — FlexShot job tracking
☐ stories collection + scenes subcollection — FlexTale job tracking
☐ orders collection — purchase history
☐ creditLogs collection — all credit movements
☐ Composite indexes defined
☐ Security rules (user can't write credits/subscription)

### Flutter App:
☐ 100% UI match with mockup_app
☐ All 18 screens + 4 overlays implemented
☐ ML Kit face detection (local, pre-upload)
☐ RevenueCat IAP integration
☐ Firestore realtime listeners (profile, generations, stories)
☐ Remote Config fetch on launch
☐ JSON data fetch + local cache
☐ i18n support (6 languages, device locale)
☐ Search enable/disable by language

### CMS:
☐ Template CRUD + JSON publish
☐ Story CRUD + JSON publish
☐ User management (read + credit adjust)
☐ Dashboard stats
☐ Full REST API for AI agent automation
