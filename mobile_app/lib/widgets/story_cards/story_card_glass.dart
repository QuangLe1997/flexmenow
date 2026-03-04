import 'package:flutter/material.dart';

import '../../core/app_animations.dart';
import '../../core/app_shadows.dart';
import '../../core/design_tokens.dart';
import '../dot_indicator.dart';
import '../image_slideshow.dart';
import 'story_card_base.dart';
import 'story_card_shared.dart';

/// Style B — Glass Carousel.
/// 3D rotating carousel (perspective 800), bouncy spring, 2800ms.
class StoryCardGlass extends StatefulWidget {
  final StoryCardData data;
  const StoryCardGlass({super.key, required this.data});

  @override
  State<StoryCardGlass> createState() => _StoryCardGlassState();
}

class _StoryCardGlassState extends State<StoryCardGlass>
    with StoryCardSlideshowMixin {
  late final List<String> _images;

  @override
  Duration get slideshowInterval => const Duration(milliseconds: 2800);

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
      id: 'glass-${tale.id}',
      child: GestureDetector(
        onTap: widget.data.onTap,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSizes.radiusXxl),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [AppColors.card, Color(0xFF0A0A0A)],
            ),
            border: Border.all(color: Colors.white.withValues(alpha: 0.04)),
            boxShadow: AppShadows.cardHero,
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppSizes.radiusXxl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // 3D carousel area
                SizedBox(
                  height: 230,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Ambient radial glow
                      Center(
                        child: Container(
                          width: 200,
                          height: 200,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: RadialGradient(
                              colors: [
                                AppColors.brand.withValues(alpha: 0.03),
                                Colors.transparent,
                              ],
                            ),
                          ),
                        ),
                      ),

                      // 3D cards — sorted so front card renders last (on top)
                      ..._sortedCarouselCards(n),

                      // Category pill top-left
                      Positioned(
                        top: 12,
                        left: 12,
                        child: StoryCatPill(category: tale.category),
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

  List<Widget> _sortedCarouselCards(int n) {
    final indices = List.generate(n, (i) => i);
    indices.sort((a, b) {
      final da = (a - currentImageIndex + n) % n;
      final db = (b - currentImageIndex + n) % n;
      if (da == 0) return 1; // front card last (renders on top)
      if (db == 0) return -1;
      return da.compareTo(db);
    });
    return indices.map((i) => _buildCarouselCard(i, n)).toList();
  }

  Widget _buildCarouselCard(int i, int n) {
    final d = (i - currentImageIndex + n) % n;
    double tx, ry, sc, op;

    if (d == 0) {
      tx = 0; ry = 0; sc = 1.0; op = 1.0;
    } else if (d == 1) {
      tx = 65; ry = 15; sc = 0.78; op = 0.75;
    } else if (d == n - 1) {
      tx = -65; ry = -15; sc = 0.78; op = 0.75;
    } else {
      tx = 0; ry = 0; sc = 0.6; op = 0.0;
    }

    final isFront = d == 0;

    return AnimatedContainer(
      duration: AppDurations.slower,
      curve: kBouncyCurve,
      transform: Matrix4.identity()
        ..setEntry(3, 2, 0.00125) // perspective ≈ 800
        // ignore: deprecated_member_use
        ..translate(tx, 0.0, 0.0)
        ..rotateY(ry * 3.14159 / 180)
        // ignore: deprecated_member_use
        ..scale(sc),
      transformAlignment: Alignment.center,
      child: AnimatedOpacity(
        opacity: op,
        duration: AppDurations.slower,
        curve: kBouncyCurve,
        child: Container(
          width: 125,
          height: 175,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isFront
                  ? AppColors.brand.withValues(alpha: 0.3)
                  : Colors.white.withValues(alpha: 0.04),
              width: 2,
            ),
            boxShadow: [
              if (isFront)
                ...AppShadows.cardHero
              else
                ...AppShadows.lg,
              if (isFront)
                ...AppShadows.brandGlow(0.06),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: PlaceholderImage(
              index: widget.data.cardIndex + i,
              borderRadius: 0,
              imageUrl: _images[i],
              fit: BoxFit.cover,
            ),
          ),
        ),
      ),
    );
  }
}
