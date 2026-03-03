import 'package:cloud_firestore/cloud_firestore.dart';

/// Generation model matching Firestore `generations/{genId}` collection.
///
/// Tracks FlexShot single-image generation jobs.
class GenerationModel {
  final String id;
  final String userId;
  final String templateId;
  final String templateName; // denormalized for UI
  final String inputImageUrl; // Storage path
  final String? outputImageUrl; // Storage URL (set on completion)
  final String? outputHdUrl;
  final String status; // "pending" | "processing" | "completed" | "failed"
  final int progress; // 0-100
  final String? errorMessage;
  final String promptUsed;
  final int? generationTimeMs;
  final int creditsSpent;
  final Map<String, dynamic> aiConfig;
  final DateTime createdAt;
  final DateTime? completedAt;

  const GenerationModel({
    required this.id,
    required this.userId,
    required this.templateId,
    required this.templateName,
    required this.inputImageUrl,
    this.outputImageUrl,
    this.outputHdUrl,
    required this.status,
    required this.progress,
    this.errorMessage,
    required this.promptUsed,
    this.generationTimeMs,
    required this.creditsSpent,
    required this.aiConfig,
    required this.createdAt,
    this.completedAt,
  });

  /// Creates a [GenerationModel] from a Firestore document snapshot.
  ///
  /// [data] is the document data map. [id] is the document ID.
  factory GenerationModel.fromFirestore(Map<String, dynamic> data, String id) {
    return GenerationModel(
      id: id,
      userId: data['userId'] as String? ?? '',
      templateId: data['templateId'] as String? ?? '',
      templateName: data['templateName'] as String? ?? '',
      inputImageUrl: data['inputImageUrl'] as String? ?? '',
      outputImageUrl: data['outputImageUrl'] as String?,
      outputHdUrl: data['outputHdUrl'] as String?,
      status: data['status'] as String? ?? 'pending',
      progress: (data['progress'] as num?)?.toInt() ?? 0,
      errorMessage: data['errorMessage'] as String?,
      promptUsed: data['promptUsed'] as String? ?? '',
      generationTimeMs: (data['generationTimeMs'] as num?)?.toInt(),
      creditsSpent: (data['creditsSpent'] as num?)?.toInt() ?? 0,
      aiConfig: (data['aiConfig'] as Map<String, dynamic>?) ?? {},
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
      'templateId': templateId,
      'templateName': templateName,
      'inputImageUrl': inputImageUrl,
      'outputImageUrl': outputImageUrl,
      'outputHdUrl': outputHdUrl,
      'status': status,
      'progress': progress,
      'errorMessage': errorMessage,
      'promptUsed': promptUsed,
      'generationTimeMs': generationTimeMs,
      'creditsSpent': creditsSpent,
      'aiConfig': aiConfig,
      'createdAt': Timestamp.fromDate(createdAt),
      'completedAt':
          completedAt != null ? Timestamp.fromDate(completedAt!) : null,
    };
  }

  /// Creates a copy of this model with updated fields.
  GenerationModel copyWith({
    String? id,
    String? userId,
    String? templateId,
    String? templateName,
    String? inputImageUrl,
    String? outputImageUrl,
    String? outputHdUrl,
    String? status,
    int? progress,
    String? errorMessage,
    String? promptUsed,
    int? generationTimeMs,
    int? creditsSpent,
    Map<String, dynamic>? aiConfig,
    DateTime? createdAt,
    DateTime? completedAt,
  }) {
    return GenerationModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      templateId: templateId ?? this.templateId,
      templateName: templateName ?? this.templateName,
      inputImageUrl: inputImageUrl ?? this.inputImageUrl,
      outputImageUrl: outputImageUrl ?? this.outputImageUrl,
      outputHdUrl: outputHdUrl ?? this.outputHdUrl,
      status: status ?? this.status,
      progress: progress ?? this.progress,
      errorMessage: errorMessage ?? this.errorMessage,
      promptUsed: promptUsed ?? this.promptUsed,
      generationTimeMs: generationTimeMs ?? this.generationTimeMs,
      creditsSpent: creditsSpent ?? this.creditsSpent,
      aiConfig: aiConfig ?? this.aiConfig,
      createdAt: createdAt ?? this.createdAt,
      completedAt: completedAt ?? this.completedAt,
    );
  }

  /// Whether this generation has completed successfully.
  bool get isCompleted => status == 'completed';

  /// Whether this generation has failed.
  bool get isFailed => status == 'failed';

  /// Whether this generation is still in progress.
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
      'GenerationModel(id: $id, template: $templateName, status: $status)';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is GenerationModel &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}
