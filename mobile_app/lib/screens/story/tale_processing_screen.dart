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

/// FlexTale processing — cinematic story generation with per-scene progress,
/// dramatic pulsing icon, Gen Z motivational text, premium dark aesthetic.
class TaleProcessingScreen extends ConsumerStatefulWidget {
  final String storyId;
  const TaleProcessingScreen({super.key, required this.storyId});

  @override
  ConsumerState<TaleProcessingScreen> createState() => _TaleProcessingScreenState();
}

class _TaleProcessingScreenState extends ConsumerState<TaleProcessingScreen>
    with TickerProviderStateMixin {
  late final AnimationController _pulseController;
  late final AnimationController _glowController;
  late final AnimationController _vibeController;
  bool _navigated = false;
  int _vibeIndex = 0;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(vsync: this, duration: const Duration(milliseconds: 2000))..repeat(reverse: true);
    _glowController = AnimationController(vsync: this, duration: const Duration(milliseconds: 3000))..repeat(reverse: true);
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
    _pulseController.dispose();
    _glowController.dispose();
    _vibeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final storyAsync = ref.watch(storyStatusProvider(widget.storyId));
    final scenesAsync = ref.watch(scenesProvider(widget.storyId));

    return storyAsync.when(
      loading: () => _buildUI(title: '', totalScenes: 0, completedScenes: 0, scenes: []),
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
        );
      },
    );
  }

  Widget _buildUI({
    required String title,
    required int totalScenes,
    required int completedScenes,
    required List<SceneModel> scenes,
  }) {
    final overallProgress = totalScenes > 0 ? completedScenes / totalScenes : 0.0;
    final pct = (overallProgress * 100).toInt();

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
                top: -100 + 30 * _glowController.value,
                left: -60,
                child: Container(
                  width: 260,
                  height: 260,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        AppColors.purple.withValues(alpha: 0.06 + 0.04 * _glowController.value),
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
                bottom: -60 + 20 * _glowController.value,
                right: -80,
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        AppColors.brand.withValues(alpha: 0.05 + 0.03 * _glowController.value),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ),

            SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  children: [
                    const Spacer(flex: 2),

                    // ── Pulsing icon ──
                    AnimatedBuilder(
                      animation: _pulseController,
                      builder: (_, __) => Container(
                        width: 88,
                        height: 88,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(24),
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [
                              AppColors.brand.withValues(alpha: 0.12 + 0.06 * _pulseController.value),
                              AppColors.purple.withValues(alpha: 0.08 + 0.04 * _pulseController.value),
                            ],
                          ),
                          border: Border.all(
                            color: AppColors.brand.withValues(alpha: 0.15 + 0.1 * _pulseController.value),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.brand.withValues(alpha: 0.15 + 0.1 * _pulseController.value),
                              blurRadius: 30 + 15 * _pulseController.value,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: Transform.scale(
                          scale: 1.0 + 0.04 * _pulseController.value,
                          child: const Icon(LucideIcons.bookOpen, size: 38, color: AppColors.brand),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // ── Title ──
                    Text(
                      'Crafting your',
                      style: TextStyle(fontSize: AppSizes.fontMdPlus, fontWeight: FontWeight.w500, color: AppColors.textSec),
                    ),
                    ShaderMask(
                      shaderCallback: (bounds) => const LinearGradient(
                        colors: [AppColors.brand400, AppColors.brand, AppColors.purple],
                      ).createShader(bounds),
                      child: Text(
                        'Story',
                        style: TextStyle(
                          fontSize: AppSizes.font3xl,
                          fontWeight: FontWeight.w900,
                          fontStyle: FontStyle.italic,
                          color: Colors.white,
                          letterSpacing: -1,
                        ),
                      ),
                    ),
                    if (title.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        title,
                        style: TextStyle(fontSize: AppSizes.fontXs, color: AppColors.textTer, letterSpacing: 1),
                      ),
                    ],
                    const SizedBox(height: 6),

                    // ── Rotating vibe text ──
                    AnimatedSwitcher(
                      duration: AppDurations.slow,
                      child: Text(
                        kTaleVibes[_vibeIndex],
                        key: ValueKey(_vibeIndex),
                        style: TextStyle(
                          fontSize: AppSizes.fontSmPlus,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textTer,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),

                    const SizedBox(height: 28),

                    // ── Per-scene cards ──
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

                          return AnimatedContainer(
                            duration: AppDurations.medium,
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                            decoration: BoxDecoration(
                              color: isActive
                                  ? AppColors.brand.withValues(alpha: 0.04)
                                  : isDone
                                      ? AppColors.green.withValues(alpha: 0.02)
                                      : AppColors.card.withValues(alpha: 0.4),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: isActive
                                    ? AppColors.brand.withValues(alpha: 0.25)
                                    : isDone
                                        ? AppColors.green.withValues(alpha: 0.15)
                                        : AppColors.zinc800.withValues(alpha: 0.5),
                              ),
                              boxShadow: isActive
                                  ? [BoxShadow(color: AppColors.brand.withValues(alpha: 0.08), blurRadius: 16)]
                                  : null,
                            ),
                            child: Row(
                              children: [
                                // Scene number/status
                                AnimatedContainer(
                                  duration: AppDurations.normal,
                                  width: 32,
                                  height: 32,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(10),
                                    color: isDone
                                        ? AppColors.green.withValues(alpha: 0.12)
                                        : isActive
                                            ? AppColors.brand.withValues(alpha: 0.12)
                                            : AppColors.zinc800.withValues(alpha: 0.3),
                                    border: Border.all(
                                      color: isDone
                                          ? AppColors.green.withValues(alpha: 0.3)
                                          : isActive
                                              ? AppColors.brand.withValues(alpha: 0.4)
                                              : Colors.transparent,
                                    ),
                                  ),
                                  child: isDone
                                      ? Icon(LucideIcons.check, size: AppSizes.iconSm, color: AppColors.green)
                                      : isActive
                                          ? const SizedBox(
                                              width: 14,
                                              height: 14,
                                              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.brand),
                                            )
                                          : Center(
                                              child: Text(
                                                '${i + 1}',
                                                style: AppTextStyles.mono.copyWith(
                                                  fontWeight: FontWeight.w700,
                                                  color: AppColors.textTer,
                                                ),
                                              ),
                                            ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        sceneName,
                                        style: TextStyle(
                                          fontSize: AppSizes.fontSmPlus,
                                          fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                                          color: isDone
                                              ? AppColors.text
                                              : isActive
                                                  ? Colors.white
                                                  : AppColors.textTer,
                                        ),
                                      ),
                                      if (isActive)
                                        Padding(
                                          padding: const EdgeInsets.only(top: 4),
                                          child: ClipRRect(
                                            borderRadius: BorderRadius.circular(1),
                                            child: const LinearProgressIndicator(
                                              minHeight: 2,
                                              backgroundColor: AppColors.zinc800,
                                              color: AppColors.brand,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                                if (isDone)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: AppColors.green.withValues(alpha: 0.08),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      'DONE',
                                      style: AppTextStyles.captionMono.copyWith(
                                        fontSize: AppSizes.font2xs,
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

                    const SizedBox(height: 16),

                    // ── Overall progress bar ──
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
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          totalScenes > 0 ? 'Scene $completedScenes of $totalScenes' : 'Warming up...',
                          style: AppTextStyles.monoSmall.copyWith(color: AppColors.textTer),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.brand.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '$pct%',
                            style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXsPlus, fontWeight: FontWeight.w800, color: AppColors.brand),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // ── Bottom branding ──
                    Text(
                      'FLEXTALE · GEMINI AI',
                      style: AppTextStyles.captionMono.copyWith(
                        color: AppColors.textTer.withValues(alpha: 0.4),
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 24),
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
