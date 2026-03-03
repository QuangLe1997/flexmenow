/// Onboarding data model parsed from `onboarding_{region}.json`.
///
/// Each region (VN, US, JP, KR, BR, etc.) has its own onboarding JSON
/// with localized slides, personalization options, and login configuration.
/// The URL is determined by Remote Config with region-based conditions.
class OnboardingData {
  final String version;
  final String region; // "VN" | "US" | "JP" | "KR" | "BR" | ...
  final List<OnboardingSlide> slides;
  final List<PersonalizeOption> personalizeOptions;
  final LoginConfig loginConfig;

  const OnboardingData({
    required this.version,
    required this.region,
    required this.slides,
    required this.personalizeOptions,
    required this.loginConfig,
  });

  /// Creates an [OnboardingData] from a JSON map.
  factory OnboardingData.fromJson(Map<String, dynamic> json) {
    return OnboardingData(
      version: json['version'] as String? ?? '',
      region: json['region'] as String? ?? '',
      slides: (json['slides'] as List<dynamic>?)
              ?.map((e) => OnboardingSlide.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      personalizeOptions: (json['personalizeOptions'] as List<dynamic>?)
              ?.map(
                  (e) => PersonalizeOption.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      loginConfig: json['loginConfig'] != null
          ? LoginConfig.fromJson(json['loginConfig'] as Map<String, dynamic>)
          : const LoginConfig(
              freeCreditsLabel: {},
              showGoogle: true,
              showApple: true,
              showAnonymous: true,
            ),
    );
  }

  /// Converts this model to a JSON-compatible map.
  Map<String, dynamic> toMap() {
    return {
      'version': version,
      'region': region,
      'slides': slides.map((s) => s.toMap()).toList(),
      'personalizeOptions':
          personalizeOptions.map((p) => p.toMap()).toList(),
      'loginConfig': loginConfig.toMap(),
    };
  }

  /// The total number of onboarding slides.
  int get slideCount => slides.length;

  @override
  String toString() =>
      'OnboardingData(version: $version, region: $region, slides: ${slides.length})';
}

/// A single onboarding slide with localized content and images.
///
/// Each slide showcases one of the 3 core features:
/// FlexLocket, FlexShot, or FlexTale.
class OnboardingSlide {
  final String badge; // "FlexLocket" | "FlexShot" | "FlexTale"
  final String icon; // icon identifier: "camera", "sparkles", "layers"
  final Map<String, dynamic> title; // i18n
  final Map<String, dynamic> slogan; // i18n
  final Map<String, dynamic> subtitle; // i18n
  final String accentColor; // hex color: "#A855F7", "#F59E0B", etc.
  final List<String> images; // CDN URLs for slide images
  final String animation; // animation type: "flip3d", "fadeIn", etc.

  const OnboardingSlide({
    required this.badge,
    required this.icon,
    required this.title,
    required this.slogan,
    required this.subtitle,
    required this.accentColor,
    required this.images,
    required this.animation,
  });

  /// Creates an [OnboardingSlide] from a JSON map.
  factory OnboardingSlide.fromJson(Map<String, dynamic> json) {
    return OnboardingSlide(
      badge: json['badge'] as String? ?? '',
      icon: json['icon'] as String? ?? '',
      title: (json['title'] as Map<String, dynamic>?) ?? {},
      slogan: (json['slogan'] as Map<String, dynamic>?) ?? {},
      subtitle: (json['subtitle'] as Map<String, dynamic>?) ?? {},
      accentColor: json['accentColor'] as String? ?? '#FFFFFF',
      images: (json['images'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      animation: json['animation'] as String? ?? 'fadeIn',
    );
  }

  /// Converts this model to a JSON-compatible map.
  Map<String, dynamic> toMap() {
    return {
      'badge': badge,
      'icon': icon,
      'title': title,
      'slogan': slogan,
      'subtitle': subtitle,
      'accentColor': accentColor,
      'images': images,
      'animation': animation,
    };
  }

  /// Returns the localized title for the given language code.
  /// Falls back to English ('en') if the language is not available.
  String localizedTitle(String langCode) {
    return (title[langCode] ?? title['en'] ?? '') as String;
  }

  /// Returns the localized slogan for the given language code.
  /// Falls back to English ('en') if the language is not available.
  String localizedSlogan(String langCode) {
    return (slogan[langCode] ?? slogan['en'] ?? '') as String;
  }

  /// Returns the localized subtitle for the given language code.
  /// Falls back to English ('en') if the language is not available.
  String localizedSubtitle(String langCode) {
    return (subtitle[langCode] ?? subtitle['en'] ?? '') as String;
  }

  @override
  String toString() => 'OnboardingSlide(badge: $badge, icon: $icon)';
}

/// Personalization option shown after onboarding slides.
///
/// Each option maps to a tab in the main app, letting the user
/// indicate their primary interest.
class PersonalizeOption {
  final Map<String, dynamic> label; // i18n: { "en": "Glow up my pics", ... }
  final String tabTarget; // "glow" | "create" | "story"
  final String accentColor; // hex color

  const PersonalizeOption({
    required this.label,
    required this.tabTarget,
    required this.accentColor,
  });

  /// Creates a [PersonalizeOption] from a JSON map.
  factory PersonalizeOption.fromJson(Map<String, dynamic> json) {
    return PersonalizeOption(
      label: (json['label'] as Map<String, dynamic>?) ?? {},
      tabTarget: json['tabTarget'] as String? ?? '',
      accentColor: json['accentColor'] as String? ?? '#FFFFFF',
    );
  }

  /// Converts this model to a JSON-compatible map.
  Map<String, dynamic> toMap() {
    return {
      'label': label,
      'tabTarget': tabTarget,
      'accentColor': accentColor,
    };
  }

  /// Returns the localized label for the given language code.
  /// Falls back to English ('en') if the language is not available.
  String localizedLabel(String langCode) {
    return (label[langCode] ?? label['en'] ?? '') as String;
  }

  @override
  String toString() =>
      'PersonalizeOption(target: $tabTarget, label: ${label['en']})';
}

/// Login configuration for the onboarding login screen.
///
/// Controls which SSO providers are shown and the free credits label.
class LoginConfig {
  final Map<String, dynamic> freeCreditsLabel; // i18n: { "en": "Get 12 free credits to start", ... }
  final bool showGoogle;
  final bool showApple;
  final bool showAnonymous;

  const LoginConfig({
    required this.freeCreditsLabel,
    required this.showGoogle,
    required this.showApple,
    required this.showAnonymous,
  });

  /// Creates a [LoginConfig] from a JSON map.
  factory LoginConfig.fromJson(Map<String, dynamic> json) {
    return LoginConfig(
      freeCreditsLabel:
          (json['freeCreditsLabel'] as Map<String, dynamic>?) ?? {},
      showGoogle: json['showGoogle'] as bool? ?? true,
      showApple: json['showApple'] as bool? ?? true,
      showAnonymous: json['showAnonymous'] as bool? ?? true,
    );
  }

  /// Converts this model to a JSON-compatible map.
  Map<String, dynamic> toMap() {
    return {
      'freeCreditsLabel': freeCreditsLabel,
      'showGoogle': showGoogle,
      'showApple': showApple,
      'showAnonymous': showAnonymous,
    };
  }

  /// Returns the localized free credits label for the given language code.
  /// Falls back to English ('en') if the language is not available.
  String localizedFreeCreditsLabel(String langCode) {
    return (freeCreditsLabel[langCode] ?? freeCreditsLabel['en'] ?? '')
        as String;
  }

  /// Returns the number of available auth providers.
  int get availableProviderCount =>
      (showGoogle ? 1 : 0) + (showApple ? 1 : 0) + (showAnonymous ? 1 : 0);

  @override
  String toString() =>
      'LoginConfig(google: $showGoogle, apple: $showApple, anonymous: $showAnonymous)';
}
