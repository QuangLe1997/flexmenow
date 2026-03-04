import 'package:flutter/material.dart';

import '../../core/app_animations.dart';
import '../../core/app_shadows.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../image_slideshow.dart';
import 'story_card_base.dart';
import 'story_card_shared.dart';

/// Style C — Accordion Reveal.
/// 3 expanding/compressing strips with "Ch.N" labels, 2600ms.
class StoryCardAccordion extends StatefulWidget {
  final StoryCardData data;
  const StoryCardAccordion({super.key, required this.data});

  @override
  State<StoryCardAccordion> createState() => _StoryCardAccordionState();
}

class _StoryCardAccordionState extends State<StoryCardAccordion>
    with StoryCardSlideshowMixin {
  late final List<String> _images;

  @override
  Duration get slideshowInterval => const Duration(milliseconds: 2600);

  @override
  int get imageCount => 3; // always 3 strips

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
      id: 'accordion-${tale.id}',
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
                // Accordion strips area
                SizedBox(
                  height: 240,
                  child: Stack(
                    children: [
                      Row(
                        children: List.generate(3, (i) {
                          final isFocused = currentImageIndex == i;
                          return Expanded(
                            flex: isFocused ? 25 : 8,
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 900),
                              curve: kAccordionCurve,
                              margin: EdgeInsets.only(
                                left: i == 0 ? 0 : 1.5,
                                right: i == 2 ? 0 : 1.5,
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(isFocused ? 0 : 2),
                                child: Stack(
                                  fit: StackFit.expand,
                                  children: [
                                    // Image with brightness/saturation
                                    AnimatedScale(
                                      scale: isFocused ? 1.08 : 1.15,
                                      duration: const Duration(milliseconds: 4000),
                                      curve: AppCurves.enter,
                                      child: ColorFiltered(
                                        colorFilter: ColorFilter.matrix(
                                          isFocused
                                              ? _brightnessMatrix(1.0)
                                              : _brightnessMatrix(0.5),
                                        ),
                                        child: PlaceholderImage(
                                          index: widget.data.cardIndex + i,
                                          borderRadius: 0,
                                          imageUrl: i < _images.length ? _images[i] : _images.last,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                    ),

                                    // Bottom gradient on focused strip
                                    if (isFocused)
                                      Positioned.fill(
                                        child: DecoratedBox(
                                          decoration: BoxDecoration(
                                            gradient: LinearGradient(
                                              begin: Alignment.bottomCenter,
                                              end: Alignment.center,
                                              colors: [
                                                Colors.black.withValues(alpha: 0.6),
                                                Colors.transparent,
                                              ],
                                            ),
                                          ),
                                        ),
                                      ),

                                    // "Ch.N" label on focused
                                    if (isFocused)
                                      Positioned(
                                        bottom: 10,
                                        left: 10,
                                        child: Text(
                                          'Ch. ${i + 1}',
                                          style: AppTextStyles.captionMono.copyWith(
                                            fontWeight: FontWeight.w800,
                                            color: AppColors.brand,
                                            letterSpacing: 2,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        }),
                      ),

                      // Pills overlay
                      Positioned(
                        top: 12,
                        left: 12,
                        child: StoryCatPill(category: tale.category),
                      ),
                      Positioned(
                        top: 12,
                        right: 12,
                        child: StoryCreditPill(credits: tale.credits),
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

  /// Simple brightness matrix. 1.0 = normal, 0.35 = darkened.
  List<double> _brightnessMatrix(double brightness) {
    return [
      brightness, 0, 0, 0, 0,
      0, brightness, 0, 0, 0,
      0, 0, brightness, 0, 0,
      0, 0, 0, 1, 0,
    ];
  }
}
