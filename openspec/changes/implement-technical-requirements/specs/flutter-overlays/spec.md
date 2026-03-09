## ADDED Requirements

### Requirement: NotifPanel overlay
The app SHALL have a notification panel overlay accessible from the main app bar. It SHALL display notifications from FCM and in-app events (generation complete, subscription changes).

#### Scenario: Open notification panel
- **WHEN** user taps the bell icon in the app bar
- **THEN** the NotifPanel slides in from the right showing notification list

### Requirement: SettingsPanel overlay
The SettingsPanel SHALL provide: language selection, account management (link anonymous account, sign out), about/legal info, app version. Settings SHALL persist to device storage and/or Firestore.

#### Scenario: Change language
- **WHEN** user selects a different language in Settings
- **THEN** the app UI and JSON data text update to the selected language

#### Scenario: Sign out
- **WHEN** user taps "Sign Out"
- **THEN** Firebase Auth signs out and app returns to onboarding

### Requirement: Paywall overlay
The Paywall SHALL display subscription plans from Remote Config `paywall_plans_json`: Starter ($2.99/mo, 10 credits), Pro ($7.99/mo, 50 credits, POPULAR badge), Elite ($19.99/mo, unlimited). Each plan SHALL show features (i18n), price, credits. Paywall variant (A/B/C) SHALL be controlled by Remote Config `paywall_variant`.

#### Scenario: Paywall displays plans
- **WHEN** the paywall is triggered (insufficient credits or upgrade CTA)
- **THEN** subscription plans are displayed with features, prices, and badges

#### Scenario: Purchase subscription
- **WHEN** user selects a plan and confirms purchase
- **THEN** RevenueCat IAP flow initiates, webhook processes payment, credits are added

#### Scenario: Credit pack purchase
- **WHEN** user selects a credit pack instead of subscription
- **THEN** consumable IAP is processed and credits are added to balance

### Requirement: Paywall trial support
If Remote Config `paywall_show_trial` is true, the paywall SHALL show a free trial option with duration from `paywall_trial_days`.

#### Scenario: Trial displayed
- **WHEN** `paywall_show_trial` is true and user has never trialed
- **THEN** a "Start Free Trial" option is shown

### Requirement: AIChat overlay
The app SHALL have an AI Chat overlay (UI shell only for MVP). Visibility controlled by Remote Config `ai_chat_enabled`.

#### Scenario: AI Chat disabled
- **WHEN** Remote Config `ai_chat_enabled` is false
- **THEN** the AI Chat entry point is hidden

#### Scenario: AI Chat enabled shows shell
- **WHEN** Remote Config `ai_chat_enabled` is true and user opens AI Chat
- **THEN** a chat interface shell is displayed (no backend AI chat in this phase)
