import 'package:flutter/material.dart';

import '../../core/app_shadows.dart';
import '../../core/design_tokens.dart';
import '../image_slideshow.dart';
import 'story_card_base.dart';
import 'story_card_shared.dart';

/// Style F — Vertical Triptych.
/// 3 portrait thumbnails using Expanded (no overflow), center rises + gold glow, 3000ms.
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
  int get imageCount => _images.length;

  @override
  void initState() {
    super.initState();
    _images = widget.data.paddedImageUrls;
    currentImageIndex = 0;
    startSlideshow();
  }

  /// Get the 3 image URLs to display based on current slideshow index.
  /// Center always shows currentImageIndex, left/right show adjacent.
  List<String> get _visibleImages {
    final len = _images.length;
    if (len <= 3) return _images;
    final left = _images[(currentImageIndex) % len];
    final center = _images[(currentImageIndex + 1) % len];
    final right = _images[(currentImageIndex + 2) % len];
    return [left, center, right];
  }

  @override
  Widget build(BuildContext context) {
    final tale = widget.data.tale;
    final visible = _visibleImages;

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
                // 3 portrait thumbnails — center always elevated
                SizedBox(
                  height: 210,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: List.generate(3, (i) {
                        final isCenter = i == 1; // center always index 1
                        return Expanded(
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 700),
                            curve: kSmoothBounce,
                            height: isCenter ? 165 : 125,
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            transform: Matrix4.translationValues(
                              0,
                              isCenter ? -10 : 8,
                              0,
                            ),
                            transformAlignment: Alignment.center,
                            decoration: BoxDecoration(
                              borderRadius:
                                  BorderRadius.circular(isCenter ? 16 : 12),
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
                              borderRadius: BorderRadius.circular(
                                  isCenter ? 14 : 10),
                              child: AnimatedSwitcher(
                                duration: const Duration(milliseconds: 600),
                                child: ColorFiltered(
                                  key: ValueKey('triptych-$i-${visible[i]}'),
                                  colorFilter: ColorFilter.matrix(
                                    isCenter
                                        ? _identityMatrix()
                                        : _dimMatrix(),
                                  ),
                                  child: PlaceholderImage(
                                    index: widget.data.cardIndex + i,
                                    borderRadius: 0,
                                    imageUrl: visible[i],
                                    fit: BoxFit.cover,
                                  ),
                                ),
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
      0.5, 0, 0, 0, 0,
      0, 0.5, 0, 0, 0,
      0, 0, 0.5, 0, 0,
      0, 0, 0, 1, 0,
    ];
  }
}
