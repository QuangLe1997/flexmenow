## ADDED Requirements

### Requirement: Flutter project initialization
The Flutter app SHALL be initialized with latest stable Flutter SDK targeting iOS and Android. The app SHALL use the package name `com.flexmenow.app`.

#### Scenario: App builds for both platforms
- **WHEN** `flutter build` is run for iOS and Android
- **THEN** the app compiles without errors and produces valid artifacts

### Requirement: Firebase initialization
The app SHALL initialize Firebase services on launch: Auth, Firestore, Storage, Remote Config, Analytics, Messaging. Initialization SHALL complete before any Firebase API calls.

#### Scenario: Firebase services ready on launch
- **WHEN** the app launches and reaches the splash screen
- **THEN** all Firebase services are initialized and ready for use

### Requirement: Design tokens from mockup
The app SHALL define all design tokens in `core/design_tokens.dart` extracted from the mockup `C` object: colors (zinc-50 through zinc-950, amber-400, amber-500, purple-500, blue-500, etc.), gradients, border radius values, padding/spacing values, font sizes, and font weights.

#### Scenario: Design tokens match mockup exactly
- **WHEN** any widget references a color, gradient, or spacing value
- **THEN** it uses design tokens, never raw hex values, and tokens match the mockup `C` object

### Requirement: Theme configuration
The app SHALL use dark mode as default theme. Background SHALL be zinc-950 (#09090B). Card backgrounds SHALL be zinc-900 (#18181B). Text SHALL default to white (#FAFAFA). Accent color SHALL be amber-500 (#F59E0B).

#### Scenario: App renders in dark mode
- **WHEN** the app launches
- **THEN** the theme is dark mode with zinc-950 background and amber-500 accent

### Requirement: Typography
The app SHALL use Inter as the primary font and JetBrains Mono as the monospace font. Font sizes SHALL match the mockup: xs (12), sm (14), base (16), lg (18), xl (20), 2xl (24), 3xl (30).

#### Scenario: Text renders with correct fonts
- **WHEN** text is displayed anywhere in the app
- **THEN** it uses Inter font with the correct size/weight from design tokens

### Requirement: GoRouter navigation
The app SHALL use GoRouter for navigation with 4 main tabs: Glow (/glow), Create (/create), Story (/story), Me (/me). Tab labels SHALL be max 5 characters for i18n compatibility.

#### Scenario: Tab navigation works
- **WHEN** user taps a bottom navigation tab
- **THEN** the app navigates to the corresponding tab screen without losing tab state

#### Scenario: Deep linking supported
- **WHEN** the app receives a deep link URL
- **THEN** GoRouter resolves the route and navigates to the correct screen

### Requirement: Bottom navigation bar
The app SHALL display a bottom navigation bar with 4 tabs: Glow (camera icon), Create (sparkles icon), Story (book icon), Me (user icon). The active tab SHALL be highlighted with amber-500 color.

#### Scenario: Bottom nav displays correctly
- **WHEN** the main app screen is visible
- **THEN** the bottom nav shows 4 tabs with icons and labels

### Requirement: Riverpod state management
The app SHALL use Riverpod for all state management. Global providers SHALL be in `providers/` directory. Feature-specific providers SHALL be co-located with their screens.

#### Scenario: State is reactive
- **WHEN** a provider's state changes (e.g., credits balance)
- **THEN** all widgets watching that provider rebuild with the new state

### Requirement: i18n support
The app SHALL support 6 languages: EN, VI, ES, PT, JA, KO. Device locale SHALL determine the display language. Fallback SHALL be EN if device language is not supported. Brand names (FlexMe, FlexLocket, FlexShot, FlexTale) SHALL never be translated.

#### Scenario: Language fallback
- **WHEN** the device locale is French (unsupported)
- **THEN** the app displays all text in English (EN)

#### Scenario: Supported language displays correctly
- **WHEN** the device locale is Vietnamese
- **THEN** all UI labels and JSON data text display in Vietnamese
