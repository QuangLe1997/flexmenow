import 'package:flutter/material.dart';

import '../../core/app_shadows.dart';
import '../../core/design_tokens.dart';
import '../image_slideshow.dart';
import 'story_card_base.dart';
import 'story_card_shared.dart';

/// Style F — Vertical Triptych.
/// 3 portrait thumbnails, center rises + gold glow, 3000ms.
class StoryCardTriptych extends StatefulWidget {
  final StoryCardData data;
  const StoryCardTriptych({super.key, required this.data});

  @override
  State<StoryCardTriptych> createState() => _StoryCardTriptychState();
}

class _StoryCardTriptychState extends State<StoryCardTriptych>
    with StoryCardSlideshowMixin {
  late final List<String> _images;

  @override
  Duration get slideshowInterval => const Duration(milliseconds: 3000);

  @override
  int get imageCount => 3; // always 3 portraits

  @override
  void initState() {
    super.initState();
    _images = widget.data.paddedImageUrls;
    // Start at center (index 1)
    currentImageIndex = 1;
    startSlideshow();
  }

  @override
  Widget build(BuildContext context) {
    final tale = widget.data.tale;

    return wrapWithVisibility(
      id: 'triptych-${tale.id}',
      child: GestureDetector(
        onTap: widget.data.onTap,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSizes.radiusXxl),
            color: AppColors.card,
            border: Border.all(color: Colors.white.withValues(alpha: 0.04)),
            boxShadow: AppShadows.cardHero,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppSizes.radiusXxl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // 3 portrait thumbnails
                SizedBox(
                  height: 210,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(3, (i) {
                        final isCenter = currentImageIndex == i;
                        return AnimatedContainer(
                          duration: const Duration(milliseconds: 700),
                          curve: kSmoothBounce,
                          width: isCenter ? 105 : 85,
                          height: isCenter ? 155 : 125,
                          margin: const EdgeInsets.symmetric(horizontal: 5),
                          transform: Matrix4.translationValues(
                            0,
                            isCenter ? -8 : 6,
                            0,
                          ),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(isCenter ? 16 : 12),
                            border: Border.all(
                              color: isCenter
                                  ? AppColors.brand.withValues(alpha: 0.3)
                                  : Colors.white.withValues(alpha: 0.04),
                              width: 2,
                            ),
                            boxShadow: [
                              if (isCenter) ...[
                                ...AppShadows.cardHero,
                                ...AppShadows.brandGlow(0.06),
                              ] else
                                ...AppShadows.md,
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(isCenter ? 14 : 10),
                            child: ColorFiltered(
                              colorFilter: ColorFilter.matrix(
                                isCenter
                                    ? _identityMatrix()
                                    : _dimMatrix(),
                              ),
                              child: PlaceholderImage(
                                index: widget.data.cardIndex + i,
                                borderRadius: 0,
                                imageUrl: i < _images.length ? _images[i] : _images.last,
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                        );
                      }),
                    ),
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

  List<double> _identityMatrix() {
    return [
      1, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, 1, 0,
    ];
  }

  /// brightness(0.5) saturate(0.6) approximation.
  List<double> _dimMatrix() {
    return [
      0.3, 0, 0, 0, 0,
      0, 0.3, 0, 0, 0,
      0, 0, 0.3, 0, 0,
      0, 0, 0, 1, 0,
    ];
  }
}
