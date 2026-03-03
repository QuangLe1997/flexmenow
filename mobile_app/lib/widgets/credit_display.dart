import 'package:flutter/material.dart';

import '../core/design_tokens.dart';

/// Displays the user's credit balance with a lightning/zap icon.
///
/// Comes in two variants: [CreditDisplaySize.small] for inline use
/// and [CreditDisplaySize.large] for headers or profile sections.
enum CreditDisplaySize { small, large }

class CreditDisplay extends StatelessWidget {
  final double balance;
  final CreditDisplaySize size;

  const CreditDisplay({
    super.key,
    required this.balance,
    this.size = CreditDisplaySize.small,
  });

  bool get _isLarge => size == CreditDisplaySize.large;

  String get _formattedBalance {
    if (balance == balance.roundToDouble()) {
      return balance.toInt().toString();
    }
    return balance.toStringAsFixed(1);
  }

  @override
  Widget build(BuildContext context) {
    final iconSize = _isLarge ? AppSizes.iconLg : AppSizes.iconSm;
    final fontSize = _isLarge ? AppSizes.fontLg : AppSizes.fontSm;
    final spacing = _isLarge ? AppSizes.xs + 2 : AppSizes.xs;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          Icons.bolt,
          size: iconSize,
          color: AppColors.brand,
        ),
        SizedBox(width: spacing),
        Text(
          _formattedBalance,
          style: TextStyle(
            fontSize: fontSize,
            fontWeight: FontWeight.w700,
            color: AppColors.brand,
          ),
        ),
      ],
    );
  }
}
