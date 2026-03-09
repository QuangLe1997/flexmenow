import 'package:firebase_analytics/firebase_analytics.dart';

/// Centralized analytics service wrapping Firebase Analytics.
///
/// Tracks key user events for funnel analysis and conversion optimization.
class AnalyticsService {
  final FirebaseAnalytics _analytics = FirebaseAnalytics.instance;

  FirebaseAnalyticsObserver get observer =>
      FirebaseAnalyticsObserver(analytics: _analytics);

  // ── Screen views ──

  Future<void> logScreenView(String screenName) async {
    await _analytics.logScreenView(screenName: screenName);
  }

  // ── Onboarding ──

  Future<void> logOnboardingComplete() async {
    await _analytics.logEvent(name: 'onboarding_complete');
  }

  Future<void> logSignUp(String method) async {
    await _analytics.logSignUp(signUpMethod: method);
  }

  Future<void> logLogin(String method) async {
    await _analytics.logLogin(loginMethod: method);
  }

  // ── Generation events ──

  Future<void> logGenerationStart(String type, {String? templateId}) async {
    await _analytics.logEvent(
      name: 'generation_start',
      parameters: {'type': type, if (templateId != null) 'template_id': templateId},
    );
  }

  Future<void> logGenerationComplete(String type, {double? credits}) async {
    await _analytics.logEvent(
      name: 'generation_complete',
      parameters: {'type': type, if (credits != null) 'credits_spent': credits},
    );
  }

  Future<void> logGenerationFailed(String type, String error) async {
    await _analytics.logEvent(
      name: 'generation_failed',
      parameters: {'type': type, 'error': error},
    );
  }

  // ── Purchase events ──

  Future<void> logPaywallView() async {
    await _analytics.logEvent(name: 'paywall_view');
  }

  Future<void> logPurchaseStart(String productId) async {
    await _analytics.logEvent(
      name: 'purchase_start',
      parameters: {'product_id': productId},
    );
  }

  Future<void> logPurchaseComplete(String productId, double revenue) async {
    await _analytics.logPurchase(currency: 'USD', value: revenue);
    await _analytics.logEvent(
      name: 'purchase_complete',
      parameters: {'product_id': productId, 'revenue': revenue},
    );
  }

  // ── Feature usage ──

  Future<void> logShareImage(String type) async {
    await _analytics.logShare(contentType: type, itemId: '', method: 'share');
  }

  Future<void> logDeleteAccount() async {
    await _analytics.logEvent(name: 'delete_account');
  }
}
