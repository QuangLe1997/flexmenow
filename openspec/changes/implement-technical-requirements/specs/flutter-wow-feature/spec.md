## ADDED Requirements

### Requirement: WOW feature flag
The WOW feature SHALL only be visible when Remote Config `wow_everyday_enabled` is true. If false, all WOW-related UI SHALL be hidden.

#### Scenario: WOW disabled
- **WHEN** Remote Config `wow_everyday_enabled` is false
- **THEN** WOW entry points are not visible in the Story tab

### Requirement: WowIntro screen
The WowIntro screen SHALL display the WOW concept: "Subscribe once, get AI photos daily." The screen SHALL show subscription plan options from Remote Config `wow_pricing_json`. Plans: 3d/$2.99, 7d/$4.99 (POPULAR), 30d/$14.99, forever/$29.99/mo.

#### Scenario: WOW intro displays plans
- **WHEN** user opens the WOW intro
- **THEN** subscription plans are displayed with prices, per-day costs, and badges

### Requirement: WOW subscription purchase
Tapping a WOW plan SHALL trigger RevenueCat IAP purchase. On success, RevenueCat webhook activates WOW subscription on the user doc.

#### Scenario: WOW purchase success
- **WHEN** user purchases the 7-day WOW plan
- **THEN** IAP completes, webhook fires, user.wowActive becomes true, user.wowExpiresAt is set to 7 days from now

### Requirement: WowSetup wizard (5 steps)
After WOW subscription activates, the app SHALL show a 5-step setup wizard:
1. Mode selection: solo or couple
2. Topic selection: choose AI photo topic
3. Source selection: "surprise" (random) or "pick" (choose specific story packs)
4. Pick packs (if source="pick"): select story packs
5. Delivery time: choose daily delivery time slot

#### Scenario: Complete WOW setup
- **WHEN** user completes all 5 setup steps
- **THEN** wowConfig is saved to the user doc with mode, topic, source, pickedPacks, deliveryTime, facePaths

### Requirement: Face upload for WOW
During WOW setup, the user SHALL upload face photos (1 for solo, 2 for couple). Photos SHALL pass ML Kit face detection. Uploaded to Storage, paths saved in wowConfig.facePaths.

#### Scenario: Face upload for couple mode
- **WHEN** user selects couple mode
- **THEN** the setup requires 2 face photos to be uploaded

### Requirement: WowDashboard screen
Active WOW subscribers SHALL see a dashboard showing: subscription status, days remaining, daily delivery history, next delivery time.

#### Scenario: Dashboard shows active subscription
- **WHEN** a WOW subscriber opens the dashboard
- **THEN** subscription status, remaining days, and delivery schedule are displayed

### Requirement: WowDelivery screen
When a daily WOW photo is delivered, the user SHALL see the WowDelivery screen with the generated photo, story context, and save/share options.

#### Scenario: Daily delivery arrives
- **WHEN** a WOW photo is generated and delivered
- **THEN** user can view, save, and share the photo

### Requirement: WOW subscription types
WOW SHALL support both non-renewing (3d, 7d, 30d) and auto-renewable (forever) subscription types via RevenueCat. No credits consumed — subscription-only access.

#### Scenario: Non-renewing WOW expires
- **WHEN** the 7-day WOW subscription period ends
- **THEN** user.wowActive becomes false and daily deliveries stop
