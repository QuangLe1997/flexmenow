import 'package:cloud_firestore/cloud_firestore.dart';

/// User model matching Firestore `users/{userId}` collection.
///
/// Fields like creditsBalance, subscriptionPlan, subscriptionExpiresAt,
/// subscriptionProductId, wowActive, wowExpiresAt, wowProductId,
/// totalGenerations, totalStories are SERVER-ONLY writes.
class UserModel {
  final String uid;
  final String email;
  final String displayName;
  final String? avatarUrl;
  final String authProvider; // "google" | "apple" | "anonymous"

  // Credits & Subscription (SERVER-ONLY writes)
  final double creditsBalance;
  final String subscriptionPlan; // "free" | "starter" | "pro" | "elite"
  final DateTime? subscriptionExpiresAt;
  final String? subscriptionProductId;

  // WOW Subscription
  final bool wowActive;
  final DateTime? wowExpiresAt;
  final String? wowProductId;
  final Map<String, dynamic>? wowConfig;

  // Stats
  final int totalGenerations;
  final int totalStories;
  final int glowUsedToday;
  final String? glowLastResetDate; // "2026-03-01" for daily reset check

  // Device & Geo
  final Map<String, dynamic>? deviceInfo;
  final Map<String, dynamic>? geo;

  // Metadata
  final String? fcmToken;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime lastActiveAt;

  const UserModel({
    required this.uid,
    required this.email,
    required this.displayName,
    this.avatarUrl,
    required this.authProvider,
    required this.creditsBalance,
    required this.subscriptionPlan,
    this.subscriptionExpiresAt,
    this.subscriptionProductId,
    required this.wowActive,
    this.wowExpiresAt,
    this.wowProductId,
    this.wowConfig,
    required this.totalGenerations,
    required this.totalStories,
    required this.glowUsedToday,
    this.glowLastResetDate,
    this.deviceInfo,
    this.geo,
    this.fcmToken,
    required this.createdAt,
    required this.updatedAt,
    required this.lastActiveAt,
  });

  /// Creates a [UserModel] from a Firestore document snapshot.
  ///
  /// [data] is the document data map. [uid] is the document ID.
  factory UserModel.fromFirestore(Map<String, dynamic> data, String uid) {
    return UserModel(
      uid: uid,
      email: data['email'] as String? ?? '',
      displayName: data['displayName'] as String? ?? '',
      avatarUrl: data['avatarUrl'] as String?,
      authProvider: data['authProvider'] as String? ?? 'anonymous',
      creditsBalance: (data['creditsBalance'] as num?)?.toDouble() ?? 0.0,
      subscriptionPlan: data['subscriptionPlan'] as String? ?? 'free',
      subscriptionExpiresAt: _parseDateTime(data['subscriptionExpiresAt']),
      subscriptionProductId: data['subscriptionProductId'] as String?,
      wowActive: data['wowActive'] as bool? ?? false,
      wowExpiresAt: _parseDateTime(data['wowExpiresAt']),
      wowProductId: data['wowProductId'] as String?,
      wowConfig: data['wowConfig'] as Map<String, dynamic>?,
      totalGenerations: (data['totalGenerations'] as num?)?.toInt() ?? 0,
      totalStories: (data['totalStories'] as num?)?.toInt() ?? 0,
      glowUsedToday: (data['glowUsedToday'] as num?)?.toInt() ?? 0,
      glowLastResetDate: data['glowLastResetDate'] as String?,
      deviceInfo: data['deviceInfo'] as Map<String, dynamic>?,
      geo: data['geo'] as Map<String, dynamic>?,
      fcmToken: data['fcmToken'] as String?,
      createdAt: _parseDateTime(data['createdAt']) ?? DateTime.now(),
      updatedAt: _parseDateTime(data['updatedAt']) ?? DateTime.now(),
      lastActiveAt: _parseDateTime(data['lastActiveAt']) ?? DateTime.now(),
    );
  }

  /// Converts this model to a Firestore-compatible map.
  ///
  /// Does NOT include [uid] since it is the document ID.
  /// Does NOT include server-only fields (creditsBalance, subscriptionPlan, etc.)
  /// that should only be written by Cloud Functions.
  Map<String, dynamic> toMap() {
    return {
      'email': email,
      'displayName': displayName,
      'avatarUrl': avatarUrl,
      'authProvider': authProvider,
      'creditsBalance': creditsBalance,
      'subscriptionPlan': subscriptionPlan,
      'subscriptionExpiresAt': subscriptionExpiresAt != null
          ? Timestamp.fromDate(subscriptionExpiresAt!)
          : null,
      'subscriptionProductId': subscriptionProductId,
      'wowActive': wowActive,
      'wowExpiresAt':
          wowExpiresAt != null ? Timestamp.fromDate(wowExpiresAt!) : null,
      'wowProductId': wowProductId,
      'wowConfig': wowConfig,
      'totalGenerations': totalGenerations,
      'totalStories': totalStories,
      'glowUsedToday': glowUsedToday,
      'glowLastResetDate': glowLastResetDate,
      'deviceInfo': deviceInfo,
      'geo': geo,
      'fcmToken': fcmToken,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
      'lastActiveAt': Timestamp.fromDate(lastActiveAt),
    };
  }

  /// Returns a map of only the fields the client is allowed to update.
  ///
  /// Per security rules, clients cannot write: creditsBalance,
  /// subscriptionPlan, subscriptionExpiresAt, subscriptionProductId,
  /// wowActive, wowExpiresAt, wowProductId, totalGenerations,
  /// totalStories, createdAt.
  Map<String, dynamic> toClientUpdateMap() {
    return {
      'displayName': displayName,
      'avatarUrl': avatarUrl,
      'glowUsedToday': glowUsedToday,
      'glowLastResetDate': glowLastResetDate,
      'deviceInfo': deviceInfo,
      'geo': geo,
      'fcmToken': fcmToken,
      'updatedAt': FieldValue.serverTimestamp(),
      'lastActiveAt': FieldValue.serverTimestamp(),
    };
  }

  /// Creates a copy of this model with updated fields.
  UserModel copyWith({
    String? uid,
    String? email,
    String? displayName,
    String? avatarUrl,
    String? authProvider,
    double? creditsBalance,
    String? subscriptionPlan,
    DateTime? subscriptionExpiresAt,
    String? subscriptionProductId,
    bool? wowActive,
    DateTime? wowExpiresAt,
    String? wowProductId,
    Map<String, dynamic>? wowConfig,
    int? totalGenerations,
    int? totalStories,
    int? glowUsedToday,
    String? glowLastResetDate,
    Map<String, dynamic>? deviceInfo,
    Map<String, dynamic>? geo,
    String? fcmToken,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? lastActiveAt,
  }) {
    return UserModel(
      uid: uid ?? this.uid,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      authProvider: authProvider ?? this.authProvider,
      creditsBalance: creditsBalance ?? this.creditsBalance,
      subscriptionPlan: subscriptionPlan ?? this.subscriptionPlan,
      subscriptionExpiresAt:
          subscriptionExpiresAt ?? this.subscriptionExpiresAt,
      subscriptionProductId:
          subscriptionProductId ?? this.subscriptionProductId,
      wowActive: wowActive ?? this.wowActive,
      wowExpiresAt: wowExpiresAt ?? this.wowExpiresAt,
      wowProductId: wowProductId ?? this.wowProductId,
      wowConfig: wowConfig ?? this.wowConfig,
      totalGenerations: totalGenerations ?? this.totalGenerations,
      totalStories: totalStories ?? this.totalStories,
      glowUsedToday: glowUsedToday ?? this.glowUsedToday,
      glowLastResetDate: glowLastResetDate ?? this.glowLastResetDate,
      deviceInfo: deviceInfo ?? this.deviceInfo,
      geo: geo ?? this.geo,
      fcmToken: fcmToken ?? this.fcmToken,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      lastActiveAt: lastActiveAt ?? this.lastActiveAt,
    );
  }

  /// Whether the user has an active paid subscription.
  bool get isPaidSubscriber => subscriptionPlan != 'free';

  /// Whether the subscription is currently valid (not expired).
  bool get isSubscriptionActive {
    if (!isPaidSubscriber) return false;
    if (subscriptionExpiresAt == null) return false;
    return subscriptionExpiresAt!.isAfter(DateTime.now());
  }

  /// Whether the WOW subscription is currently active and not expired.
  bool get isWowActive {
    if (!wowActive) return false;
    if (wowExpiresAt == null) return false;
    return wowExpiresAt!.isAfter(DateTime.now());
  }

  /// Parses a Firestore Timestamp or ISO 8601 string into a DateTime.
  static DateTime? _parseDateTime(dynamic value) {
    if (value == null) return null;
    if (value is Timestamp) return value.toDate();
    if (value is DateTime) return value;
    if (value is String) return DateTime.tryParse(value);
    return null;
  }

  @override
  String toString() => 'UserModel(uid: $uid, email: $email, plan: $subscriptionPlan)';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UserModel &&
          runtimeType == other.runtimeType &&
          uid == other.uid;

  @override
  int get hashCode => uid.hashCode;
}
