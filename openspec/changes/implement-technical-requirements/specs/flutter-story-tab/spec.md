## ADDED Requirements

### Requirement: Story grid display
The Story tab SHALL display FlexTale stories in a grid/list layout. Stories SHALL be loaded from cached flextale_stories.json. Each story card SHALL show: cover image, title (i18n), category, duration badge, total pics count, credit cost, badge (HOT/NEW/TRENDING).

#### Scenario: Stories load and display
- **WHEN** user navigates to the Story tab
- **THEN** stories from cached JSON are displayed sorted by sortOrder

### Requirement: Story category filter
The Story tab SHALL display category filters. Categories SHALL come from the JSON `categories` array (Travel, Romance, Cyberpunk, Paradise, etc.).

#### Scenario: Filter by category
- **WHEN** user taps "Romance" category
- **THEN** only stories with category "Romance" are displayed

### Requirement: Duration filter
The Story tab SHALL provide duration filters: Moment (instant), One Day, Many Days. Duration labels SHALL be i18n-aware.

#### Scenario: Filter by duration
- **WHEN** user selects "Many Days" duration filter
- **THEN** only stories with duration "many" are displayed

### Requirement: Type and gender filters
The Story tab SHALL provide type and gender filters identical to Create tab for consistency.

#### Scenario: Combined filtering
- **WHEN** user selects category "Travel" + gender "couple" + duration "many"
- **THEN** only stories matching all three filters are displayed

### Requirement: Story search
The Story tab SHALL show a search bar following the same language restriction rules as Create tab (Remote Config `search_supported_langs`). Search SHALL run locally on `title[deviceLang]` and `tags[]`.

#### Scenario: Search finds story
- **WHEN** user types "paris" in search
- **THEN** stories with "paris" in title or tags are displayed

### Requirement: TalePreview screen
Tapping a story card SHALL open the TalePreview screen showing: preview images, title (i18n), description (i18n), chapter count, total pics, credit cost, and a "Start Story" CTA button.

#### Scenario: Story preview displays
- **WHEN** user taps a story card
- **THEN** TalePreview screen opens with story details and chapter list

### Requirement: Credit check for FlexTale
Before calling `genFlexTale`, the app SHALL check if user has sufficient credits. FlexTale credits come from the story data JSON `credits` field (NOT Remote Config). If insufficient, show paywall.

#### Scenario: Story credits check
- **WHEN** user taps "Start Story" on a story costing 8 credits with 5 credits balance
- **THEN** the paywall overlay is shown

### Requirement: TaleProcessing screen
After initiating story generation, the app SHALL show TaleProcessing screen. The screen SHALL listen to the Firestore story doc for real-time updates: totalScenes, completedScenes, current scene name. Each scene completion SHALL be visually indicated.

#### Scenario: Scene-by-scene progress
- **WHEN** a scene completes during story generation
- **THEN** the TaleProcessing screen updates completedScenes count and shows the completed scene image

### Requirement: TaleReader screen
When story generation completes, the app SHALL show the TaleReader screen. The reader SHALL display chapter-by-chapter with: heading (i18n), text (i18n), generated image, and chapter choices (i18n). User SHALL swipe/navigate between chapters.

#### Scenario: Reader displays full story
- **WHEN** story generation status is "completed"
- **THEN** TaleReader shows all chapters with images, text, and choices

#### Scenario: Save and share story
- **WHEN** user is in TaleReader
- **THEN** user can save individual images or share the full story
