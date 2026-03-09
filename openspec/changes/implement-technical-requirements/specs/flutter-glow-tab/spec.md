## ADDED Requirements

### Requirement: Camera-first Glow screen
The Glow tab SHALL display a camera viewfinder as the primary UI. Minimal UI — no descriptions, no tutorials. Philosophy: "Try and you'll know."

#### Scenario: Glow tab shows camera
- **WHEN** user navigates to the Glow tab
- **THEN** the camera viewfinder is displayed full-screen with capture button

### Requirement: Photo capture and pick
The user SHALL be able to capture a photo using the camera or pick from gallery. The captured/picked photo SHALL be validated for face detection before upload.

#### Scenario: Capture photo from camera
- **WHEN** user taps the capture button
- **THEN** a photo is taken and sent to face detection validation

#### Scenario: Pick photo from gallery
- **WHEN** user taps the gallery button
- **THEN** the image picker opens and selected photo is sent to face detection validation

### Requirement: ML Kit face detection (pre-upload)
The app SHALL use Google ML Kit Face Detection (on-device) to validate photos before upload. Validation SHALL check: (a) at least 1 face detected, (b) face is front-facing (not extreme angle), (c) face is large enough in frame. The app SHALL show a specific error message if validation fails.

#### Scenario: Valid face detected
- **WHEN** a photo with a clear, front-facing face is captured
- **THEN** face detection passes and photo proceeds to upload/processing

#### Scenario: No face detected
- **WHEN** a photo with no face is captured
- **THEN** an error message is shown: "No face detected. Please try again."

#### Scenario: Face too small
- **WHEN** a photo with a very small/distant face is captured
- **THEN** an error message is shown: "Face is too small. Please move closer."

### Requirement: Glow daily free limit
The user SHALL get 10 free Glow uses per day (configurable via Remote Config `daily_free_glow_limit`). After the free limit, each Glow use costs `glow_credit_cost` credits (default 0.5). The daily counter SHALL reset at midnight local time.

#### Scenario: Free uses available
- **WHEN** user has remaining free uses today
- **THEN** the Glow enhancement is free (no credit deduction)

#### Scenario: Free uses exhausted
- **WHEN** user has used all 10 free uses today
- **THEN** each subsequent use deducts `glow_credit_cost` credits

### Requirement: GlowProcessing screen
After photo upload, the app SHALL show a processing screen with an animation/progress indicator while AI enhancement runs (2-3 seconds).

#### Scenario: Processing animation
- **WHEN** a photo is submitted for Glow enhancement
- **THEN** the GlowProcessing screen displays with a pulsing/shimmer animation

### Requirement: GlowResult screen
After enhancement completes, the app SHALL show the GlowResult screen with before/after comparison. User SHALL be able to save the enhanced photo to gallery or share.

#### Scenario: Result displays enhanced photo
- **WHEN** Glow enhancement completes successfully
- **THEN** the GlowResult screen shows the enhanced photo with save/share options

#### Scenario: Enhancement fails
- **WHEN** Glow enhancement fails
- **THEN** an error message is shown and user can retry

### Requirement: FlexLocket feature flag
The Glow tab visibility SHALL be controlled by Remote Config `flexlocket_enabled`. If false, the tab SHALL be hidden.

#### Scenario: FlexLocket disabled
- **WHEN** Remote Config `flexlocket_enabled` is false
- **THEN** the Glow tab is not visible in the bottom navigation
