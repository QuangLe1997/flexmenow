import 'package:cloud_firestore/cloud_firestore.dart';

/// Order model matching Firestore `orders/{orderId}` collection.
///
/// Tracks all purchases: subscriptions, credit packs, and WOW subscriptions.
/// Created by Cloud Functions when processing RevenueCat webhook events.
class OrderModel {
  final String id;
  final String userId;
  final String orderType; // "subscription" | "credits_pack" | "wow_subscription"
  final String productId; // RevenueCat product ID
  final String? plan; // "starter" | "pro" | "elite" | null
  final int amount; // price in cents
  final String currency; // "USD"
  final String status; // "pending" | "completed" | "failed" | "refunded"
  final int creditsAdded;
  final String? revenuecatEventId;
  final DateTime createdAt;
  final DateTime? completedAt;

  const OrderModel({
    required this.id,
    required this.userId,
    required this.orderType,
    required this.productId,
    this.plan,
    required this.amount,
    required this.currency,
    required this.status,
    required this.creditsAdded,
    this.revenuecatEventId,
    required this.createdAt,
    this.completedAt,
  });

  /// Creates an [OrderModel] from a Firestore document snapshot.
  ///
  /// [data] is the document data map. [id] is the document ID.
  factory OrderModel.fromFirestore(Map<String, dynamic> data, String id) {
    return OrderModel(
      id: id,
      userId: data['userId'] as String? ?? '',
      orderType: data['orderType'] as String? ?? '',
      productId: data['productId'] as String? ?? '',
      plan: data['plan'] as String?,
      amount: (data['amount'] as num?)?.toInt() ?? 0,
      currency: data['currency'] as String? ?? 'USD',
      status: data['status'] as String? ?? 'pending',
      creditsAdded: (data['creditsAdded'] as num?)?.toInt() ?? 0,
      revenuecatEventId: data['revenuecatEventId'] as String?,
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
      'orderType': orderType,
      'productId': productId,
      'plan': plan,
      'amount': amount,
      'currency': currency,
      'status': status,
      'creditsAdded': creditsAdded,
      'revenuecatEventId': revenuecatEventId,
      'createdAt': Timestamp.fromDate(createdAt),
      'completedAt':
          completedAt != null ? Timestamp.fromDate(completedAt!) : null,
    };
  }

  /// Creates a copy of this model with updated fields.
  OrderModel copyWith({
    String? id,
    String? userId,
    String? orderType,
    String? productId,
    String? plan,
    int? amount,
    String? currency,
    String? status,
    int? creditsAdded,
    String? revenuecatEventId,
    DateTime? createdAt,
    DateTime? completedAt,
  }) {
    return OrderModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      orderType: orderType ?? this.orderType,
      productId: productId ?? this.productId,
      plan: plan ?? this.plan,
      amount: amount ?? this.amount,
      currency: currency ?? this.currency,
      status: status ?? this.status,
      creditsAdded: creditsAdded ?? this.creditsAdded,
      revenuecatEventId: revenuecatEventId ?? this.revenuecatEventId,
      createdAt: createdAt ?? this.createdAt,
      completedAt: completedAt ?? this.completedAt,
    );
  }

  /// Whether this is a subscription order.
  bool get isSubscription => orderType == 'subscription';

  /// Whether this is a credit pack purchase.
  bool get isCreditsPack => orderType == 'credits_pack';

  /// Whether this is a WOW subscription order.
  bool get isWowSubscription => orderType == 'wow_subscription';

  /// Whether this order completed successfully.
  bool get isCompleted => status == 'completed';

  /// Whether this order was refunded.
  bool get isRefunded => status == 'refunded';

  /// The amount in display currency (dollars, not cents).
  double get displayAmount => amount / 100.0;

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
      'OrderModel(id: $id, type: $orderType, product: $productId, status: $status)';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OrderModel &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}
