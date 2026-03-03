import 'package:flutter/material.dart';

import '../core/design_tokens.dart';

/// Primary call-to-action button with a gold gradient background.
///
/// Supports full-width mode, a loading spinner state, and a disabled state.
/// Uses [AppGradients.btn] for the gold gradient. Text is white and bold.
class GoldButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isDisabled;
  final bool fullWidth;
  final IconData? icon;

  const GoldButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.fullWidth = false,
    this.icon,
  });

  bool get _enabled => !isDisabled && !isLoading && onPressed != null;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: fullWidth ? double.infinity : null,
      height: 48,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: _enabled ? AppGradients.btn : null,
          color: _enabled ? null : AppColors.zinc700,
          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
        ),
        child: MaterialButton(
          onPressed: _enabled ? onPressed : null,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSizes.radiusMd),
          ),
          padding: const EdgeInsets.symmetric(horizontal: AppSizes.xxl),
          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
          child: isLoading
              ? const SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (icon != null) ...[
                      Icon(icon, size: AppSizes.iconLg, color: Colors.white),
                      const SizedBox(width: AppSizes.sm),
                    ],
                    Text(
                      label,
                      style: const TextStyle(
                        fontSize: AppSizes.fontBase,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
