## ADDED Requirements

### Requirement: User list page
The CMS SHALL display a paginated list of users with: avatar, display name, email, subscription plan, credits balance, total generations, total stories, last active date. Admin SHALL be able to search by name/email and filter by plan.

#### Scenario: User list displays
- **WHEN** admin navigates to Users page
- **THEN** users are listed from Firestore with pagination (20 per page)

#### Scenario: Search users
- **WHEN** admin searches for "john"
- **THEN** users with "john" in displayName or email are shown

### Requirement: User detail page
The CMS SHALL show a user detail page with: full profile info, subscription details (plan, expiry, product ID), WOW subscription status, credit balance, device info, geo info, creation date, last active date.

#### Scenario: View user detail
- **WHEN** admin clicks a user in the list
- **THEN** the full user profile is displayed

### Requirement: User generation history
The user detail page SHALL show the user's generation history from the `generations` collection: template name, output image, credits spent, status, date.

#### Scenario: View generation history
- **WHEN** admin views a user's detail page
- **THEN** their FlexShot generations are listed

### Requirement: User order history
The user detail page SHALL show the user's order/transaction history from the `orders` collection: order type, product, amount, status, credits added, date.

#### Scenario: View order history
- **WHEN** admin views a user's detail page
- **THEN** their purchase orders are listed

### Requirement: Manual credit adjustment
The CMS SHALL allow admins to manually adjust a user's credit balance with a required reason. The adjustment SHALL create a creditLog entry with type "bonus" or "refund" and the admin's reason as description.

#### Scenario: Add credits manually
- **WHEN** admin adds 10 credits to a user with reason "Compensation for bug"
- **THEN** user's creditsBalance increases by 10 and a creditLog entry is created
