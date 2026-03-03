import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'design_tokens.dart';

/// Centralized text style presets.
///
/// Inter styles use plain [TextStyle] since the app theme sets Inter globally.
/// Only JetBrains Mono uses [GoogleFonts] since it's not the default family.
abstract final class AppTextStyles {
  // ── Headings (Inter bold/semibold) ──

  static const heading1 = TextStyle(
    fontSize: AppSizes.font4xl,
    fontWeight: FontWeight.w700,
    color: AppColors.text,
    letterSpacing: -0.5,
  );

  static const heading2 = TextStyle(
    fontSize: AppSizes.font3xl,
    fontWeight: FontWeight.w700,
    color: AppColors.text,
    letterSpacing: -0.5,
  );

  static const heading3 = TextStyle(
    fontSize: AppSizes.font2xl,
    fontWeight: FontWeight.w700,
    color: AppColors.text,
  );

  static const heading4 = TextStyle(
    fontSize: AppSizes.fontXl,
    fontWeight: FontWeight.w600,
    color: AppColors.text,
  );

  static const heading5 = TextStyle(
    fontSize: AppSizes.fontLg,
    fontWeight: FontWeight.w600,
    color: AppColors.text,
  );

  // ── Body (Inter regular) ──

  static const bodyLarge = TextStyle(
    fontSize: AppSizes.fontBase,
    fontWeight: FontWeight.w400,
    color: AppColors.text,
  );

  static const body = TextStyle(
    fontSize: AppSizes.fontSm,
    fontWeight: FontWeight.w400,
    color: AppColors.textSec,
  );

  static const bodySmall = TextStyle(
    fontSize: AppSizes.fontXs,
    fontWeight: FontWeight.w400,
    color: AppColors.textSec,
  );

  // ── Labels (Inter medium/semibold) ──

  static const label = TextStyle(
    fontSize: AppSizes.fontSm,
    fontWeight: FontWeight.w600,
    color: AppColors.text,
  );

  static const labelSmall = TextStyle(
    fontSize: AppSizes.fontXs,
    fontWeight: FontWeight.w500,
    color: AppColors.textSec,
  );

  // ── Buttons (Inter bold) ──

  static const button = TextStyle(
    fontSize: AppSizes.fontBase,
    fontWeight: FontWeight.w700,
    color: Colors.white,
  );

  static const buttonSmall = TextStyle(
    fontSize: AppSizes.fontSm,
    fontWeight: FontWeight.w600,
    color: Colors.white,
  );

  // ── Captions ──

  static const caption = TextStyle(
    fontSize: AppSizes.fontXxsPlus,
    fontWeight: FontWeight.w500,
    color: AppColors.textTer,
  );

  // ── Mono (JetBrains Mono — needs GoogleFonts) ──

  static TextStyle get mono => GoogleFonts.jetBrainsMono(
    fontSize: AppSizes.fontXs,
    fontWeight: FontWeight.w600,
    color: AppColors.text,
  );

  static TextStyle get monoSmall => GoogleFonts.jetBrainsMono(
    fontSize: AppSizes.fontXxsPlus,
    fontWeight: FontWeight.w600,
    color: AppColors.text,
  );

  static TextStyle get monoLarge => GoogleFonts.jetBrainsMono(
    fontSize: AppSizes.fontSm,
    fontWeight: FontWeight.w700,
    color: AppColors.text,
  );

  static TextStyle get captionMono => GoogleFonts.jetBrainsMono(
    fontSize: AppSizes.fontXxs,
    fontWeight: FontWeight.w500,
    color: AppColors.textTer,
  );
}
