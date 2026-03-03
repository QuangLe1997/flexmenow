import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_images.dart';
import '../../core/app_shadows.dart';
import '../../core/design_tokens.dart';
import '../../widgets/image_slideshow.dart';
import '../../widgets/dot_indicator.dart';

/// WOW Intro screen — hero slideshow, subscription badges, how-it-works,
/// what-you-get, sample delivery preview, and animated CTA.
/// Mirrors: docs/mockup_app/app.jsx WowIntro component.
class WowIntroScreen extends StatefulWidget {
  const WowIntroScreen({super.key});

  @override
  State<WowIntroScreen> createState() => _WowIntroScreenState();
}

class _WowIntroScreenState extends State<WowIntroScreen>
    with SingleTickerProviderStateMixin {
  int _heroIndex = 0;
  late final AnimationController _gradientController;

  static const _demoImageCount = 3;

  // Mock delivery data matching the JSX wowDeliveryMock
  static const _sampleCaption =
      'Lost in the streets of Santorini, where every corner is a postcard.';
  static const _sampleHashtags =
      '#Santorini #TravelVibes #WanderlustLife #FlexMe';

  @override
  void initState() {
    super.initState();
    _gradientController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _gradientController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Column(
        children: [
          // Hero image area (280px)
          _buildHero(),

          // Scrollable content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 20),
                  _buildBadges(),
                  const SizedBox(height: 16),
                  _buildDescription(),
                  const SizedBox(height: 24),
                  _buildHowItWorks(),
                  const SizedBox(height: 24),
                  _buildWhatYouGet(),
                  const SizedBox(height: 24),
                  _buildSampleDelivery(),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),

          // Bottom CTA
          _buildBottomCTA(),
        ],
      ),
    );
  }

  // ── Hero image area with slideshow, gradient, back button, VIP badge ──
  Widget _buildHero() {
    return SizedBox(
      height: 280,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Slideshow images
          ImageSlideshow(
            itemCount: _demoImageCount,
            height: 280,
            borderRadius: 0,
            interval: const Duration(milliseconds: 2800),
            onIndexChanged: (i) => setState(() => _heroIndex = i),
            itemBuilder: (_, i) => PlaceholderImage(
              index: i,
              borderRadius: 0,
              imageUrl: i < AppImages.onboardingSplash.length
                  ? AppImages.onboardingSplash[i]
                  : null,
            ),
          ),

          // Gradient overlay
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  stops: const [0.0, 0.3, 0.7, 1.0],
                  colors: [
                    AppColors.bg.withValues(alpha: 0.3),
                    AppColors.bg.withValues(alpha: 0.1),
                    AppColors.bg.withValues(alpha: 0.85),
                    AppColors.bg,
                  ],
                ),
              ),
            ),
          ),

          // Top gold line
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 2,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    AppColors.brand,
                    Colors.transparent,
                  ],
                ),
              ),
              // ignore: deprecated_member_use
              // Using opacity on container
            ),
          ),

          // Back button
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 18,
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => context.pop(),
                customBorder: const CircleBorder(),
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.black.withValues(alpha: 0.5),
                    border: Border.all(color: AppColors.borderMed),
                  ),
                  child: const Center(
                    child: Icon(LucideIcons.arrowLeft, size: AppSizes.iconBase,
                        color: Colors.white),
                  ),
                ),
              ),
            ),
          ),

          // VIP badge
          Positioned(
            top: MediaQuery.of(context).padding.top + 12,
            right: 18,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                color: Colors.black.withValues(alpha: 0.5),
                border: Border.all(
                    color: AppColors.brand.withValues(alpha: 0.25)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.crown, size: AppSizes.iconXs, color: AppColors.brand),
                  const SizedBox(width: 6),
                  Text(
                    'VIP',
                    style: TextStyle(
                      fontSize: AppSizes.fontXxs,
                      fontWeight: FontWeight.w900,
                      color: AppColors.brand,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom content over gradient: badge + title
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // FLEXTALE · PREMIUM badge
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      color: AppColors.brand.withValues(alpha: 0.12),
                      border: Border.all(
                          color: AppColors.brand.withValues(alpha: 0.18)),
                    ),
                    child: Text(
                      'FLEXTALE \u00b7 PREMIUM',
                      style: TextStyle(
                        fontSize: AppSizes.font2xs,
                        fontWeight: FontWeight.w900,
                        color: AppColors.brand,
                        letterSpacing: 3,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  // MAKE ME WOW EVERYDAY
                  Text(
                    'MAKE ME WOW\nEVERYDAY',
                    style: TextStyle(
                      fontSize: AppSizes.font2xlPlus,
                      fontWeight: FontWeight.w900,
                      fontStyle: FontStyle.italic,
                      color: Colors.white,
                      letterSpacing: -1,
                      height: 1.1,
                      shadows: [
                        Shadow(
                          offset: const Offset(0, 2),
                          blurRadius: 20,
                          color: Colors.black.withValues(alpha: 0.5),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Slide dots (bottom right)
          Positioned(
            bottom: 24,
            right: 20,
            child: DotIndicator(
              count: _demoImageCount,
              activeIndex: _heroIndex,
              dotSize: 5,
              activeDotWidth: 16,
              activeColor: AppColors.brand,
              inactiveColor: Colors.white.withValues(alpha: 0.3),
              spacing: 2,
            ),
          ),
        ],
      ),
    );
  }

  // ── Subscription + NO CREDITS badges ──
  Widget _buildBadges() {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: AppColors.purple.withValues(alpha: 0.07),
            border:
                Border.all(color: AppColors.purple.withValues(alpha: 0.18)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(LucideIcons.crown, size: AppSizes.iconXs, color: AppColors.purple),
              const SizedBox(width: 6),
              Text(
                'SUBSCRIPTION',
                style: TextStyle(
                  fontSize: AppSizes.fontXxsPlus,
                  fontWeight: FontWeight.w900,
                  color: AppColors.purple,
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: AppColors.green.withValues(alpha: 0.07),
            border:
                Border.all(color: AppColors.green.withValues(alpha: 0.18)),
          ),
          child: Text(
            'NO CREDITS',
            style: TextStyle(
              fontSize: AppSizes.fontXxsPlus,
              fontWeight: FontWeight.w800,
              color: AppColors.green,
              letterSpacing: 1,
            ),
          ),
        ),
      ],
    );
  }

  // ── What is this? description ──
  Widget _buildDescription() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'WHAT IS THIS?',
          style: TextStyle(
            fontSize: AppSizes.fontXsPlus,
            fontWeight: FontWeight.w900,
            color: AppColors.brand,
            letterSpacing: 3,
          ),
        ),
        const SizedBox(height: 10),
        RichText(
          text: TextSpan(
            style: TextStyle(
              fontSize: AppSizes.fontSm,
              color: AppColors.textSec,
              height: 1.8,
            ),
            children: [
              TextSpan(
                text: 'Make Me WOW',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: AppColors.text,
                ),
              ),
              const TextSpan(text: ' is a '),
              TextSpan(
                text: 'VIP subscription',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: AppColors.brand,
                ),
              ),
              const TextSpan(
                text:
                    ' \u2014 your personal AI content factory. Upload your face once, pick a topic you love, and every single day we deliver ',
              ),
              TextSpan(
                text: '4 ready-to-post photos',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: AppColors.brand,
                ),
              ),
              const TextSpan(
                text:
                    ' straight to your inbox \u2014 with captions, hashtags, and platform-optimized sizes. No credits needed. One subscription, unlimited daily magic.',
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── How it works — 4 steps with connectors ──
  Widget _buildHowItWorks() {
    final steps = [
      _HowItWorksStep(
        icon: LucideIcons.camera,
        title: 'Upload your face',
        desc: 'One selfie \u2014 AI remembers you. Solo or couple mode.',
      ),
      _HowItWorksStep(
        icon: LucideIcons.palette,
        title: 'Pick a topic',
        desc: 'Travel, Fashion, Fitness, Romance... 8 vibes to choose from.',
      ),
      _HowItWorksStep(
        icon: LucideIcons.moon,
        title: 'Set your schedule',
        desc: 'Pick delivery time \u2014 morning, noon, evening, or night.',
      ),
      _HowItWorksStep(
        icon: LucideIcons.sparkles,
        title: 'Get WOW daily',
        desc:
            '4 AI photos delivered every day. Share to IG, TikTok, FB in 1 tap.',
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'HOW IT WORKS',
          style: TextStyle(
            fontSize: AppSizes.fontXsPlus,
            fontWeight: FontWeight.w900,
            color: AppColors.brand,
            letterSpacing: 3,
          ),
        ),
        const SizedBox(height: 14),
        ...List.generate(steps.length, (i) {
          final step = steps[i];
          final isLast = i == steps.length - 1;
          return Padding(
            padding: EdgeInsets.only(bottom: isLast ? 0 : 16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Icon circle + connector
                SizedBox(
                  width: 38,
                  child: Column(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          color: AppColors.brand.withValues(alpha: 0.07),
                          border: Border.all(
                              color:
                                  AppColors.brand.withValues(alpha: 0.15)),
                        ),
                        child: Center(
                          child: Icon(step.icon, size: AppSizes.iconMd,
                              color: AppColors.brand),
                        ),
                      ),
                      if (!isLast)
                        Container(
                          width: 2,
                          height: 20,
                          margin: const EdgeInsets.only(top: 4),
                          color: AppColors.brand.withValues(alpha: 0.09),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),
                // Text
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          step.title,
                          style: TextStyle(
                            fontSize: AppSizes.fontSmPlus,
                            fontWeight: FontWeight.w800,
                            color: AppColors.text,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          step.desc,
                          style: TextStyle(
                            fontSize: AppSizes.fontXsPlus,
                            color: AppColors.textTer,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  // ── What you get — 6 benefits ──
  Widget _buildWhatYouGet() {
    final benefits = [
      _Benefit('\ud83d\udcf8', '4 AI-generated photos every day'),
      _Benefit('\u270d\ufe0f', 'Ready-made captions + trending hashtags'),
      _Benefit('\ud83d\udcd0', 'Optimized ratios for IG, TikTok, Facebook'),
      _Benefit('\ud83d\udd04', 'Redo any photo unlimited times'),
      _Benefit('\ud83c\udfaf', 'AI picks best styles for your topic'),
      _Benefit('\u23f0', 'Delivered on your schedule, every day'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'WHAT YOU GET',
          style: TextStyle(
            fontSize: AppSizes.fontXsPlus,
            fontWeight: FontWeight.w900,
            color: AppColors.brand,
            letterSpacing: 3,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: List.generate(benefits.length, (i) {
              final b = benefits[i];
              return Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: i < benefits.length - 1
                    ? BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: AppColors.border),
                        ),
                      )
                    : null,
                child: Row(
                  children: [
                    Text(b.emoji, style: const TextStyle(fontSize: AppSizes.fontBase)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        b.text,
                        style: TextStyle(
                          fontSize: AppSizes.fontXs,
                          color: AppColors.textSec,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ),
      ],
    );
  }

  // ── Sample delivery preview card ──
  Widget _buildSampleDelivery() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'SAMPLE DELIVERY',
          style: TextStyle(
            fontSize: AppSizes.fontXsPlus,
            fontWeight: FontWeight.w900,
            color: AppColors.brand,
            letterSpacing: 3,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Topic badge + day info
              Row(
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      color: AppColors.blue.withValues(alpha: 0.09),
                      border: Border.all(
                          color: AppColors.blue.withValues(alpha: 0.15)),
                    ),
                    child: Text(
                      '\u2708\ufe0f Travel',
                      style: TextStyle(
                        fontSize: AppSizes.fontXxs,
                        fontWeight: FontWeight.w800,
                        color: AppColors.blue,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Day 5 of 7 \u2014 Santorini',
                    style: TextStyle(
                      fontSize: AppSizes.fontXxsPlus,
                      color: AppColors.textTer,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // 4 photo thumbnails
              Row(
                children: List.generate(4, (i) {
                  return Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(right: i < 3 ? 6 : 0),
                      child: AspectRatio(
                        aspectRatio: 1,
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: PlaceholderImage(
                              index: i,
                              borderRadius: 0,
                              icon: LucideIcons.image,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 10),

              // Caption
              Text(
                '"$_sampleCaption"',
                style: TextStyle(
                  fontSize: AppSizes.fontXsPlus,
                  color: AppColors.textSec,
                  fontStyle: FontStyle.italic,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 4),
              // Hashtags
              Text(
                _sampleHashtags,
                style: TextStyle(
                  fontSize: AppSizes.fontXxs,
                  fontWeight: FontWeight.w600,
                  color: AppColors.purple,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── Bottom CTA with animated gradient ──
  Widget _buildBottomCTA() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 40),
      decoration: BoxDecoration(
        color: AppColors.bg,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Column(
        children: [
          // Animated gradient button
          AnimatedBuilder(
            animation: _gradientController,
            builder: (context, child) {
              return Container(
                width: double.infinity,
                height: 56,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  gradient: LinearGradient(
                    begin: Alignment.lerp(
                      Alignment.topLeft,
                      Alignment.bottomRight,
                      _gradientController.value,
                    )!,
                    end: Alignment.lerp(
                      Alignment.bottomRight,
                      Alignment.topLeft,
                      _gradientController.value,
                    )!,
                    colors: const [
                      AppColors.purple,
                      AppColors.brand,
                      Color(0xFFEC4899), // pink
                    ],
                  ),
                  boxShadow: [...AppShadows.colorGlow(AppColors.purple, opacity: 0.3, blur: 28)],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(20),
                    onTap: () => context.push('/story/wow/setup'),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.crown, size: AppSizes.iconBase,
                            color: Colors.white),
                        const SizedBox(width: 8),
                        Text(
                          'Start My WOW',
                          style: TextStyle(
                            fontSize: AppSizes.fontSm,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 1,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 10),
          Text(
            '3-day free trial \u00b7 Cancel anytime \u00b7 No hidden fees',
            style: TextStyle(
              fontSize: AppSizes.fontXxsPlus,
              color: AppColors.textTer,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _HowItWorksStep {
  final IconData icon;
  final String title;
  final String desc;
  const _HowItWorksStep(
      {required this.icon, required this.title, required this.desc});
}

class _Benefit {
  final String emoji;
  final String text;
  const _Benefit(this.emoji, this.text);
}
