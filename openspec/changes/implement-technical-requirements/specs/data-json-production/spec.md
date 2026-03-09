## ADDED Requirements

### Requirement: FlexShot templates JSON
A production-ready `flexshot_templates.json` SHALL be created matching the schema in TECHNICAL_REQUIREMENTS.md Section 1. It SHALL include: version, updatedAt, defaults (creditsPerTemplate, premiumCreditsPerTemplate), categories array (5 categories with i18n names), types array (5 types), genders array (4 genders), and templates array with at least 10 sample templates spanning all categories.

#### Scenario: JSON validates against schema
- **WHEN** the JSON file is validated against the defined schema
- **THEN** validation passes with zero errors

#### Scenario: All i18n fields populated
- **WHEN** the JSON is parsed
- **THEN** every name/label field has values for all 6 languages (en, vi, es, pt, ja, ko)

### Requirement: FlexTale stories JSON
A production-ready `flextale_stories.json` SHALL be created matching the schema in TECHNICAL_REQUIREMENTS.md Section 2. It SHALL include: version, updatedAt, categories, types, genders, durations array (3 durations), and stories array with at least 5 sample stories with full chapters (3+ chapters each).

#### Scenario: Stories have complete chapters
- **WHEN** the JSON is parsed
- **THEN** each story has at least 3 chapters with heading, text, choices, prompt, and aiConfig

#### Scenario: Per-story credit pricing
- **WHEN** the JSON is parsed
- **THEN** each story has its own credits field (not a global default)

### Requirement: Onboarding JSON per region
Production-ready onboarding JSON files SHALL be created for at least 3 regions: VN, US, JP. Each SHALL follow the schema in TECHNICAL_REQUIREMENTS.md Section 3: slides array (3 slides for FlexLocket/FlexShot/FlexTale), personalizeOptions, loginConfig.

#### Scenario: VN onboarding has Vietnamese content
- **WHEN** onboarding_VN.json is parsed
- **THEN** slides have Vietnamese text in the vi field and images reference the VN image directory

#### Scenario: Login config correct
- **WHEN** onboarding JSON is parsed
- **THEN** loginConfig has freeCreditsLabel (i18n), showGoogle, showApple, showAnonymous flags

### Requirement: JSON schema validation
A validation script SHALL exist that validates all data JSONs against their schemas using AJV or equivalent. The script SHALL be runnable via `npm run validate`.

#### Scenario: Validation catches errors
- **WHEN** a template is missing the required `name.en` field
- **THEN** the validation script reports the error with field path
