import 'dart:io' show Platform;

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../../core/constants.dart';
import 'remote_config_service.dart';
import 'revenuecat_service.dart';

/// Central orchestrator for all app initialization.
///
/// Split into two phases:
/// - [initPreAuth]: runs in `main()` before `runApp()` — Firebase, Remote Config, FCM token
/// - [initPostAuth]: runs after user is authenticated — device info, geo, FCM save, RevenueCat
class AppInitService {
  AppInitService({
    RemoteConfigService? remoteConfigService,
    RevenueCatService? revenueCatService,
    FirebaseFirestore? firestore,
    FirebaseFunctions? functions,
    FirebaseMessaging? messaging,
  })  : _remoteConfigServiceOverride = remoteConfigService,
        _revenueCatServiceOverride = revenueCatService,
        _firestoreOverride = firestore,
        _functionsOverride = functions,
        _messagingOverride = messaging;

  final RemoteConfigService? _remoteConfigServiceOverride;
  final RevenueCatService? _revenueCatServiceOverride;
  final FirebaseFirestore? _firestoreOverride;
  final FirebaseFunctions? _functionsOverride;
  final FirebaseMessaging? _messagingOverride;

  /// Whether Firebase was initialized successfully.
  bool _firebaseReady = false;

  // Lazy getters — only access Firebase instances when Firebase is ready.
  late final RemoteConfigService _remoteConfigService =
      _remoteConfigServiceOverride ?? RemoteConfigService();
  late final RevenueCatService _revenueCatService =
      _revenueCatServiceOverride ?? RevenueCatService();
  late final FirebaseFirestore _firestore =
      _firestoreOverride ?? FirebaseFirestore.instance;
  late final FirebaseFunctions _functions = _functionsOverride ??
      FirebaseFunctions.instanceFor(region: AppConstants.firebaseRegion);
  late final FirebaseMessaging _messaging =
      _messagingOverride ?? FirebaseMessaging.instance;

  /// FCM token obtained during pre-auth init. Saved to Firestore in post-auth.
  String? _fcmToken;

  /// The Remote Config service instance (exposed for providers).
  RemoteConfigService get remoteConfigService => _remoteConfigService;

  /// The RevenueCat service instance (exposed for providers).
  RevenueCatService get revenueCatService => _revenueCatService;

  // ---------------------------------------------------------------------------
  // Pre-auth init (runs in main() before runApp)
  // ---------------------------------------------------------------------------

  /// Initialize services that don't require authentication.
  ///
  /// Call after `Firebase.initializeApp()` and before `runApp()`.
  /// Initializes Remote Config and requests FCM permission + token.
  /// If Firebase is not available (no google-services.json), skips gracefully.
  Future<void> initPreAuth({bool firebaseReady = true}) async {
    _firebaseReady = firebaseReady;
    if (!_firebaseReady) {
      debugPrint('AppInitService: Firebase not ready, skipping pre-auth init');
      return;
    }
    await Future.wait([
      _initRemoteConfig(),
      _requestFcmPermissionAndToken(),
    ]);
  }

  Future<void> _initRemoteConfig() async {
    try {
      await _remoteConfigService.initialize();
    } catch (e) {
      debugPrint('RemoteConfig init failed: $e');
    }
  }

  Future<void> _requestFcmPermissionAndToken() async {
    try {
      final settings = await _messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional) {
        _fcmToken = await _messaging.getToken();
      }
    } catch (e) {
      debugPrint('FCM init failed: $e');
    }
  }

  // ---------------------------------------------------------------------------
  // Post-auth init (runs after user is authenticated)
  // ---------------------------------------------------------------------------

  /// Initialize services that require an authenticated user.
  ///
  /// Call after successful sign-in or when splash screen detects an existing session.
  /// Saves device info, geo, FCM token to Firestore; initializes RevenueCat;
  /// updates lastActiveAt; checks glow daily reset.
  Future<void> initPostAuth(String uid) async {
    if (!_firebaseReady) {
      debugPrint('AppInitService: Firebase not ready, skipping post-auth init');
      return;
    }

    // Ensure user doc exists first (creates doc + welcome credits if new user)
    await _ensureUserDoc(uid);

    // Run independent tasks in parallel
    await Future.wait([
      _saveDeviceInfo(uid),
      _callCheckGeo(uid),
      _saveFcmToken(uid),
      _initRevenueCat(uid),
      _updateLastActive(uid),
      _checkGlowDailyReset(uid),
    ]);

    // Start listening for Remote Config realtime updates
    _remoteConfigService.listenForUpdates();
  }

  // ---------------------------------------------------------------------------
  // Ensure user document exists (calls onUserCreate CF)
  // ---------------------------------------------------------------------------

  /// Calls the `onUserCreate` callable Cloud Function to ensure the user
  /// document exists in Firestore. Idempotent — if doc already exists, it's a no-op.
  Future<void> _ensureUserDoc(String uid) async {
    try {
      final callable = _functions.httpsCallable(AppConstants.cfOnUserCreate);
      await callable.call<dynamic>();
    } catch (e) {
      debugPrint('ensureUserDoc failed: $e');
    }
  }

  // ---------------------------------------------------------------------------
  // Device info
  // ---------------------------------------------------------------------------

  Future<void> _saveDeviceInfo(String uid) async {
    try {
      final info = _collectDeviceInfo();
      await _firestore.collection(AppConstants.colUsers).doc(uid).update({
        'deviceInfo': info,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      debugPrint('saveDeviceInfo failed: $e');
    }
  }

  Map<String, dynamic> _collectDeviceInfo() {
    return {
      'platform': Platform.isIOS ? 'ios' : 'android',
      'os': Platform.operatingSystem,
      'osVersion': Platform.operatingSystemVersion,
    };
  }

  // ---------------------------------------------------------------------------
  // Geo check via Cloud Function
  // ---------------------------------------------------------------------------

  Future<void> _callCheckGeo(String uid) async {
    try {
      final callable = _functions.httpsCallable(AppConstants.cfCheckGeo);
      final result = await callable.call<dynamic>();
      final geo = Map<String, dynamic>.from(result.data as Map);

      await _firestore.collection(AppConstants.colUsers).doc(uid).update({
        'geo': geo,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      debugPrint('checkGeo failed: $e');
    }
  }

  // ---------------------------------------------------------------------------
  // FCM token save
  // ---------------------------------------------------------------------------

  Future<void> _saveFcmToken(String uid) async {
    if (_fcmToken == null) return;
    try {
      await _firestore.collection(AppConstants.colUsers).doc(uid).update({
        'fcmToken': _fcmToken,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      debugPrint('saveFcmToken failed: $e');
    }
  }

  // ---------------------------------------------------------------------------
  // RevenueCat
  // ---------------------------------------------------------------------------

  Future<void> _initRevenueCat(String uid) async {
    try {
      // Platform-specific API key
      final apiKey = Platform.isIOS
          ? const String.fromEnvironment('RC_IOS_KEY',
              defaultValue: 'appl_PLACEHOLDER')
          : const String.fromEnvironment('RC_ANDROID_KEY',
              defaultValue: 'goog_PLACEHOLDER');

      await _revenueCatService.initialize(
        apiKey: apiKey,
        appUserId: uid,
      );
    } catch (e) {
      debugPrint('RevenueCat init failed: $e');
    }
  }

  // ---------------------------------------------------------------------------
  // Last active
  // ---------------------------------------------------------------------------

  Future<void> _updateLastActive(String uid) async {
    try {
      await _firestore.collection(AppConstants.colUsers).doc(uid).update({
        'lastActiveAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      debugPrint('updateLastActive failed: $e');
    }
  }

  // ---------------------------------------------------------------------------
  // Glow daily reset
  // ---------------------------------------------------------------------------

  /// Resets `glowUsedToday` to 0 if the last reset date is not today.
  Future<void> _checkGlowDailyReset(String uid) async {
    try {
      final doc = await _firestore
          .collection(AppConstants.colUsers)
          .doc(uid)
          .get();
      if (!doc.exists) return;

      final data = doc.data()!;
      final lastReset = data['glowLastResetDate'] as String?;
      final today = DateTime.now().toIso8601String().substring(0, 10);

      if (lastReset != today) {
        await _firestore.collection(AppConstants.colUsers).doc(uid).update({
          'glowUsedToday': 0,
          'glowLastResetDate': today,
          'updatedAt': FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      debugPrint('glowDailyReset failed: $e');
    }
  }
}
