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
import '../../data/models/story_model.dart';
import '../../providers/app_providers.dart';

/// FlexTale processing — Lensa/Remini style photo-centric processing screen
/// with film strip, cinematic bars, scene counter, and progressive reveal.
class TaleProcessingScreen extends ConsumerStatefulWidget {
  final String storyId;
  const TaleProcessingScreen({super.key, required this.storyId});

  @override
  ConsumerState<TaleProcessingScreen> createState() => _TaleProcessingScreenState();
}

class _TaleProcessingScreenState extends ConsumerState<TaleProcessingScreen>
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
    _vibeController = AnimationController(vsync: this, duration: const Duration(seconds: 5))
      ..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          setState(() => _vibeIndex = (_vibeIndex + 1) % kTaleVibes.length);
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

  @override
  Widget build(BuildContext context) {
    final storyAsync = ref.watch(storyStatusProvider(widget.storyId));
    final scenesAsync = ref.watch(scenesProvider(widget.storyId));

    return storyAsync.when(
      loading: () => _buildUI(title: '', totalScenes: 0, completedScenes: 0, scenes: [], inputImageUrl: null),
      error: (e, _) => _buildErrorScreen(e.toString()),
      data: (story) {
        if (story.isCompleted && !_navigated) {
          _navigated = true;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) context.go('/story/reader/${widget.storyId}');
          });
        }

        if (story.isFailed) {
          return _buildErrorScreen(story.errorMessage ?? 'Story generation failed');
        }

        final scenes = scenesAsync.value ?? [];

        return _buildUI(
          title: story.storyTitle,
          totalScenes: story.totalScenes,
          completedScenes: story.completedScenes,
          scenes: scenes,
          inputImageUrl: story.inputImageUrl,
        );
      },
    );
  }

  Widget _buildUI({
    required String title,
    required int totalScenes,
    required int completedScenes,
    required List<SceneModel> scenes,
    String? inputImageUrl,
  }) {
    final overallProgress = totalScenes > 0 ? completedScenes / totalScenes : 0.0;
    final pct = (overallProgress * 100).toInt();

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
                    const SizedBox(width: 44),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.purple.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                        border: Border.all(color: AppColors.purple.withValues(alpha: 0.2)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(LucideIcons.bookOpen, size: 12, color: AppColors.purple),
                          const SizedBox(width: 5),
                          Text('Story Mode', style: TextStyle(fontSize: AppSizes.fontXxsPlus, color: AppColors.purple, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 8),

              // ── Film strip (horizontal scrollable scene thumbnails) ──
              if (totalScenes > 0)
                SizedBox(
                  height: 60,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: totalScenes,
                    itemBuilder: (context, i) {
                      final scene = i < scenes.length ? scenes[i] : null;
                      final isDone = scene?.isCompleted ?? false;
                      final isActive = scene?.isInProgress ?? false;
                      final hasImage = isDone && scene?.outputImageUrl != null;

                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: AnimatedContainer(
                          duration: AppDurations.normal,
                          width: 50,
                          height: 60,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isActive
                                  ? AppColors.brand
                                  : isDone
                                      ? AppColors.green.withValues(alpha: 0.4)
                                      : AppColors.zinc800,
                              width: isActive ? 2 : 1,
                            ),
                            color: AppColors.zinc800,
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(7),
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                if (hasImage)
                                  CachedNetworkImage(
                                    imageUrl: scene!.outputImageUrl!,
                                    fit: BoxFit.cover,
                                  )
                                else
                                  Center(
                                    child: Text(
                                      '${i + 1}',
                                      style: AppTextStyles.mono.copyWith(
                                        fontSize: AppSizes.fontXs,
                                        color: AppColors.textTer,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                // Green check overlay for done scenes
                                if (isDone)
                                  Positioned(
                                    top: 2,
                                    right: 2,
                                    child: Container(
                                      width: 14,
                                      height: 14,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: AppColors.green,
                                      ),
                                      child: const Icon(LucideIcons.check, size: 8, color: Colors.white),
                                    ),
                                  ),
                                // Mini spinner for active scene
                                if (isActive)
                                  const Center(
                                    child: SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 1.5,
                                        color: AppColors.brand,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),

              const SizedBox(height: 8),

              // ── Hero photo area ──
              Expanded(
                flex: 5,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: AnimatedBuilder(
                    animation: Listenable.merge([_scanController, _particleController, _pulseController]),
                    builder: (context, _) {
                      return Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.purple.withValues(alpha: 0.2 + 0.2 * _pulseController.value),
                              blurRadius: 20 + 15 * _pulseController.value,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              // Progressive blur reveal
                              ImageFiltered(
                                imageFilter: ui.ImageFilter.blur(
                                  sigmaX: 8.0 * (1.0 - overallProgress),
                                  sigmaY: 8.0 * (1.0 - overallProgress),
                                ),
                                child: inputImageUrl != null && inputImageUrl.isNotEmpty
                                    ? CachedNetworkImage(imageUrl: inputImageUrl, fit: BoxFit.cover)
                                    : Container(color: AppColors.zinc800),
                              ),

                              // Cinematic film bars (top/bottom)
                              Positioned(
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 12,
                                child: Container(color: Colors.black.withValues(alpha: 0.7)),
                              ),
                              Positioned(
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 12,
                                child: Container(color: Colors.black.withValues(alpha: 0.7)),
                              ),

                              // Scanning line
                              LayoutBuilder(
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
                                                AppColors.purple.withValues(alpha: 0.8),
                                                Colors.transparent,
                                              ],
                                            ),
                                            boxShadow: [
                                              BoxShadow(
                                                color: AppColors.purple.withValues(alpha: 0.5),
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

                              // Floating particles
                              CustomPaint(
                                painter: _ParticlePainter(
                                  progress: _particleController.value,
                                  color: AppColors.purple,
                                ),
                              ),

                              // Scene counter badge (top-right)
                              Positioned(
                                top: 18,
                                right: 10,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppColors.bg.withValues(alpha: 0.85),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(color: AppColors.purple.withValues(alpha: 0.3)),
                                  ),
                                  child: Text(
                                    '$completedScenes/$totalScenes',
                                    style: AppTextStyles.mono.copyWith(
                                      fontSize: AppSizes.fontXsPlus,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.purple,
                                    ),
                                  ),
                                ),
                              ),

                              // Percentage badge (bottom-right)
                              Positioned(
                                bottom: 18,
                                right: 10,
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

              const SizedBox(height: 12),

              // ── Bottom info area ──
              Expanded(
                flex: 4,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    children: [
                      // Title
                      Text(
                        'Crafting your Story',
                        style: TextStyle(
                          fontSize: AppSizes.fontXlPlus,
                          fontWeight: FontWeight.w800,
                          color: AppColors.text,
                        ),
                      ),
                      if (title.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          title,
                          style: TextStyle(fontSize: AppSizes.fontXs, color: AppColors.textTer, letterSpacing: 1),
                          textAlign: TextAlign.center,
                        ),
                      ],
                      const SizedBox(height: 10),

                      // Rotating vibe text
                      AnimatedSwitcher(
                        duration: AppDurations.slow,
                        child: Text(
                          kTaleVibes[_vibeIndex],
                          key: ValueKey(_vibeIndex),
                          style: TextStyle(
                            fontSize: AppSizes.fontXs,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textTer,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Compact scene progress list
                      Expanded(
                        child: ListView.builder(
                          padding: EdgeInsets.zero,
                          physics: const BouncingScrollPhysics(),
                          itemCount: scenes.isEmpty ? totalScenes : scenes.length,
                          itemBuilder: (context, i) {
                            final scene = i < scenes.length ? scenes[i] : null;
                            final isDone = scene?.isCompleted ?? false;
                            final isActive = scene?.isInProgress ?? false;
                            final sceneName = scene?.sceneName ?? 'Scene ${i + 1}';

                            return Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Row(
                                children: [
                                  // Status icon
                                  SizedBox(
                                    width: 20,
                                    child: isDone
                                        ? Icon(LucideIcons.check, size: 14, color: AppColors.green)
                                        : isActive
                                            ? const SizedBox(
                                                width: 12,
                                                height: 12,
                                                child: CircularProgressIndicator(strokeWidth: 1.5, color: AppColors.brand),
                                              )
                                            : Icon(LucideIcons.circle, size: 10, color: AppColors.zinc700),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      sceneName,
                                      style: TextStyle(
                                        fontSize: AppSizes.fontXs,
                                        fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                                        color: isDone
                                            ? AppColors.text
                                            : isActive
                                                ? Colors.white
                                                : AppColors.textTer,
                                      ),
                                    ),
                                  ),
                                  if (isDone)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppColors.green.withValues(alpha: 0.08),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        'DONE',
                                        style: AppTextStyles.captionMono.copyWith(
                                          fontSize: AppSizes.font3xs,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.green.withValues(alpha: 0.6),
                                          letterSpacing: 1,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),

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
                                duration: AppDurations.slow,
                                width: constraints.maxWidth * overallProgress,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(2),
                                  gradient: const LinearGradient(
                                    colors: [AppColors.brand600, AppColors.brand, AppColors.purple],
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
                      const SizedBox(height: 8),

                      // Branding
                      Text(
                        'FLEXTALE · GEMINI AI',
                        style: AppTextStyles.captionMono.copyWith(
                          color: AppColors.textTer.withValues(alpha: 0.4),
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 12),
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
                    child: Icon(LucideIcons.alertCircle, size: AppSizes.icon4xl, color: AppColors.red),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Story hit a plot hole',
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
                        Icon(LucideIcons.rotateCcw, size: AppSizes.iconXs, color: AppColors.green),
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
                      onPressed: () => context.go('/story'),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: AppColors.zinc700),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                      ),
                      child: Text('Try another story', style: TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w600, color: AppColors.text)),
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
