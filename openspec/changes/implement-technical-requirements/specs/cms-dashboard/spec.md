## ADDED Requirements

### Requirement: CMS authentication
The CMS SHALL authenticate admin users via Firebase Admin SDK. Only users with `admin: true` custom claim SHALL access the CMS. Unauthenticated requests SHALL redirect to a login page.

#### Scenario: Admin access granted
- **WHEN** a user with admin custom claim accesses the CMS
- **THEN** the dashboard is displayed

#### Scenario: Non-admin denied
- **WHEN** a user without admin claim accesses the CMS
- **THEN** they are redirected to an access denied page

### Requirement: Dashboard stats
The dashboard SHALL display aggregate statistics: total users, daily active users (DAU), monthly active users (MAU), total generations, total stories, total revenue (from orders), total credits used.

#### Scenario: Dashboard loads stats
- **WHEN** admin navigates to the dashboard
- **THEN** aggregate stats are computed from Firestore collections and displayed

### Requirement: Dashboard layout
The dashboard SHALL use a sidebar navigation layout with links to: Dashboard, Templates, Stories, Users. The CMS SHALL use TailwindCSS for styling with a dark theme matching the app brand.

#### Scenario: Navigation works
- **WHEN** admin clicks "Templates" in the sidebar
- **THEN** the templates management page is displayed
