/// App-wide constants. Brand names, collection names, storage paths.
abstract final class AppConstants {
  // Brand (never translated)
  static const appName = 'FlexMe';
  static const flexLocket = 'FlexLocket';
  static const flexShot = 'FlexShot';
  static const flexTale = 'FlexTale';

  // Tab labels (max 5 chars for i18n)
  static const tabGlow = 'Locket';
  static const tabCreate = 'Shot';
  static const tabStory = 'Tale';
  static const tabMe = 'Me';

  // Firestore collections
  static const colUsers = 'users';
  static const colGenerations = 'generations';
  static const colStories = 'stories';
  static const colScenes = 'scenes';
  static const colOrders = 'orders';
  static const colEnhancements = 'enhancements';
  static const colCreditLogs = 'creditLogs';

  // Storage paths
  static const storageUploads = 'uploads';
  static const storageGenerated = 'generated';

  // Cloud Functions
  static const cfGenFlexShot = 'genFlexShot';
  static const cfGenFlexTale = 'genFlexTale';
  static const cfGenFlexLocket = 'genFlexLocket';
  static const cfCheckGeo = 'checkGeo';
  static const cfOnUserCreate = 'onUserCreate';
  static const cfDeleteAccount = 'deleteAccount';
  static const cfResetGlowDaily = 'resetGlowDaily';

  // Remote Config keys
  static const rcFlexshotJsonUrl = 'flexshot_json_url';
  static const rcFlextaleJsonUrl = 'flextale_json_url';
  static const rcOnboardingJsonUrl = 'onboarding_json_url';
  static const rcWowEverydayEnabled = 'wow_everyday_enabled';
  static const rcSearchEnabled = 'search_enabled';
  static const rcSearchSupportedLangs = 'search_supported_langs';
  static const rcAiChatEnabled = 'ai_chat_enabled';
  static const rcFlexlocketEnabled = 'flexlocket_enabled';
  static const rcMaintenanceMode = 'maintenance_mode';
  static const rcDefaultTemplateCredits = 'default_template_credits';
  static const rcPremiumTemplateCredits = 'premium_template_credits';
  static const rcNewUserFreeCredits = 'new_user_free_credits';
  static const rcDailyFreeGlowLimit = 'daily_free_glow_limit';
  static const rcGlowCreditCost = 'glow_credit_cost';
  static const rcPaywallVariant = 'paywall_variant';
  static const rcPaywallShowTrial = 'paywall_show_trial';
  static const rcPaywallTrialDays = 'paywall_trial_days';
  static const rcPaywallPlansJson = 'paywall_plans_json';
  static const rcWowPricingJson = 'wow_pricing_json';

  // Supported locales
  static const supportedLocales = ['en', 'vi', 'es', 'pt', 'ja', 'ko'];
  static const defaultLocale = 'en';

  // Firebase region
  static const firebaseRegion = 'asia-southeast1';
}
