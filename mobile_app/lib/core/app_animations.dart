import 'package:flutter/material.dart';

/// Duration tokens for consistent animation timing.
abstract final class AppDurations {
  static const instant = Duration(milliseconds: 100);
  static const fast = Duration(milliseconds: 200);
  static const normal = Duration(milliseconds: 300);
  static const medium = Duration(milliseconds: 400);
  static const slow = Duration(milliseconds: 500);
  static const slower = Duration(milliseconds: 800);
  static const slowest = Duration(milliseconds: 1200);
}

/// Curve tokens for consistent animation easing.
abstract final class AppCurves {
  static const standard = Curves.easeInOut;
  static const enter = Curves.easeOut;
  static const exit = Curves.easeIn;
  static const spring = Curves.elasticOut;
  static const smooth = Curves.easeOutCubic;
}
