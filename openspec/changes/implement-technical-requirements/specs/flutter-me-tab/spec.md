## ADDED Requirements

### Requirement: Profile display
The Me tab SHALL display user profile information: avatar, display name, email, subscription plan badge, credit balance.

#### Scenario: Profile shows current user data
- **WHEN** user navigates to the Me tab
- **THEN** their profile info, plan badge, and credit balance are displayed from Firestore user doc

### Requirement: Real-time credit balance
The credit balance SHALL update in real-time via Firestore onSnapshot listener on the user doc. Any credit change (spend, purchase, bonus) SHALL immediately reflect in the UI.

#### Scenario: Credits update after generation
- **WHEN** user spends credits on a FlexShot generation
- **THEN** the credit balance in the Me tab updates without manual refresh

### Requirement: Generation history
The Me tab SHALL display the user's generation history from the Firestore `generations` collection. Each entry SHALL show: template name, output image thumbnail, credits spent, date.

#### Scenario: History displays past generations
- **WHEN** user views generation history
- **THEN** past generations are listed ordered by createdAt DESC

### Requirement: Story history
The Me tab SHALL display the user's story history from the Firestore `stories` collection. Each entry SHALL show: story title, scene count, credits spent, status, date.

#### Scenario: Story history displays
- **WHEN** user views story history
- **THEN** past stories are listed ordered by createdAt DESC

### Requirement: Subscription status display
The Me tab SHALL show the current subscription plan (Free/Starter/Pro/Elite), expiration date if subscribed, and an upgrade CTA if on free plan.

#### Scenario: Free user sees upgrade CTA
- **WHEN** a free user views the Me tab
- **THEN** an "Upgrade" button is displayed that opens the paywall

#### Scenario: Subscribed user sees plan info
- **WHEN** a Pro user views the Me tab
- **THEN** their plan badge shows "Pro" with expiration date

### Requirement: Settings access
The Me tab SHALL have a settings button that opens the SettingsPanel overlay.

#### Scenario: Open settings
- **WHEN** user taps the settings icon
- **THEN** the SettingsPanel overlay slides in
