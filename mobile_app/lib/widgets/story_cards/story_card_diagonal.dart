import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../core/app_animations.dart';
import '../../core/app_shadows.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../dot_indicator.dart';
import '../image_slideshow.dart';
import 'story_card_base.dart';
import 'story_card_shared.dart';

/// Style E — Split Diagonal.
/// ClipPath diagonal + crossfade + gold diagonal line, 3200ms.
class StoryCardDiagonal extends StatefulWidget {
  final StoryCardData data;
  const StoryCardDiagonal({super.key, required this.data});

  @override
  State<StoryCardDiagonal> createState() => _StoryCardDiagonalState();
}

class _StoryCardDiagonalState extends State<StoryCardDiagonal>
    with StoryCardSlideshowMixin {
  late final List<String> _images;

  @override
  Duration get slideshowInterval => const Duration(milliseconds: 3200);

  @override
  int get imageCount => _images.length;

  @override
  void initState() {
    super.initState();
    _images = widget.data.paddedImageUrls;
    startSlideshow();
  }

  @override
  Widget build(BuildContext context) {
    final tale = widget.data.tale;

    return wrapWithVisibility(
      id: 'diagonal-${tale.id}',
      child: GestureDetector(
        onTap: widget.data.onTap,
        child: Container(
          height: 260,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSizes.radiusXxl),
            color: AppColors.card,
            border: Border.all(color: Colors.white.withValues(alpha: 0.04)),
            boxShadow: AppShadows.cardHero,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppSizes.radiusXxl),
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Diagonally-clipped image area
                ClipPath(
                  clipper: _DiagonalClipper(),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      ..._buildImages(),
                      // Gradient overlay
                      Positioned.fill(
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.transparent,
                                Colors.black.withValues(alpha: 0.7),
                              ],
                              stops: const [0.3, 1.0],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Gold diagonal divider line
                Positioned(
                  top: 260 * 0.68,
                  left: 0,
                  right: 0,
                  child: Transform.rotate(
                    angle: -3.5 * math.pi / 180,
                    alignment: Alignment.centerLeft,
                    child: Container(
                      height: 2,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppColors.brand.withValues(alpha: 0.38),
                            AppColors.brand.withValues(alpha: 0.12),
                            Colors.transparent,
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

                // Pills top-left
                Positioned(
                  top: 14,
                  left: 14,
                  child: Row(
                    children: [
                      StoryCatPill(category: tale.category),
                      const SizedBox(width: 6),
                      StoryCreditPill(credits: tale.credits),
                    ],
                  ),
                ),

                // Text at bottom
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(18, 0, 18, 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          tale.localizedTitle('en'),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: AppSizes.fontLg,
                            fontWeight: FontWeight.w900,
                            fontStyle: FontStyle.italic,
                            color: AppColors.text,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          tale.localizedDescription('en'),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: AppSizes.fontXsPlus,
                            color: AppColors.textSec,
                            height: 1.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Text(
                              '${tale.chapterCount} ch \u00b7 ${tale.totalPics} img',
                              style: AppTextStyles.monoSmall.copyWith(color: AppColors.textTer),
                            ),
                            const SizedBox(width: 10),
                            DotIndicator(
                              count: _images.length,
                              activeIndex: currentImageIndex,
                              showGlow: true,
                            ),
                            const Spacer(),
                            StoryGoButton(onTap: widget.data.onTap, size: 36),
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
      ),
    );
  }

  List<Widget> _buildImages() {
    return List.generate(_images.length, (i) {
      final isActive = currentImageIndex == i;
      return AnimatedOpacity(
        opacity: isActive ? 1.0 : 0.0,
        duration: AppDurations.slowest,
        curve: AppCurves.standard,
        child: AnimatedScale(
          scale: isActive ? 1.05 : 1.12,
          duration: const Duration(milliseconds: 6000),
          curve: AppCurves.enter,
          child: PlaceholderImage(
            index: widget.data.cardIndex + i,
            borderRadius: 0,
            imageUrl: _images[i],
            fit: BoxFit.cover,
          ),
        ),
      );
    });
  }
}

/// Clips image area as polygon(0 0, 100% 0, 100% 60%, 0 80%).
class _DiagonalClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    return Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width, size.height * 0.60)
      ..lineTo(0, size.height * 0.80)
      ..close();
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}
