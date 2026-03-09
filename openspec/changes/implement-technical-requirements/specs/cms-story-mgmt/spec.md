## ADDED Requirements

### Requirement: Story list page
The CMS SHALL display a paginated list of all FlexTale stories with: cover image, title (EN), category, duration, totalPics, credits, badge, active status, sortOrder.

#### Scenario: Stories listed
- **WHEN** admin navigates to Stories page
- **THEN** all stories are listed from Firestore with filtering

### Requirement: Story create/edit form
The CMS SHALL provide a form to create/edit stories with fields: title (all 6 languages), description (all 6 languages), category, type, gender, duration, totalPics, credits, badge, premium toggle, isActive toggle, sortOrder, cover image upload, preview images upload, tags.

#### Scenario: Create new story
- **WHEN** admin fills the story form and clicks Save
- **THEN** a new story doc is created in Firestore

### Requirement: Chapter editor
The story form SHALL include a chapter editor where admin can add/remove/reorder chapters. Each chapter has: order, heading (6 languages), text (6 languages), choices (6 languages, array of strings), prompt (base, negative, styleHint), aiConfig (model, guidanceScale, aspectRatio, referenceType).

#### Scenario: Add chapter to story
- **WHEN** admin clicks "Add Chapter" and fills chapter fields
- **THEN** a new chapter is added to the story's chapters array

#### Scenario: Reorder chapters
- **WHEN** admin drags chapter 3 to position 1
- **THEN** chapter order values are updated

### Requirement: Per-story credit pricing
The CMS SHALL allow setting credits per story individually (NOT from Remote Config). Credits field SHALL be editable per story.

#### Scenario: Set story credits
- **WHEN** admin sets credits to 8 for a story
- **THEN** the story's credits field is saved as 8 in Firestore and published JSON

### Requirement: Story image upload
The CMS SHALL upload story cover and preview images to GCS at `stories/{storyId}/cover.png` and `stories/{storyId}/preview_{n}.png`.

#### Scenario: Story images uploaded
- **WHEN** admin uploads preview images for story paris7
- **THEN** images are stored at `stories/paris7/preview_1.png` etc.

### Requirement: Story JSON publish
The CMS SHALL have a "Publish" button that generates `flextale_stories.json` per the schema in TECHNICAL_REQUIREMENTS.md Section 2 and uploads to GCS.

#### Scenario: Publish stories JSON
- **WHEN** admin clicks "Publish" on the Stories page
- **THEN** the full JSON is generated from all active stories and uploaded to GCS
