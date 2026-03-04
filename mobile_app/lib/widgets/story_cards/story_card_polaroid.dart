import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../core/app_animations.dart';
import '../../core/app_shadows.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../image_slideshow.dart';
import 'story_card_base.dart';
import 'story_card_shared.dart';

/// Style D — Floating Polaroid.
/// Horizontal split: text left, tilted polaroid stack right, 3400ms.
class StoryCardPolaroid extends StatefulWidget {
  final StoryCardData data;
  const StoryCardPolaroid({super.key, required this.data});

  @override
  State<StoryCardPolaroid> createState() => _StoryCardPolaroidState();
}

class _StoryCardPolaroidState extends State<StoryCardPolaroid>
    with StoryCardSlideshowMixin {
  late final List<String> _images;
  static const _tilts = [-3.0, 2.0, -1.5];

  @override
  Duration get slideshowInterval => const Duration(milliseconds: 3400);

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
      id: 'polaroid-${tale.id}',
      child: GestureDetector(
        onTap: widget.data.onTap,
        child: Container(
          height: 210,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSizes.radiusXxl),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [AppColors.card, Color(0xFF0C0C0C)],
            ),
            border: Border.all(color: Colors.white.withValues(alpha: 0.04)),
            boxShadow: AppShadows.cardHero,
          ),
          child: Row(
            children: [
              // Left: text column
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(18, 18, 4, 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      StoryCatPill(category: tale.category),
                      const SizedBox(height: 8),
                      Text(
                        tale.localizedTitle('en'),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 17,
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
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              '${tale.chapterCount} ch \u00b7 ${tale.totalPics} img',
                              style: AppTextStyles.monoSmall.copyWith(color: AppColors.textTer),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          StoryCreditPill(credits: tale.credits),
                          const Spacer(),
                          StoryGoButton(onTap: widget.data.onTap, size: 32),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // Right: polaroid stack — sorted so active card renders on top
              SizedBox(
                width: 155,
                child: Stack(
                  alignment: Alignment.center,
                  children: _sortedCards(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _sortedCards() {
    final indices = List.generate(_images.length, (i) => i);
    indices.sort((a, b) {
      if (currentImageIndex == a) return 1; // active card last (on top)
      if (currentImageIndex == b) return -1;
      return a.compareTo(b);
    });
    return indices.map((i) => _buildCard(i)).toList();
  }

  Widget _buildCard(int i) {
    final isActive = currentImageIndex == i;
    final tilt = _tilts[i % _tilts.length] * math.pi / 180;

    return AnimatedContainer(
      duration: AppDurations.slower,
      curve: kBouncyCurve,
      transform: Matrix4.identity()
        ..rotateZ(tilt)
        // ignore: deprecated_member_use
        ..scale(isActive ? 1.0 : 0.88)
        // ignore: deprecated_member_use
        ..translate(0.0, isActive ? 0.0 : 8.0),
      transformAlignment: Alignment.center,
      child: AnimatedOpacity(
        opacity: isActive ? 1.0 : 0.5,
        duration: AppDurations.slower,
        curve: kBouncyCurve,
        child: Container(
          width: 115,
          height: 158,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(4),
            boxShadow: [
              if (isActive)
                ...AppShadows.cardHero
              else
                ...AppShadows.md,
            ],
          ),
          padding: const EdgeInsets.fromLTRB(6, 6, 6, 24),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(2),
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
