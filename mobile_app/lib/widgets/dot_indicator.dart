import 'package:flutter/material.dart';
import '../core/app_animations.dart';
import '../core/app_shadows.dart';
import '../core/design_tokens.dart';

/// Reusable pagination dots. Active dot is wider + colored, inactive = small + gray.
class DotIndicator extends StatelessWidget {
  final int count;
  final int activeIndex;
  final Color activeColor;
  final Color inactiveColor;
  final double dotSize;
  final double activeDotWidth;
  final double spacing;
  final bool showGlow;

  const DotIndicator({
    super.key,
    required this.count,
    required this.activeIndex,
    this.activeColor = AppColors.brand,
    this.inactiveColor = AppColors.zinc700,
    this.dotSize = 8,
    this.activeDotWidth = 24,
    this.spacing = 4,
    this.showGlow = false,
  });

  @override
  Widget build(BuildContext context) {
    // Limit visible dots to prevent overflow — show window around active index
    const maxVisible = 7;
    final int startIndex;
    final int endIndex;
    final bool showLeadingEllipsis;
    final bool showTrailingEllipsis;

    if (count <= maxVisible) {
      startIndex = 0;
      endIndex = count;
      showLeadingEllipsis = false;
      showTrailingEllipsis = false;
    } else {
      final half = maxVisible ~/ 2;
      int s = activeIndex - half;
      int e = activeIndex + half + 1;
      if (s < 0) { e += -s; s = 0; }
      if (e > count) { s -= (e - count); e = count; }
      s = s.clamp(0, count);
      e = e.clamp(0, count);
      startIndex = s;
      endIndex = e;
      showLeadingEllipsis = s > 0;
      showTrailingEllipsis = e < count;
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (showLeadingEllipsis)
          _miniDot(inactiveColor.withValues(alpha: 0.4)),
        ...List.generate(endIndex - startIndex, (i) {
          final index = startIndex + i;
          final isActive = index == activeIndex;
          return AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            curve: AppCurves.enter,
            margin: EdgeInsets.symmetric(horizontal: spacing),
            width: isActive ? activeDotWidth : dotSize,
            height: dotSize,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppSizes.radiusFull),
              color: isActive ? activeColor : inactiveColor,
              boxShadow: isActive && showGlow
                  ? AppShadows.colorGlow(activeColor, opacity: 0.5, blur: 8, spread: 1)
                  : null,
            ),
          );
        }),
        if (showTrailingEllipsis)
          _miniDot(inactiveColor.withValues(alpha: 0.4)),
      ],
    );
  }

  Widget _miniDot(Color color) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: spacing),
      width: dotSize * 0.5,
      height: dotSize * 0.5,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }
}
