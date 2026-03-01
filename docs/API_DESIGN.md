# FlexMe - API Design (Cloud Functions)

## Overview
Tat ca API duoc implement bang **Cloud Functions Gen 2** (Node.js/TypeScript).
Su dung **Firebase callable functions** thay vi REST endpoints.
Client goi qua Firebase SDK - tu dong co auth context.

## Base Config
```
Project ID: flexme-prod
Region: asia-southeast1 (Singapore - gan VN)
Runtime: Node.js 20
```

---

## Cloud Functions

### Auth Triggers

#### `onUserCreate`
**Trigger:** Firebase Auth - khi user moi dang ky.
```typescript
// functions/src/auth/onUserCreate.ts
export const onUserCreate = onDocumentCreated(
  'users/{userId}', // hoac auth trigger
  async (event) => {
    // Tao user document trong Firestore
    await db.doc(`users/${event.params.userId}`).set({
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.photoURL,
      authProvider: user.providerData[0].providerId,
      creditsBalance: 3, // free credits
      subscriptionPlan: 'free',
      subscriptionExpiresAt: null,
      totalGenerations: 0,
      totalStories: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      fcmToken: null,
    });
  }
);
```

---

### Generation Functions

#### `generateSingle` (Feature 1: Flex Anh)
**Type:** Callable function
**Auth:** Required

```typescript
// Client call
const generateSingle = httpsCallable(functions, 'generateSingle');
const result = await generateSingle({
  inputImagePath: 'uploads/abc123/selfie.jpg', // Firebase Storage path
  templateId: 'template_paris_eiffel',
  style: 'realistic', // optional override
  options: {           // optional
    aspectRatio: '1:1',
  }
});

// Response
{
  generationId: 'gen_xyz789',
  status: 'pending',
  creditsSpent: 1,
  creditsRemaining: 14
}

// Then client listens to Firestore for realtime updates:
// onSnapshot(doc(db, 'generations', 'gen_xyz789'), callback)
```

**Cloud Function Logic:**
```typescript
export const generateSingle = onCall(
  { region: 'asia-southeast1', timeoutSeconds: 300 },
  async (request) => {
    const { auth, data } = request;
    if (!auth) throw new HttpsError('unauthenticated', 'Login required');

    const { inputImagePath, templateId, style, options } = data;

    // 1. Validate & deduct credits (transaction)
    // 2. Get template from Firestore
    // 3. Create generation doc (status: pending)
    // 4. Use Gemini to optimize prompt
    // 5. Call Vertex AI Imagen API
    // 6. Upload result to Firebase Storage
    // 7. Update generation doc (status: completed)
    // 8. Return generationId

    return { generationId, status: 'pending', creditsSpent: 1, creditsRemaining };
  }
);
```

---

#### `generateStory` (Feature 2: Flex Story)
**Type:** Callable function
**Auth:** Required

```typescript
// Client call
const generateStory = httpsCallable(functions, 'generateStory');
const result = await generateStory({
  inputImagePath: 'uploads/abc123/selfie.jpg',
  storyPackId: 'pack_paris_7days',
  selectedScenes: [1, 2, 3, 5, 7], // optional: chi gen 1 so scene
  style: 'realistic'
});

// Response
{
  storyId: 'story_abc456',
  status: 'pending',
  totalScenes: 5,
  creditsSpent: 5,
  creditsRemaining: 9
}

// Client listens:
// onSnapshot(collection(db, 'stories', storyId, 'scenes'), callback)
```

---

#### `regenerateScene`
**Type:** Callable function
**Auth:** Required

```typescript
// Client call
const regenerateScene = httpsCallable(functions, 'regenerateScene');
const result = await regenerateScene({
  storyId: 'story_abc456',
  sceneOrder: 3
});

// Response
{
  status: 'pending',
  creditsSpent: 1,
  creditsRemaining: 8
}
```

---

### User Functions

#### `getUserProfile`
**Type:** Callable function
```typescript
// Client call
const getUserProfile = httpsCallable(functions, 'getUserProfile');
const result = await getUserProfile();

// Response
{
  email: 'user@gmail.com',
  displayName: 'Nguyen Van A',
  creditsBalance: 15,
  subscriptionPlan: 'basic',
  subscriptionExpiresAt: '2026-04-01T00:00:00Z',
  totalGenerations: 42,
  totalStories: 5
}
```

#### `getCreditHistory`
**Type:** Callable function
```typescript
// Client call
const getCreditHistory = httpsCallable(functions, 'getCreditHistory');
const result = await getCreditHistory({
  limit: 20,
  startAfter: 'last_log_id' // pagination cursor
});

// Response
{
  items: [
    {
      id: 'log_123',
      amount: -1,
      type: 'spend_single',
      description: 'Flex Anh - Paris Eiffel Tower',
      balanceAfter: 14,
      createdAt: '2026-02-28T10:00:00Z'
    }
  ],
  hasMore: true
}
```

---

### Template & Story Pack Functions

> **Note:** Templates va Story Packs co the query truc tiep tu Firestore
> (read-only, bao ve boi security rules).
> Khong can Cloud Function cho read operations.

```typescript
// Client - query templates truc tiep tu Firestore
const q = query(
  collection(db, 'templates'),
  where('category', '==', 'travel'),
  where('isActive', '==', true),
  orderBy('sortOrder'),
  limit(20)
);
const snapshot = await getDocs(q);

// Client - query story packs
const q = query(
  collection(db, 'storyPacks'),
  where('isActive', '==', true),
  orderBy('sortOrder')
);
```

---

### Payment Functions

#### `createCheckoutSession`
**Type:** Callable function

```typescript
// Client call
const createCheckout = httpsCallable(functions, 'createCheckoutSession');
const result = await createCheckout({
  plan: 'basic', // basic | pro | pack_20
});

// Response
{
  checkoutUrl: 'https://checkout.stripe.com/cs_xxx',
  orderId: 'order_789'
}
```

#### `stripeWebhook`
**Type:** HTTPS function (NOT callable - Stripe calls this)

```typescript
// Endpoint: https://asia-southeast1-flexme-prod.cloudfunctions.net/stripeWebhook
export const stripeWebhook = onRequest(
  { region: 'asia-southeast1' },
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed':
        // Add credits / activate subscription
        break;
      case 'customer.subscription.deleted':
        // Downgrade to free
        break;
    }

    res.status(200).send('OK');
  }
);
```

---

### Scheduled Functions

#### `dailyFreeCredits`
**Schedule:** Moi ngay luc 00:00 UTC+7

```typescript
export const dailyFreeCredits = onSchedule(
  { schedule: '0 17 * * *', region: 'asia-southeast1' }, // 17:00 UTC = 00:00 UTC+7
  async () => {
    // Query all free users
    // Reset credits to 3 if current < 3
    // Log credit additions
  }
);
```

#### `checkExpiredSubscriptions`
**Schedule:** Moi gio

```typescript
export const checkExpiredSubs = onSchedule(
  { schedule: 'every 1 hours', region: 'asia-southeast1' },
  async () => {
    // Query users with expired subscriptions
    // Downgrade to free plan
  }
);
```

---

### Admin Functions

#### `manageTemplate`
**Type:** Callable function
**Auth:** Admin only (custom claims)

```typescript
const manageTemplate = httpsCallable(functions, 'manageTemplate');
await manageTemplate({
  action: 'create', // create | update | delete
  data: {
    name: 'New Template',
    category: 'travel',
    promptTemplate: 'A person at...',
    // ...
  }
});
```

---

## Vertex AI / Gemini Integration Code Pattern

### Gemini SDK - Prompt Optimization
```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function optimizePrompt(
  templatePrompt: string,
  userPreferences: object
): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `
      Given this image generation template: "${templatePrompt}"
      And user preferences: ${JSON.stringify(userPreferences)}
      Create an optimized, detailed prompt for Imagen 3 that will produce
      a photorealistic image. Include lighting, camera angle, mood details.
      Output ONLY the prompt, nothing else.
    `,
  });
  return response.text;
}
```

### Vertex AI Imagen - Image Generation
```typescript
import { VertexAI } from '@google-cloud/vertexai';

const vertexai = new VertexAI({
  project: 'flexme-prod',
  location: 'us-central1'
});

async function generateImage(
  prompt: string,
  referenceImageBase64: string
): Promise<Buffer> {
  // Call Imagen 3 API via Vertex AI
  const response = await vertexai.preview.imagen.generate({
    model: 'imagen-3.0-generate-001',
    prompt: prompt,
    referenceImages: [{
      referenceImage: { bytesBase64Encoded: referenceImageBase64 },
      referenceType: 'SUBJECT_REFERENCE'
    }],
    config: {
      numberOfImages: 1,
      aspectRatio: '1:1',
      safetyFilterLevel: 'BLOCK_MEDIUM_AND_ABOVE',
      guidanceScale: 7.5,
    }
  });

  return Buffer.from(response.images[0].bytesBase64Encoded, 'base64');
}
```

---

## Error Handling

```typescript
// Standard error format (HttpsError)
throw new HttpsError('permission-denied', 'INSUFFICIENT_CREDITS', {
  required: 1,
  current: 0,
  message: 'Ban khong du credits'
});

// Client catches
try {
  await generateSingle(data);
} catch (error) {
  if (error.code === 'permission-denied') {
    showUpgradeModal();
  }
}
```

## Rate Limiting (via Cloud Functions)

```typescript
// Implement in middleware
const RATE_LIMITS = {
  free: { maxPerMinute: 5, maxConcurrent: 1 },
  basic: { maxPerMinute: 15, maxConcurrent: 2 },
  pro: { maxPerMinute: 30, maxConcurrent: 5 },
};
```
