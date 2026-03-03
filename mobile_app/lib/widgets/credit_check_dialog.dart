import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../core/app_text_styles.dart';
import '../core/design_tokens.dart';

/// Dialog shown when user doesn't have enough credits for an action.
///
/// Displays current balance vs required amount with "Buy Credits" CTA.
Future<bool> showCreditCheckDialog(
  BuildContext context, {
  required double currentBalance,
  required double requiredCredits,
}) async {
  final result = await showModalBottomSheet<bool>(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (ctx) => _CreditCheckSheet(
      currentBalance: currentBalance,
      requiredCredits: requiredCredits,
    ),
  );
  return result ?? false;
}

class _CreditCheckSheet extends StatelessWidget {
  final double currentBalance;
  final double requiredCredits;

  const _CreditCheckSheet({
    required this.currentBalance,
    required this.requiredCredits,
  });

  @override
  Widget build(BuildContext context) {
    final deficit = requiredCredits - currentBalance;

    return Container(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border.all(color: AppColors.borderMed),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            Container(
              width: 36,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: AppColors.zinc700,
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Icon
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.brand.withValues(alpha: 0.1),
              ),
              child: Icon(LucideIcons.zap, size: AppSizes.icon3xl, color: AppColors.brand),
            ),
            const SizedBox(height: 16),

            // Title
            Text(
              'Not enough credits',
              style: TextStyle(
                fontSize: AppSizes.fontXl,
                fontWeight: FontWeight.w700,
                color: AppColors.text,
              ),
            ),
            const SizedBox(height: 8),

            // Description
            Text(
              'You need ${requiredCredits.toStringAsFixed(requiredCredits.truncateToDouble() == requiredCredits ? 0 : 1)} credits for this action.',
              style: TextStyle(fontSize: AppSizes.fontSm, color: AppColors.textSec),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),

            // Balance info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.bg,
                borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                border: Border.all(color: AppColors.borderMed),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _balanceItem(
                    'Current',
                    currentBalance.toStringAsFixed(currentBalance.truncateToDouble() == currentBalance ? 0 : 1),
                    AppColors.textSec,
                  ),
                  Container(width: 1, height: 32, color: AppColors.borderMed),
                  _balanceItem(
                    'Required',
                    requiredCredits.toStringAsFixed(requiredCredits.truncateToDouble() == requiredCredits ? 0 : 1),
                    AppColors.brand,
                  ),
                  Container(width: 1, height: 32, color: AppColors.borderMed),
                  _balanceItem(
                    'Need',
                    '+${deficit.toStringAsFixed(deficit.truncateToDouble() == deficit ? 0 : 1)}',
                    AppColors.red,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Buy Credits button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: AppGradients.btn,
                  borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                ),
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(LucideIcons.zap, size: AppSizes.iconBase, color: AppColors.bg),
                      const SizedBox(width: 8),
                      Text(
                        'Buy Credits',
                        style: TextStyle(
                          fontSize: AppSizes.fontBase,
                          fontWeight: FontWeight.w700,
                          color: AppColors.bg,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),

            // Cancel
            SizedBox(
              width: double.infinity,
              height: 44,
              child: TextButton(
                onPressed: () => Navigator.of(context).pop(false),
                child: Text(
                  'Cancel',
                  style: TextStyle(
                    fontSize: AppSizes.fontSm,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textTer,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _balanceItem(String label, String value, Color valueColor) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(fontSize: AppSizes.fontXsPlus, color: AppColors.textTer),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: AppTextStyles.monoLarge.copyWith(
            fontSize: AppSizes.fontLg,
            color: valueColor,
          ),
        ),
      ],
    );
  }
}
