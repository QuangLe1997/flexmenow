import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/app_providers.dart';
import '../widgets/credit_check_dialog.dart';

/// Check if the user has enough credits. If not, show the credit dialog.
///
/// Returns `true` if the user has sufficient credits, `false` if not
/// (dialog was shown and user either cancelled or tapped "Buy Credits").
///
/// When [navigateToPaywall] is provided, tapping "Buy Credits" will call it.
Future<bool> ensureCredits(
  BuildContext context,
  WidgetRef ref,
  double required, {
  VoidCallback? navigateToPaywall,
}) async {
  final balance = ref.read(creditsProvider);
  if (balance >= required) return true;

  final wantsBuy = await showCreditCheckDialog(
    context,
    currentBalance: balance,
    requiredCredits: required,
  );

  if (wantsBuy && navigateToPaywall != null) {
    navigateToPaywall();
  }

  return false;
}
