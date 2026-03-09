/// FlexShot template data model parsed from `flexshot_templates.json`.
///
/// This JSON is hosted on GCS, URL configured via Remote Config.
/// App fetches on launch, caches locally, and renders UI from this data.
class TemplateData {
  final String id;
  final Map<String, dynamic> name; // i18n: { "en": "...", "vi": "...", ... }
  final String category; // "romance" | "travel" | "luxury" | "creative" | "beauty" | "career" | "emotion" | "culture" | "lifestyle" | "active"
  final String type; // "travel" | "sexy" | "business" | "trend" | "traditional"
  final String gender; // "male" | "female" | "couple" | "all"
  final String promptGender; // "male" | "female" | "neutral" — whether the prompt is gender-specific
  final String style; // "Realistic" | "Cinematic" | "Corporate" | "Anime" | etc.
  final int credits; // cost per generation
  final String? badge; // "HOT" | "NEW" | "TRENDING" | null
  final bool premium; // requires paid subscription
  final bool isActive; // false = hidden from app
  final int sortOrder; // display order
  final String coverImage;
  final List<String> previewImages;
  final Map<String, dynamic> prompt; // { base, negative, styleHint }
  final Map<String, dynamic> aiConfig; // { model, guidanceScale, aspectRatio, ... }
  final Map<String, dynamic> stats; // { likes, views, generates }
  final List<String> tags;
  final String createdAt; // ISO 8601 string
  final String updatedAt; // ISO 8601 string

  const TemplateData({
    required this.id,
    required this.name,
    required this.category,
    required this.type,
    required this.gender,
    this.promptGender = 'neutral',
    required this.style,
    required this.credits,
    this.badge,
    required this.premium,
    required this.isActive,
    required this.sortOrder,
    required this.coverImage,
    required this.previewImages,
    required this.prompt,
    required this.aiConfig,
    required this.stats,
    required this.tags,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Creates a [TemplateData] from a JSON map.
  factory TemplateData.fromJson(Map<String, dynamic> json) {
    return TemplateData(
      id: json['id'] as String? ?? '',
      name: (json['name'] as Map<String, dynamic>?) ?? {},
      category: json['category'] as String? ?? '',
      type: json['type'] as String? ?? '',
      gender: json['gender'] as String? ?? 'all',
      promptGender: json['promptGender'] as String? ?? 'neutral',
      style: json['style'] as String? ?? 'Realistic',
      credits: (json['credits'] as num?)?.toInt() ?? 1,
      badge: json['badge'] as String?,
      premium: json['premium'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? true,
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      coverImage: json['coverImage'] as String? ?? '',
      previewImages: (json['previewImages'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      prompt: (json['prompt'] as Map<String, dynamic>?) ?? {},
      aiConfig: (json['aiConfig'] as Map<String, dynamic>?) ?? {},
      stats: (json['stats'] as Map<String, dynamic>?) ?? {},
      tags: (json['tags'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
    );
  }

  /// Converts this model to a JSON-compatible map.
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'category': category,
      'type': type,
      'gender': gender,
      'promptGender': promptGender,
      'style': style,
      'credits': credits,
      'badge': badge,
      'premium': premium,
      'isActive': isActive,
      'sortOrder': sortOrder,
      'coverImage': coverImage,
      'previewImages': previewImages,
      'prompt': prompt,
      'aiConfig': aiConfig,
      'stats': stats,
      'tags': tags,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  /// Returns the localized name for the given language code.
  /// Falls back to English ('en') if the language is not available.
  String localizedName(String langCode) {
    return (name[langCode] ?? name['en'] ?? '') as String;
  }

  /// Returns the base prompt text.
  String get basePrompt => (prompt['base'] ?? '') as String;

  /// Returns the negative prompt text.
  String get negativePrompt => (prompt['negative'] ?? '') as String;

  /// Returns the style hint text.
  String get styleHint => (prompt['styleHint'] ?? '') as String;

  /// Returns the number of likes.
  int get likes => (stats['likes'] as num?)?.toInt() ?? 0;

  /// Returns the number of views.
  int get views => (stats['views'] as num?)?.toInt() ?? 0;

  /// Returns the number of generates.
  int get generates => (stats['generates'] as num?)?.toInt() ?? 0;

  /// Whether this template has a badge.
  bool get hasBadge => badge != null && badge!.isNotEmpty;

  @override
  String toString() => 'TemplateData(id: $id, name: ${name['en']}, category: $category)';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is TemplateData &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}

/// Top-level response model for `flexshot_templates.json`.
///
/// Contains version info, filter option metadata, and the full list of templates.
class TemplatesResponse {
  final String version;
  final String updatedAt;
  final String imageBaseUrl;
  final String imageSuffix;
  final Map<String, dynamic> defaults; // { creditsPerTemplate, premiumCreditsPerTemplate }
  final List<Map<String, dynamic>> categories; // filter options with i18n names
  final List<Map<String, dynamic>> types; // filter options with i18n names
  final List<Map<String, dynamic>> genders; // filter options with i18n names
  final List<TemplateData> templates;

  const TemplatesResponse({
    required this.version,
    required this.updatedAt,
    this.imageBaseUrl = '',
    this.imageSuffix = '',
    required this.defaults,
    required this.categories,
    required this.types,
    required this.genders,
    required this.templates,
  });

  /// Build a full image URL from a relative path.
  String buildImageUrl(String relativePath) {
    if (relativePath.isEmpty || imageBaseUrl.isEmpty) return relativePath;
    return '$imageBaseUrl${Uri.encodeComponent(relativePath)}$imageSuffix';
  }

  /// Creates a [TemplatesResponse] from the top-level JSON map.
  factory TemplatesResponse.fromJson(Map<String, dynamic> json) {
    final baseUrl = json['imageBaseUrl'] as String? ?? '';
    final suffix = json['imageSuffix'] as String? ?? '';

    return TemplatesResponse(
      version: json['version'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
      imageBaseUrl: baseUrl,
      imageSuffix: suffix,
      defaults: (json['defaults'] as Map<String, dynamic>?) ?? {},
      categories: (json['categories'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [],
      types: (json['types'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [],
      genders: (json['genders'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [],
      templates: (json['templates'] as List<dynamic>?)
              ?.map((e) => TemplateData.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  /// Converts this model to a JSON-compatible map.
  Map<String, dynamic> toMap() {
    return {
      'version': version,
      'updatedAt': updatedAt,
      'defaults': defaults,
      'categories': categories,
      'types': types,
      'genders': genders,
      'templates': templates.map((t) => t.toMap()).toList(),
    };
  }

  /// Returns the default credit cost per template.
  int get defaultCredits =>
      (defaults['creditsPerTemplate'] as num?)?.toInt() ?? 1;

  /// Returns the default credit cost for premium templates.
  int get premiumCredits =>
      (defaults['premiumCreditsPerTemplate'] as num?)?.toInt() ?? 2;

  /// Returns only active templates (isActive == true).
  List<TemplateData> get activeTemplates =>
      templates.where((t) => t.isActive).toList();

  @override
  String toString() =>
      'TemplatesResponse(version: $version, templates: ${templates.length})';
}
