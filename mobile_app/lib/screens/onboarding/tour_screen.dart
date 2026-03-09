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
/// Slide 0: Flip3D — card physically flips 180° on Y-axis to reveal next image
/// Slide 1: Carousel3D — smooth CoverFlow rotation of 3 cards
/// Slide 2: Stack3D — top card flies off, stack reshuffles
/// Bottom: Skip button (glass), pagination dots with glow, Next/Get Started CTA.
class TourScreen extends StatefulWidget {
  const TourScreen({super.key});

  @override
  State<TourScreen> createState() => _TourScreenState();
}

class _TourScreenState extends State<TourScreen> with TickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  // Animation controllers for each slide type
  late final AnimationController _flipController;
  late final AnimationController _carouselController;
  late final AnimationController _stackController;

  // Image indices per slide
  int _flipImageIndex = 0;
  int _carouselBaseIndex = 0;
  int _stackBaseIndex = 0;

  // Single pause timer for current slide
  Timer? _pauseTimer;

  @override
  void initState() {
    super.initState();
    _flipController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _carouselController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _stackController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    // Start animation for the initial slide
    _startAnimationForSlide(0);
  }

  @override
  void dispose() {
    _pauseTimer?.cancel();
    _flipController.dispose();
    _carouselController.dispose();
    _stackController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  void _stopAllAnimations() {
    _pauseTimer?.cancel();
    _pauseTimer = null;
    _flipController.reset();
    _carouselController.reset();
    _stackController.reset();
  }

  void _startAnimationForSlide(int slideIndex) {
    _stopAllAnimations();
    switch (kTourSlides[slideIndex].animationType) {
      case 'flip3d':
        _startFlipLoop();
      case 'carousel3d':
        _startCarouselLoop();
      case 'stack3d':
        _startStackLoop();
    }
  }

  // ── Flip3D loop ──────────────────────────────────────────────────────────

  void _startFlipLoop() {
    _flipController.reset();
    _flipController.forward().then((_) {
      if (!mounted) return;
      _pauseTimer = Timer(const Duration(milliseconds: 1400), () {
        if (!mounted) return;
        setState(() {
          final count = kTourSlides[0].imageUrls.isEmpty
              ? 4
              : kTourSlides[0].imageUrls.length;
          _flipImageIndex = (_flipImageIndex + 1) % count;
        });
        _startFlipLoop();
      });
    });
  }

  // ── Carousel3D loop ──────────────────────────────────────────────────────

  void _startCarouselLoop() {
    _carouselController.reset();
    _carouselController.forward().then((_) {
      if (!mounted) return;
      setState(() {
        _carouselBaseIndex++;
      });
      _pauseTimer = Timer(const Duration(milliseconds: 1300), () {
        if (!mounted) return;
        _startCarouselLoop();
      });
    });
  }

  // ── Stack3D loop ─────────────────────────────────────────────────────────

  void _startStackLoop() {
    _stackController.reset();
    _stackController.forward().then((_) {
      if (!mounted) return;
      setState(() {
        _stackBaseIndex++;
      });
      _pauseTimer = Timer(const Duration(milliseconds: 1200), () {
        if (!mounted) return;
        _startStackLoop();
      });
    });
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
                onPageChanged: (index) {
                  setState(() => _currentPage = index);
                  _startAnimationForSlide(index);
                },
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
    switch (slide.animationType) {
      case 'flip3d':
        return _buildFlip3D(slide);
      case 'carousel3d':
        return _buildCarousel3D(slide);
      case 'stack3d':
        return _buildStack3D(slide);
      default:
        return _buildFlip3D(slide);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Slide 0 — Flip3D: Playing card flip 180° on Y-axis
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildFlip3D(TourSlideData slide) {
    final imageCount = slide.imageUrls.isEmpty ? 4 : slide.imageUrls.length;
    final currentIdx = _flipImageIndex % imageCount;
    final nextIdx = (_flipImageIndex + 1) % imageCount;

    return Center(
      child: AnimatedBuilder(
        animation: _flipController,
        builder: (context, _) {
          final t = Curves.easeInOut.transform(_flipController.value);
          final isFirstHalf = t <= 0.5;

          // Rotation: 0→90° then -90°→0°
          final angle = isFirstHalf
              ? t * math.pi // 0 → π/2
              : (1.0 - t) * math.pi; // π/2 → 0

          // Scale pulse: 1.0 → 0.95 at midpoint → 1.0
          final scale = 1.0 - 0.05 * math.sin(t * math.pi);

          // Shadow intensity: 30 → 40 → 30
          final blur = 30.0 + 10.0 * math.sin(t * math.pi);

          // Show front image in first half, back image in second half
          final displayIdx = isFirstHalf ? currentIdx : nextIdx;

          return Transform(
            alignment: Alignment.center,
            transform: Matrix4.identity()
              ..setEntry(3, 2, 0.0015)
              ..rotateY(angle)
              ..scale(scale),
            child: Container(
              width: 220,
              height: 310,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                border: Border.all(
                  color: slide.accentColor.withValues(alpha: 0.4),
                  width: 1.5,
                ),
                boxShadow: AppShadows.colorGlow(
                  slide.accentColor,
                  opacity: 0.15,
                  blur: blur,
                  spread: 5,
                ),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                child: PlaceholderImage(
                  index: displayIdx,
                  imageUrl: slide.imageUrls.isNotEmpty
                      ? slide.imageUrls[displayIdx]
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
          );
        },
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Slide 1 — Carousel3D: Smooth CoverFlow rotation
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildCarousel3D(TourSlideData slide) {
    final n = slide.imageUrls.isEmpty ? 5 : slide.imageUrls.length;

    return Center(
      child: SizedBox(
        width: 300,
        height: 280,
        child: AnimatedBuilder(
          animation: _carouselController,
          builder: (context, _) {
            final animValue = AppCurves.smooth
                .transform(_carouselController.value);
            final fractionalIndex = _carouselBaseIndex + animValue;

            // Build card data for all images, then pick the 3 closest
            final cards = <_CarouselCard>[];
            for (int i = 0; i < n; i++) {
              // Distance from center (fractional, wrapping)
              double d = (i - fractionalIndex) % n;
              if (d < 0) d += n;
              // Normalize: center=0, right=positive small, left=positive large
              // Convert to signed: -N/2..N/2
              double signed = d;
              if (signed > n / 2) signed -= n;

              // Only render cards within range
              if (signed.abs() > 1.5) continue;

              final tx = signed * 100.0; // X offset
              final rotY = signed * 0.3; // Y rotation (radians, ~17°)
              final s = 1.0 - signed.abs() * 0.2; // scale
              final op = 1.0 - signed.abs() * 0.35; // opacity

              cards.add(_CarouselCard(
                imageIndex: i,
                tx: tx,
                rotY: rotY,
                scale: s.clamp(0.6, 1.0),
                opacity: op.clamp(0.0, 1.0),
                zIndex: (100 - signed.abs() * 10).toInt(),
                isCenter: signed.abs() < 0.5,
              ));
            }

            // Sort by z-index so center card renders on top
            cards.sort((a, b) => a.zIndex.compareTo(b.zIndex));

            return Stack(
              alignment: Alignment.center,
              children: cards.map((card) {
                return Transform(
                  alignment: Alignment.center,
                  transform: Matrix4.identity()
                    ..setEntry(3, 2, 0.001)
                    ..translate(card.tx, 0.0, 0.0)
                    ..rotateY(card.rotY)
                    ..scale(card.scale),
                  child: Opacity(
                    opacity: card.opacity,
                    child: Container(
                      width: 180,
                      height: 260,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                        border: card.isCenter
                            ? Border.all(
                                color: slide.accentColor.withValues(alpha: 0.4),
                                width: 2,
                              )
                            : null,
                        boxShadow: card.isCenter
                            ? AppShadows.colorGlow(
                                slide.accentColor,
                                opacity: 0.2,
                                blur: 20,
                                spread: 0,
                              )
                            : null,
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                        child: PlaceholderImage(
                          index: card.imageIndex % n,
                          imageUrl: slide.imageUrls.isNotEmpty
                              ? slide.imageUrls[card.imageIndex % n]
                              : null,
                          child: card.isCenter && slide.imageUrls.isEmpty
                              ? Center(
                                  child: Icon(
                                    LucideIcons.wand,
                                    size: AppSizes.icon6xl,
                                    color: slide.accentColor
                                        .withValues(alpha: 0.3),
                                  ),
                                )
                              : null,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            );
          },
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Slide 2 — Stack3D: Top card flies off, stack reshuffles
  // ═══════════════════════════════════════════════════════════════════════════

  Widget _buildStack3D(TourSlideData slide) {
    final imageCount = slide.imageUrls.isEmpty ? 7 : slide.imageUrls.length;
    final dayLabels = ['Day 1', 'Day 3', 'Day 7'];

    return Center(
      child: SizedBox(
        width: 260,
        height: 320,
        child: AnimatedBuilder(
          animation: _stackController,
          builder: (context, _) {
            final t = Curves.easeInOutCubic.transform(_stackController.value);

            // 3 visible cards: bottom (slot 2), middle (slot 1), top (slot 0)
            // During animation, top flies off and others shift up
            final cards = <Widget>[];

            for (int slot = 2; slot >= 0; slot--) {
              // slot 2 = bottom, slot 1 = middle, slot 0 = top
              final imgIdx = (_stackBaseIndex + (2 - slot)) % imageCount;
              final dayIdx = (2 - slot) % dayLabels.length;

              double tx = 0, ty = 0, rot = 0, scale = 1.0, opacity = 1.0;
              double cardW = 220, cardH = 310;

              if (slot == 0) {
                // Top card: flies away during animation
                tx = t * 200;
                ty = t * -30;
                rot = t * 0.21; // ~12°
                scale = 1.0 - t * 0.3;
                opacity = 1.0 - t;
                cardW = 220;
                cardH = 310;
              } else if (slot == 1) {
                // Middle → becomes top
                scale = 0.92 + t * 0.08; // 0.92 → 1.0
                ty = -8.0 + t * 8.0; // -8 → 0
                opacity = 0.7 + t * 0.3; // 0.7 → 1.0
                cardW = 220 - 12 * (1.0 - t); // 208 → 220
                cardH = 310 - 12 * (1.0 - t); // 298 → 310
              } else {
                // Bottom → becomes middle (+ new card appears below)
                scale = 0.84 + t * 0.08; // 0.84 → 0.92
                ty = -16.0 + t * 8.0; // -16 → -8
                opacity = 0.5 + t * 0.2; // 0.5 → 0.7
                cardW = 220 - 24 * (1.0 - t) + 12 * t; // shrunk → less shrunk
                cardH = 310 - 24 * (1.0 - t) + 12 * t;
              }

              // Clamp dimensions
              cardW = cardW.clamp(180.0, 220.0);
              cardH = cardH.clamp(270.0, 310.0);

              final isActive = (slot == 0 && t < 0.5) || (slot == 1 && t >= 0.5);

              cards.add(
                Transform(
                  alignment: Alignment.center,
                  transform: Matrix4.identity()
                    ..translate(tx, ty)
                    ..rotateZ(rot)
                    ..scale(scale),
                  child: Opacity(
                    opacity: opacity.clamp(0.0, 1.0),
                    child: Container(
                      width: cardW,
                      height: cardH,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                        border: isActive
                            ? Border.all(
                                color: slide.accentColor.withValues(alpha: 0.4),
                                width: 2,
                              )
                            : Border.all(color: AppColors.borderMed),
                        boxShadow: isActive
                            ? AppShadows.colorGlow(
                                slide.accentColor,
                                opacity: 0.2,
                                blur: 25,
                                spread: 0,
                              )
                            : null,
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                        child: Stack(
                          fit: StackFit.expand,
                          children: [
                            PlaceholderImage(
                              index: imgIdx % imageCount,
                              imageUrl: slide.imageUrls.isNotEmpty
                                  ? slide.imageUrls[imgIdx % imageCount]
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
                                  borderRadius:
                                      BorderRadius.circular(AppSizes.radiusFull),
                                ),
                                child: Text(
                                  dayLabels[dayIdx],
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
            }

            return Stack(
              alignment: Alignment.center,
              children: cards,
            );
          },
        ),
      ),
    );
  }
}

/// Helper data class for carousel card positioning.
class _CarouselCard {
  final int imageIndex;
  final double tx;
  final double rotY;
  final double scale;
  final double opacity;
  final int zIndex;
  final bool isCenter;

  const _CarouselCard({
    required this.imageIndex,
    required this.tx,
    required this.rotY,
    required this.scale,
    required this.opacity,
    required this.zIndex,
    required this.isCenter,
  });
}
