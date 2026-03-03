import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_animations.dart';
import '../../core/app_shadows.dart';
import '../../core/app_text_styles.dart';
import '../../core/credit_utils.dart';
import '../../core/design_tokens.dart';
import '../../data/models/story_data.dart';
import '../../providers/app_providers.dart';
import '../../widgets/dot_indicator.dart';
import '../../widgets/image_slideshow.dart';

/// Tale preview — 3D card stack hero, badges, large italic title, description,
/// 3-stat row, chapter list with thumbnails, "Start Story" CTA.
class TalePreviewScreen extends ConsumerStatefulWidget {
  final String storyId;
  const TalePreviewScreen({super.key, required this.storyId});

  @override
  ConsumerState<TalePreviewScreen> createState() => _TalePreviewScreenState();
}

class _TalePreviewScreenState extends ConsumerState<TalePreviewScreen> {
  int _heroIndex = 0;

  @override
  void initState() {
    super.initState();
    // Cycle hero cards every 3s — actual image count applied in build via modulo
    Future.doWhile(() async {
      await Future.delayed(const Duration(milliseconds: 3000));
      if (!mounted) return false;
      setState(() => _heroIndex++);
      return true;
    });
  }

  @override
  Widget build(BuildContext context) {
    final storiesAsync = ref.watch(storiesProvider);

    return storiesAsync.when(
      loading: () => const Scaffold(backgroundColor: AppColors.bg, body: Center(child: CircularProgressIndicator(color: AppColors.brand))),
      error: (_, __) => const Scaffold(backgroundColor: AppColors.bg, body: Center(child: Text('Error loading stories'))),
      data: (response) {
        final tale = response.stories.cast<StoryData?>().firstWhere(
          (s) => s!.id == widget.storyId,
          orElse: () => response.stories.isNotEmpty ? response.stories.first : null,
        );
        if (tale == null) return const Scaffold(backgroundColor: AppColors.bg, body: Center(child: Text('Story not found')));
        return _buildPreview(tale, response);
      },
    );
  }

  Widget _buildPreview(StoryData tale, StoriesResponse response) {
    final imageUrl = response.buildImageUrl(tale.coverImage);
    // All preview images (fallback to cover if empty)
    final allImages = tale.previewImages.isNotEmpty
        ? tale.previewImages.map((p) => response.buildImageUrl(p)).toList()
        : [imageUrl];
    final imageCount = allImages.length;
    final activeIdx = _heroIndex % imageCount;
    // 3 visible slots: prev / current / next
    final prevIdx = (activeIdx - 1 + imageCount) % imageCount;
    final nextIdx = (activeIdx + 1) % imageCount;
    final visibleSlots = [
      (idx: prevIdx, pos: -1), // left
      (idx: activeIdx, pos: 0), // center
      (idx: nextIdx, pos: 1), // right
    ];

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Column(
        children: [
          SizedBox(
            height: 320,
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Blurred background = current active image
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 600),
                  child: PlaceholderImage(
                    key: ValueKey(activeIdx),
                    index: activeIdx,
                    borderRadius: 0,
                    imageUrl: allImages[activeIdx],
                  ),
                ),
                Container(color: AppColors.bg.withValues(alpha: 0.7)),
                // 3-card carousel
                Center(
                  child: SizedBox(
                    width: 280, height: 260,
                    child: Stack(
                      alignment: Alignment.center,
                      children: visibleSlots.map((slot) {
                        final isCurrent = slot.pos == 0;
                        final xOffset = slot.pos * 40.0;
                        return AnimatedPositioned(
                          duration: AppDurations.slow,
                          curve: AppCurves.smooth,
                          left: 55 + xOffset,
                          child: AnimatedScale(
                            scale: isCurrent ? 1.0 : 0.82,
                            duration: AppDurations.slow,
                            curve: AppCurves.smooth,
                            child: AnimatedOpacity(
                              duration: AppDurations.medium,
                              opacity: isCurrent ? 1.0 : 0.45,
                              child: Container(
                                width: 170, height: 230,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                                  border: Border.all(
                                    color: isCurrent ? AppColors.brand.withValues(alpha: 0.5) : AppColors.borderMed,
                                    width: isCurrent ? 2 : 1,
                                  ),
                                  boxShadow: isCurrent
                                      ? AppShadows.colorGlow(AppColors.purple, opacity: 0.25, blur: 24)
                                      : null,
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                                  child: PlaceholderImage(index: slot.idx, borderRadius: 0, imageUrl: allImages[slot.idx]),
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
                Positioned(
                  top: 0, left: 0, right: 0,
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _circleBtn(LucideIcons.arrowLeft, () => context.pop()),
                          Row(children: [
                            _circleBtn(LucideIcons.share, () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Share coming soon')),
                              );
                            }),
                            const SizedBox(width: 8),
                            _circleBtn(LucideIcons.bookmark, () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Bookmark coming soon')),
                              );
                            }),
                          ]),
                        ],
                      ),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 12, left: 0, right: 0,
                  child: Center(child: DotIndicator(count: imageCount, activeIndex: activeIdx, activeColor: AppColors.purple, dotSize: 6, activeDotWidth: 16)),
                ),
              ],
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    _badge(tale.category.toUpperCase(), AppColors.purple),
                    const SizedBox(width: 8),
                    _badge('TALE', AppColors.brand),
                    if (tale.hasBadge) ...[const SizedBox(width: 8), _badge(tale.badge!, AppColors.red)],
                  ]),
                  const SizedBox(height: 12),
                  Text(tale.localizedTitle('en'), style: TextStyle(fontSize: AppSizes.font2xlMax, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic, color: AppColors.text, letterSpacing: -0.5)),
                  const SizedBox(height: 8),
                  Text(tale.localizedDescription('en'), style: TextStyle(fontSize: AppSizes.fontSm, color: AppColors.textSec, height: 1.5)),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(AppSizes.radiusMd), border: Border.all(color: AppColors.borderMed)),
                    child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                      _stat(LucideIcons.image, '${tale.totalPics}', 'Images'),
                      Container(width: 1, height: 30, color: AppColors.borderMed),
                      _stat(LucideIcons.layers, '${tale.chapterCount}', 'Chapters'),
                      Container(width: 1, height: 30, color: AppColors.borderMed),
                      _stat(LucideIcons.zap, '${tale.credits}', 'Credits'),
                    ]),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Text('CHAPTERS', style: AppTextStyles.monoSmall.copyWith(fontWeight: FontWeight.w700, color: AppColors.textTer, letterSpacing: 2)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: AppColors.purple.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(AppSizes.radiusFull)),
                        child: Text('${tale.chapters.length}', style: AppTextStyles.monoSmall.copyWith(fontWeight: FontWeight.w700, color: AppColors.purple)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  ...List.generate(tale.chapters.length, (i) {
                    final ch = tale.chapters[i];
                    final isLast = i == tale.chapters.length - 1;
                    // Each chapter maps to its own preview image
                    final chapterImageUrl = i < allImages.length
                        ? allImages[i]
                        : imageUrl;
                    return Padding(
                      padding: EdgeInsets.only(bottom: isLast ? 0 : 14),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Timeline indicator
                          Column(
                            children: [
                              Container(
                                width: 28, height: 28,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: AppColors.purple.withValues(alpha: 0.12),
                                  border: Border.all(color: AppColors.purple.withValues(alpha: 0.3)),
                                ),
                                child: Center(
                                  child: Text('${i + 1}', style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXsPlus, fontWeight: FontWeight.w700, color: AppColors.purple)),
                                ),
                              ),
                              if (!isLast)
                                Container(width: 1.5, height: 68, color: AppColors.purple.withValues(alpha: 0.12)),
                            ],
                          ),
                          const SizedBox(width: 14),
                          // Chapter card
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: AppColors.card,
                                borderRadius: BorderRadius.circular(AppSizes.radiusLg),
                                border: Border.all(color: AppColors.borderMed),
                              ),
                              child: Row(
                                children: [
                                  // Chapter thumbnail
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                                    child: PlaceholderImage(index: i, width: 64, height: 64, borderRadius: AppSizes.radiusMd, imageUrl: chapterImageUrl),
                                  ),
                                  const SizedBox(width: 14),
                                  // Chapter info
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(ch.localizedHeading('en'), style: TextStyle(fontSize: AppSizes.fontMdPlus, fontWeight: FontWeight.w600, color: AppColors.text)),
                                        if (ch.localizedChoices('en').isNotEmpty) ...[
                                          const SizedBox(height: 8),
                                          Wrap(
                                            spacing: 6,
                                            runSpacing: 6,
                                            children: ch.localizedChoices('en').take(3).map((c) => Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: AppColors.purple.withValues(alpha: 0.08),
                                                borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                                                border: Border.all(color: AppColors.purple.withValues(alpha: 0.15)),
                                              ),
                                              child: Text(c, style: TextStyle(fontSize: AppSizes.fontXxsPlus, fontWeight: FontWeight.w500, color: AppColors.purple)),
                                            )).toList(),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Icon(LucideIcons.chevronRight, size: AppSizes.iconMd, color: AppColors.textTer),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
            child: SizedBox(
              width: double.infinity, height: 52,
              child: DecoratedBox(
                decoration: BoxDecoration(gradient: AppGradients.btn, borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                child: ElevatedButton(
                  onPressed: () async {
                    final storiesAsync = ref.read(storiesProvider).value;
                    final tale = storiesAsync?.stories.firstWhere((s) => s.id == widget.storyId);
                    if (tale == null) return;
                    final hasCredits = await ensureCredits(context, ref, tale.credits.toDouble());
                    if (!hasCredits || !context.mounted) return;
                    context.push('/story/upload/${widget.storyId}');
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd))),
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(LucideIcons.play, size: AppSizes.iconBase, color: AppColors.bg),
                    const SizedBox(width: 8),
                    Text('Start Story', style: TextStyle(fontSize: AppSizes.fontBase, fontWeight: FontWeight.w700, color: AppColors.bg)),
                    const SizedBox(width: 8),
                    Text('${tale.credits} ⚡', style: AppTextStyles.mono.copyWith(color: AppColors.bg.withValues(alpha: 0.7))),
                  ]),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _circleBtn(IconData icon, VoidCallback onTap) => Material(
    color: Colors.transparent,
    child: InkWell(onTap: onTap, customBorder: const CircleBorder(), child: Container(
      width: 44, height: 44, decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.5), shape: BoxShape.circle, border: Border.all(color: AppColors.borderMed)),
      child: Icon(icon, size: AppSizes.iconBase, color: AppColors.text))));

  Widget _badge(String text, Color color) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(AppSizes.radiusFull), border: Border.all(color: color.withValues(alpha: 0.2))),
    child: Text(text, style: AppTextStyles.captionMono.copyWith(fontWeight: FontWeight.w700, color: color, letterSpacing: 1)));

  Widget _stat(IconData icon, String value, String label) => Column(children: [
    Icon(icon, size: AppSizes.iconMd, color: AppColors.brand), const SizedBox(height: 4),
    Text(value, style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontBase, fontWeight: FontWeight.w700, color: AppColors.text)),
    Text(label, style: TextStyle(fontSize: AppSizes.fontXxsPlus, color: AppColors.textTer))]);
}
