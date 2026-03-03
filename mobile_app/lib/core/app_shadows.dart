import 'package:flutter/material.dart';

import 'design_tokens.dart';

/// Shadow elevation system.
///
/// Provides consistent shadow tokens for light/dark surfaces.
/// Use [brandGlow] and [brandGlowLg] for gold-tinted glow effects.
abstract final class AppShadows {
  static const xs = [
    BoxShadow(color: Color(0x0DFFFFFF), blurRadius: 4, offset: Offset(0, 1)),
  ];

  static const sm = [
    BoxShadow(color: Color(0x1AFFFFFF), blurRadius: 8, offset: Offset(0, 2)),
  ];

  static const md = [
    BoxShadow(color: Color(0x26000000), blurRadius: 16, offset: Offset(0, 4)),
  ];

  static const lg = [
    BoxShadow(color: Color(0x33000000), blurRadius: 24, offset: Offset(0, 8)),
  ];

  static const xl = [
    BoxShadow(color: Color(0x40000000), blurRadius: 32, offset: Offset(0, 12)),
  ];

  /// Brand gold glow — used for CTA buttons, active states.
  static List<BoxShadow> brandGlow([double opacity = 0.3]) => [
    BoxShadow(
      color: AppColors.brand.withValues(alpha: opacity),
      blurRadius: 16,
      spreadRadius: 2,
    ),
  ];

  /// Larger brand glow — used for hero elements, processing screens.
  static List<BoxShadow> brandGlowLg([double opacity = 0.4]) => [
    BoxShadow(
      color: AppColors.brand.withValues(alpha: opacity),
      blurRadius: 32,
      spreadRadius: 4,
    ),
  ];

  /// Heavy card shadow — story card heroes, large floating elements.
  static const cardHero = [
    BoxShadow(
        color: Color(0x80000000),
        blurRadius: 40,
        offset: Offset(0, 12)),
  ];

  /// Dark overlay shadow — floating pills, badges, compact overlays.
  static const overlay = [
    BoxShadow(color: Color(0x4D000000), blurRadius: 8),
  ];

  /// Generic colored glow — dynamic/accent-colored elements.
  static List<BoxShadow> colorGlow(
    Color color, {
    double opacity = 0.3,
    double blur = 16,
    double spread = 2,
  }) =>
      [
        BoxShadow(
          color: color.withValues(alpha: opacity),
          blurRadius: blur,
          spreadRadius: spread,
        ),
      ];
}
