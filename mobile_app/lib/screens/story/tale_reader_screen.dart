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

/// Tale reader — Scene image hero, progress strip, chapter heading,
/// story text, choice buttons (A/B/C), completion screen with Award icon.
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
          // Hero image — 70% height
          Expanded(
            flex: 7,
            child: Stack(fit: StackFit.expand, children: [
              if (sceneImageUrl != null && sceneImageUrl.isNotEmpty)
                CachedNetworkImage(
                  imageUrl: sceneImageUrl,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(color: AppColors.zinc900, child: const Center(child: CircularProgressIndicator(color: AppColors.brand, strokeWidth: 2))),
                  errorWidget: (_, __, ___) => PlaceholderImage(index: _currentScene, borderRadius: 0),
                )
              else
                PlaceholderImage(index: _currentScene, borderRadius: 0),
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter,
                    colors: [AppColors.bg.withValues(alpha: 0.1), AppColors.bg.withValues(alpha: 0.15), AppColors.bg.withValues(alpha: 0.85), AppColors.bg],
                    stops: const [0.0, 0.5, 0.85, 1.0]),
                ),
              ),
              // Top bar
              Positioned(top: 0, left: 0, right: 0, child: SafeArea(
                child: Padding(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    _circleBtn(LucideIcons.x, () => context.pop()),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.5), borderRadius: BorderRadius.circular(AppSizes.radiusFull)),
                      child: Text('${_currentScene + 1} / $totalScenes', style: AppTextStyles.monoSmall.copyWith(color: AppColors.text)),
                    ),
                    _circleBtn(LucideIcons.share, () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Share coming soon')),
                      );
                    }),
                  ])),
              )),
              // Progress strip
              Positioned(top: 0, left: 0, right: 0, child: SafeArea(
                child: Padding(padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Row(children: List.generate(totalScenes, (i) {
                    return Expanded(child: Container(
                      height: 3, margin: const EdgeInsets.symmetric(horizontal: 1.5),
                      decoration: BoxDecoration(color: i <= _currentScene ? AppColors.purple : Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(2)),
                    ));
                  }))),
              )),
            ]),
          ),
          // Scene content — 30% height
          Expanded(
            flex: 3,
            child: FadeTransition(
              opacity: _fadeController,
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('SCENE ${_currentScene + 1}', style: AppTextStyles.captionMono.copyWith(fontWeight: FontWeight.w700, color: AppColors.purple, letterSpacing: 2)),
                  const SizedBox(height: 6),
                  Text(
                    currentScene?.sceneName ?? 'Scene ${_currentScene + 1}',
                    style: TextStyle(fontSize: AppSizes.font2xl, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic, color: AppColors.text, letterSpacing: -0.5),
                  ),
                  const SizedBox(height: 16),
                  if (currentScene != null && currentScene.promptUsed.isNotEmpty)
                    Text(
                      currentScene.promptUsed,
                      style: TextStyle(fontSize: AppSizes.fontMdPlus, color: AppColors.textSec, height: 1.7),
                      maxLines: 5,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: 24),
                ]),
              ),
            ),
          ),
          // Navigation bar
          Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
            decoration: BoxDecoration(color: AppColors.bg, border: Border(top: BorderSide(color: AppColors.borderMed.withValues(alpha: 0.5)))),
            child: SafeArea(top: false, child: Row(children: [
              if (_currentScene > 0) ...[
                Expanded(child: SizedBox(height: 48, child: OutlinedButton(
                  onPressed: () { _fadeController.reverse().then((_) { if (!mounted) return; setState(() { _currentScene--; }); _fadeController.forward(); }); },
                  style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.borderMed), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd))),
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(LucideIcons.chevronLeft, size: AppSizes.iconMd, color: AppColors.text),
                    const SizedBox(width: 4),
                    Text('Previous', style: TextStyle(fontSize: AppSizes.fontSmPlus, fontWeight: FontWeight.w600, color: AppColors.text)),
                  ]),
                ))),
                const SizedBox(width: 10),
              ],
              Expanded(child: SizedBox(height: 48, child: DecoratedBox(
                decoration: BoxDecoration(gradient: AppGradients.btn, borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                child: ElevatedButton(
                  onPressed: () => _goNextScene(totalScenes),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd))),
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text(_currentScene == totalScenes - 1 ? 'Finish' : 'Continue', style: TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w700, color: AppColors.bg)),
                    const SizedBox(width: 4),
                    Icon(LucideIcons.chevronRight, size: AppSizes.iconMd, color: AppColors.bg),
                  ]),
                ),
              ))),
            ])),
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
    child: InkWell(onTap: onTap, customBorder: const CircleBorder(), child: Container(
      width: 44, height: 44, decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.5), shape: BoxShape.circle, border: Border.all(color: AppColors.borderMed)),
      child: Icon(icon, size: AppSizes.iconBase, color: AppColors.text))));

  Widget _completionStat(IconData icon, String value, String label) => Column(children: [
    Icon(icon, size: AppSizes.iconMd, color: AppColors.brand), const SizedBox(height: 4),
    Text(value, style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontBase, fontWeight: FontWeight.w700, color: AppColors.text)),
    Text(label, style: TextStyle(fontSize: AppSizes.fontXxsPlus, color: AppColors.textTer))]);
}
