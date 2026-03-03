import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../core/design_tokens.dart';
import 'badge_chip.dart';
import 'loading_skeleton.dart';

/// Duration label for story cards.
///
/// Maps to the story length: Moment (short), One Day (medium), Many Days (long).
enum StoryDuration {
  moment,
  oneDay,
  manyDays,
}

/// Reusable story card for the Story tab grid.
///
/// Displays a story cover image with title overlay, duration badge,
/// credit cost, total pics count, and optional badge chip.
/// Aspect ratio is ~3:4.
class StoryCard extends StatelessWidget {
  /// URL for the story cover image.
  final String coverUrl;

  /// Story display title.
  final String title;

  /// Duration label displayed as a small chip.
  final String duration;

  /// Credit cost for generating this story.
  final int credits;

  /// Number of images/scenes in this story.
  final int totalPics;

  /// Optional badge type string ("HOT", "NEW", "TRENDING", "POPULAR").
  final String? badge;

  /// Callback when the card is tapped.
  final VoidCallback? onTap;

  const StoryCard({
    super.key,
    required this.coverUrl,
    required this.title,
    required this.duration,
    required this.credits,
    required this.totalPics,
    this.badge,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final badgeWidget = BadgeChip.fromString(badge);

    return AspectRatio(
      aspectRatio: 3 / 4,
      child: Material(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(AppSizes.radiusMd),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Cover image
              CachedNetworkImage(
                imageUrl: coverUrl,
                fit: BoxFit.cover,
                placeholder: (_, __) => const LoadingSkeleton(
                  height: double.infinity,
                  borderRadius: 0,
                ),
                errorWidget: (_, __, ___) => const Center(
                  child: Icon(
                    Icons.broken_image_outlined,
                    color: AppColors.textTer,
                    size: AppSizes.icon4xl,
                  ),
                ),
              ),

              // Badge chip at top-right
              if (badgeWidget != null)
                Positioned(
                  top: AppSizes.sm,
                  right: AppSizes.sm,
                  child: badgeWidget,
                ),

              // Duration badge at top-left
              Positioned(
                top: AppSizes.sm,
                left: AppSizes.sm,
                child: _DurationChip(duration: duration),
              ),

              // Bottom gradient overlay with title + info
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: Container(
                  padding: const EdgeInsets.all(AppSizes.sm),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withOpacity(0.85),
                      ],
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Story title
                      Text(
                        title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: AppSizes.fontXs,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: AppSizes.xs),
                      // Credits + pics count row
                      Row(
                        children: [
                          // Credits
                          Icon(Icons.bolt, size: AppSizes.iconXs, color: AppColors.brand),
                          const SizedBox(width: 2),
                          Text(
                            '$credits',
                            style: const TextStyle(
                              fontSize: AppSizes.fontXxsPlus,
                              fontWeight: FontWeight.w600,
                              color: AppColors.brand,
                            ),
                          ),
                          const SizedBox(width: AppSizes.sm),
                          // Pics count
                          const Icon(
                            Icons.photo_library_outlined,
                            size: AppSizes.iconXs,
                            color: AppColors.textSec,
                          ),
                          const SizedBox(width: 2),
                          Text(
                            '$totalPics pics',
                            style: const TextStyle(
                              fontSize: AppSizes.fontXxsPlus,
                              fontWeight: FontWeight.w500,
                              color: AppColors.textSec,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Small chip showing the story duration label.
class _DurationChip extends StatelessWidget {
  final String duration;
  const _DurationChip({required this.duration});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 6,
        vertical: 3,
      ),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.6),
        borderRadius: BorderRadius.circular(AppSizes.radiusFull),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.schedule, size: 10, color: AppColors.textSec),
          const SizedBox(width: 3),
          Text(
            duration,
            style: const TextStyle(
              fontSize: AppSizes.fontXxsPlus,
              fontWeight: FontWeight.w500,
              color: AppColors.textSec,
            ),
          ),
        ],
      ),
    );
  }
}
