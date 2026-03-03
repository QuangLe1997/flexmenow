import 'package:cloud_firestore/cloud_firestore.dart';

/// Story generation model matching Firestore `stories/{storyId}` collection.
///
/// Tracks FlexTale multi-scene story generation jobs.
class StoryGenerationModel {
  final String id;
  final String userId;
  final String storyDataId; // story ID from JSON data
  final String storyTitle; // denormalized
  final String inputImageUrl;
  final String status; // "pending" | "processing" | "completed" | "failed"
  final int totalScenes;
  final int completedScenes;
  final int creditsSpent;
  final String? errorMessage;
  final DateTime createdAt;
  final DateTime? completedAt;

  const StoryGenerationModel({
    required this.id,
    required this.userId,
    required this.storyDataId,
    required this.storyTitle,
    required this.inputImageUrl,
    required this.status,
    required this.totalScenes,
    required this.completedScenes,
    required this.creditsSpent,
    this.errorMessage,
    required this.createdAt,
    this.completedAt,
  });

  /// Creates a [StoryGenerationModel] from a Firestore document snapshot.
  ///
  /// [data] is the document data map. [id] is the document ID.
  factory StoryGenerationModel.fromFirestore(
      Map<String, dynamic> data, String id) {
    return StoryGenerationModel(
      id: id,
      userId: data['userId'] as String? ?? '',
      storyDataId: data['storyDataId'] as String? ?? '',
      storyTitle: data['storyTitle'] as String? ?? '',
      inputImageUrl: data['inputImageUrl'] as String? ?? '',
      status: data['status'] as String? ?? 'pending',
      totalScenes: (data['totalScenes'] as num?)?.toInt() ?? 0,
      completedScenes: (data['completedScenes'] as num?)?.toInt() ?? 0,
      creditsSpent: (data['creditsSpent'] as num?)?.toInt() ?? 0,
      errorMessage: data['errorMessage'] as String?,
      createdAt: _parseDateTime(data['createdAt']) ?? DateTime.now(),
      completedAt: _parseDateTime(data['completedAt']),
    );
  }

  /// Converts this model to a Firestore-compatible map.
  ///
  /// Does NOT include [id] since it is the document ID.
  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'storyDataId': storyDataId,
      'storyTitle': storyTitle,
      'inputImageUrl': inputImageUrl,
      'status': status,
      'totalScenes': totalScenes,
      'completedScenes': completedScenes,
      'creditsSpent': creditsSpent,
      'errorMessage': errorMessage,
      'createdAt': Timestamp.fromDate(createdAt),
      'completedAt':
          completedAt != null ? Timestamp.fromDate(completedAt!) : null,
    };
  }

  /// Creates a copy of this model with updated fields.
  StoryGenerationModel copyWith({
    String? id,
    String? userId,
    String? storyDataId,
    String? storyTitle,
    String? inputImageUrl,
    String? status,
    int? totalScenes,
    int? completedScenes,
    int? creditsSpent,
    String? errorMessage,
    DateTime? createdAt,
    DateTime? completedAt,
  }) {
    return StoryGenerationModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      storyDataId: storyDataId ?? this.storyDataId,
      storyTitle: storyTitle ?? this.storyTitle,
      inputImageUrl: inputImageUrl ?? this.inputImageUrl,
      status: status ?? this.status,
      totalScenes: totalScenes ?? this.totalScenes,
      completedScenes: completedScenes ?? this.completedScenes,
      creditsSpent: creditsSpent ?? this.creditsSpent,
      errorMessage: errorMessage ?? this.errorMessage,
      createdAt: createdAt ?? this.createdAt,
      completedAt: completedAt ?? this.completedAt,
    );
  }

  /// Progress percentage (0.0 - 1.0) for UI progress indicators.
  double get progressFraction =>
      totalScenes > 0 ? completedScenes / totalScenes : 0.0;

  /// Progress percentage (0 - 100) for UI display.
  int get progressPercent => (progressFraction * 100).round();

  /// Whether this story generation has completed successfully.
  bool get isCompleted => status == 'completed';

  /// Whether this story generation has failed.
  bool get isFailed => status == 'failed';

  /// Whether this story generation is still in progress.
  bool get isInProgress => status == 'pending' || status == 'processing';

  /// Parses a Firestore Timestamp or ISO 8601 string into a DateTime.
  static DateTime? _parseDateTime(dynamic value) {
    if (value == null) return null;
    if (value is Timestamp) return value.toDate();
    if (value is DateTime) return value;
    if (value is String) return DateTime.tryParse(value);
    return null;
  }

  @override
  String toString() =>
      'StoryGenerationModel(id: $id, story: $storyTitle, status: $status, '
      'progress: $completedScenes/$totalScenes)';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is StoryGenerationModel &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}

/// Scene model matching Firestore `stories/{storyId}/scenes/{sceneId}` subcollection.
///
/// Each scene represents one AI-generated image within a story.
class SceneModel {
  final String id;
  final int sceneOrder;
  final String sceneName;
  final String status; // "pending" | "processing" | "completed" | "failed"
  final String? outputImageUrl;
  final String promptUsed;
  final int? generationTimeMs;
  final DateTime createdAt;
  final DateTime? completedAt;

  const SceneModel({
    required this.id,
    required this.sceneOrder,
    required this.sceneName,
    required this.status,
    this.outputImageUrl,
    required this.promptUsed,
    this.generationTimeMs,
    required this.createdAt,
    this.completedAt,
  });

  /// Creates a [SceneModel] from a Firestore document snapshot.
  ///
  /// [data] is the document data map. [id] is the document ID.
  factory SceneModel.fromFirestore(Map<String, dynamic> data, String id) {
    return SceneModel(
      id: id,
      sceneOrder: (data['sceneOrder'] as num?)?.toInt() ?? 0,
      sceneName: data['sceneName'] as String? ?? '',
      status: data['status'] as String? ?? 'pending',
      outputImageUrl: data['outputImageUrl'] as String?,
      promptUsed: data['promptUsed'] as String? ?? '',
      generationTimeMs: (data['generationTimeMs'] as num?)?.toInt(),
      createdAt: _parseDateTime(data['createdAt']) ?? DateTime.now(),
      completedAt: _parseDateTime(data['completedAt']),
    );
  }

  /// Converts this model to a Firestore-compatible map.
  ///
  /// Does NOT include [id] since it is the document ID.
  Map<String, dynamic> toMap() {
    return {
      'sceneOrder': sceneOrder,
      'sceneName': sceneName,
      'status': status,
      'outputImageUrl': outputImageUrl,
      'promptUsed': promptUsed,
      'generationTimeMs': generationTimeMs,
      'createdAt': Timestamp.fromDate(createdAt),
      'completedAt':
          completedAt != null ? Timestamp.fromDate(completedAt!) : null,
    };
  }

  /// Creates a copy of this model with updated fields.
  SceneModel copyWith({
    String? id,
    int? sceneOrder,
    String? sceneName,
    String? status,
    String? outputImageUrl,
    String? promptUsed,
    int? generationTimeMs,
    DateTime? createdAt,
    DateTime? completedAt,
  }) {
    return SceneModel(
      id: id ?? this.id,
      sceneOrder: sceneOrder ?? this.sceneOrder,
      sceneName: sceneName ?? this.sceneName,
      status: status ?? this.status,
      outputImageUrl: outputImageUrl ?? this.outputImageUrl,
      promptUsed: promptUsed ?? this.promptUsed,
      generationTimeMs: generationTimeMs ?? this.generationTimeMs,
      createdAt: createdAt ?? this.createdAt,
      completedAt: completedAt ?? this.completedAt,
    );
  }

  /// Whether this scene has completed successfully.
  bool get isCompleted => status == 'completed';

  /// Whether this scene has failed.
  bool get isFailed => status == 'failed';

  /// Whether this scene is still in progress.
  bool get isInProgress => status == 'pending' || status == 'processing';

  /// Parses a Firestore Timestamp or ISO 8601 string into a DateTime.
  static DateTime? _parseDateTime(dynamic value) {
    if (value == null) return null;
    if (value is Timestamp) return value.toDate();
    if (value is DateTime) return value;
    if (value is String) return DateTime.tryParse(value);
    return null;
  }

  @override
  String toString() =>
      'SceneModel(id: $id, order: $sceneOrder, name: $sceneName, status: $status)';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is SceneModel &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}
