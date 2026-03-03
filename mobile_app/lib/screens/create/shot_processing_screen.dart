import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_animations.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../../data/mock_data.dart';
import '../../providers/app_providers.dart';

/// FlexShot processing — premium circular progress ring with glow,
/// Gen Z motivational text, step checklist, artistic gradient background.
class ShotProcessingScreen extends ConsumerStatefulWidget {
  final String generationId;
  const ShotProcessingScreen({super.key, required this.generationId});

  @override
  ConsumerState<ShotProcessingScreen> createState() => _ShotProcessingScreenState();
}

class _ShotProcessingScreenState extends ConsumerState<ShotProcessingScreen>
    with TickerProviderStateMixin {
  late final AnimationController _ringController;
  late final AnimationController _glowController;
  late final AnimationController _vibeController;
  bool _navigated = false;
  int _vibeIndex = 0;

  @override
  void initState() {
    super.initState();
    _ringController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();
    _glowController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2500),
    )..repeat(reverse: true);
    _vibeController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          setState(() => _vibeIndex = (_vibeIndex + 1) % kShotVibes.length);
          _vibeController.forward(from: 0);
        }
      })
      ..forward();
  }

  @override
  void dispose() {
    _ringController.dispose();
    _glowController.dispose();
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
      loading: () => _buildUI(progress: 0, step: 0),
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
        return _buildUI(progress: progress, step: step);
      },
    );
  }

  Widget _buildUI({required int progress, required int step}) {
    final pct = progress;
    final normalizedProgress = progress / 100.0;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Container(
        decoration: const BoxDecoration(gradient: AppGradients.processing),
        child: Stack(
          children: [
            // Ambient glow orbs
            AnimatedBuilder(
              animation: _glowController,
              builder: (_, __) => Positioned(
                top: -60 + 20 * _glowController.value,
                right: -40,
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        AppColors.brand.withValues(alpha: 0.08 + 0.04 * _glowController.value),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ),
            AnimatedBuilder(
              animation: _glowController,
              builder: (_, __) => Positioned(
                bottom: -80 + 15 * _glowController.value,
                left: -60,
                child: Container(
                  width: 240,
                  height: 240,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        AppColors.purple.withValues(alpha: 0.06 + 0.03 * _glowController.value),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ),

            SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  children: [
                    const Spacer(flex: 2),

                    // ── Circular progress ring with glow ──
                    AnimatedBuilder(
                      animation: _glowController,
                      builder: (_, child) => Container(
                        width: 176,
                        height: 176,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.brand.withValues(alpha: 0.12 + 0.08 * _glowController.value),
                              blurRadius: 40 + 20 * _glowController.value,
                              spreadRadius: 8,
                            ),
                          ],
                        ),
                        child: child,
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          // Background ring
                          CustomPaint(
                            size: const Size(176, 176),
                            painter: _RingPainter(progress: 1.0, color: AppColors.zinc800.withValues(alpha: 0.5), strokeWidth: 4),
                          ),
                          // Progress ring
                          AnimatedBuilder(
                            animation: _ringController,
                            builder: (_, __) => Transform.rotate(
                              angle: _ringController.value * 0.3,
                              child: CustomPaint(
                                size: const Size(176, 176),
                                painter: _GlowRingPainter(
                                  progress: normalizedProgress,
                                  strokeWidth: 4,
                                ),
                              ),
                            ),
                          ),
                          // Center content
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                '$pct',
                                style: AppTextStyles.mono.copyWith(
                                  fontSize: 44,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                  height: 1,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.brand.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  'CREATING',
                                  style: AppTextStyles.mono.copyWith(
                                    fontSize: AppSizes.font2xs,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.brand,
                                    letterSpacing: 3,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),

                    // ── Title ──
                    Text(
                      'Creating your',
                      style: TextStyle(
                        fontSize: AppSizes.fontBase,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textSec,
                      ),
                    ),
                    ShaderMask(
                      shaderCallback: (bounds) => const LinearGradient(
                        colors: [AppColors.brand400, AppColors.brand, AppColors.brand400],
                      ).createShader(bounds),
                      child: Text(
                        'FlexShot',
                        style: TextStyle(
                          fontSize: AppSizes.font2xlMax,
                          fontWeight: FontWeight.w900,
                          fontStyle: FontStyle.italic,
                          color: Colors.white,
                          letterSpacing: -1,
                        ),
                      ),
                    ),

                    const SizedBox(height: 8),

                    // ── Rotating vibe text ──
                    AnimatedSwitcher(
                      duration: AppDurations.slow,
                      child: Text(
                        kShotVibes[_vibeIndex],
                        key: ValueKey(_vibeIndex),
                        style: TextStyle(
                          fontSize: AppSizes.fontSmPlus,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textTer,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // ── Step checklist ──
                    ...List.generate(kShotSteps.length, (i) {
                      final isDone = i < step;
                      final isActive = i == step;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          children: [
                            // Connector line (left side)
                            SizedBox(
                              width: 24,
                              child: Stack(
                                alignment: Alignment.center,
                                children: [
                                  if (i < kShotSteps.length - 1)
                                    Positioned(
                                      top: 16,
                                      bottom: -10,
                                      child: Container(
                                        width: 1,
                                        color: isDone
                                            ? AppColors.brand.withValues(alpha: 0.3)
                                            : AppColors.zinc800,
                                      ),
                                    ),
                                  AnimatedContainer(
                                    duration: AppDurations.medium,
                                    width: 22,
                                    height: 22,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: isDone
                                          ? AppColors.green.withValues(alpha: 0.15)
                                          : isActive
                                              ? AppColors.brand.withValues(alpha: 0.15)
                                              : Colors.transparent,
                                      border: Border.all(
                                        color: isDone
                                            ? AppColors.green.withValues(alpha: 0.6)
                                            : isActive
                                                ? AppColors.brand
                                                : AppColors.zinc700.withValues(alpha: 0.5),
                                        width: 1.5,
                                      ),
                                      boxShadow: isActive
                                          ? [BoxShadow(color: AppColors.brand.withValues(alpha: 0.3), blurRadius: 8)]
                                          : null,
                                    ),
                                    child: isDone
                                        ? const Icon(LucideIcons.check, size: 11, color: AppColors.green)
                                        : isActive
                                            ? Center(
                                                child: Container(
                                                  width: 6,
                                                  height: 6,
                                                  decoration: BoxDecoration(
                                                    shape: BoxShape.circle,
                                                    color: AppColors.brand,
                                                    boxShadow: [BoxShadow(color: AppColors.brand.withValues(alpha: 0.6), blurRadius: 6)],
                                                  ),
                                                ),
                                              )
                                            : null,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: AnimatedDefaultTextStyle(
                                duration: AppDurations.normal,
                                style: TextStyle(
                                  fontSize: AppSizes.fontSmPlus,
                                  fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                                  color: isDone
                                      ? AppColors.green
                                      : isActive
                                          ? Colors.white
                                          : AppColors.textTer.withValues(alpha: 0.5),
                                ),
                                child: Text(kShotSteps[i]),
                              ),
                            ),
                            if (isDone)
                              Text(
                                'DONE',
                                style: AppTextStyles.mono.copyWith(
                                  fontSize: AppSizes.font2xs,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.green.withValues(alpha: 0.5),
                                  letterSpacing: 1,
                                ),
                              ),
                          ],
                        ),
                      );
                    }),

                    const Spacer(),

                    // ── Progress bar ──
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
                    const SizedBox(height: 16),

                    // ── Bottom branding ──
                    Text(
                      'FLEXSHOT · GEMINI AI',
                      style: AppTextStyles.mono.copyWith(
                        fontSize: AppSizes.fontXxs,
                        color: AppColors.textTer.withValues(alpha: 0.4),
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ],
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

/// Draws a simple arc ring.
class _RingPainter extends CustomPainter {
  final double progress;
  final Color color;
  final double strokeWidth;

  _RingPainter({required this.progress, required this.color, required this.strokeWidth});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final rect = Rect.fromLTWH(strokeWidth / 2, strokeWidth / 2, size.width - strokeWidth, size.height - strokeWidth);
    const startAngle = -math.pi / 2;
    final sweepAngle = progress * 2 * math.pi;

    canvas.drawArc(rect, startAngle, sweepAngle, false, paint);
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.color != color;
  }
}

/// Draws a gradient arc ring with glow effect.
class _GlowRingPainter extends CustomPainter {
  final double progress;
  final double strokeWidth;

  _GlowRingPainter({required this.progress, required this.strokeWidth});

  @override
  void paint(Canvas canvas, Size size) {
    if (progress <= 0) return;

    final rect = Rect.fromLTWH(strokeWidth / 2, strokeWidth / 2, size.width - strokeWidth, size.height - strokeWidth);
    const startAngle = -math.pi / 2;
    final sweepAngle = progress * 2 * math.pi;

    // Glow layer
    final glowPaint = Paint()
      ..strokeWidth = strokeWidth + 6
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..color = AppColors.brand.withValues(alpha: 0.3)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8);
    canvas.drawArc(rect, startAngle, sweepAngle, false, glowPaint);

    // Main ring
    final paint = Paint()
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..shader = const SweepGradient(
        startAngle: 0,
        endAngle: 2 * math.pi,
        colors: [AppColors.brand600, AppColors.brand, AppColors.brand400, AppColors.brand],
      ).createShader(rect);
    canvas.drawArc(rect, startAngle, sweepAngle, false, paint);
  }

  @override
  bool shouldRepaint(covariant _GlowRingPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
