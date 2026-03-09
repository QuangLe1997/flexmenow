/// FlexTale story data model parsed from `flextale_stories.json`.
///
/// This JSON is hosted on GCS, URL configured via Remote Config.
/// App fetches on launch, caches locally, and renders UI from this data.
/// Unlike FlexShot templates, each story has its own credit cost (not from Remote Config).
class StoryData {
  final String id;
  final Map<String, dynamic> title; // i18n: { "en": "...", "vi": "...", ... }
  final Map<String, dynamic> description; // i18n
  final String category; // "romance" | "travel" | "luxury" | "creative" | "beauty" | "career" | "emotion" | "culture" | "lifestyle" | "active"
  final String type; // "aesthetic" | "flex" | "journey" | "story" | "travel" | "vlog"
  final String gender; // "male" | "female" | "couple" | "all"
  final String promptGender; // "male" | "female" | "neutral" — whether the prompt is gender-specific
  final String duration; // "moment" | "once" | "many"
  final int totalPics; // number of AI images generated
  final int credits; // per-story credit cost (from data JSON, NOT Remote Config)
  final String? badge; // "NEW" | "HOT" | "TRENDING" | null
  final bool premium;
  final bool isActive;
  final int sortOrder;
  final String coverImage;
  final List<String> previewImages;
  final List<ChapterData> chapters;
  final List<String> tags;
  final Map<String, dynamic> stats; // { likes, views, generates }
  final String createdAt; // ISO 8601 string
  final String updatedAt; // ISO 8601 string

  const StoryData({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.type,
    required this.gender,
    this.promptGender = 'neutral',
    required this.duration,
    required this.totalPics,
    required this.credits,
    this.badge,
    required this.premium,
    required this.isActive,
    required this.sortOrder,
    required this.coverImage,
    required this.previewImages,
    required this.chapters,
    required this.tags,
    required this.stats,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Creates a [StoryData] from a JSON map.
  factory StoryData.fromJson(Map<String, dynamic> json) {
    return StoryData(
      id: json['id'] as String? ?? '',
      title: (json['title'] as Map<String, dynamic>?) ?? {},
      description: (json['description'] as Map<String, dynamic>?) ?? {},
      category: json['category'] as String? ?? '',
      type: json['type'] as String? ?? '',
      gender: json['gender'] as String? ?? 'female',
      promptGender: json['promptGender'] as String? ?? 'neutral',
      duration: json['duration'] as String? ?? 'many',
      totalPics: (json['totalPics'] as num?)?.toInt() ?? 0,
      credits: (json['credits'] as num?)?.toInt() ?? 0,
      badge: json['badge'] as String?,
      premium: json['premium'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? true,
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      coverImage: json['coverImage'] as String? ?? '',
      previewImages: (json['previewImages'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      chapters: (json['chapters'] as List<dynamic>?)
              ?.map((e) => ChapterData.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      tags: (json['tags'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      stats: (json['stats'] as Map<String, dynamic>?) ?? {},
      createdAt: json['createdAt'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
    );
  }

  /// Converts this model to a JSON-compatible map.
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
      'type': type,
      'gender': gender,
      'promptGender': promptGender,
      'duration': duration,
      'totalPics': totalPics,
      'credits': credits,
      'badge': badge,
      'premium': premium,
      'isActive': isActive,
      'sortOrder': sortOrder,
      'coverImage': coverImage,
      'previewImages': previewImages,
      'chapters': chapters.map((c) => c.toMap()).toList(),
      'tags': tags,
      'stats': stats,
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }

  /// Returns the localized title for the given language code.
  /// Falls back to English ('en') if the language is not available.
  String localizedTitle(String langCode) {
    return (title[langCode] ?? title['en'] ?? '') as String;
  }

  /// Returns the localized description for the given language code.
  /// Falls back to English ('en') if the language is not available.
  String localizedDescription(String langCode) {
    return (description[langCode] ?? description['en'] ?? '') as String;
  }

  /// Returns the number of likes.
  int get likes => (stats['likes'] as num?)?.toInt() ?? 0;

  /// Returns the number of views.
  int get views => (stats['views'] as num?)?.toInt() ?? 0;

  /// Returns the number of generates.
  int get generates => (stats['generates'] as num?)?.toInt() ?? 0;

  /// Whether this story has a badge.
  bool get hasBadge => badge != null && badge!.isNotEmpty;

  /// The total number of chapters in this story.
  int get chapterCount => chapters.length;

  @override
  String toString() =>
      'StoryData(id: $id, title: ${title['en']}, chapters: ${chapters.length})';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is StoryData &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}

/// Chapter data within a FlexTale story.
///
/// Each chapter has i18n text, choices, and an AI prompt configuration
/// for generating the scene image.
class ChapterData {
  final int order;
  final Map<String, dynamic> heading; // i18n
  final Map<String, dynamic> text; // i18n
  final Map<String, dynamic> choices; // i18n: { "en": ["choice1", "choice2"], ... }
  final Map<String, dynamic> prompt; // { base, negative, styleHint }
  final Map<String, dynamic> aiConfig; // { model, guidanceScale, aspectRatio, referenceType }

  const ChapterData({
    required this.order,
    required this.heading,
    required this.text,
    required this.choices,
    required this.prompt,
    required this.aiConfig,
  });

  /// Creates a [ChapterData] from a JSON map.
  factory ChapterData.fromJson(Map<String, dynamic> json) {
    return ChapterData(
      order: (json['order'] as num?)?.toInt() ?? 0,
      heading: (json['heading'] as Map<String, dynamic>?) ?? {},
      text: (json['text'] as Map<String, dynamic>?) ?? {},
      choices: (json['choices'] as Map<String, dynamic>?) ?? {},
      prompt: (json['prompt'] as Map<String, dynamic>?) ?? {},
      aiConfig: (json['aiConfig'] as Map<String, dynamic>?) ?? {},
    );
  }

  /// Converts this model to a JSON-compatible map.
  Map<String, dynamic> toMap() {
    return {
      'order': order,
      'heading': heading,
      'text': text,
      'choices': choices,
      'prompt': prompt,
      'aiConfig': aiConfig,
    };
  }

  /// Returns the localized heading for the given language code.
  /// Falls back to English ('en') if the language is not available.
  String localizedHeading(String langCode) {
    return (heading[langCode] ?? heading['en'] ?? '') as String;
  }

  /// Returns the localized text for the given language code.
  /// Falls back to English ('en') if the language is not available.
  String localizedText(String langCode) {
    return (text[langCode] ?? text['en'] ?? '') as String;
  }

  /// Returns the localized choices for the given language code.
  /// Falls back to English ('en') if the language is not available.
  List<String> localizedChoices(String langCode) {
    final choiceList = choices[langCode] ?? choices['en'];
    if (choiceList is List) {
      return choiceList.map((e) => e as String).toList();
    }
    return [];
  }

  /// Returns the base prompt text.
  String get basePrompt => (prompt['base'] ?? '') as String;

  /// Returns the negative prompt text.
  String get negativePrompt => (prompt['negative'] ?? '') as String;

  /// Returns the style hint text.
  String get styleHint => (prompt['styleHint'] ?? '') as String;

  @override
  String toString() =>
      'ChapterData(order: $order, heading: ${heading['en']})';
}

/// Top-level response model for `flextale_stories.json`.
///
/// Contains version info, filter option metadata, and the full list of stories.
class StoriesResponse {
  final String version;
  final String updatedAt;
  final String imageBaseUrl;
  final String imageSuffix;
  final List<Map<String, dynamic>> categories; // filter options with i18n names
  final List<Map<String, dynamic>> types; // filter options with i18n names
  final List<Map<String, dynamic>> genders; // filter options with i18n names
  final List<Map<String, dynamic>> durations; // duration filter options
  final List<StoryData> stories;

  const StoriesResponse({
    required this.version,
    required this.updatedAt,
    this.imageBaseUrl = '',
    this.imageSuffix = '',
    required this.categories,
    required this.types,
    required this.genders,
    required this.durations,
    required this.stories,
  });

  /// Build a full image URL from a relative path.
  String buildImageUrl(String relativePath) {
    if (relativePath.isEmpty || imageBaseUrl.isEmpty) return relativePath;
    return '$imageBaseUrl${Uri.encodeComponent(relativePath)}$imageSuffix';
  }

  /// Creates a [StoriesResponse] from the top-level JSON map.
  factory StoriesResponse.fromJson(Map<String, dynamic> json) {
    return StoriesResponse(
      version: json['version'] as String? ?? '',
      updatedAt: json['updatedAt'] as String? ?? '',
      imageBaseUrl: json['imageBaseUrl'] as String? ?? '',
      imageSuffix: json['imageSuffix'] as String? ?? '',
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
      durations: (json['durations'] as List<dynamic>?)
              ?.map((e) => e as Map<String, dynamic>)
              .toList() ??
          [],
      stories: (json['stories'] as List<dynamic>?)
              ?.map((e) => StoryData.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  /// Converts this model to a JSON-compatible map.
  Map<String, dynamic> toMap() {
    return {
      'version': version,
      'updatedAt': updatedAt,
      'imageBaseUrl': imageBaseUrl,
      'imageSuffix': imageSuffix,
      'categories': categories,
      'types': types,
      'genders': genders,
      'durations': durations,
      'stories': stories.map((s) => s.toMap()).toList(),
    };
  }

  /// Returns only active stories (isActive == true).
  List<StoryData> get activeStories =>
      stories.where((s) => s.isActive).toList();

  @override
  String toString() =>
      'StoriesResponse(version: $version, stories: ${stories.length})';
}
