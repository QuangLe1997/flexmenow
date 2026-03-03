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
  late final AnimationController _barController;
  late final AnimationController _glowController;

  int _bgIndex = 0;
  int _phase = 0; // 0=init, 1=logo-in, 2=text-in, 3=bar-fill

  @override
  void initState() {
    super.initState();

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

    // Loading bar fill
    _barController = AnimationController(
      vsync: this,
      duration: AppDurations.slowest,
    );

    // Glow pulse (continuous)
    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    )..repeat(reverse: true);

    _startAnimation();
  }

  Future<void> _startAnimation() async {
    // Phase 1: Logo entrance at 200ms
    await Future.delayed(AppDurations.fast);
    if (!mounted) return;
    setState(() => _phase = 1);
    _logoController.forward();

    // Phase 2: Text at 800ms
    await Future.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    setState(() => _phase = 2);
    _textController.forward();

    // Phase 3: Loading bar at 1300ms
    await Future.delayed(AppDurations.slow);
    if (!mounted) return;
    setState(() => _phase = 3);
    _barController.forward();

    // Navigate after bar fills
    await Future.delayed(const Duration(milliseconds: 1400));
    if (!mounted) return;
    _navigate();
  }

  Future<void> _navigate() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        // Run post-auth initialization before navigating
        final appInit = ref.read(appInitProvider);
        await appInit.initPostAuth(user.uid);
        if (!mounted) return;
        context.go('/create');
      } else {
        context.go('/tour');
      }
    } catch (_) {
      if (mounted) context.go('/tour');
    }
  }

  @override
  void dispose() {
    _logoController.dispose();
    _textController.dispose();
    _barController.dispose();
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
          // Static spotlight hero background (main)
          AnimatedOpacity(
            opacity: _phase >= 1 ? 0.7 : 0.3,
            duration: const Duration(milliseconds: 1500),
            child: Transform.scale(
              scale: 1.1,
              child: Image.asset(
                AppImages.splashSpotlight,
                fit: BoxFit.cover,
                width: double.infinity,
                height: double.infinity,
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

                // Brand: "Flex" (white) + "Me" (gold) — 52px italic w900
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
                    child: RichText(
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
                                  color: AppColors.brand.withValues(alpha: 0.5),
                                  blurRadius: 20,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
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

                const SizedBox(height: 40),

                // Loading bar (gold → purple gradient)
                if (_phase >= 3)
                  AnimatedBuilder(
                    animation: _barController,
                    builder: (context, _) {
                      return Column(
                        children: [
                          Container(
                            width: 140,
                            height: 3,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(2),
                              color: AppColors.zinc800,
                            ),
                            child: Align(
                              alignment: Alignment.centerLeft,
                              child: FractionallySizedBox(
                                widthFactor: _barController.value,
                                child: Container(
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(2),
                                    gradient: const LinearGradient(
                                      colors: [AppColors.brand, AppColors.purple],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      );
                    },
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
