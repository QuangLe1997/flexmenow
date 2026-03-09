## ADDED Requirements

### Requirement: Template API endpoints
The CMS SHALL expose REST API endpoints for template management:
- POST /api/templates — create template
- GET /api/templates — list templates (with query params for filter/sort/pagination)
- GET /api/templates/:id — get single template
- PUT /api/templates/:id — update template
- DELETE /api/templates/:id — delete template
- POST /api/templates/publish — generate and upload JSON to GCS

#### Scenario: Create template via API
- **WHEN** POST /api/templates is called with valid template data
- **THEN** a new template is created in Firestore and returned with 201 status

#### Scenario: List templates with filter
- **WHEN** GET /api/templates?category=travel&gender=female is called
- **THEN** filtered templates are returned as JSON array

### Requirement: Story API endpoints
The CMS SHALL expose REST API endpoints for story management:
- POST /api/stories — create story
- GET /api/stories — list stories
- GET /api/stories/:id — get single story
- PUT /api/stories/:id — update story
- DELETE /api/stories/:id — delete story
- POST /api/stories/publish — generate and upload JSON to GCS

#### Scenario: Publish stories via API
- **WHEN** POST /api/stories/publish is called
- **THEN** flextale_stories.json is generated and uploaded to GCS

### Requirement: Upload API endpoint
The CMS SHALL expose POST /api/upload for uploading images to GCS. It SHALL accept multipart form data with the image file and a target path. It SHALL return the GCS URL.

#### Scenario: Upload image
- **WHEN** POST /api/upload is called with an image file and path "templates/t001/cover.png"
- **THEN** the image is uploaded to GCS and the CDN URL is returned

### Requirement: User API endpoints
The CMS SHALL expose REST API endpoints for user management:
- GET /api/users — list users (paginated, searchable)
- GET /api/users/:id — get user detail
- GET /api/users/:id/history — get user generation history
- GET /api/users/:id/orders — get user orders
- POST /api/users/:id/credits — adjust credits (with reason)

#### Scenario: Adjust credits via API
- **WHEN** POST /api/users/uid123/credits is called with { amount: 10, reason: "Bonus" }
- **THEN** user's credits are adjusted and a creditLog entry is created

### Requirement: Dashboard stats API
The CMS SHALL expose GET /api/dashboard/stats returning aggregate statistics: totalUsers, activeUsersToday, activeUsersMonth, totalGenerations, totalStories, totalRevenue, totalCreditsUsed.

#### Scenario: Get dashboard stats
- **WHEN** GET /api/dashboard/stats is called
- **THEN** aggregated stats are computed and returned as JSON

### Requirement: API authentication
All CMS API endpoints SHALL require Firebase Admin authentication. Requests SHALL include a Firebase ID token in the Authorization header. The token SHALL be verified and the user SHALL have `admin: true` custom claim.

#### Scenario: Unauthenticated request rejected
- **WHEN** an API request is made without a valid token
- **THEN** 401 Unauthorized is returned

#### Scenario: Non-admin request rejected
- **WHEN** an API request is made by a non-admin user
- **THEN** 403 Forbidden is returned
