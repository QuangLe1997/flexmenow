import 'package:flutter/material.dart';

import '../../core/app_animations.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../dot_indicator.dart';
import '../image_slideshow.dart';
import 'story_card_base.dart';
import 'story_card_shared.dart';

/// Style A — Cinematic Parallax.
/// Full-bleed 320px, crossfade + slow scale zoom, gold accent line, 3800ms.
class StoryCardCinematic extends StatefulWidget {
  final StoryCardData data;
  const StoryCardCinematic({super.key, required this.data});

  @override
  State<StoryCardCinematic> createState() => _StoryCardCinematicState();
}

class _StoryCardCinematicState extends State<StoryCardCinematic>
    with StoryCardSlideshowMixin {
  late final List<String> _images;

  @override
  Duration get slideshowInterval => const Duration(milliseconds: 3800);

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
      id: 'cinematic-${tale.id}',
      child: GestureDetector(
        onTap: widget.data.onTap,
        child: Container(
          height: 320,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSizes.radiusXxl),
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: 0.6), blurRadius: 50, offset: const Offset(0, 20)),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppSizes.radiusXxl),
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Crossfading images with Ken Burns zoom
                ..._buildImages(),

                // Dark gradient overlay
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.black.withValues(alpha: 0.1),
                          Colors.black.withValues(alpha: 0.15),
                          Colors.black.withValues(alpha: 0.85),
                          Colors.black.withValues(alpha: 0.98),
                        ],
                        stops: const [0.0, 0.4, 0.75, 1.0],
                      ),
                    ),
                  ),
                ),

                // Gold accent line at top
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Colors.transparent,
                          AppColors.brand,
                          Colors.transparent,
                        ],
                      ),
                    ),
                    child: Opacity(opacity: 0.6, child: const SizedBox.expand()),
                  ),
                ),

                // Category pill top-left
                Positioned(
                  top: 14,
                  left: 14,
                  child: StoryCatPill(category: tale.category),
                ),

                // Credit pill top-right
                Positioned(
                  top: 14,
                  right: 14,
                  child: StoryCreditPill(credits: tale.credits),
                ),

                // Bottom text area
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          tale.localizedTitle('en'),
                          style: const TextStyle(
                            fontSize: AppSizes.fontXlPlus,
                            fontWeight: FontWeight.w900,
                            fontStyle: FontStyle.italic,
                            color: Colors.white,
                            letterSpacing: -0.8,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          tale.localizedDescription('en'),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: AppSizes.fontXs,
                            color: Colors.white.withValues(alpha: 0.6),
                            height: 1.55,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Text(
                              '${tale.chapterCount} chapters \u00b7 ${tale.totalPics} images',
                              style: AppTextStyles.monoSmall.copyWith(
                                color: Colors.white.withValues(alpha: 0.35),
                              ),
                            ),
                            const Spacer(),
                            DotIndicator(
                              count: _images.length,
                              activeIndex: currentImageIndex,
                              showGlow: true,
                            ),
                            const Spacer(),
                            StoryGoButton(onTap: widget.data.onTap, size: 38),
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
        duration: const Duration(milliseconds: 1500),
        curve: AppCurves.standard,
        child: AnimatedScale(
          scale: isActive ? 1.08 : 1.15,
          duration: const Duration(milliseconds: 8000),
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
