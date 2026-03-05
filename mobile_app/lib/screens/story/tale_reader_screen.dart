import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_animations.dart';
import '../../core/app_shadows.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../../data/models/story_model.dart';
import '../../providers/app_providers.dart';
import '../../widgets/image_slideshow.dart';

/// Tale reader — Cinematic scene viewer with immersive 3:4 hero image,
/// film bars, story-strip progress, premium typography.
///
/// The [storyId] is the Firestore document ID. Loads story + scenes data,
/// uses real scene images from `outputImageUrl` when available.
class TaleReaderScreen extends ConsumerStatefulWidget {
  final String storyId;
  const TaleReaderScreen({super.key, required this.storyId});

  @override
  ConsumerState<TaleReaderScreen> createState() => _TaleReaderScreenState();
}

class _TaleReaderScreenState extends ConsumerState<TaleReaderScreen>
    with SingleTickerProviderStateMixin {
  int _currentScene = 0;
  bool _completed = false;
  late final AnimationController _fadeController;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(vsync: this, duration: AppDurations.medium)..forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    super.dispose();
  }

  void _goNextScene(int totalScenes) {
    if (_currentScene < totalScenes - 1) {
      _fadeController.reverse().then((_) {
        if (!mounted) return;
        setState(() { _currentScene++; });
        _fadeController.forward();
      });
    } else {
      setState(() => _completed = true);
    }
  }

  void _goPrevScene() {
    if (_currentScene > 0) {
      _fadeController.reverse().then((_) {
        if (!mounted) return;
        setState(() { _currentScene--; });
        _fadeController.forward();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final storyAsync = ref.watch(storyStatusProvider(widget.storyId));
    final scenesAsync = ref.watch(scenesProvider(widget.storyId));

    return storyAsync.when(
      loading: () => const Scaffold(backgroundColor: AppColors.bg, body: Center(child: CircularProgressIndicator(color: AppColors.brand))),
      error: (_, __) => const Scaffold(backgroundColor: AppColors.bg, body: Center(child: Text('Error'))),
      data: (story) {
        final scenes = scenesAsync.value ?? [];
        if (_completed) return _buildCompletionScreen(story, scenes);
        return _buildReader(story, scenes);
      },
    );
  }

  Widget _buildReader(StoryGenerationModel story, List<SceneModel> scenes) {
    final totalScenes = scenes.isNotEmpty ? scenes.length : story.totalScenes;
    final currentScene = _currentScene < scenes.length ? scenes[_currentScene] : null;
    final sceneImageUrl = currentScene?.outputImageUrl;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Column(
        children: [
          // ── Cinematic hero image — 70% ──
          Expanded(
            flex: 7,
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Scene image (full bleed)
                AnimatedSwitcher(
                  duration: AppDurations.medium,
                  child: sceneImageUrl != null && sceneImageUrl.isNotEmpty
                      ? CachedNetworkImage(
                          key: ValueKey('scene-$_currentScene'),
                          imageUrl: sceneImageUrl,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(
                            color: AppColors.zinc900,
                            child: const Center(child: CircularProgressIndicator(color: AppColors.brand, strokeWidth: 2)),
                          ),
                          errorWidget: (_, __, ___) => PlaceholderImage(index: _currentScene, borderRadius: 0),
                        )
                      : PlaceholderImage(key: ValueKey('ph-$_currentScene'), index: _currentScene, borderRadius: 0),
                ),

                // Cinematic film bars (top/bottom)
                Positioned(
                  top: 0, left: 0, right: 0,
                  child: Container(
                    height: 6,
                    color: Colors.black.withValues(alpha: 0.85),
                  ),
                ),
                Positioned(
                  bottom: 0, left: 0, right: 0,
                  child: Container(
                    height: 6,
                    color: Colors.black.withValues(alpha: 0.85),
                  ),
                ),

                // Bottom gradient — subtle, cinematic
                Positioned(
                  bottom: 0, left: 0, right: 0,
                  height: 120,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          AppColors.bg.withValues(alpha: 0.7),
                          AppColors.bg,
                        ],
                        stops: const [0.0, 0.6, 1.0],
                      ),
                    ),
                  ),
                ),

                // Top safe area gradient
                Positioned(
                  top: 0, left: 0, right: 0,
                  height: 100,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          AppColors.bg.withValues(alpha: 0.6),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),

                // ── Story progress strip (Instagram-style, top) ──
                Positioned(
                  top: 0, left: 0, right: 0,
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(8, 4, 8, 0),
                      child: Row(
                        children: List.generate(totalScenes, (i) {
                          final isDone = i < _currentScene;
                          final isActive = i == _currentScene;
                          return Expanded(
                            child: Container(
                              height: 2.5,
                              margin: const EdgeInsets.symmetric(horizontal: 1.5),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(2),
                                color: isDone
                                    ? AppColors.purple
                                    : isActive
                                        ? AppColors.brand
                                        : Colors.white.withValues(alpha: 0.2),
                                boxShadow: isActive
                                    ? [BoxShadow(color: AppColors.brand.withValues(alpha: 0.6), blurRadius: 4)]
                                    : null,
                              ),
                            ),
                          );
                        }),
                      ),
                    ),
                  ),
                ),

                // ── Top navigation bar ──
                Positioned(
                  top: 0, left: 0, right: 0,
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _circleBtn(LucideIcons.x, () => context.pop()),
                          // Scene counter badge
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.55),
                              borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(LucideIcons.film, size: 11, color: AppColors.purple),
                                const SizedBox(width: 5),
                                Text(
                                  '${_currentScene + 1} / $totalScenes',
                                  style: AppTextStyles.mono.copyWith(
                                    fontSize: AppSizes.fontXsPlus,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.text,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          _circleBtn(LucideIcons.share, () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Share coming soon')),
                            );
                          }),
                        ],
                      ),
                    ),
                  ),
                ),

                // ── Scene name overlay (bottom of image) ──
                Positioned(
                  bottom: 12, left: 20, right: 20,
                  child: FadeTransition(
                    opacity: _fadeController,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Scene label
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.purple.withValues(alpha: 0.8),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'SCENE ${_currentScene + 1}',
                            style: AppTextStyles.mono.copyWith(
                              fontSize: AppSizes.font3xs,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              letterSpacing: 2,
                            ),
                          ),
                        ),
                        const SizedBox(height: 6),
                        // Scene title
                        Text(
                          currentScene?.sceneName ?? 'Scene ${_currentScene + 1}',
                          style: TextStyle(
                            fontSize: AppSizes.fontXlPlus,
                            fontWeight: FontWeight.w800,
                            fontStyle: FontStyle.italic,
                            color: Colors.white,
                            letterSpacing: -0.5,
                            shadows: [
                              Shadow(color: Colors.black.withValues(alpha: 0.8), blurRadius: 12),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // ── Tap zones for prev/next ──
                Positioned(
                  left: 0, top: 80, bottom: 80, width: 80,
                  child: GestureDetector(
                    onTap: _goPrevScene,
                    behavior: HitTestBehavior.translucent,
                  ),
                ),
                Positioned(
                  right: 0, top: 80, bottom: 80, width: 80,
                  child: GestureDetector(
                    onTap: () => _goNextScene(totalScenes),
                    behavior: HitTestBehavior.translucent,
                  ),
                ),
              ],
            ),
          ),

          // ── Scene text content — 30% ──
          Expanded(
            flex: 3,
            child: FadeTransition(
              opacity: _fadeController,
              child: Column(
                children: [
                  // Story text (scrollable)
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (currentScene != null && currentScene.promptUsed.isNotEmpty)
                            Text(
                              currentScene.promptUsed,
                              style: TextStyle(
                                fontSize: AppSizes.fontBase,
                                color: AppColors.textSec,
                                height: 1.7,
                                letterSpacing: 0.2,
                              ),
                            )
                          else
                            Text(
                              'The story unfolds...',
                              style: TextStyle(
                                fontSize: AppSizes.fontBase,
                                color: AppColors.textTer,
                                fontStyle: FontStyle.italic,
                                height: 1.7,
                              ),
                            ),
                          const SizedBox(height: 12),
                        ],
                      ),
                    ),
                  ),

                  // ── Navigation bar ──
                  Container(
                    padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
                    decoration: BoxDecoration(
                      border: Border(top: BorderSide(color: AppColors.borderMed.withValues(alpha: 0.3))),
                    ),
                    child: SafeArea(
                      top: false,
                      child: Row(
                        children: [
                          // Previous button
                          if (_currentScene > 0) ...[
                            SizedBox(
                              height: 44,
                              child: OutlinedButton(
                                onPressed: _goPrevScene,
                                style: OutlinedButton.styleFrom(
                                  side: BorderSide(color: AppColors.zinc700),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                ),
                                child: Icon(LucideIcons.chevronLeft, size: AppSizes.iconMd, color: AppColors.text),
                              ),
                            ),
                            const SizedBox(width: 10),
                          ],
                          // Continue / Finish button
                          Expanded(
                            child: SizedBox(
                              height: 44,
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                  gradient: _currentScene == totalScenes - 1
                                      ? const LinearGradient(colors: [AppColors.purple, AppColors.brand])
                                      : AppGradients.btn,
                                  borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                                ),
                                child: ElevatedButton(
                                  onPressed: () => _goNextScene(totalScenes),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.transparent,
                                    shadowColor: Colors.transparent,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        _currentScene == totalScenes - 1 ? 'Finish Story' : 'Continue',
                                        style: TextStyle(
                                          fontSize: AppSizes.fontSm,
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.bg,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      Icon(
                                        _currentScene == totalScenes - 1 ? LucideIcons.award : LucideIcons.chevronRight,
                                        size: AppSizes.iconMd,
                                        color: AppColors.bg,
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
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompletionScreen(StoryGenerationModel story, List<SceneModel> scenes) {
    final completedScenes = scenes.where((s) => s.isCompleted).length;
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Container(
        decoration: const BoxDecoration(gradient: AppGradients.processing),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(children: [
              const Spacer(flex: 2),
              Container(width: 100, height: 100, decoration: BoxDecoration(borderRadius: BorderRadius.circular(AppSizes.radiusXl), gradient: AppGradients.hero, boxShadow: AppShadows.brandGlowLg(0.3)),
                child: const Icon(LucideIcons.award, size: 44, color: AppColors.bg)),
              const SizedBox(height: 24),
              Text('Story Complete!', style: TextStyle(fontSize: AppSizes.font2xlPlus, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic, color: AppColors.text)),
              const SizedBox(height: 8),
              Text(story.storyTitle, style: TextStyle(fontSize: AppSizes.fontBase, color: AppColors.brand, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              Text('$completedScenes scenes · ${story.totalScenes} total', style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXsPlus, color: AppColors.textTer)),
              const SizedBox(height: 40),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(AppSizes.radiusMd), border: Border.all(color: AppColors.borderMed)),
                child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                  _completionStat(LucideIcons.layers, '$completedScenes', 'Scenes'),
                  Container(width: 1, height: 30, color: AppColors.borderMed),
                  _completionStat(LucideIcons.image, '${story.totalScenes}', 'Images'),
                  Container(width: 1, height: 30, color: AppColors.borderMed),
                  _completionStat(LucideIcons.zap, '${story.creditsSpent}', 'Credits'),
                ]),
              ),
              const Spacer(flex: 3),
              Row(children: [
                Expanded(child: SizedBox(height: 48, child: OutlinedButton.icon(
                  onPressed: () => context.pop(),
                  style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.borderMed), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd))),
                  icon: Icon(LucideIcons.share, size: AppSizes.iconMd, color: AppColors.text),
                  label: Text('Share', style: TextStyle(fontSize: AppSizes.fontSmPlus, fontWeight: FontWeight.w600, color: AppColors.text)),
                ))),
                const SizedBox(width: 10),
                Expanded(child: SizedBox(height: 48, child: DecoratedBox(
                  decoration: BoxDecoration(gradient: AppGradients.btn, borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                  child: ElevatedButton.icon(
                    onPressed: () => context.go('/story'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd))),
                    icon: Icon(LucideIcons.bookOpen, size: AppSizes.iconMd, color: AppColors.bg),
                    label: Text('More Stories', style: TextStyle(fontSize: AppSizes.fontSmPlus, fontWeight: FontWeight.w700, color: AppColors.bg)),
                  ),
                ))),
              ]),
              const SizedBox(height: 32),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _circleBtn(IconData icon, VoidCallback onTap) => Material(
    color: Colors.transparent,
    child: InkWell(
      onTap: onTap,
      customBorder: const CircleBorder(),
      child: Container(
        width: 40, height: 40,
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.5),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
        ),
        child: Icon(icon, size: AppSizes.iconSm, color: AppColors.text),
      ),
    ),
  );

  Widget _completionStat(IconData icon, String value, String label) => Column(children: [
    Icon(icon, size: AppSizes.iconMd, color: AppColors.brand), const SizedBox(height: 4),
    Text(value, style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontBase, fontWeight: FontWeight.w700, color: AppColors.text)),
    Text(label, style: TextStyle(fontSize: AppSizes.fontXxsPlus, color: AppColors.textTer))]);
}
