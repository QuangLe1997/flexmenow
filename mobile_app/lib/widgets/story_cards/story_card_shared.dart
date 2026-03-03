import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_shadows.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../../data/models/story_data.dart';

/// Category pill — dark backdrop with gold uppercase text.
class StoryCatPill extends StatelessWidget {
  final String category;
  const StoryCatPill({super.key, required this.category});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.55),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.brand.withValues(alpha: 0.15)),
      ),
      child: Text(
        category.toUpperCase(),
        style: AppTextStyles.captionMono.copyWith(
          fontSize: AppSizes.font2xs,
          fontWeight: FontWeight.w800,
          color: AppColors.brand,
          letterSpacing: 1.5,
        ),
      ),
    );
  }
}

/// Credit cost pill — gold tinted background with zap icon + number.
class StoryCreditPill extends StatelessWidget {
  final int credits;
  const StoryCreditPill({super.key, required this.credits});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.brand.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(LucideIcons.zap, size: AppSizes.iconXxs, color: AppColors.brand),
          const SizedBox(width: 3),
          Text(
            '$credits',
            style: AppTextStyles.captionMono.copyWith(
              fontWeight: FontWeight.w800,
              color: AppColors.brand,
            ),
          ),
        ],
      ),
    );
  }
}

/// Badge color helper for story badges.
Color badgeColor(String badge) {
  switch (badge) {
    case 'HOT':
      return AppColors.red;
    case 'NEW':
      return AppColors.green;
    case 'TRENDING':
      return AppColors.purple;
    case 'POPULAR':
      return AppColors.blue;
    default:
      return AppColors.brand;
  }
}

/// Card info footer — title (italic 15px) + credit pill + description + stats + GoBtn.
/// Used by styles B, C, F, G which have a separate image area on top.
class StoryCardInfoFooter extends StatelessWidget {
  final StoryData tale;
  final int maxLines;
  final VoidCallback onTap;

  const StoryCardInfoFooter({
    super.key,
    required this.tale,
    this.maxLines = 2,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title row with credit pill
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        tale.localizedTitle('en'),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: AppSizes.fontMdPlus,
                          fontWeight: FontWeight.w900,
                          fontStyle: FontStyle.italic,
                          color: AppColors.text,
                          letterSpacing: -0.4,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    StoryCreditPill(credits: tale.credits),
                  ],
                ),
                const SizedBox(height: 5),
                // Description
                Text(
                  tale.localizedDescription('en'),
                  maxLines: maxLines,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: AppSizes.fontXsPlus,
                    color: AppColors.textSec,
                    height: 1.55,
                  ),
                ),
                const SizedBox(height: 5),
                // Stats
                Text(
                  '${tale.chapterCount} ch \u00b7 ${tale.totalPics} img',
                  style: AppTextStyles.monoSmall.copyWith(
                    color: AppColors.textTer,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          StoryGoButton(onTap: onTap),
        ],
      ),
    );
  }
}

/// Circular gold arrow button.
class StoryGoButton extends StatelessWidget {
  final VoidCallback onTap;
  final double size;

  const StoryGoButton({super.key, required this.onTap, this.size = 44});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
      onTap: onTap,
      customBorder: const CircleBorder(),
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: AppColors.brand,
          boxShadow: AppShadows.brandGlow(0.3),
        ),
        child: Icon(
          LucideIcons.chevronRight,
          size: size * 0.5,
          color: Colors.black,
        ),
      ),
      ),
    );
  }
}
