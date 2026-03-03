import 'package:flutter/material.dart';
import 'design_tokens.dart';

final ThemeData appTheme = ThemeData(
  brightness: Brightness.dark,
  scaffoldBackgroundColor: AppColors.bg,
  fontFamily: 'Inter',
  colorScheme: const ColorScheme.dark(
    primary: AppColors.brand,
    secondary: AppColors.brand400,
    surface: AppColors.card,
    error: AppColors.red,
    onPrimary: AppColors.bg,
    onSecondary: AppColors.bg,
    onSurface: AppColors.text,
    onError: AppColors.text,
  ),
  appBarTheme: const AppBarTheme(
    backgroundColor: AppColors.bg,
    foregroundColor: AppColors.text,
    elevation: 0,
    centerTitle: true,
  ),
  cardTheme: CardThemeData(
    color: AppColors.card,
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(AppSizes.radiusMd),
      side: const BorderSide(color: AppColors.border),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: AppColors.input,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppSizes.radiusMd),
      borderSide: const BorderSide(color: AppColors.border),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppSizes.radiusMd),
      borderSide: const BorderSide(color: AppColors.border),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppSizes.radiusMd),
      borderSide: const BorderSide(color: AppColors.brand),
    ),
    hintStyle: const TextStyle(color: AppColors.textTer, fontSize: AppSizes.fontBase),
    contentPadding: const EdgeInsets.symmetric(
      horizontal: AppSizes.lg,
      vertical: AppSizes.md,
    ),
  ),
  textTheme: const TextTheme(
    headlineLarge: TextStyle(
      fontSize: AppSizes.font3xl,
      fontWeight: FontWeight.w700,
      color: AppColors.text,
      letterSpacing: -0.5,
    ),
    headlineMedium: TextStyle(
      fontSize: AppSizes.font2xl,
      fontWeight: FontWeight.w700,
      color: AppColors.text,
    ),
    headlineSmall: TextStyle(
      fontSize: AppSizes.fontXl,
      fontWeight: FontWeight.w600,
      color: AppColors.text,
    ),
    titleLarge: TextStyle(
      fontSize: AppSizes.fontLg,
      fontWeight: FontWeight.w600,
      color: AppColors.text,
    ),
    titleMedium: TextStyle(
      fontSize: AppSizes.fontBase,
      fontWeight: FontWeight.w600,
      color: AppColors.text,
    ),
    bodyLarge: TextStyle(
      fontSize: AppSizes.fontBase,
      fontWeight: FontWeight.w400,
      color: AppColors.text,
    ),
    bodyMedium: TextStyle(
      fontSize: AppSizes.fontSm,
      fontWeight: FontWeight.w400,
      color: AppColors.textSec,
    ),
    bodySmall: TextStyle(
      fontSize: AppSizes.fontXs,
      fontWeight: FontWeight.w400,
      color: AppColors.textTer,
    ),
    labelLarge: TextStyle(
      fontSize: AppSizes.fontBase,
      fontWeight: FontWeight.w600,
      color: AppColors.brand,
    ),
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    backgroundColor: AppColors.bg,
    selectedItemColor: AppColors.brand,
    unselectedItemColor: AppColors.textTer,
    type: BottomNavigationBarType.fixed,
    showUnselectedLabels: true,
    selectedLabelStyle: TextStyle(fontSize: AppSizes.fontXs, fontWeight: FontWeight.w600),
    unselectedLabelStyle: TextStyle(fontSize: AppSizes.fontXs),
  ),
  dividerTheme: const DividerThemeData(
    color: AppColors.border,
    thickness: 1,
  ),
);
