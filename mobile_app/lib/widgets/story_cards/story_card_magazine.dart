import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../core/app_shadows.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../image_slideshow.dart';
import 'story_card_base.dart';
import 'story_card_shared.dart';

/// Style H — Magazine Spread.
/// Horizontal: stacked cards left + text right, 3500ms.
class StoryCardMagazine extends StatefulWidget {
  final StoryCardData data;
  const StoryCardMagazine({super.key, required this.data});

  @override
  State<StoryCardMagazine> createState() => _StoryCardMagazineState();
}

class _StoryCardMagazineState extends State<StoryCardMagazine>
    with StoryCardSlideshowMixin {
  late final List<String> _images;

  @override
  Duration get slideshowInterval => const Duration(milliseconds: 3500);

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
      id: 'magazine-${tale.id}',
      child: GestureDetector(
        onTap: widget.data.onTap,
        child: Container(
          height: 220,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSizes.radiusXxl),
            gradient: const LinearGradient(
              begin: Alignment(-1, -1),
              end: Alignment(1, 1),
              colors: [Color(0xFF0E0E0E), AppColors.card],
            ),
            border: Border.all(color: Colors.white.withValues(alpha: 0.04)),
            boxShadow: AppShadows.cardHero,
          ),
          child: Row(
            children: [
              // Left: stacked card area — sorted so front card renders on top
              SizedBox(
                width: 170,
                child: Stack(
                  alignment: Alignment.center,
                  children: _sortedCards(n),
                ),
              ),

              // Right: text area
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(4, 18, 18, 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: [
                          StoryCatPill(category: tale.category),
                          StoryCreditPill(credits: tale.credits),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        tale.localizedTitle('en'),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: AppSizes.fontBase,
                          fontWeight: FontWeight.w900,
                          fontStyle: FontStyle.italic,
                          color: AppColors.text,
                          letterSpacing: -0.4,
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        tale.localizedDescription('en'),
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: AppSizes.fontXsPlus,
                          color: AppColors.textSec,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Text(
                            '${tale.chapterCount} ch \u00b7 ${tale.totalPics} img',
                            style: AppTextStyles.monoSmall.copyWith(color: AppColors.textTer),
                          ),
                          const Spacer(),
                          StoryGoButton(onTap: widget.data.onTap, size: 32),
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

  List<Widget> _sortedCards(int n) {
    final indices = List.generate(n, (i) => i);
    // Sort: front card last so it renders on top (highest z-index in Stack)
    indices.sort((a, b) {
      final aFront = currentImageIndex == a;
      final bFront = currentImageIndex == b;
      if (aFront) return 1;
      if (bFront) return -1;
      return a.compareTo(b);
    });
    return indices.map((i) => _buildCard(i, n)).toList();
  }

  Widget _buildCard(int i, int n) {
    final isFront = currentImageIndex == i;
    final isBack = (currentImageIndex + 1) % n == i;

    double tx, ty, rot, sc, op;
    if (isFront) {
      tx = -8; ty = -4; rot = -4; sc = 1.0; op = 1.0;
    } else if (isBack) {
      tx = 12; ty = 6; rot = 3; sc = 0.9; op = 0.7;
    } else {
      tx = 20; ty = 10; rot = 6; sc = 0.82; op = 0.35;
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 900),
      curve: kSpringBounce,
      transform: Matrix4.identity()
        // ignore: deprecated_member_use
        ..translate(tx, ty)
        ..rotateZ(rot * math.pi / 180)
        // ignore: deprecated_member_use
        ..scale(sc),
      transformAlignment: Alignment.center,
      child: AnimatedOpacity(
        opacity: op,
        duration: const Duration(milliseconds: 900),
        curve: kSpringBounce,
        child: Container(
          width: 110,
          height: 155,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isFront
                  ? AppColors.brand.withValues(alpha: 0.25)
                  : Colors.white.withValues(alpha: 0.03),
              width: 2,
            ),
            boxShadow: [
              if (isFront)
                ...AppShadows.cardHero
              else
                ...AppShadows.md,
              if (isFront)
                ...AppShadows.brandGlow(0.04),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
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
