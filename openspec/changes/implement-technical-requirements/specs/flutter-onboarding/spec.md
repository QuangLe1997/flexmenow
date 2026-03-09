## ADDED Requirements

### Requirement: Splash screen
The app SHALL display a splash screen with the FlexMe logo and brand animation on launch. The splash screen SHALL display while Firebase initializes and Remote Config fetches.

#### Scenario: Splash screen during initialization
- **WHEN** the app launches cold
- **THEN** the splash screen displays until Firebase + Remote Config are ready

### Requirement: Auth state routing
The app SHALL check Firebase Auth state after initialization. If NOT logged in, show onboarding tour. If logged in, proceed to main app with parallel data fetching.

#### Scenario: New user sees onboarding
- **WHEN** the app launches with no authenticated user
- **THEN** the onboarding tour screen is displayed

#### Scenario: Returning user goes to main app
- **WHEN** the app launches with an authenticated user
- **THEN** the main app with tabs is displayed after data loading

### Requirement: Onboarding tour (3 slides)
The app SHALL display 3 onboarding slides fetched from the onboarding JSON (URL from Remote Config, region-specific). Each slide SHALL have: badge (feature name), icon, title, slogan, subtitle, accent color, preview images with animation. Slide content SHALL be i18n-aware.

#### Scenario: Tour slides display with remote content
- **WHEN** the onboarding screen loads
- **THEN** 3 slides are displayed with content from the region-specific onboarding JSON

#### Scenario: Slide navigation
- **WHEN** user swipes left or taps "Next"
- **THEN** the next slide is displayed with transition animation

### Requirement: Personalize screen
The app SHALL display a personalize screen after the tour with options for the user to select their primary interest. Options SHALL be loaded from the onboarding JSON `personalizeOptions`. Each option has a label (i18n), tabTarget, and accentColor.

#### Scenario: User selects interest
- **WHEN** user taps a personalize option
- **THEN** the selection is saved and user proceeds to login screen

### Requirement: Login screen
The app SHALL display a login screen with Google SSO, Apple SSO (iOS only), and anonymous login options. The login screen SHALL show the `freeCreditsLabel` from onboarding JSON (e.g., "Get 12 free credits to start"). Login config (`showGoogle`, `showApple`, `showAnonymous`) SHALL come from onboarding JSON.

#### Scenario: Google login
- **WHEN** user taps "Continue with Google"
- **THEN** Firebase Auth Google sign-in flow initiates and on success, user enters main app

#### Scenario: Apple login on iOS
- **WHEN** user taps "Continue with Apple" on an iOS device
- **THEN** Firebase Auth Apple sign-in flow initiates

#### Scenario: Anonymous login
- **WHEN** user taps "Try without account"
- **THEN** Firebase Auth anonymous sign-in creates an anonymous user

### Requirement: Post-auth initialization
After successful login, the app SHALL perform parallel initialization: (a) get device info, (b) call checkGeo Cloud Function, (c) fetch flexshot_templates.json, (d) fetch flextale_stories.json, (e) subscribe to user profile Firestore doc, (f) subscribe to generations collection, (g) subscribe to stories collection.

#### Scenario: Parallel data loading after login
- **WHEN** user successfully logs in
- **THEN** all 7 initialization tasks run in parallel and main app loads when critical ones complete

### Requirement: New user credit grant
When a new user logs in for the first time, the `onUserCreate` Cloud Function trigger SHALL create the user doc with `new_user_free_credits` from Remote Config (default 12).

#### Scenario: First-time user gets free credits
- **WHEN** a new user logs in for the first time
- **THEN** their credits balance shows the configured free credits amount (default 12)
