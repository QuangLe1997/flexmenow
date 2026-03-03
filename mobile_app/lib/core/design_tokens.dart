import 'package:flutter/material.dart';

/// Design tokens extracted from mockup C object.
/// Source of truth: docs/mockup_app/app.jsx
abstract final class AppColors {
  // Brand
  static const brand = Color(0xFFF59E0B);
  static const brand400 = Color(0xFFFBBF24);
  static const brand600 = Color(0xFFB45309);
  static const brand800 = Color(0xFF78350F);

  // Accents
  static const blue = Color(0xFF3B82F6);
  static const purple = Color(0xFF7C3AFF);
  static const green = Color(0xFF10B981);
  static const red = Color(0xFFEF4444);
  static const pink = Color(0xFFF9A8D4);
  static const indigo = Color(0xFF6366F1);

  // Backgrounds
  static const bg = Color(0xFF050505);
  static const card = Color(0xFF121212);
  static const input = Color(0xFF1A1A1A);

  // Text
  static const text = Color(0xFFFFFFFF);
  static const textSec = Color(0xFFA3A3A3);
  static const textTer = Color(0xFF525252);

  // Borders
  static const border = Color(0x0FFFFFFF); // rgba(255,255,255,0.06)
  static const borderMed = Color(0x1AFFFFFF); // rgba(255,255,255,0.10)

  // Zinc palette (for fine-grained use)
  static const zinc50 = Color(0xFFFAFAFA);
  static const zinc100 = Color(0xFFF4F4F5);
  static const zinc200 = Color(0xFFE4E4E7);
  static const zinc300 = Color(0xFFD4D4D8);
  static const zinc400 = Color(0xFFA1A1AA);
  static const zinc500 = Color(0xFF71717A);
  static const zinc600 = Color(0xFF52525B);
  static const zinc700 = Color(0xFF3F3F46);
  static const zinc800 = Color(0xFF27272A);
  static const zinc900 = Color(0xFF18181B);
  static const zinc950 = Color(0xFF09090B);
}

abstract final class AppGradients {
  static const hero = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [AppColors.brand, AppColors.brand400, AppColors.brand600],
  );

  static const btn = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [AppColors.brand, AppColors.brand400, AppColors.brand600],
  );

  static const story = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [AppColors.brand600, AppColors.brand800],
  );

  static const glow = RadialGradient(
    center: Alignment.center,
    radius: 0.7,
    colors: [
      Color(0x26F59E0B), // rgba(245,158,11,0.15)
      Color(0xFF050505),
    ],
  );

  static const glass = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0x1AFFFFFF), // rgba(255,255,255,0.1)
      Color(0x0DF59E0B), // rgba(245,158,11,0.05)
    ],
  );

  // WOW animated gradient (purple → gold → pink)
  static const wow = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [AppColors.purple, AppColors.brand, AppColors.pink],
  );

  // Processing background
  static const processing = RadialGradient(
    center: Alignment.center,
    radius: 0.8,
    colors: [
      Color(0x33F59E0B), // gold glow
      Color(0x1A7C3AFF), // purple tint
      Color(0xFF050505),
    ],
  );
}

abstract final class AppSizes {
  // Font sizes
  static const double font3xs = 7;
  static const double font2xs = 8;
  static const double fontXxs = 9;
  static const double fontXxsPlus = 10;
  static const double fontXsPlus = 11;
  static const double fontXs = 12;
  static const double fontSmPlus = 13;
  static const double fontSm = 14;
  static const double fontMdPlus = 15;
  static const double fontBase = 16;
  static const double fontLg = 18;
  static const double fontXl = 20;
  static const double fontXlPlus = 22;
  static const double font2xl = 24;
  static const double font2xlPlus = 26;
  static const double font2xlMax = 28;
  static const double font3xl = 30;
  static const double font4xl = 36;
  static const double font5xl = 48;

  // Spacing
  static const double xxs = 2;
  static const double spacing3 = 3;
  static const double xs = 4;
  static const double spacing6 = 6;
  static const double sm = 8;
  static const double spacing10 = 10;
  static const double md = 12;
  static const double spacing14 = 14;
  static const double lg = 16;
  static const double spacing18 = 18;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 32;
  static const double xxxxl = 40;
  static const double xxxxxl = 48;

  // Border radius
  static const double radiusXxs = 2;
  static const double radiusXs = 4;
  static const double radiusSm = 8;
  static const double radiusMdSm = 10;
  static const double radiusMd = 12;
  static const double radiusMdLg = 14;
  static const double radiusLg = 16;
  static const double radiusLgXl = 18;
  static const double radiusXl = 20;
  static const double radiusXlXxl = 24;
  static const double radiusXxl = 28;
  static const double radiusFull = 999;

  // Icon sizes
  static const double iconXxs = 9;
  static const double iconXs = 12;
  static const double iconSm = 14;
  static const double iconMd = 16;
  static const double iconBase = 18;
  static const double iconLg = 20;
  static const double iconXl = 22;
  static const double icon2xl = 24;
  static const double icon3xl = 28;
  static const double icon4xl = 32;
  static const double icon5xl = 36;
  static const double icon6xl = 40;
  static const double icon7xl = 48;

  // Button heights
  static const double btnSm = 40;
  static const double btnMd = 44;
  static const double btnLg = 48;
  static const double btnXl = 52;
  static const double btnXxl = 56;

  // Bottom nav
  static const double bottomNavHeight = 72;
}

abstract final class AppFonts {
  static const fontFamily = 'Inter';
  static const monoFamily = 'JetBrains Mono';
}
