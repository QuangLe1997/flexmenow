import 'package:flutter/material.dart';

import '../core/design_tokens.dart';

/// Badge type for template/story cards.
enum BadgeType {
  hot,
  newBadge,
  trending,
  popular,
}

/// Small rounded pill badge with colored background.
///
/// Used as an overlay chip on [TemplateCard] and [StoryCard].
/// Colors: HOT=red, NEW=green, TRENDING=purple, POPULAR=amber.
class BadgeChip extends StatelessWidget {
  final BadgeType type;

  const BadgeChip({super.key, required this.type});

  /// Factory constructor from a raw string (e.g. from JSON data).
  ///
  /// Returns `null` if the string does not match a known badge type.
  static BadgeChip? fromString(String? badge) {
    if (badge == null || badge.isEmpty) return null;
    switch (badge.toUpperCase()) {
      case 'HOT':
        return const BadgeChip(type: BadgeType.hot);
      case 'NEW':
        return const BadgeChip(type: BadgeType.newBadge);
      case 'TRENDING':
        return const BadgeChip(type: BadgeType.trending);
      case 'POPULAR':
        return const BadgeChip(type: BadgeType.popular);
      default:
        return null;
    }
  }

  String get _label {
    switch (type) {
      case BadgeType.hot:
        return 'HOT';
      case BadgeType.newBadge:
        return 'NEW';
      case BadgeType.trending:
        return 'TRENDING';
      case BadgeType.popular:
        return 'POPULAR';
    }
  }

  Color get _color {
    switch (type) {
      case BadgeType.hot:
        return AppColors.red;
      case BadgeType.newBadge:
        return AppColors.green;
      case BadgeType.trending:
        return AppColors.purple;
      case BadgeType.popular:
        return AppColors.brand;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSizes.sm,
        vertical: AppSizes.xs,
      ),
      decoration: BoxDecoration(
        color: _color,
        borderRadius: BorderRadius.circular(AppSizes.radiusFull),
      ),
      child: Text(
        _label,
        style: const TextStyle(
          fontSize: AppSizes.fontXs,
          fontWeight: FontWeight.w700,
          color: Colors.white,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
