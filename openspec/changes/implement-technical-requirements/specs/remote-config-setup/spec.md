## ADDED Requirements

### Requirement: Remote Config parameters setup
A setup script or configuration file SHALL define all Firebase Remote Config parameters from TECHNICAL_REQUIREMENTS.md Section 3: content URLs (flexshot_json_url, flextale_json_url, onboarding_json_url), feature flags (wow_everyday_enabled, search_enabled, search_supported_langs, ai_chat_enabled, flexlocket_enabled, schedule_post_enabled, referral_enabled, maintenance_mode), pricing (default_template_credits, premium_template_credits, new_user_free_credits, daily_free_glow_limit, glow_credit_cost), paywall config (paywall_variant, paywall_show_trial, paywall_trial_days, paywall_plans_json), WOW pricing (wow_pricing_json).

#### Scenario: All parameters defined with defaults
- **WHEN** the Remote Config setup is applied
- **THEN** all parameters exist with their default values as specified in TECHNICAL_REQUIREMENTS.md

### Requirement: Onboarding URL conditions
The `onboarding_json_url` parameter SHALL have conditions based on region/country so each region gets its own onboarding JSON URL.

#### Scenario: VN region gets VN onboarding
- **WHEN** a device from Vietnam fetches Remote Config
- **THEN** `onboarding_json_url` points to the VN-specific onboarding JSON

### Requirement: Paywall plans JSON
The `paywall_plans_json` parameter SHALL contain a JSON string with 3 plans (Starter, Pro, Elite) per the schema in TECHNICAL_REQUIREMENTS.md Section 3. Each plan SHALL have: id, name (i18n), price, priceId, period, credits, color, badge, features (i18n).

#### Scenario: Paywall plans parseable
- **WHEN** the app parses `paywall_plans_json`
- **THEN** 3 plans are available with all required fields

### Requirement: WOW pricing JSON
The `wow_pricing_json` parameter SHALL contain a JSON string with 4 WOW plans (3d, 7d, 30d, forever) per the schema in TECHNICAL_REQUIREMENTS.md Section 3.

#### Scenario: WOW plans parseable
- **WHEN** the app parses `wow_pricing_json`
- **THEN** 4 WOW plans are available with prices, per-day costs, and IAP product IDs

### Requirement: Setup script executable
The Remote Config setup SHALL be implementable via Firebase Admin SDK script that can be run to initialize or update all parameters.

#### Scenario: Script initializes config
- **WHEN** the setup script is run
- **THEN** all Remote Config parameters are created/updated in the Firebase project
