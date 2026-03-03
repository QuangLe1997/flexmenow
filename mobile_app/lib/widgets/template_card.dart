import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../core/design_tokens.dart';
import 'badge_chip.dart';
import 'loading_skeleton.dart';

/// Reusable template card for the Create tab grid.
///
/// Displays a template cover image with optional badge overlay (HOT/NEW/TRENDING),
/// a premium lock icon overlay, the template name on a dark gradient footer,
/// and a small amber credit cost chip. Aspect ratio is ~3:4.
class TemplateCard extends StatelessWidget {
  /// URL for the template cover image (loaded via [CachedNetworkImage]).
  final String coverUrl;

  /// Template display name shown at the bottom of the card.
  final String name;

  /// Credit cost for this template (displayed as an amber chip).
  final int credits;

  /// Optional badge type string ("HOT", "NEW", "TRENDING", "POPULAR").
  final String? badge;

  /// Whether this template requires a premium subscription.
  final bool isPremium;

  /// Callback when the card is tapped.
  final VoidCallback? onTap;

  const TemplateCard({
    super.key,
    required this.coverUrl,
    required this.name,
    required this.credits,
    this.badge,
    this.isPremium = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final badgeWidget = BadgeChip.fromString(badge);

    return AspectRatio(
      aspectRatio: 3 / 4,
      child: Material(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(AppSizes.radiusXl),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppSizes.radiusXl),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Cover image with shimmer placeholder
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
                  top: AppSizes.md,
                  right: AppSizes.md,
                  child: badgeWidget,
                ),

              // Premium lock icon at top-left
              if (isPremium)
                Positioned(
                  top: AppSizes.md,
                  left: AppSizes.md,
                  child: Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.lock,
                      size: AppSizes.iconSm,
                      color: AppColors.brand,
                    ),
                  ),
                ),

              // Bottom gradient overlay with name + credits
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: Container(
                  padding: const EdgeInsets.fromLTRB(AppSizes.md, AppSizes.xl, AppSizes.md, AppSizes.md),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withOpacity(0.88),
                      ],
                    ),
                  ),
                  child: Row(
                    children: [
                      // Template name
                      Expanded(
                        child: Text(
                          name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: AppSizes.fontXs,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSizes.sm),
                      // Credits cost badge
                      _CreditCostChip(credits: credits),
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

/// Small amber pill showing the credit cost.
class _CreditCostChip extends StatelessWidget {
  final int credits;
  const _CreditCostChip({required this.credits});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 6,
        vertical: 2,
      ),
      decoration: BoxDecoration(
        color: AppColors.brand.withOpacity(0.9),
        borderRadius: BorderRadius.circular(AppSizes.radiusFull),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.bolt, size: 10, color: Colors.white),
          const SizedBox(width: 2),
          Text(
            '$credits',
            style: const TextStyle(
              fontSize: AppSizes.fontXxsPlus,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}
