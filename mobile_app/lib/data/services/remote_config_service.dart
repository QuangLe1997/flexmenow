import 'package:firebase_remote_config/firebase_remote_config.dart';

import '../../core/constants.dart';

/// Service for Firebase Remote Config.
///
/// Initializes Remote Config with default values, fetches and activates
/// the latest config from the server, and provides typed getters for
/// all config keys defined in [AppConstants].
class RemoteConfigService {
  RemoteConfigService({FirebaseRemoteConfig? remoteConfig})
      : _remoteConfig = remoteConfig ?? FirebaseRemoteConfig.instance;

  final FirebaseRemoteConfig _remoteConfig;

  /// Initialize Remote Config with defaults and fetch latest values.
  ///
  /// Sets a minimum fetch interval of 1 hour for production.
  /// Call this once during app startup (after Firebase.initializeApp).
  Future<void> initialize() async {
    await _remoteConfig.setConfigSettings(RemoteConfigSettings(
      fetchTimeout: const Duration(seconds: 10),
      minimumFetchInterval: const Duration(hours: 1),
    ));

    await _remoteConfig.setDefaults(_defaultValues);

    // Fetch and activate in background — don't block app startup.
    try {
      await _remoteConfig.fetchAndActivate();
    } catch (_) {
      // Use cached/default values if fetch fails.
    }
  }

  /// Fetch and activate the latest Remote Config values.
  ///
  /// Returns true if new values were activated.
  Future<bool> fetchAndActivate() async {
    return _remoteConfig.fetchAndActivate();
  }

  /// Listen for realtime Remote Config updates (if supported).
  ///
  /// Activates new values automatically when they arrive.
  void listenForUpdates() {
    _remoteConfig.onConfigUpdated.listen((event) async {
      await _remoteConfig.activate();
    });
  }

  // ---------------------------------------------------------------------------
  // String getters
  // ---------------------------------------------------------------------------

  /// URL to the FlexShot templates JSON file on GCS.
  String get flexshotJsonUrl =>
      _remoteConfig.getString(AppConstants.rcFlexshotJsonUrl);

  /// URL to the FlexTale stories JSON file on GCS.
  String get flextaleJsonUrl =>
      _remoteConfig.getString(AppConstants.rcFlextaleJsonUrl);

  /// URL to the onboarding slides JSON file on GCS.
  String get onboardingJsonUrl =>
      _remoteConfig.getString(AppConstants.rcOnboardingJsonUrl);

  /// Comma-separated list of locale codes that support search.
  String get searchSupportedLangs =>
      _remoteConfig.getString(AppConstants.rcSearchSupportedLangs);

  /// Current paywall variant for A/B testing (e.g. "A", "B", "C").
  String get paywallVariant =>
      _remoteConfig.getString(AppConstants.rcPaywallVariant);

  /// JSON string with paywall plan definitions.
  String get paywallPlansJson =>
      _remoteConfig.getString(AppConstants.rcPaywallPlansJson);

  /// JSON string with WOW pricing configuration.
  String get wowPricingJson =>
      _remoteConfig.getString(AppConstants.rcWowPricingJson);

  // ---------------------------------------------------------------------------
  // Bool getters
  // ---------------------------------------------------------------------------

  /// Whether WOW Everyday feature is enabled.
  bool get wowEverydayEnabled =>
      _remoteConfig.getBool(AppConstants.rcWowEverydayEnabled);

  /// Whether search functionality is enabled.
  bool get searchEnabled =>
      _remoteConfig.getBool(AppConstants.rcSearchEnabled);

  /// Whether AI chat assistant feature is enabled.
  bool get aiChatEnabled =>
      _remoteConfig.getBool(AppConstants.rcAiChatEnabled);

  /// Whether FlexLocket (Glow) feature is enabled.
  bool get flexlocketEnabled =>
      _remoteConfig.getBool(AppConstants.rcFlexlocketEnabled);

  /// Whether the app is in maintenance mode.
  bool get maintenanceMode =>
      _remoteConfig.getBool(AppConstants.rcMaintenanceMode);

  /// Whether to show a free trial option in the paywall.
  bool get paywallShowTrial =>
      _remoteConfig.getBool(AppConstants.rcPaywallShowTrial);

  // ---------------------------------------------------------------------------
  // Int getters
  // ---------------------------------------------------------------------------

  /// Default credit cost per FlexShot template generation.
  int get defaultTemplateCredits =>
      _remoteConfig.getInt(AppConstants.rcDefaultTemplateCredits);

  /// Credit cost per premium FlexShot template generation.
  int get premiumTemplateCredits =>
      _remoteConfig.getInt(AppConstants.rcPremiumTemplateCredits);

  /// Number of free credits given to new users on signup.
  int get newUserFreeCredits =>
      _remoteConfig.getInt(AppConstants.rcNewUserFreeCredits);

  /// Maximum number of free FlexLocket (Glow) uses per day.
  int get dailyFreeGlowLimit =>
      _remoteConfig.getInt(AppConstants.rcDailyFreeGlowLimit);

  /// Number of free trial days for paywall offers.
  int get paywallTrialDays =>
      _remoteConfig.getInt(AppConstants.rcPaywallTrialDays);

  // ---------------------------------------------------------------------------
  // Double getters
  // ---------------------------------------------------------------------------

  /// Credit cost per FlexLocket (Glow) use after free daily limit.
  double get glowCreditCost =>
      _remoteConfig.getDouble(AppConstants.rcGlowCreditCost);

  // ---------------------------------------------------------------------------
  // Default values
  // ---------------------------------------------------------------------------

  static const Map<String, dynamic> _defaultValues = {
    // Strings
    AppConstants.rcFlexshotJsonUrl: '',
    AppConstants.rcFlextaleJsonUrl: '',
    AppConstants.rcOnboardingJsonUrl: '',
    AppConstants.rcSearchSupportedLangs: 'en',
    AppConstants.rcPaywallVariant: 'A',
    AppConstants.rcPaywallPlansJson: '[]',
    AppConstants.rcWowPricingJson: '[]',

    // Bools
    AppConstants.rcWowEverydayEnabled: false,
    AppConstants.rcSearchEnabled: true,
    AppConstants.rcAiChatEnabled: false,
    AppConstants.rcFlexlocketEnabled: true,
    AppConstants.rcMaintenanceMode: false,
    AppConstants.rcPaywallShowTrial: true,

    // Ints
    AppConstants.rcDefaultTemplateCredits: 1,
    AppConstants.rcPremiumTemplateCredits: 2,
    AppConstants.rcNewUserFreeCredits: 5,
    AppConstants.rcDailyFreeGlowLimit: 10,
    AppConstants.rcPaywallTrialDays: 3,

    // Doubles
    AppConstants.rcGlowCreditCost: 0.5,
  };
}
