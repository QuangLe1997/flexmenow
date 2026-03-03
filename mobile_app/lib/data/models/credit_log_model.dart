import 'package:cloud_firestore/cloud_firestore.dart';

/// CreditLog model matching Firestore `creditLogs/{logId}` collection.
///
/// Tracks all credit movements: bonuses, purchases, subscription renewals,
/// spending on FlexShot/FlexTale/Glow, and refunds.
class CreditLogModel {
  final String id;
  final String userId;
  final double amount; // positive (add) or negative (deduct)
  final String type; // "bonus" | "purchase" | "subscription_renewal" | "spend_flexshot" | "spend_flextale" | "spend_glow" | "refund"
  final String? referenceId; // genId, storyId, orderId
  final String? referenceType; // "generation" | "story" | "order" | null
  final double balanceAfter;
  final String description;
  final DateTime createdAt;

  const CreditLogModel({
    required this.id,
    required this.userId,
    required this.amount,
    required this.type,
    this.referenceId,
    this.referenceType,
    required this.balanceAfter,
    required this.description,
    required this.createdAt,
  });

  /// Creates a [CreditLogModel] from a Firestore document snapshot.
  ///
  /// [data] is the document data map. [id] is the document ID.
  factory CreditLogModel.fromFirestore(Map<String, dynamic> data, String id) {
    return CreditLogModel(
      id: id,
      userId: data['userId'] as String? ?? '',
      amount: (data['amount'] as num?)?.toDouble() ?? 0.0,
      type: data['type'] as String? ?? '',
      referenceId: data['referenceId'] as String?,
      referenceType: data['referenceType'] as String?,
      balanceAfter: (data['balanceAfter'] as num?)?.toDouble() ?? 0.0,
      description: data['description'] as String? ?? '',
      createdAt: _parseDateTime(data['createdAt']) ?? DateTime.now(),
    );
  }

  /// Converts this model to a Firestore-compatible map.
  ///
  /// Does NOT include [id] since it is the document ID.
  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'amount': amount,
      'type': type,
      'referenceId': referenceId,
      'referenceType': referenceType,
      'balanceAfter': balanceAfter,
      'description': description,
      'createdAt': Timestamp.fromDate(createdAt),
    };
  }

  /// Creates a copy of this model with updated fields.
  CreditLogModel copyWith({
    String? id,
    String? userId,
    double? amount,
    String? type,
    String? referenceId,
    String? referenceType,
    double? balanceAfter,
    String? description,
    DateTime? createdAt,
  }) {
    return CreditLogModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      amount: amount ?? this.amount,
      type: type ?? this.type,
      referenceId: referenceId ?? this.referenceId,
      referenceType: referenceType ?? this.referenceType,
      balanceAfter: balanceAfter ?? this.balanceAfter,
      description: description ?? this.description,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  /// Whether this log entry represents credits being added.
  bool get isCredit => amount > 0;

  /// Whether this log entry represents credits being deducted.
  bool get isDebit => amount < 0;

  /// Whether this is a bonus credit entry (welcome credits, promotions, etc.).
  bool get isBonus => type == 'bonus';

  /// Whether this is a spending entry (FlexShot, FlexTale, Glow).
  bool get isSpending =>
      type == 'spend_flexshot' ||
      type == 'spend_flextale' ||
      type == 'spend_glow';

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
      'CreditLogModel(id: $id, type: $type, amount: $amount, balance: $balanceAfter)';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CreditLogModel &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}
