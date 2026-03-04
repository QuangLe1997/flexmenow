import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_animations.dart';
import '../../core/app_shadows.dart';
import '../../core/app_text_styles.dart';
import '../../core/credit_utils.dart';
import '../../core/design_tokens.dart';
import '../../core/i18n_helper.dart';
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
      loading: () => const Scaffold(
          backgroundColor: AppColors.bg,
          body: Center(
              child: CircularProgressIndicator(color: AppColors.brand))),
      error: (_, __) => const Scaffold(
          backgroundColor: AppColors.bg,
          body: Center(child: Text('Error loading stories'))),
      data: (response) {
        final tale = response.stories.cast<StoryData?>().firstWhere(
              (s) => s!.id == widget.storyId,
              orElse: () => response.stories.isNotEmpty
                  ? response.stories.first
                  : null,
            );
        if (tale == null) {
          return const Scaffold(
              backgroundColor: AppColors.bg,
              body: Center(child: Text('Story not found')));
        }
        return _buildPreview(tale, response);
      },
    );
  }

  Widget _buildPreview(StoryData tale, StoriesResponse response) {
    final coverUrl = response.buildImageUrl(tale.coverImage);
    // Collect ALL available images: previewImages > cover fallback
    final allImages = tale.previewImages.isNotEmpty
        ? tale.previewImages.map((p) => response.buildImageUrl(p)).toList()
        : [coverUrl];
    final imageCount = allImages.length;
    final activeIdx = _heroIndex % imageCount;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Column(
        children: [
          // ─── 3D Hero Banner (full bleed, premium) ───
          SizedBox(
            height: 360,
            child: LayoutBuilder(
              builder: (context, constraints) {
                final screenW = constraints.maxWidth;
                final bannerH = constraints.maxHeight;
                // Card fits within banner (minus top safe area + dots)
                final cardW = screenW * 0.58;
                final cardH = (bannerH - 90).clamp(160.0, 260.0);

                return Stack(
                  fit: StackFit.expand,
                  children: [
                    // Full-bleed background image
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 800),
                      child: PlaceholderImage(
                        key: ValueKey('bg-$activeIdx'),
                        index: activeIdx,
                        borderRadius: 0,
                        imageUrl: allImages[activeIdx],
                      ),
                    ),
                    // Cinematic gradient overlay (top fade + bottom fade)
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            AppColors.bg.withValues(alpha: 0.4),
                            AppColors.bg.withValues(alpha: 0.15),
                            AppColors.bg.withValues(alpha: 0.15),
                            AppColors.bg.withValues(alpha: 0.75),
                            AppColors.bg,
                          ],
                          stops: const [0.0, 0.2, 0.5, 0.8, 1.0],
                        ),
                      ),
                    ),
                    // Ambient purple radial glow behind cards
                    Center(
                      child: Container(
                        width: 280,
                        height: 280,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(
                            colors: [
                              AppColors.purple.withValues(alpha: 0.10),
                              AppColors.purple.withValues(alpha: 0.03),
                              Colors.transparent,
                            ],
                            stops: const [0.0, 0.5, 1.0],
                          ),
                        ),
                      ),
                    ),
                    // 3D carousel — all cards, clipped within banner
                    Positioned.fill(
                      top: 55,
                      bottom: 28,
                      child: Stack(
                        clipBehavior: Clip.none,
                        children: _buildHeroCards(
                          allImages,
                          activeIdx,
                          cardW,
                          cardH,
                          screenW,
                        ),
                      ),
                    ),
                    // Left edge fade overlay
                    Positioned(
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 50,
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                            colors: [
                              AppColors.bg.withValues(alpha: 0.85),
                              Colors.transparent,
                            ],
                          ),
                        ),
                      ),
                    ),
                    // Right edge fade overlay
                    Positioned(
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: 50,
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.centerRight,
                            end: Alignment.centerLeft,
                            colors: [
                              AppColors.bg.withValues(alpha: 0.85),
                              Colors.transparent,
                            ],
                          ),
                        ),
                      ),
                    ),
                    // Top nav buttons
                    Positioned(
                      top: 0,
                      left: 0,
                      right: 0,
                      child: SafeArea(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              _circleBtn(LucideIcons.arrowLeft,
                                  () => context.pop()),
                              Row(children: [
                                _circleBtn(LucideIcons.share, () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                        content: Text('Share coming soon')),
                                  );
                                }),
                                const SizedBox(width: 8),
                                _circleBtn(LucideIcons.bookmark, () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                        content: Text('Bookmark coming soon')),
                                  );
                                }),
                              ]),
                            ],
                          ),
                        ),
                      ),
                    ),
                    // Dot indicator with glow
                    Positioned(
                      bottom: 8,
                      left: 0,
                      right: 0,
                      child: Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.4),
                            borderRadius:
                                BorderRadius.circular(AppSizes.radiusFull),
                          ),
                          child: DotIndicator(
                            count: imageCount,
                            activeIndex: activeIdx,
                            activeColor: AppColors.purple,
                            dotSize: 5,
                            activeDotWidth: 20,
                            showGlow: true,
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),

          // ─── Info + Chapters (with blend overlay) ───
          Expanded(
            child: Stack(
              children: [
                SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 44),
                  Row(children: [
                    _badge(tale.category.toUpperCase(), AppColors.purple),
                    const SizedBox(width: 8),
                    _badge('TALE', AppColors.brand),
                    if (tale.hasBadge) ...[
                      const SizedBox(width: 8),
                      _badge(tale.badge!, AppColors.red)
                    ],
                  ]),
                  const SizedBox(height: 14),
                  Text(localized(tale.title, context),
                      style: TextStyle(
                          fontSize: AppSizes.font2xlMax,
                          fontWeight: FontWeight.w800,
                          fontStyle: FontStyle.italic,
                          color: AppColors.text,
                          letterSpacing: -0.5)),
                  const SizedBox(height: 8),
                  Text(localized(tale.description, context),
                      style: TextStyle(
                          fontSize: AppSizes.fontSm,
                          color: AppColors.textSec,
                          height: 1.5)),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                        color: AppColors.card,
                        borderRadius:
                            BorderRadius.circular(AppSizes.radiusMd),
                        border: Border.all(color: AppColors.borderMed)),
                    child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _stat(LucideIcons.image, '${tale.totalPics}',
                              'Images'),
                          Container(
                              width: 1,
                              height: 30,
                              color: AppColors.borderMed),
                          _stat(LucideIcons.layers, '${tale.chapterCount}',
                              'Chapters'),
                          Container(
                              width: 1,
                              height: 30,
                              color: AppColors.borderMed),
                          _stat(LucideIcons.zap, '${tale.credits}',
                              'Credits'),
                        ]),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Text('CHAPTERS',
                          style: AppTextStyles.monoSmall.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.textTer,
                              letterSpacing: 2)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                            color:
                                AppColors.purple.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(
                                AppSizes.radiusFull)),
                        child: Text('${tale.chapters.length}',
                            style: AppTextStyles.monoSmall.copyWith(
                                fontWeight: FontWeight.w700,
                                color: AppColors.purple)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  ...List.generate(tale.chapters.length, (i) {
                    final ch = tale.chapters[i];
                    final isLast = i == tale.chapters.length - 1;
                    final chapterImageUrl =
                        i < allImages.length ? allImages[i] : coverUrl;
                    final heading = localized(ch.heading, context);
                    final description = localized(ch.text, context);
                    final choices = localizedList(ch.choices, context);
                    return Padding(
                      padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
                      child: GestureDetector(
                        onTap: () => _showChapterDetail(
                          context, ch, i, chapterImageUrl, heading,
                          description, choices,
                        ),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(
                                AppSizes.radiusLg),
                            border: Border.all(
                                color: AppColors.borderMed),
                          ),
                          child: Row(
                            children: [
                              // 3:4 thumbnail with chapter badge
                              SizedBox(
                                width: 90,
                                height: 120,
                                child: Stack(
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(
                                          AppSizes.radiusMd),
                                      child: PlaceholderImage(
                                          index: i,
                                          width: 90,
                                          height: 120,
                                          borderRadius: AppSizes.radiusMd,
                                          imageUrl: chapterImageUrl),
                                    ),
                                    // Chapter number badge
                                    Positioned(
                                      top: 6,
                                      left: 6,
                                      child: Container(
                                        width: 24,
                                        height: 24,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: AppColors.purple,
                                        ),
                                        child: Center(
                                          child: Text('${i + 1}',
                                              style: AppTextStyles.mono
                                                  .copyWith(
                                                      fontSize: AppSizes
                                                          .fontXsPlus,
                                                      fontWeight:
                                                          FontWeight.w700,
                                                      color: Colors.white)),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 14),
                              // Text content
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(heading,
                                        style: TextStyle(
                                            fontSize:
                                                AppSizes.fontMdPlus,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.text)),
                                    if (description.isNotEmpty) ...[
                                      const SizedBox(height: 6),
                                      Text(description,
                                          maxLines: 2,
                                          overflow:
                                              TextOverflow.ellipsis,
                                          style: TextStyle(
                                              fontSize:
                                                  AppSizes.fontSm,
                                              color:
                                                  AppColors.textSec,
                                              height: 1.4)),
                                    ],
                                    if (choices.isNotEmpty) ...[
                                      const SizedBox(height: 8),
                                      Container(
                                        padding:
                                            const EdgeInsets.symmetric(
                                                horizontal: 8,
                                                vertical: 3),
                                        decoration: BoxDecoration(
                                          color: AppColors.purple
                                              .withValues(
                                                  alpha: 0.08),
                                          borderRadius:
                                              BorderRadius.circular(
                                                  AppSizes
                                                      .radiusFull),
                                          border: Border.all(
                                              color: AppColors.purple
                                                  .withValues(
                                                      alpha: 0.15)),
                                        ),
                                        child: Text(
                                            '${choices.length} choices',
                                            style: TextStyle(
                                                fontSize: AppSizes
                                                    .fontXxsPlus,
                                                fontWeight:
                                                    FontWeight.w500,
                                                color: AppColors
                                                    .purple)),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Icon(LucideIcons.chevronRight,
                                  size: AppSizes.iconMd,
                                  color: AppColors.textTer),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
                // Blend gradient overlay — fades banner into info
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 40,
                  child: IgnorePointer(
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            AppColors.bg,
                            AppColors.bg.withValues(alpha: 0.6),
                            Colors.transparent,
                          ],
                          stops: const [0.0, 0.4, 1.0],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ─── CTA Button ───
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
            child: SizedBox(
              width: double.infinity,
              height: 52,
              child: DecoratedBox(
                decoration: BoxDecoration(
                    gradient: AppGradients.btn,
                    borderRadius:
                        BorderRadius.circular(AppSizes.radiusMd)),
                child: ElevatedButton(
                  onPressed: () async {
                    final storiesAsync =
                        ref.read(storiesProvider).value;
                    final tale = storiesAsync?.stories
                        .firstWhere((s) => s.id == widget.storyId);
                    if (tale == null) return;
                    final hasCredits = await ensureCredits(
                        context, ref, tale.credits.toDouble());
                    if (!hasCredits || !context.mounted) return;
                    context.push('/story/upload/${widget.storyId}');
                  },
                  style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(
                              AppSizes.radiusMd))),
                  child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(LucideIcons.play,
                            size: AppSizes.iconBase,
                            color: AppColors.bg),
                        const SizedBox(width: 8),
                        Text('Start Story',
                            style: TextStyle(
                                fontSize: AppSizes.fontBase,
                                fontWeight: FontWeight.w700,
                                color: AppColors.bg)),
                        const SizedBox(width: 8),
                        Text('${tale.credits} ⚡',
                            style: AppTextStyles.mono.copyWith(
                                color: AppColors.bg
                                    .withValues(alpha: 0.7))),
                      ]),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── 3D Hero Carousel (all images, full bleed) ───

  /// Shortest absolute circular distance.
  int _absDist(int i, int active, int n) {
    final d = (i - active + n) % n;
    return d <= n ~/ 2 ? d : n - d;
  }

  /// Shortest signed circular distance (neg = left, pos = right).
  int _signedDist(int i, int active, int n) {
    final d = (i - active + n) % n;
    return d <= n ~/ 2 ? d : d - n;
  }

  List<Widget> _buildHeroCards(
    List<String> images,
    int activeIdx,
    double cardW,
    double cardH,
    double screenW,
  ) {
    final n = images.length;
    if (n == 0) return [];

    // Sort: furthest first (behind), active last (on top / highest z-index)
    final indices = List.generate(n, (i) => i);
    indices.sort((a, b) {
      final da = _absDist(a, activeIdx, n);
      final db = _absDist(b, activeIdx, n);
      if (da != db) return db.compareTo(da);
      return a.compareTo(b);
    });

    return indices.map((i) {
      final d = _signedDist(i, activeIdx, n);
      return _heroCard(images[i], i, d, n, cardW, cardH, screenW);
    }).toList();
  }

  Widget _heroCard(String url, int idx, int signedDist, int total,
      double cardW, double cardH, double screenW) {
    final ad = signedDist.abs();
    final centerLeft = (screenW - cardW) / 2;

    // Show up to 4 cards on each side
    const maxSide = 4;

    if (ad > maxSide) {
      return Positioned(
        key: ValueKey('hero-$idx'),
        left: centerLeft,
        top: 0,
        child: Opacity(
          opacity: 0,
          child: SizedBox(width: cardW, height: cardH),
        ),
      );
    }

    // Spacing: cards spread out toward edges, tighter near center
    final xOffset = signedDist * cardW * 0.46;
    final left = centerLeft + xOffset;

    // Scale: center 1.0, sides shrink progressively
    final scale = ad == 0
        ? 1.0
        : (0.78 - 0.05 * (ad - 1)).clamp(0.52, 0.78);

    // Opacity: center 1.0, sides dim out
    final opacity = ad == 0
        ? 1.0
        : (0.70 - 0.16 * (ad - 1)).clamp(0.15, 0.70);

    // 3D rotation: side cards tilt inward
    final rotDeg = signedDist.clamp(-3, 3) * -16.0;
    final rotY = rotDeg * math.pi / 180;

    // Vertical offset: side cards drop slightly
    final topOffset = ad == 0 ? 0.0 : (10.0 + 6.0 * (ad - 1));

    final isCurrent = ad == 0;

    return AnimatedPositioned(
      key: ValueKey('hero-$idx'),
      duration: const Duration(milliseconds: 600),
      curve: AppCurves.smooth,
      left: left,
      top: topOffset,
      child: AnimatedScale(
        scale: scale,
        duration: const Duration(milliseconds: 600),
        curve: AppCurves.smooth,
        child: AnimatedOpacity(
          duration: const Duration(milliseconds: 500),
          opacity: opacity,
          child: Transform(
            transform: Matrix4.identity()
              ..setEntry(3, 2, 0.0012)
              ..rotateY(rotY),
            alignment: Alignment.center,
            child: Container(
              width: cardW,
              height: cardH,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AppSizes.radiusLg),
                boxShadow: [
                  if (isCurrent) ...[
                    ...AppShadows.cardHero,
                    ...AppShadows.colorGlow(AppColors.purple,
                        opacity: 0.18, blur: 24, spread: 2),
                  ] else ...[
                    ...AppShadows.lg,
                  ],
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(AppSizes.radiusLg),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    PlaceholderImage(
                        index: idx, borderRadius: 0, imageUrl: url),
                    // Dark overlay on non-active cards
                    if (!isCurrent)
                      Container(
                        color: Colors.black.withValues(alpha: 0.25),
                      ),
                    // Bottom gradient on active card (cinematic)
                    if (isCurrent)
                      Positioned(
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: cardH * 0.35,
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: const BorderRadius.only(
                              bottomLeft:
                                  Radius.circular(AppSizes.radiusLg),
                              bottomRight:
                                  Radius.circular(AppSizes.radiusLg),
                            ),
                            gradient: LinearGradient(
                              begin: Alignment.bottomCenter,
                              end: Alignment.topCenter,
                              colors: [
                                Colors.black.withValues(alpha: 0.6),
                                Colors.transparent,
                              ],
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ─── Chapter Detail Modal ───

  void _showChapterDetail(
    BuildContext context,
    ChapterData ch,
    int index,
    String imageUrl,
    String heading,
    String description,
    List<String> choices,
  ) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.92,
        builder: (_, scrollController) => Container(
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(24)),
            border: Border.all(color: AppColors.borderMed),
          ),
          child: ListView(
            controller: scrollController,
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: AppColors.zinc700,
                    borderRadius:
                        BorderRadius.circular(AppSizes.radiusFull),
                  ),
                ),
              ),
              // Hero image 3:4
              ClipRRect(
                borderRadius:
                    BorderRadius.circular(AppSizes.radiusLg),
                child: AspectRatio(
                  aspectRatio: 3 / 4,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      PlaceholderImage(
                        index: index,
                        borderRadius: 0,
                        imageUrl: imageUrl,
                      ),
                      // Bottom gradient
                      Positioned(
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 80,
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.bottomCenter,
                              end: Alignment.topCenter,
                              colors: [
                                Colors.black.withValues(alpha: 0.7),
                                Colors.transparent,
                              ],
                            ),
                          ),
                        ),
                      ),
                      // Chapter badge
                      Positioned(
                        bottom: 12,
                        left: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: AppColors.purple,
                            borderRadius: BorderRadius.circular(
                                AppSizes.radiusFull),
                          ),
                          child: Text('Chapter ${index + 1}',
                              style: AppTextStyles.mono.copyWith(
                                  fontSize: AppSizes.fontXsPlus,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              // Heading
              Text(heading,
                  style: TextStyle(
                      fontSize: AppSizes.fontXl,
                      fontWeight: FontWeight.w700,
                      color: AppColors.text)),
              if (description.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(description,
                    style: TextStyle(
                        fontSize: AppSizes.fontBase,
                        color: AppColors.textSec,
                        height: 1.6)),
              ],
              // Choices
              if (choices.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text('CHOICES',
                    style: AppTextStyles.monoSmall.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textTer,
                        letterSpacing: 2)),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: choices
                      .map((c) => Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.purple
                                  .withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(
                                  AppSizes.radiusFull),
                              border: Border.all(
                                  color: AppColors.purple
                                      .withValues(alpha: 0.2)),
                            ),
                            child: Text(c,
                                style: TextStyle(
                                    fontSize: AppSizes.fontSm,
                                    fontWeight: FontWeight.w500,
                                    color: AppColors.purple)),
                          ))
                      .toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // ─── Helpers ───

  Widget _circleBtn(IconData icon, VoidCallback onTap) => Material(
      color: Colors.transparent,
      child: InkWell(
          onTap: onTap,
          customBorder: const CircleBorder(),
          child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.borderMed)),
              child: Icon(icon,
                  size: AppSizes.iconBase, color: AppColors.text))));

  Widget _badge(String text, Color color) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(AppSizes.radiusFull),
          border: Border.all(color: color.withValues(alpha: 0.2))),
      child: Text(text,
          style: AppTextStyles.captionMono.copyWith(
              fontWeight: FontWeight.w700,
              color: color,
              letterSpacing: 1)));

  Widget _stat(IconData icon, String value, String label) => Column(children: [
        Icon(icon, size: AppSizes.iconMd, color: AppColors.brand),
        const SizedBox(height: 4),
        Text(value,
            style: AppTextStyles.mono.copyWith(
                fontSize: AppSizes.fontBase,
                fontWeight: FontWeight.w700,
                color: AppColors.text)),
        Text(label,
            style: TextStyle(
                fontSize: AppSizes.fontXxsPlus, color: AppColors.textTer))
      ]);
}
