import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_animations.dart';
import '../../core/app_shadows.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../../data/mock_data.dart';
import '../../widgets/dot_indicator.dart';
import '../../widgets/image_slideshow.dart';

/// Tour screen with 3 slides. Each slide has a unique 3D card animation:
/// Slide 0: Flip3D (cards flip rotateY)
/// Slide 1: Carousel3D (rotating cylinder)
/// Slide 2: Stack3D (stacked card flip)
/// Bottom: Skip button (glass), pagination dots with glow, Next/Get Started CTA.
class TourScreen extends StatefulWidget {
  const TourScreen({super.key});

  @override
  State<TourScreen> createState() => _TourScreenState();
}

class _TourScreenState extends State<TourScreen> with TickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  // Per-slide image cycling
  final List<int> _slideImageIndex = [0, 0, 0];
  final List<Timer?> _slideTimers = [null, null, null];

  @override
  void initState() {
    super.initState();
    // Start image cycling for each slide
    for (int i = 0; i < 3; i++) {
      final count = [4, 5, 7][i]; // image counts per slide
      final interval = [2200, 2000, 2000][i];
      _slideTimers[i] = Timer.periodic(Duration(milliseconds: interval), (_) {
        if (mounted) {
          setState(() {
            _slideImageIndex[i] = (_slideImageIndex[i] + 1) % count;
          });
        }
      });
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    for (final t in _slideTimers) {
      t?.cancel();
    }
    super.dispose();
  }

  void _onNext() {
    if (_currentPage < kTourSlides.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 350),
        curve: AppCurves.standard,
      );
    } else {
      context.go('/personalize');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLastPage = _currentPage == kTourSlides.length - 1;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            // Skip button (glass style)
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.all(AppSizes.lg),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => context.go('/personalize'),
                    borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSizes.lg,
                        vertical: AppSizes.md,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.06),
                        borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.1),
                        ),
                      ),
                      child: Text(
                        'Skip',
                        style: TextStyle(
                          fontSize: AppSizes.fontSm,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textSec,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),

            // PageView
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) =>
                    setState(() => _currentPage = index),
                itemCount: kTourSlides.length,
                itemBuilder: (context, index) {
                  final slide = kTourSlides[index];
                  return _buildSlide(slide, index);
                },
              ),
            ),

            // Pagination dots with glow
            Padding(
              padding: const EdgeInsets.symmetric(vertical: AppSizes.lg),
              child: DotIndicator(
                count: kTourSlides.length,
                activeIndex: _currentPage,
                activeColor: kTourSlides[_currentPage].accentColor,
                showGlow: true,
              ),
            ),

            // CTA button
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: AppGradients.btn,
                    borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                  ),
                  child: ElevatedButton(
                    onPressed: _onNext,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                      ),
                    ),
                    child: Text(
                      isLastPage ? 'Get Started' : 'Next',
                      style: TextStyle(
                        fontSize: AppSizes.fontLg,
                        fontWeight: FontWeight.w700,
                        color: AppColors.bg,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSlide(TourSlideData slide, int slideIndex) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // 3D card animation area — flexible to avoid overflow on small screens
          Flexible(
            flex: 3,
            child: _build3DCards(slide, slideIndex),
          ),
          const SizedBox(height: 24),

          // Badge chip (icon + label)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: slide.accentColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(AppSizes.radiusFull),
              border: Border.all(
                color: slide.accentColor.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: slide.accentColor.withValues(alpha: 0.2),
                  ),
                  child: Icon(
                    slideIndex == 0
                        ? LucideIcons.sparkles
                        : slideIndex == 1
                            ? LucideIcons.wand
                            : LucideIcons.bookOpen,
                    size: AppSizes.iconMd,
                    color: slide.accentColor,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  slide.badge,
                  style: TextStyle(
                    fontSize: AppSizes.fontSmPlus,
                    fontWeight: FontWeight.w700,
                    color: slide.accentColor,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Title (28px italic, -1 letterSpacing)
          Text(
            slide.title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: AppSizes.font2xlMax,
              fontWeight: FontWeight.w800,
              fontStyle: FontStyle.italic,
              color: AppColors.text,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 8),

          // Slogan (12px bold italic, colored)
          Text(
            slide.slogan,
            textAlign: TextAlign.center,
            style: AppTextStyles.monoSmall.copyWith(
              fontWeight: FontWeight.w700,
              color: slide.accentColor,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 12),

          // Subtitle
          SizedBox(
            width: 280,
            child: Text(
              slide.subtitle,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: AppSizes.fontSmPlus,
                color: AppColors.textSec,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _build3DCards(TourSlideData slide, int slideIndex) {
    final imgIndex = _slideImageIndex[slideIndex];

    switch (slide.animationType) {
      case 'flip3d':
        return _buildFlip3D(slide, imgIndex);
      case 'carousel3d':
        return _buildCarousel3D(slide, imgIndex);
      case 'stack3d':
        return _buildStack3D(slide, imgIndex);
      default:
        return _buildFlip3D(slide, imgIndex);
    }
  }

  /// Flip3D: Main card that flips between images
  Widget _buildFlip3D(TourSlideData slide, int imgIndex) {
    return Center(
      child: AnimatedSwitcher(
        duration: AppDurations.slower,
        transitionBuilder: (child, animation) {
          final rotate = Tween(begin: math.pi / 2, end: 0.0).animate(
            CurvedAnimation(parent: animation, curve: AppCurves.enter),
          );
          return AnimatedBuilder(
            animation: rotate,
            builder: (_, child) {
              return Transform(
                alignment: Alignment.center,
                transform: Matrix4.identity()
                  ..setEntry(3, 2, 0.001)
                  ..rotateY(rotate.value),
                child: child,
              );
            },
            child: child,
          );
        },
        child: Container(
          key: ValueKey(imgIndex),
          width: 220,
          height: 310,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSizes.radiusXl),
            border: Border.all(
              color: slide.accentColor.withValues(alpha: 0.3),
              width: 1.5,
            ),
            boxShadow: AppShadows.colorGlow(slide.accentColor, opacity: 0.15, blur: 30, spread: 5),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppSizes.radiusXl),
            child: PlaceholderImage(
              index: imgIndex,
              imageUrl: slide.imageUrls.isNotEmpty
                  ? slide.imageUrls[imgIndex % slide.imageUrls.length]
                  : null,
              child: slide.imageUrls.isEmpty
                  ? Center(
                      child: Icon(
                        LucideIcons.sparkles,
                        size: AppSizes.icon7xl,
                        color: slide.accentColor.withValues(alpha: 0.3),
                      ),
                    )
                  : null,
            ),
          ),
        ),
      ),
    );
  }

  /// Carousel3D: Rotating cylinder of cards
  Widget _buildCarousel3D(TourSlideData slide, int imgIndex) {
    return Center(
      child: SizedBox(
        width: 300,
        height: 280,
        child: Stack(
          alignment: Alignment.center,
          children: List.generate(3, (i) {
            final offset = (i - 1); // -1, 0, 1
            final isCenter = offset == 0;
            final xOffset = offset * 90.0;
            final scale = isCenter ? 1.0 : 0.75;
            final opacity = isCenter ? 1.0 : 0.4;

            return AnimatedPositioned(
              duration: AppDurations.slow,
              curve: AppCurves.enter,
              left: 150 + xOffset - 90,
              child: AnimatedOpacity(
                duration: AppDurations.slow,
                opacity: opacity,
                child: Transform(
                  alignment: Alignment.center,
                  transform: Matrix4.identity()
                    ..setEntry(3, 2, 0.001)
                    ..rotateY(offset * 0.3)
                    ..scaleByDouble(scale, scale, scale, 1.0),
                  child: Container(
                    width: 180,
                    height: 260,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                      border: isCenter
                          ? Border.all(
                              color: slide.accentColor.withValues(alpha: 0.4),
                              width: 2,
                            )
                          : null,
                      boxShadow: isCenter
                          ? AppShadows.colorGlow(slide.accentColor, opacity: 0.2, blur: 20, spread: 0)
                          : null,
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                      child: PlaceholderImage(
                        index: (imgIndex + i) % 5,
                        imageUrl: slide.imageUrls.isNotEmpty
                            ? slide.imageUrls[(imgIndex + i) % slide.imageUrls.length]
                            : null,
                        child: isCenter && slide.imageUrls.isEmpty
                            ? Center(
                                child: Icon(
                                  LucideIcons.wand,
                                  size: AppSizes.icon6xl,
                                  color: slide.accentColor.withValues(alpha: 0.3),
                                ),
                              )
                            : null,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }

  /// Stack3D: Stacked card flip with day labels
  Widget _buildStack3D(TourSlideData slide, int imgIndex) {
    return Center(
      child: SizedBox(
        width: 260,
        height: 320,
        child: Stack(
          alignment: Alignment.center,
          children: List.generate(3, (i) {
            final reverseI = 2 - i;
            final zOffset = reverseI * 15.0;
            final yOffset = reverseI * -8.0;
            final isTop = i == 2;
            final dayLabels = ['Day 1', 'Day 3', 'Day 7'];

            return AnimatedPositioned(
              duration: AppDurations.slow,
              top: 10 + yOffset,
              child: Transform(
                alignment: Alignment.center,
                transform: Matrix4.identity()
                  ..setEntry(3, 2, 0.001)
                  ..translateByDouble(0.0, 0.0, zOffset, 1.0),
                child: AnimatedOpacity(
                  duration: AppDurations.slow,
                  opacity: isTop ? 1.0 : 0.5 + (i * 0.15),
                  child: Container(
                    width: 220 - (reverseI * 12),
                    height: 310 - (reverseI * 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                      border: isTop
                          ? Border.all(
                              color: slide.accentColor.withValues(alpha: 0.4),
                              width: 2,
                            )
                          : Border.all(color: AppColors.borderMed),
                      boxShadow: isTop
                          ? AppShadows.colorGlow(slide.accentColor, opacity: 0.2, blur: 25, spread: 0)
                          : null,
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                      child: Stack(
                        children: [
                          PlaceholderImage(
                          index: (imgIndex + i) % 7,
                          imageUrl: slide.imageUrls.isNotEmpty
                              ? slide.imageUrls[(imgIndex + i) % slide.imageUrls.length]
                              : null,
                        ),
                          // Day label
                          Positioned(
                            bottom: 12,
                            left: 12,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.6),
                                borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                              ),
                              child: Text(
                                dayLabels[i],
                                style: AppTextStyles.monoSmall.copyWith(
                                  color: slide.accentColor,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}
