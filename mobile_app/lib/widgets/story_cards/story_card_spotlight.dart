import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';

import '../../core/app_shadows.dart';
import '../../core/design_tokens.dart';
import '../dot_indicator.dart';
import '../image_slideshow.dart';
import 'story_card_base.dart';
import 'story_card_shared.dart';

/// Style G — Spotlight Focus.
/// Single portrait + blurred ambient background, 4000ms.
class StoryCardSpotlight extends StatefulWidget {
  final StoryCardData data;
  const StoryCardSpotlight({super.key, required this.data});

  @override
  State<StoryCardSpotlight> createState() => _StoryCardSpotlightState();
}

class _StoryCardSpotlightState extends State<StoryCardSpotlight>
    with StoryCardSlideshowMixin {
  late final List<String> _images;

  @override
  Duration get slideshowInterval => const Duration(milliseconds: 4000);

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
    final n = _images.length;

    return wrapWithVisibility(
      id: 'spotlight-${tale.id}',
      child: GestureDetector(
        onTap: widget.data.onTap,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSizes.radiusXxl),
            color: const Color(0xFF060606),
            border: Border.all(color: Colors.white.withValues(alpha: 0.04)),
            boxShadow: AppShadows.cardHero,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppSizes.radiusXxl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Spotlight area
                SizedBox(
                  height: 250,
                  child: Stack(
                    alignment: Alignment.center,
                    clipBehavior: Clip.hardEdge,
                    children: [
                      // Blurred ambient background
                      Positioned.fill(
                        child: _images.isNotEmpty
                            ? ImageFiltered(
                                imageFilter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
                                child: ColorFiltered(
                                  colorFilter: const ColorFilter.matrix([
                                    0.25, 0, 0, 0, 0,
                                    0, 0.25, 0, 0, 0,
                                    0, 0, 0.25, 0, 0,
                                    0, 0, 0, 1, 0,
                                  ]),
                                  child: Transform.scale(
                                    scale: 1.15,
                                    child: PlaceholderImage(
                                      index: widget.data.cardIndex,
                                      borderRadius: 0,
                                      imageUrl: _images[currentImageIndex],
                                      fit: BoxFit.cover,
                                    ),
                                  ),
                                ),
                              )
                            : const SizedBox.shrink(),
                      ),

                      // Centered portrait cards with crossfade
                      ...List.generate(n, (i) {
                        final isActive = currentImageIndex == i;
                        return AnimatedOpacity(
                          opacity: isActive ? 1.0 : 0.0,
                          duration: const Duration(milliseconds: 900),
                          curve: kSmoothBounce,
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 900),
                            curve: kSmoothBounce,
                            transform: Matrix4.identity()
                              // ignore: deprecated_member_use
                              ..scale(isActive ? 1.0 : 0.85)
                              ..rotateZ(isActive ? 0.0 : 3 * math.pi / 180),
                            transformAlignment: Alignment.center,
                            width: 140,
                            height: 200,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: isActive
                                    ? AppColors.brand.withValues(alpha: 0.3)
                                    : Colors.transparent,
                                width: 2,
                              ),
                              boxShadow: isActive
                                  ? [
                                      ...AppShadows.cardHero,
                                      ...AppShadows.brandGlow(0.12),
                                    ]
                                  : [],
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: PlaceholderImage(
                                index: widget.data.cardIndex + i,
                                borderRadius: 0,
                                imageUrl: _images[i],
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                        );
                      }),

                      // Pills top-left
                      Positioned(
                        top: 12,
                        left: 12,
                        child: Row(
                          children: [
                            StoryCatPill(category: tale.category),
                            const SizedBox(width: 6),
                            StoryCreditPill(credits: tale.credits),
                          ],
                        ),
                      ),

                      // Dots bottom center
                      Positioned(
                        bottom: 10,
                        child: DotIndicator(
                          count: n,
                          activeIndex: currentImageIndex,
                          showGlow: true,
                        ),
                      ),
                    ],
                  ),
                ),

                // Info footer
                StoryCardInfoFooter(tale: tale, onTap: widget.data.onTap),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
