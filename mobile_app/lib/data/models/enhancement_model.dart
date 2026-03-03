import 'package:cloud_firestore/cloud_firestore.dart';

/// Enhancement model matching Firestore `enhancements/{enhId}` collection.
///
/// Tracks FlexLocket (Glow) photo enhancement jobs.
class EnhancementModel {
  final String id;
  final String userId;
  final String inputImageUrl;
  final String? outputImageUrl;
  final String enhanceMode;
  final String filterId;
  final String status; // "processing" | "completed" | "failed"
  final int progress;
  final String? errorMessage;
  final int? enhancementTimeMs;
  final double creditsSpent;
  final bool isFreeUse;
  final DateTime createdAt;
  final DateTime? completedAt;

  const EnhancementModel({
    required this.id,
    required this.userId,
    required this.inputImageUrl,
    this.outputImageUrl,
    required this.enhanceMode,
    required this.filterId,
    required this.status,
    required this.progress,
    this.errorMessage,
    this.enhancementTimeMs,
    required this.creditsSpent,
    required this.isFreeUse,
    required this.createdAt,
    this.completedAt,
  });

  factory EnhancementModel.fromFirestore(Map<String, dynamic> data, String id) {
    return EnhancementModel(
      id: id,
      userId: data['userId'] as String? ?? '',
      inputImageUrl: data['inputImageUrl'] as String? ?? '',
      outputImageUrl: data['outputImageUrl'] as String?,
      enhanceMode: data['enhanceMode'] as String? ?? data['vibeFilter'] as String? ?? 'real',
      filterId: data['filterId'] as String? ?? 'natural',
      status: data['status'] as String? ?? 'processing',
      progress: (data['progress'] as num?)?.toInt() ?? 0,
      errorMessage: data['errorMessage'] as String?,
      enhancementTimeMs: (data['enhancementTimeMs'] as num?)?.toInt(),
      creditsSpent: (data['creditsSpent'] as num?)?.toDouble() ?? 0,
      isFreeUse: data['isFreeUse'] as bool? ?? true,
      createdAt: _parseDateTime(data['createdAt']) ?? DateTime.now(),
      completedAt: _parseDateTime(data['completedAt']),
    );
  }

  bool get isCompleted => status == 'completed';
  bool get isFailed => status == 'failed';
  bool get isInProgress => status == 'processing';

  static DateTime? _parseDateTime(dynamic value) {
    if (value == null) return null;
    if (value is Timestamp) return value.toDate();
    if (value is DateTime) return value;
    if (value is String) return DateTime.tryParse(value);
    return null;
  }
}
