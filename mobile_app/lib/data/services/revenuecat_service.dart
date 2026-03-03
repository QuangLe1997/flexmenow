import 'dart:async';

import 'package:purchases_flutter/purchases_flutter.dart';

/// Service for RevenueCat in-app purchase and subscription management.
///
/// Wraps the RevenueCat SDK (purchases_flutter) to provide a clean
/// interface for the app. RevenueCat handles all IAP complexity
/// (receipt validation, subscription tracking, cross-platform sync)
/// and sends webhook events to our Cloud Function for credit
/// and subscription management.
class RevenueCatService {
  /// Whether the SDK has been initialized.
  bool _initialized = false;

  final StreamController<CustomerInfo> _customerInfoController =
      StreamController<CustomerInfo>.broadcast();

  /// Initialize RevenueCat SDK.
  ///
  /// Must be called once during app startup, after Firebase Auth sign-in.
  /// [apiKey] is the RevenueCat public API key (platform-specific).
  /// [appUserId] is the Firebase Auth UID to link RevenueCat to our user.
  Future<void> initialize({
    required String apiKey,
    required String appUserId,
  }) async {
    if (_initialized) return;

    final configuration = PurchasesConfiguration(apiKey)
      ..appUserID = appUserId;

    await Purchases.configure(configuration);
    Purchases.addCustomerInfoUpdateListener(
      (info) => _customerInfoController.add(info),
    );
    _initialized = true;
  }

  /// Log in a new user after authentication.
  ///
  /// Associates the RevenueCat anonymous ID with the Firebase UID.
  /// Should be called after successful sign-in or account linking.
  Future<LogInResult> logIn(String appUserId) async {
    return Purchases.logIn(appUserId);
  }

  /// Log out the current user from RevenueCat.
  ///
  /// Creates a new anonymous user in RevenueCat. Call on sign-out.
  Future<CustomerInfo> logOut() async {
    return Purchases.logOut();
  }

  /// Get the current available product offerings.
  ///
  /// Returns the configured offerings from RevenueCat dashboard,
  /// including subscription plans and credit pack products.
  Future<Offerings> getOfferings() async {
    return Purchases.getOfferings();
  }

  /// Purchase a specific package (subscription or one-time).
  ///
  /// [package] is one of the packages from [getOfferings].
  /// RevenueCat handles receipt validation and sends a webhook
  /// to our Cloud Function, which updates the user's credits
  /// and subscription status in Firestore.
  Future<CustomerInfo> purchase(Package package) async {
    final result = await Purchases.purchasePackage(package);
    return result.customerInfo;
  }

  /// Purchase a specific product by [StoreProduct].
  ///
  /// Alternative to [purchase] when you have a direct product reference.
  Future<CustomerInfo> purchaseProduct(StoreProduct product) async {
    final result = await Purchases.purchaseStoreProduct(product);
    return result.customerInfo;
  }

  /// Restore previous purchases.
  ///
  /// Useful when the user reinstalls the app or switches devices.
  /// RevenueCat syncs the purchase history and sends webhook events
  /// for any active subscriptions found.
  Future<CustomerInfo> restorePurchases() async {
    return Purchases.restorePurchases();
  }

  /// Get the current customer info.
  ///
  /// Contains active subscriptions, entitlements, and purchase history.
  Future<CustomerInfo> getCustomerInfo() async {
    return Purchases.getCustomerInfo();
  }

  /// Stream of customer info updates.
  ///
  /// Emits whenever the customer's purchase state changes
  /// (new purchase, renewal, expiration, etc.).
  Stream<CustomerInfo> get customerInfoStream =>
      _customerInfoController.stream;

  /// Check if the user has an active entitlement.
  ///
  /// [entitlementId] is the entitlement identifier configured in
  /// the RevenueCat dashboard (e.g. "pro", "basic", "wow").
  Future<bool> hasActiveEntitlement(String entitlementId) async {
    final info = await Purchases.getCustomerInfo();
    return info.entitlements.active.containsKey(entitlementId);
  }

  /// Get all active entitlement identifiers.
  Future<Set<String>> getActiveEntitlements() async {
    final info = await Purchases.getCustomerInfo();
    return info.entitlements.active.keys.toSet();
  }

  /// Set user attributes in RevenueCat for analytics.
  ///
  /// Used to pass email, display name, etc. for RevenueCat dashboard.
  Future<void> setUserAttributes({
    String? email,
    String? displayName,
    String? phoneNumber,
  }) async {
    if (email != null) await Purchases.setEmail(email);
    if (displayName != null) await Purchases.setDisplayName(displayName);
    if (phoneNumber != null) await Purchases.setPhoneNumber(phoneNumber);
  }

  /// Set a custom attribute key-value pair.
  Future<void> setCustomAttribute(String key, String value) async {
    await Purchases.setAttributes({key: value});
  }
}
