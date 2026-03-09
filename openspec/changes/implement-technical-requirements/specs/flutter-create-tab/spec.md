## ADDED Requirements

### Requirement: Template grid display
The Create tab SHALL display FlexShot templates in a grid layout. Templates SHALL be loaded from the cached flexshot_templates.json. Each template card SHALL show: cover image, name (i18n), badge (HOT/NEW/TRENDING if set), premium lock icon if premium.

#### Scenario: Templates load and display
- **WHEN** user navigates to the Create tab
- **THEN** templates from cached JSON are displayed in a grid sorted by sortOrder

### Requirement: Category filter bar
The Create tab SHALL display a horizontal scrollable category filter bar at the top. Categories SHALL come from the JSON `categories` array. Tapping a category SHALL filter templates by that category.

#### Scenario: Filter by category
- **WHEN** user taps "Travel" category
- **THEN** only templates with category "travel" are displayed

### Requirement: Type and gender filters
The Create tab SHALL provide type filter (travel, sexy, business, trend, traditional) and gender filter (all, male, female, couple) as secondary filters. Filter labels SHALL be i18n-aware.

#### Scenario: Multi-filter combination
- **WHEN** user selects category "lifestyle" + gender "female"
- **THEN** only templates matching both filters are displayed

### Requirement: Template search
The Create tab SHALL show a search bar if the device language is in `search_supported_langs` (Remote Config). Search SHALL run locally on `name[deviceLang]` and `tags[]`. If device lang is not supported, search bar SHALL be hidden.

#### Scenario: Search finds template
- **WHEN** user types "paris" in search (device lang is English)
- **THEN** templates with "paris" in name or tags are displayed

#### Scenario: Search hidden for unsupported language
- **WHEN** device language is Japanese and "ja" is not in `search_supported_langs`
- **THEN** the search bar is not visible

### Requirement: Sort options
Templates SHALL be sortable by: sortOrder (default), likes (stats.likes), views (stats.views), newest (createdAt).

#### Scenario: Sort by likes
- **WHEN** user selects "Most Liked" sort
- **THEN** templates are reordered by stats.likes descending

### Requirement: ShotDetail screen
Tapping a template card SHALL open the ShotDetail screen showing: preview images (carousel/swipeable), template name, style, category, credit cost, and a "Create" CTA button.

#### Scenario: Template detail displays
- **WHEN** user taps a template card
- **THEN** ShotDetail screen opens with preview images, name, and credit cost

### Requirement: Photo upload for FlexShot
The ShotDetail "Create" button SHALL open the photo upload flow. User SHALL capture or pick a photo. Photo SHALL pass ML Kit face detection validation before upload to Firebase Storage at `uploads/{userId}/{filename}`.

#### Scenario: Photo uploaded successfully
- **WHEN** user selects a valid photo with detected face
- **THEN** photo is uploaded to Firebase Storage and generation is initiated

### Requirement: Credit check before generation
Before calling `genFlexShot`, the app SHALL check if user has sufficient credits. Standard templates cost `default_template_credits` (Remote Config, default 1). Premium templates cost `premium_template_credits` (Remote Config, default 2). If insufficient, show paywall.

#### Scenario: Sufficient credits
- **WHEN** user has enough credits for the template
- **THEN** generation proceeds without interruption

#### Scenario: Insufficient credits
- **WHEN** user does not have enough credits
- **THEN** the paywall overlay is shown

### Requirement: ShotProcessing screen
After initiating generation, the app SHALL show the ShotProcessing screen. The screen SHALL display a processing animation and listen to the Firestore generation doc for real-time status updates (pending → processing → completed/failed).

#### Scenario: Real-time progress updates
- **WHEN** the generation doc status changes in Firestore
- **THEN** the ShotProcessing screen updates to reflect the current status

### Requirement: ShotResult screen
When generation completes, the app SHALL show the ShotResult screen with the generated image. User SHALL be able to: save to gallery, share, or generate again with the same template.

#### Scenario: Result displays generated image
- **WHEN** generation status is "completed"
- **THEN** ShotResult screen shows the output image with save/share options

#### Scenario: Generation fails
- **WHEN** generation status is "failed"
- **THEN** an error message is shown with retry option, credits are not deducted (handled by CF)
