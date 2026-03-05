import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_animations.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../../data/mock_data.dart';
import '../../providers/app_providers.dart';

/// FlexShot processing — Lensa/Remini style photo-centric processing screen.
/// User's photo dominates with progressive blur reveal, scanning line,
/// floating particles, grid overlay, and compact step dots.
class ShotProcessingScreen extends ConsumerStatefulWidget {
  final String generationId;
  const ShotProcessingScreen({super.key, required this.generationId});

  @override
  ConsumerState<ShotProcessingScreen> createState() => _ShotProcessingScreenState();
}

class _ShotProcessingScreenState extends ConsumerState<ShotProcessingScreen>
    with TickerProviderStateMixin {
  late final AnimationController _scanController;
  late final AnimationController _particleController;
  late final AnimationController _pulseController;
  late final AnimationController _vibeController;
  bool _navigated = false;
  int _vibeIndex = 0;

  @override
  void initState() {
    super.initState();
    _scanController = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat();
    _particleController = AnimationController(vsync: this, duration: const Duration(seconds: 6))..repeat();
    _pulseController = AnimationController(vsync: this, duration: const Duration(milliseconds: 2500))..repeat(reverse: true);
    _vibeController = AnimationController(vsync: this, duration: const Duration(seconds: 4))
      ..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          setState(() => _vibeIndex = (_vibeIndex + 1) % kShotVibes.length);
          _vibeController.forward(from: 0);
        }
      })
      ..forward();
  }

  @override
  void dispose() {
    _scanController.dispose();
    _particleController.dispose();
    _pulseController.dispose();
    _vibeController.dispose();
    super.dispose();
  }

  int _progressToStep(int progress) {
    if (progress <= 10) return 0;
    if (progress <= 20) return 1;
    if (progress <= 40) return 2;
    if (progress <= 60) return 3;
    if (progress <= 80) return 4;
    return 5;
  }

  @override
  Widget build(BuildContext context) {
    final genAsync = ref.watch(generationStatusProvider(widget.generationId));

    return genAsync.when(
      loading: () => _buildUI(progress: 0, step: 0, inputImageUrl: null),
      error: (e, _) => _buildErrorScreen(e.toString()),
      data: (gen) {
        if (gen.isCompleted && !_navigated) {
          _navigated = true;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) context.go('/create/result/${widget.generationId}');
          });
        }

        if (gen.isFailed) {
          return _buildErrorScreen(gen.errorMessage ?? 'Generation failed');
        }

        final progress = gen.progress;
        final step = _progressToStep(progress);
        return _buildUI(progress: progress, step: step, inputImageUrl: gen.inputImageUrl);
      },
    );
  }

  Widget _buildUI({required int progress, required int step, String? inputImageUrl}) {
    final pct = progress;
    final normalizedProgress = progress / 100.0;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Container(
        decoration: const BoxDecoration(gradient: AppGradients.processing),
        child: SafeArea(
          child: Column(
            children: [
              // ── Top bar ──
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const SizedBox(width: 44), // balance
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.brand.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                        border: Border.all(color: AppColors.brand.withValues(alpha: 0.2)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(LucideIcons.sparkles, size: 12, color: AppColors.brand),
                          const SizedBox(width: 5),
                          Text('AI Generating', style: TextStyle(fontSize: AppSizes.fontXxsPlus, color: AppColors.brand, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // ── Hero photo area (60%) ──
              Expanded(
                flex: 6,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: AnimatedBuilder(
                    animation: Listenable.merge([_scanController, _particleController, _pulseController]),
                    builder: (context, _) {
                      return Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.brand.withValues(alpha: 0.2 + 0.2 * _pulseController.value),
                              blurRadius: 20 + 15 * _pulseController.value,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(20),
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              // Progressive blur reveal
                              ImageFiltered(
                                imageFilter: ui.ImageFilter.blur(
                                  sigmaX: 8.0 * (1.0 - normalizedProgress),
                                  sigmaY: 8.0 * (1.0 - normalizedProgress),
                                ),
                                child: inputImageUrl != null && inputImageUrl.isNotEmpty
                                    ? CachedNetworkImage(imageUrl: inputImageUrl, fit: BoxFit.cover)
                                    : Container(color: AppColors.zinc800),
                              ),

                              // Grid overlay (AI analysis viz) — fades with progress
                              CustomPaint(
                                painter: _GridOverlayPainter(
                                  opacity: (1.0 - normalizedProgress).clamp(0.0, 0.5),
                                  color: AppColors.brand,
                                ),
                              ),

                              // Scanning line
                              Positioned(
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                child: LayoutBuilder(
                                  builder: (context, constraints) {
                                    final scanY = _scanController.value * constraints.maxHeight;
                                    return Stack(
                                      children: [
                                        Positioned(
                                          top: scanY - 1,
                                          left: 0,
                                          right: 0,
                                          child: Container(
                                            height: 2,
                                            decoration: BoxDecoration(
                                              gradient: LinearGradient(
                                                colors: [
                                                  Colors.transparent,
                                                  AppColors.brand.withValues(alpha: 0.8),
                                                  Colors.transparent,
                                                ],
                                              ),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: AppColors.brand.withValues(alpha: 0.5),
                                                  blurRadius: 20,
                                                  spreadRadius: 4,
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    );
                                  },
                                ),
                              ),

                              // Floating particles
                              CustomPaint(
                                painter: _ParticlePainter(
                                  progress: _particleController.value,
                                  color: AppColors.brand,
                                ),
                              ),

                              // Percentage badge (bottom-right)
                              Positioned(
                                bottom: 12,
                                right: 12,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: AppColors.bg.withValues(alpha: 0.85),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: AppColors.brand.withValues(alpha: 0.3)),
                                  ),
                                  child: Text(
                                    '$pct%',
                                    style: AppTextStyles.mono.copyWith(
                                      fontSize: AppSizes.fontMdPlus,
                                      fontWeight: FontWeight.w900,
                                      color: AppColors.brand,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // ── Bottom info area (40%) ──
              Expanded(
                flex: 4,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Column(
                    children: [
                      // Title
                      Text(
                        'Creating your FlexShot',
                        style: TextStyle(
                          fontSize: AppSizes.fontXlPlus,
                          fontWeight: FontWeight.w800,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Compact step dots
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(kShotSteps.length, (i) {
                          final isDone = i < step;
                          final isActive = i == step;
                          return Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 2),
                            child: AnimatedContainer(
                              duration: AppDurations.normal,
                              width: isActive ? 20 : 6,
                              height: 6,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(3),
                                color: isDone
                                    ? AppColors.green
                                    : isActive
                                        ? AppColors.brand
                                        : AppColors.zinc700,
                              ),
                            ),
                          );
                        }),
                      ),
                      const SizedBox(height: 10),

                      // Current step text
                      AnimatedSwitcher(
                        duration: AppDurations.normal,
                        child: Text(
                          step < kShotSteps.length ? kShotSteps[step] : 'Done!',
                          key: ValueKey(step),
                          style: TextStyle(
                            fontSize: AppSizes.fontSmPlus,
                            fontWeight: FontWeight.w600,
                            color: AppColors.brand400,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),

                      // Rotating vibe text
                      AnimatedSwitcher(
                        duration: AppDurations.slow,
                        child: Text(
                          kShotVibes[_vibeIndex],
                          key: ValueKey(_vibeIndex),
                          style: TextStyle(
                            fontSize: AppSizes.fontXs,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textTer,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),

                      const Spacer(),

                      // Thin progress bar
                      Container(
                        height: 3,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(2),
                          color: AppColors.zinc800.withValues(alpha: 0.5),
                        ),
                        child: LayoutBuilder(
                          builder: (context, constraints) => Stack(
                            children: [
                              AnimatedContainer(
                                duration: AppDurations.medium,
                                width: constraints.maxWidth * normalizedProgress,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(2),
                                  gradient: const LinearGradient(
                                    colors: [AppColors.brand600, AppColors.brand, AppColors.brand400],
                                  ),
                                  boxShadow: [
                                    BoxShadow(color: AppColors.brand.withValues(alpha: 0.5), blurRadius: 8),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Branding
                      Text(
                        'FLEXSHOT · GEMINI AI',
                        style: AppTextStyles.mono.copyWith(
                          fontSize: AppSizes.fontXxs,
                          color: AppColors.textTer.withValues(alpha: 0.4),
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 16),
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

  Widget _buildErrorScreen(String error) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Container(
        decoration: const BoxDecoration(gradient: AppGradients.processing),
        child: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.red.withValues(alpha: 0.08),
                      border: Border.all(color: AppColors.red.withValues(alpha: 0.2)),
                    ),
                    child: const Icon(LucideIcons.alertCircle, size: AppSizes.icon4xl, color: AppColors.red),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Oop, that didn\'t work',
                    style: TextStyle(fontSize: AppSizes.fontXlPlus, fontWeight: FontWeight.w800, color: AppColors.text),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    error,
                    style: TextStyle(fontSize: AppSizes.fontSmPlus, color: AppColors.textSec, height: 1.5),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.green.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.green.withValues(alpha: 0.2)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.rotateCcw, size: AppSizes.iconXs, color: AppColors.green),
                        const SizedBox(width: 6),
                        Text(
                          'Credits refunded — you\'re good',
                          style: TextStyle(fontSize: AppSizes.fontXs, color: AppColors.green, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: OutlinedButton(
                      onPressed: () => context.go('/create'),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: AppColors.zinc700),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                      ),
                      child: Text('Try again', style: TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w600, color: AppColors.text)),
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
}

/// 3×3 grid overlay that fades as AI processing progresses.
class _GridOverlayPainter extends CustomPainter {
  final double opacity;
  final Color color;

  _GridOverlayPainter({required this.opacity, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    if (opacity <= 0) return;
    final paint = Paint()
      ..color = color.withValues(alpha: opacity * 0.3)
      ..strokeWidth = 0.5;

    // Vertical lines
    for (int i = 1; i <= 2; i++) {
      final x = size.width * i / 3;
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    // Horizontal lines
    for (int i = 1; i <= 2; i++) {
      final y = size.height * i / 3;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _GridOverlayPainter old) => old.opacity != opacity;
}

/// Floating particles that drift upward with pulsing opacity.
class _ParticlePainter extends CustomPainter {
  final double progress;
  final Color color;
  static final _rng = math.Random(42);
  static final _particles = List.generate(18, (i) => _ParticleData(
    x: _rng.nextDouble(),
    y: _rng.nextDouble(),
    size: 1.5 + _rng.nextDouble() * 2.5,
    speed: 0.3 + _rng.nextDouble() * 0.7,
    phase: _rng.nextDouble() * math.pi * 2,
  ));

  _ParticlePainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    for (final p in _particles) {
      final y = (p.y - progress * p.speed) % 1.0;
      final opacity = (0.3 + 0.4 * math.sin(progress * math.pi * 2 + p.phase)).clamp(0.0, 1.0);
      final paint = Paint()
        ..color = color.withValues(alpha: opacity * 0.6)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 1);
      canvas.drawCircle(
        Offset(p.x * size.width, y * size.height),
        p.size,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _ParticlePainter old) => old.progress != progress;
}

class _ParticleData {
  final double x, y, size, speed, phase;
  const _ParticleData({required this.x, required this.y, required this.size, required this.speed, required this.phase});
}
