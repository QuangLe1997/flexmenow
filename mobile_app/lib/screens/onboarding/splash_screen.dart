import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_animations.dart';
import '../../core/app_images.dart';
import '../../core/design_tokens.dart';
import '../../providers/app_providers.dart';
import '../../widgets/dot_indicator.dart';
import '../../widgets/image_slideshow.dart';

/// Splash screen with 4-phase entrance animation.
///
/// Phase 0: init → Phase 1 (200ms): logo rotates in from -45°→0°, scales up
/// Phase 2 (800ms): brand text fades in → Phase 3 (1300ms): loading bar fills
/// Background: cycling placeholder images (blurred + dimmed)
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with TickerProviderStateMixin {
  late final AnimationController _logoController;
  late final AnimationController _textController;
  late final AnimationController _glowController;
  late final AnimationController _spotlightController;
  late final AnimationController _spotlightSwingController;
  late final AnimationController _nowController;

  int _bgIndex = 0;
  int _phase = 0; // 0=init, 1=spotlight, 2=logo-in, 3=text-in, 4=now-in
  Future<void>? _preloadFuture;

  @override
  void initState() {
    super.initState();

    // Spotlight beam sweep left→right
    _spotlightController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    // Spotlight image swing (pendulum, pivot top-center)
    _spotlightSwingController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    )..repeat(reverse: true);

    // Logo entrance: rotate + scale
    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    // Text fade-in
    _textController = AnimationController(
      vsync: this,
      duration: AppDurations.slow,
    );

    // "Now!" entrance: spring up from bottom
    _nowController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    // Glow pulse (continuous)
    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    )..repeat(reverse: true);

    _startAnimation();
  }

  Future<void> _startAnimation() async {
    // Start background data preload immediately (parallel with animations)
    _preloadFuture = _preloadData();

    // Phase 1: Spotlight beam sweeps left→right
    await Future.delayed(AppDurations.fast);
    if (!mounted) return;
    setState(() => _phase = 1);
    _spotlightController.forward();

    // Phase 2: Logo entrance follows spotlight
    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;
    setState(() => _phase = 2);
    _logoController.forward();

    // Phase 3: Brand text at 1100ms
    await Future.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    setState(() => _phase = 3);
    _textController.forward();

    // Phase 4: "Now!" drops in after FlexMe stabilizes
    await Future.delayed(const Duration(milliseconds: 700));
    if (!mounted) return;
    setState(() => _phase = 4);
    _nowController.forward();

    // Navigate after animation — preload continues in background (non-blocking)
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;
    _navigate();
  }

  /// Preloads remote config, templates JSON, stories JSON in parallel.
  Future<void> _preloadData() async {
    try {
      // Warm up remote config (already initialized in main, just ensure fresh)
      final rc = ref.read(remoteConfigProvider);

      // Fetch templates + stories JSON in parallel
      final templateRepo = ref.read(templateRepositoryProvider);
      final storyRepo = ref.read(storyRepositoryProvider);

      await Future.wait([
        templateRepo.loadTemplates().then((_) {
          debugPrint('[Splash] Templates preloaded');
        }),
        storyRepo.loadStories(rc.flextaleJsonUrl).then((_) {
          debugPrint('[Splash] Stories preloaded');
        }),
      ]);
    } catch (e) {
      debugPrint('[Splash] Preload error (non-blocking): $e');
    }
  }

  Future<void> _navigate() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        // Run post-auth initialization with timeout to prevent infinite hang
        final appInit = ref.read(appInitProvider);
        await appInit.initPostAuth(user.uid).timeout(
          const Duration(seconds: 5),
        );
        if (!mounted) return;
        context.go('/create');
      } else {
        context.go('/tour');
      }
    } catch (_) {
      if (mounted) context.go('/create');
    }
  }

  @override
  void dispose() {
    _spotlightController.dispose();
    _spotlightSwingController.dispose();
    _logoController.dispose();
    _textController.dispose();
    _nowController.dispose();
    _glowController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Spotlight hero background — swings left↔right, pivot at top-center
          AnimatedBuilder(
            animation: _spotlightSwingController,
            builder: (context, child) {
              // Swing angle: -8° to +8° (pendulum effect)
              final t = CurvedAnimation(
                parent: _spotlightSwingController,
                curve: Curves.easeInOutSine,
              ).value;
              final angle = (t - 0.5) * 2 * (math.pi / 22.5); // ±8°
              return Transform(
                alignment: Alignment.topCenter,
                transform: Matrix4.identity()
                  ..rotateZ(angle),
                child: child,
              );
            },
            child: AnimatedOpacity(
              opacity: _phase >= 1 ? 0.7 : 0.3,
              duration: const Duration(milliseconds: 1500),
              child: Transform.scale(
                scale: 1.3,
                child: Image.asset(
                  AppImages.splashSpotlight,
                  fit: BoxFit.cover,
                  width: double.infinity,
                  height: double.infinity,
                ),
              ),
            ),
          ),

          // Cycling showcase images (subtle overlay, blurred)
          ImageSlideshow(
            itemCount: AppImages.splashLocal.length,
            interval: const Duration(milliseconds: 2500),
            height: double.infinity,
            borderRadius: 0,
            onIndexChanged: (i) => setState(() => _bgIndex = i),
            itemBuilder: (context, index) => Opacity(
              opacity: 0.12,
              child: Image.asset(
                AppImages.splashLocal[index % AppImages.splashLocal.length],
                fit: BoxFit.cover,
                width: double.infinity,
                height: double.infinity,
              ),
            ),
          ),

          // Vignette overlay (matches mockup)
          Container(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: const Alignment(0, -0.3),
                radius: 1.0,
                colors: [
                  Colors.transparent,
                  AppColors.bg.withValues(alpha: 0.5),
                  AppColors.bg.withValues(alpha: 0.92),
                ],
                stops: const [0.0, 0.5, 1.0],
              ),
            ),
          ),

          // Animated spotlight beam (sweeps left→right)
          if (_phase >= 1)
            AnimatedBuilder(
              animation: _spotlightController,
              builder: (context, _) {
                final t = CurvedAnimation(
                  parent: _spotlightController,
                  curve: Curves.easeInOutCubic,
                ).value;
                final screenWidth = MediaQuery.of(context).size.width;
                final beamX = -screenWidth * 0.5 + screenWidth * 1.5 * t;
                return Positioned.fill(
                  child: CustomPaint(
                    painter: _SpotlightBeamPainter(
                      beamX: beamX,
                      opacity: (1.0 - (t - 0.7).clamp(0.0, 1.0) * 2.5)
                          .clamp(0.0, 0.8),
                    ),
                  ),
                );
              },
            ),

          // Top accent line (gold gradient)
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 2,
              decoration: const BoxDecoration(gradient: AppGradients.hero),
            ),
          ),

          // Main content
          SafeArea(
            child: Column(
              children: [
                const Spacer(flex: 3),

                // Logo: Gold rounded-rect with Zap icon, rotated 12°
                AnimatedBuilder(
                  animation: _logoController,
                  builder: (context, child) {
                    final t = CurvedAnimation(
                      parent: _logoController,
                      curve: AppCurves.spring,
                    ).value;
                    return Transform.rotate(
                      angle: math.pi / 15 * t, // 12° rotation
                      child: Transform.scale(
                        scale: 0.3 + (0.7 * t),
                        child: Opacity(
                          opacity: t.clamp(0.0, 1.0),
                          child: child,
                        ),
                      ),
                    );
                  },
                  child: AnimatedBuilder(
                    animation: _glowController,
                    builder: (context, child) {
                      final glowValue = _glowController.value;
                      return Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(AppSizes.radiusLg),
                          gradient: AppGradients.hero,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.brand.withValues(alpha: 0.3 + 0.2 * glowValue),
                              blurRadius: 30 + 20 * glowValue,
                              spreadRadius: 5 + 5 * glowValue,
                            ),
                          ],
                        ),
                        child: const Icon(
                          LucideIcons.zap,
                          size: AppSizes.icon5xl,
                          color: AppColors.bg,
                        ),
                      );
                    },
                  ),
                ),

                const SizedBox(height: 24),

                // Brand: "FlexMe" with "Now!" superscript at top-right of "Me"
                FadeTransition(
                  opacity: _textController,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0, 0.3),
                      end: Offset.zero,
                    ).animate(CurvedAnimation(
                      parent: _textController,
                      curve: AppCurves.enter,
                    )),
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        // "FlexMe" base text
                        RichText(
                          text: TextSpan(
                            style: TextStyle(
                              fontSize: 52,
                              fontWeight: FontWeight.w900,
                              fontStyle: FontStyle.italic,
                              letterSpacing: -2,
                            ),
                            children: [
                              const TextSpan(
                                text: 'Flex',
                                style: TextStyle(color: AppColors.text),
                              ),
                              TextSpan(
                                text: 'Me',
                                style: TextStyle(
                                  color: AppColors.brand,
                                  shadows: [
                                    Shadow(
                                      color: AppColors.brand
                                          .withValues(alpha: 0.5),
                                      blurRadius: 20,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),

                        // "Now!" — small superscript, top-right of "Me"
                        Positioned(
                          right: -30,
                          top: -6,
                          child: AnimatedBuilder(
                            animation: _nowController,
                            builder: (context, child) {
                              final t = CurvedAnimation(
                                parent: _nowController,
                                curve: Curves.easeOutBack,
                              ).value;
                              final shakeT = _nowController.value;
                              final shake = shakeT < 0.5
                                  ? math.sin(shakeT * 16) * 2 * (1.0 - shakeT)
                                  : 0.0;
                              return Transform.translate(
                                offset: Offset(shake, -20 * (1.0 - t)),
                                child: Transform.rotate(
                                  angle: math.pi / 30, // slight tilt ~6°
                                  child: Opacity(
                                    opacity: t.clamp(0.0, 1.0),
                                    child: child,
                                  ),
                                ),
                              );
                            },
                            child: ShaderMask(
                              shaderCallback: (bounds) => const LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [
                                  Color(0xFF00E5FF),
                                  Color(0xFF00B0FF),
                                  Color(0xFF7C4DFF),
                                ],
                              ).createShader(bounds),
                              child: Text(
                                'Now!',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                  fontStyle: FontStyle.italic,
                                  letterSpacing: 0.5,
                                  color: Colors.white,
                                  shadows: [
                                    Shadow(
                                      color: const Color(0xFF00E5FF)
                                          .withValues(alpha: 0.8),
                                      blurRadius: 12,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 12),

                // Tagline
                FadeTransition(
                  opacity: _textController,
                  child: Text(
                    'Your glow-up starts here',
                    style: TextStyle(
                      fontSize: AppSizes.fontSm,
                      color: AppColors.textSec,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Image counter dots
                DotIndicator(
                  count: AppImages.splashLocal.length,
                  activeIndex: _bgIndex,
                  activeColor: AppColors.brand,
                  inactiveColor: AppColors.zinc800,
                  dotSize: 4,
                  activeDotWidth: 12,
                  spacing: 2,
                ),

                const Spacer(flex: 2),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Custom painter for animated spotlight beam sweeping left→right.
class _SpotlightBeamPainter extends CustomPainter {
  final double beamX;
  final double opacity;

  _SpotlightBeamPainter({required this.beamX, required this.opacity});

  @override
  void paint(Canvas canvas, Size size) {
    if (opacity <= 0) return;

    final beamWidth = size.width * 0.35;

    // Main cone beam — from top-center down, swept by beamX
    final beamPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          AppColors.brand.withValues(alpha: 0.25 * opacity),
          AppColors.brand400.withValues(alpha: 0.08 * opacity),
          Colors.transparent,
        ],
        stops: const [0.0, 0.4, 1.0],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    // Draw cone shape (trapezoid from top to bottom)
    final path = Path()
      ..moveTo(beamX - beamWidth * 0.15, 0)
      ..lineTo(beamX + beamWidth * 0.15, 0)
      ..lineTo(beamX + beamWidth * 0.8, size.height * 0.85)
      ..lineTo(beamX - beamWidth * 0.8, size.height * 0.85)
      ..close();
    canvas.drawPath(path, beamPaint);

    // Hot-spot glow at top where "light source" is
    final glowPaint = Paint()
      ..shader = RadialGradient(
        center: Alignment.center,
        radius: 0.5,
        colors: [
          AppColors.brand.withValues(alpha: 0.3 * opacity),
          AppColors.brand.withValues(alpha: 0.05 * opacity),
          Colors.transparent,
        ],
      ).createShader(
        Rect.fromCenter(
          center: Offset(beamX, 0),
          width: beamWidth * 1.2,
          height: beamWidth * 1.2,
        ),
      );
    canvas.drawCircle(Offset(beamX, 0), beamWidth * 0.6, glowPaint);
  }

  @override
  bool shouldRepaint(_SpotlightBeamPainter oldDelegate) =>
      oldDelegate.beamX != beamX || oldDelegate.opacity != opacity;
}
