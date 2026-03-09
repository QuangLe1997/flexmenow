## ADDED Requirements

### Requirement: Template list page
The CMS SHALL display a paginated list of all FlexShot templates with: cover image thumbnail, name (EN), category, type, gender, style, badge, premium status, sortOrder, active status.

#### Scenario: Templates listed
- **WHEN** admin navigates to Templates page
- **THEN** all templates are listed from Firestore with filtering and search

### Requirement: Template create/edit form
The CMS SHALL provide a form to create/edit templates with fields: name (all 6 languages), category, type, gender, style, credits cost, badge, premium toggle, isActive toggle, sortOrder, cover image upload, preview images upload (up to 3), base prompt, negative prompt, style hint, AI config (model, guidanceScale, aspectRatio, numberOfImages, safetyFilterLevel, referenceType).

#### Scenario: Create new template
- **WHEN** admin fills the template form and clicks Save
- **THEN** a new template doc is created in Firestore with all fields

#### Scenario: Edit existing template
- **WHEN** admin edits a template's name and saves
- **THEN** the template doc in Firestore is updated

### Requirement: Template image upload
The CMS SHALL upload template cover and preview images to GCS at `templates/{templateId}/cover.png` and `templates/{templateId}/preview_{n}.png`. Upload SHALL return the CDN URL.

#### Scenario: Image upload to GCS
- **WHEN** admin uploads a cover image for template t001
- **THEN** the image is stored at `templates/t001/cover.png` and the URL is saved to the template doc

### Requirement: Template delete
The CMS SHALL allow deleting templates. Deletion SHALL remove the Firestore doc and optionally the GCS images.

#### Scenario: Delete template
- **WHEN** admin deletes a template
- **THEN** the template is removed from Firestore

### Requirement: Template reorder
The CMS SHALL allow drag-and-drop reordering of templates. Reorder SHALL update sortOrder field on affected templates.

#### Scenario: Reorder templates
- **WHEN** admin drags template from position 3 to position 1
- **THEN** sortOrder values are updated for all affected templates

### Requirement: Template JSON publish
The CMS SHALL have a "Publish" button that generates the complete `flexshot_templates.json` file per the schema in TECHNICAL_REQUIREMENTS.md Section 1, and uploads it to GCS at the URL configured in Remote Config.

#### Scenario: Publish templates JSON
- **WHEN** admin clicks "Publish" on the Templates page
- **THEN** the full JSON is generated from all active templates in Firestore and uploaded to GCS

### Requirement: Template card preview
The CMS SHALL show a live preview of how the template card will appear in the mobile app.

#### Scenario: Preview matches app
- **WHEN** admin views a template in the CMS
- **THEN** a preview card matching the app's dark theme design is displayed
