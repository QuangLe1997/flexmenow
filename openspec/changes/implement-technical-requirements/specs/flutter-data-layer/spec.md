## ADDED Requirements

### Requirement: Data models
The app SHALL define Dart models for: User, Generation, Story, Scene, Order, CreditLog, Template, StoryData, OnboardingData. Models SHALL match Firestore schema from TECHNICAL_REQUIREMENTS.md Section 8.

#### Scenario: Models serialize/deserialize correctly
- **WHEN** a Firestore document is read
- **THEN** it deserializes into the correct Dart model without data loss

### Requirement: Auth repository
The app SHALL have an AuthRepository that wraps Firebase Auth for: Google sign-in, Apple sign-in, anonymous sign-in, sign out, auth state stream, current user.

#### Scenario: Auth state changes propagate
- **WHEN** user signs in or out
- **THEN** the auth state stream emits the new state and Riverpod providers react

### Requirement: User repository
The app SHALL have a UserRepository that provides: real-time user profile stream (onSnapshot), update device info, update FCM token, update last active.

#### Scenario: Real-time profile updates
- **WHEN** credits balance changes in Firestore (server-side)
- **THEN** the user profile stream emits the updated User model

### Requirement: Template repository
The app SHALL have a TemplateRepository that: fetches flexshot_templates.json from URL in Remote Config, caches JSON locally, provides filtered/sorted template lists, checks version for updates.

#### Scenario: Template data cached locally
- **WHEN** app launches and cached JSON exists with matching version
- **THEN** templates load from local cache without network request

#### Scenario: Template data updated from remote
- **WHEN** app launches and remote JSON has newer version
- **THEN** new JSON is fetched, cached, and templates update

### Requirement: Story repository
The app SHALL have a StoryRepository with the same fetch/cache pattern as TemplateRepository but for flextale_stories.json.

#### Scenario: Story data cached and refreshed
- **WHEN** app launches
- **THEN** story data loads from cache or remote with version check

### Requirement: Generation repository
The app SHALL have a GenerationRepository that: calls genFlexShot Cloud Function, streams generation status from Firestore (onSnapshot), lists user's generation history.

#### Scenario: Generation status stream
- **WHEN** a FlexShot generation is in progress
- **THEN** the generation doc stream emits status updates (pending → processing → completed)

### Requirement: Story generation repository
The app SHALL have a StoryGenerationRepository that: calls genFlexTale Cloud Function, streams story status from Firestore, lists user's story history, streams individual scenes from subcollection.

#### Scenario: Scene-by-scene progress stream
- **WHEN** a FlexTale story is generating
- **THEN** the story doc stream emits completedScenes updates and scene subcollection streams new scene docs

### Requirement: Remote Config service
The app SHALL have a RemoteConfigService that: fetches and activates Remote Config on launch, provides typed getters for all config parameters (feature flags, pricing, URLs, paywall plans JSON, WOW pricing JSON).

#### Scenario: Remote Config values available
- **WHEN** app initializes
- **THEN** all Remote Config parameters are accessible with correct types and defaults

### Requirement: Storage service
The app SHALL have a StorageService that: uploads images to Firebase Storage at `uploads/{userId}/{filename}`, returns the storage path for Cloud Function input.

#### Scenario: Image upload
- **WHEN** user selects a photo for FlexShot
- **THEN** the image is uploaded to Storage and the path is returned

### Requirement: RevenueCat service
The app SHALL have a RevenueCatService that: initializes RevenueCat SDK, fetches available packages, initiates purchases, restores purchases, provides subscription status.

#### Scenario: Purchase flow
- **WHEN** user selects a subscription plan
- **THEN** RevenueCat purchase flow initiates and processes through IAP

### Requirement: Riverpod providers
The app SHALL define Riverpod providers for: authStateProvider, currentUserProvider, creditsProvider, templatesProvider, storiesProvider, remoteConfigProvider, generationStatusProvider, storyStatusProvider.

#### Scenario: Provider dependency chain
- **WHEN** authStateProvider emits a new user
- **THEN** dependent providers (currentUser, credits, etc.) automatically refresh
