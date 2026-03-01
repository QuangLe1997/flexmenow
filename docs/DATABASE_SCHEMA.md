# FlexMe - Database Schema (Cloud Firestore)

## Overview
Su dung Cloud Firestore (NoSQL document database).
Structure: Collections -> Documents -> Subcollections

## Collections Structure

```
firestore/
├── users/{userId}
├── templates/{templateId}
├── storyPacks/{packId}
│   └── scenes/{sceneId}          (subcollection)
├── generations/{genId}
├── stories/{storyId}
│   └── scenes/{sceneId}          (subcollection)
├── orders/{orderId}
├── creditLogs/{logId}
└── appConfig/{configId}          (admin settings)
```

---

## Collection: `users`
**Path:** `/users/{userId}`
**userId** = Firebase Auth UID

```typescript
interface User {
  // Identity
  email: string;
  displayName: string;
  avatarUrl: string;
  authProvider: 'google' | 'apple' | 'email';

  // Credits & Subscription
  creditsBalance: number;          // default: 3
  subscriptionPlan: 'free' | 'basic' | 'pro';
  subscriptionExpiresAt: Timestamp | null;
  stripeCustomerId: string | null;

  // Stats
  totalGenerations: number;        // default: 0
  totalStories: number;            // default: 0

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActiveAt: Timestamp;
  fcmToken: string | null;         // push notification token
}
```

---

## Collection: `templates`
**Path:** `/templates/{templateId}`

```typescript
interface Template {
  name: string;                     // "Paris Eiffel Tower"
  category: 'travel' | 'luxury' | 'lifestyle' | 'fun';
  style: 'realistic' | 'artistic' | 'anime';
  previewUrl: string;               // Firebase Storage URL
  promptTemplate: string;           // "A person standing in front of {location}..."
  negativePrompt: string;
  imagenParams: {                   // Vertex AI Imagen specific params
    guidanceScale: number;
    numberOfImages: number;
    aspectRatio: string;            // "1:1", "9:16", "16:9"
    safetyFilterLevel: string;
  };
  isPremium: boolean;
  isActive: boolean;
  sortOrder: number;
  usageCount: number;               // dem so lan duoc dung
  createdAt: Timestamp;
}
```

---

## Collection: `storyPacks`
**Path:** `/storyPacks/{packId}`

```typescript
interface StoryPack {
  name: string;                     // "Du lich Paris 7 ngay"
  description: string;
  category: 'travel' | 'love' | 'lifestyle' | 'fitness';
  previewUrls: string[];            // Array anh preview
  totalScenes: number;
  creditsCost: number;              // 5-10
  isPremium: boolean;
  isActive: boolean;
  sortOrder: number;
  usageCount: number;
  createdAt: Timestamp;
}
```

### Subcollection: `storyPacks/{packId}/scenes`
**Path:** `/storyPacks/{packId}/scenes/{sceneId}`

```typescript
interface StoryPackScene {
  sceneOrder: number;               // 1, 2, 3, ...
  sceneName: string;                // "Ngay 1 - Den san bay CDG"
  promptTemplate: string;           // Prompt cho Gemini -> Imagen
  negativePrompt: string;
  styleHint: string;
  imagenParams: {
    guidanceScale: number;
    aspectRatio: string;
  };
}
```

---

## Collection: `generations`
**Path:** `/generations/{genId}`
Single image generation jobs.

```typescript
interface Generation {
  userId: string;                   // FK -> users
  templateId: string;               // FK -> templates
  inputImageUrl: string;            // Firebase Storage path
  outputImageUrl: string | null;    // Firebase Storage path (khi xong)
  outputHdUrl: string | null;

  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;                 // 0-100
  errorMessage: string | null;

  promptUsed: string;               // Prompt thuc te (sau Gemini optimize)
  generationTimeMs: number | null;
  creditsSpent: number;

  // Imagen response metadata
  imagenMetadata: {
    model: string;
    seed: number;
    guidanceScale: number;
  } | null;

  createdAt: Timestamp;
  completedAt: Timestamp | null;
}
```

**Composite Index:**
- `userId` ASC + `createdAt` DESC (gallery query)
- `status` ASC + `createdAt` ASC (processing queue)

---

## Collection: `stories`
**Path:** `/stories/{storyId}`
Story series generation jobs.

```typescript
interface Story {
  userId: string;
  storyPackId: string;
  storyPackName: string;            // denormalized cho UI
  inputImageUrl: string;

  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalScenes: number;
  completedScenes: number;
  creditsSpent: number;

  createdAt: Timestamp;
  completedAt: Timestamp | null;
}
```

### Subcollection: `stories/{storyId}/scenes`
**Path:** `/stories/{storyId}/scenes/{sceneId}`

```typescript
interface StoryScene {
  sceneOrder: number;
  sceneName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  outputImageUrl: string | null;
  promptUsed: string | null;
  generationTimeMs: number | null;
  createdAt: Timestamp;
  completedAt: Timestamp | null;
}
```

**Composite Index:**
- `stories`: `userId` ASC + `createdAt` DESC

---

## Collection: `orders`
**Path:** `/orders/{orderId}`

```typescript
interface Order {
  userId: string;
  orderType: 'subscription' | 'credits_pack';
  plan: 'basic' | 'pro' | 'pack_20';
  amount: number;                   // So tien
  currency: 'usd' | 'vnd';
  paymentMethod: 'stripe' | 'momo' | 'zalopay';
  stripePaymentIntentId: string | null;
  stripeSessionId: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  creditsAdded: number;
  createdAt: Timestamp;
  completedAt: Timestamp | null;
}
```

---

## Collection: `creditLogs`
**Path:** `/creditLogs/{logId}`
Transaction log cho moi thay doi credits.

```typescript
interface CreditLog {
  userId: string;
  amount: number;                   // +3, -1, +100, etc.
  type: 'daily_free' | 'purchase' | 'spend_single' | 'spend_story' | 'refund' | 'bonus' | 'referral';
  referenceId: string | null;       // genId / orderId
  referenceType: 'generation' | 'story' | 'order' | null;
  balanceAfter: number;
  description: string;              // "Flex Anh - Paris Eiffel Tower"
  createdAt: Timestamp;
}
```

---

## Collection: `appConfig`
**Path:** `/appConfig/{configId}`
Admin-only configuration.

```typescript
// /appConfig/pricing
interface PricingConfig {
  plans: {
    basic: { price: number; credits: number; features: string[] };
    pro: { price: number; credits: number; features: string[] };
  };
  creditsPack: { price: number; credits: number };
  dailyFreeCredits: number;
  singleImageCost: number;         // default: 1
  storyBaseCost: number;           // default: 5
  storyPerSceneCost: number;       // default: 0.5
}

// /appConfig/features
interface FeatureFlags {
  storyEnabled: boolean;
  schedulePostEnabled: boolean;
  referralEnabled: boolean;
  maintenanceMode: boolean;
}
```

---

## Firestore Query Patterns

### Gallery - Lay anh cua user (paginated)
```typescript
const q = query(
  collection(db, 'generations'),
  where('userId', '==', currentUser.uid),
  orderBy('createdAt', 'desc'),
  limit(20)
);
```

### Realtime Generation Progress
```typescript
// Client listen trang thai generation
const unsub = onSnapshot(
  doc(db, 'generations', genId),
  (snap) => {
    const data = snap.data();
    // data.status, data.progress, data.outputImageUrl
    updateUI(data);
  }
);
```

### Realtime Story Progress
```typescript
// Listen toan bo scenes cua 1 story
const unsub = onSnapshot(
  collection(db, 'stories', storyId, 'scenes'),
  (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === 'modified') {
        // Scene vua complete -> update UI
        updateSceneUI(change.doc.data());
      }
    });
  }
);
```

### Credit Check (trong Cloud Function)
```typescript
// Atomic credit deduction using transaction
await runTransaction(db, async (transaction) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await transaction.get(userRef);
  const currentCredits = userDoc.data().creditsBalance;

  if (currentCredits < cost) {
    throw new Error('INSUFFICIENT_CREDITS');
  }

  transaction.update(userRef, {
    creditsBalance: currentCredits - cost,
    updatedAt: FieldValue.serverTimestamp()
  });
});
```
