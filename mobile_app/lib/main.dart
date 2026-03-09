import 'dart:async';

import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'core/theme.dart';
import 'core/router.dart';
import 'data/services/app_init_service.dart';
import 'providers/app_providers.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. Firebase core
  bool firebaseReady = false;
  try {
    await Firebase.initializeApp();
    firebaseReady = true;
  } catch (e) {
    debugPrint('Firebase init failed (expected without google-services.json): $e');
  }

  // 1b. Crashlytics — capture all Flutter & platform errors
  if (firebaseReady) {
    FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;
    PlatformDispatcher.instance.onError = (error, stack) {
      FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      return true;
    };
  }

  // 1c. App Check (required by firebase_ai for Gemini calls)
  if (firebaseReady) {
    try {
      await FirebaseAppCheck.instance.activate(
        androidProvider: kDebugMode
            ? AndroidProvider.debug
            : AndroidProvider.playIntegrity,
        appleProvider: kDebugMode
            ? AppleProvider.debug
            : AppleProvider.deviceCheck,
      );
    } catch (e) {
      debugPrint('App Check init failed: $e');
    }
  }

  // 2. Pre-auth init: Remote Config + FCM token
  final appInit = AppInitService();
  await appInit.initPreAuth(firebaseReady: firebaseReady);

  runApp(ProviderScope(
    overrides: [
      appInitProvider.overrideWithValue(appInit),
      if (firebaseReady) ...[
        remoteConfigProvider.overrideWithValue(appInit.remoteConfigService),
        revenueCatServiceProvider.overrideWithValue(appInit.revenueCatService),
      ],
    ],
    child: const FlexMeApp(),
  ));
}

/// Initializes Firebase + services without calling [runApp].
/// Returns a [ProviderScope] widget ready for [runApp] or [tester.pumpWidget].
/// Used by integration tests to separate async init from widget rendering.
Future<Widget> initApp() async {
  bool firebaseReady = false;
  try {
    await Firebase.initializeApp();
    firebaseReady = true;
  } catch (e) {
    debugPrint('Firebase init failed: $e');
  }

  if (firebaseReady) {
    try {
      await FirebaseAppCheck.instance.activate(
        androidProvider: kDebugMode ? AndroidProvider.debug : AndroidProvider.playIntegrity,
        appleProvider: kDebugMode ? AppleProvider.debug : AppleProvider.deviceCheck,
      );
    } catch (e) {
      debugPrint('App Check init failed: $e');
    }
  }

  final appInit = AppInitService();
  await appInit.initPreAuth(firebaseReady: firebaseReady);

  return ProviderScope(
    overrides: [
      appInitProvider.overrideWithValue(appInit),
      if (firebaseReady) ...[
        remoteConfigProvider.overrideWithValue(appInit.remoteConfigService),
        revenueCatServiceProvider.overrideWithValue(appInit.revenueCatService),
      ],
    ],
    child: const FlexMeApp(),
  );
}

class FlexMeApp extends ConsumerWidget {
  const FlexMeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'FlexMe',
      debugShowCheckedModeBanner: false,
      theme: appTheme,
      routerConfig: router,
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('en'),
        Locale('vi'),
        Locale('es'),
        Locale('pt'),
        Locale('ja'),
        Locale('ko'),
      ],
    );
  }
}
