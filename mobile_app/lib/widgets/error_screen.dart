import 'package:flutter/material.dart';

import '../core/design_tokens.dart';

/// Reusable error display with an icon, message, and retry button.
///
/// Designed for full-screen or centered-in-parent usage. The [onRetry]
/// callback is invoked when the user taps "Try Again".
class ErrorScreen extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const ErrorScreen({
    super.key,
    this.message = 'Something went wrong. Please try again.',
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSizes.xxxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Error icon
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.red.withOpacity(0.15),
              ),
              child: const Icon(
                Icons.error_outline,
                size: AppSizes.icon5xl,
                color: AppColors.red,
              ),
            ),
            const SizedBox(height: AppSizes.xxl),

            // Error message
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: AppSizes.fontBase,
                color: AppColors.textSec,
                height: 1.5,
              ),
            ),
            const SizedBox(height: AppSizes.xxl),

            // Try again button
            if (onRetry != null)
              SizedBox(
                width: 180,
                height: 44,
                child: OutlinedButton(
                  onPressed: onRetry,
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: AppColors.borderMed),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                    ),
                  ),
                  child: const Text(
                    'Try Again',
                    style: TextStyle(
                      fontSize: AppSizes.fontSm,
                      fontWeight: FontWeight.w600,
                      color: AppColors.text,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
