import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_animations.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../../data/models/template_data.dart';
import '../../providers/app_providers.dart';
import '../../widgets/dot_indicator.dart';
import '../../widgets/image_slideshow.dart';

/// Create tab (FlexShot) — Header, Hero Spotlight, category-based rows
/// (top 6 per category, horizontal scroll), "View more" → category detail.
class CreateTab extends ConsumerStatefulWidget {
  const CreateTab({super.key});

  @override
  ConsumerState<CreateTab> createState() => _CreateTabState();
}

class _CreateTabState extends ConsumerState<CreateTab> {
  // Hero spotlight cycling
  int _spotlightIndex = 0;
  Timer? _spotlightTimer;

  @override
  void initState() {
    super.initState();
    _spotlightTimer = Timer.periodic(const Duration(milliseconds: 4000), (_) {
      if (mounted) setState(() => _spotlightIndex++);
    });
  }

  @override
  void dispose() {
    _spotlightTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final templatesAsync = ref.watch(templatesProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: templatesAsync.when(
          loading: () => const Center(
              child: CircularProgressIndicator(color: AppColors.brand)),
          error: (err, _) => Center(
              child: Text('Failed to load templates',
                  style: TextStyle(color: AppColors.textSec))),
          data: (response) => _buildContent(response),
        ),
      ),
    );
  }

  Widget _buildContent(TemplatesResponse response) {
    final allTemplates = response.activeTemplates;

    // Group templates by category, maintain sort order
    final categoryMap = <String, List<TemplateData>>{};
    for (final cat in response.categories) {
      final catId = cat['id'] as String? ?? '';
      if (catId.isEmpty) continue;
      final templates = allTemplates
          .where((t) => t.category == catId)
          .toList()
        ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
      if (templates.isNotEmpty) {
        categoryMap[catId] = templates;
      }
    }

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(child: _buildHeader()),
        SliverToBoxAdapter(
            child: _buildHeroSpotlight(allTemplates, response)),

        // Category rows
        for (final entry in categoryMap.entries)
          SliverToBoxAdapter(
            child: _buildCategoryRow(
              categoryId: entry.key,
              categoryName: _getCategoryName(entry.key, response),
              templates: entry.value,
              response: response,
            ),
          ),

        // Premium collection at bottom
        SliverToBoxAdapter(
            child: _buildPremiumCollection(allTemplates, response)),
        const SliverToBoxAdapter(child: SizedBox(height: 16)),
      ],
    );
  }

  String _getCategoryName(String catId, TemplatesResponse response) {
    for (final cat in response.categories) {
      if (cat['id'] == catId) {
        final nameMap = cat['name'] as Map<String, dynamic>?;
        return (nameMap?['en'] ?? catId) as String;
      }
    }
    return catId[0].toUpperCase() + catId.substring(1);
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Row(
        children: [
          RichText(
            text: TextSpan(
              style: TextStyle(
                fontSize: AppSizes.fontXlPlus,
                fontWeight: FontWeight.w800,
                fontStyle: FontStyle.italic,
              ),
              children: const [
                TextSpan(
                    text: 'Flex', style: TextStyle(color: AppColors.text)),
                TextSpan(
                    text: 'Shot', style: TextStyle(color: AppColors.brand)),
              ],
            ),
          ),
          const Spacer(),
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () {
                showModalBottomSheet(
                  context: context,
                  backgroundColor: AppColors.card,
                  shape: const RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.vertical(top: Radius.circular(20))),
                  builder: (_) => Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(children: [
                          Text('Notifications',
                              style: TextStyle(
                                  fontSize: AppSizes.fontLg,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.text)),
                          const Spacer(),
                          GestureDetector(
                              onTap: () => Navigator.of(context).pop(),
                              child: Icon(LucideIcons.x,
                                  size: AppSizes.iconBase,
                                  color: AppColors.textSec)),
                        ]),
                        const SizedBox(height: 32),
                        Icon(LucideIcons.bellOff,
                            size: AppSizes.icon4xl, color: AppColors.zinc700),
                        const SizedBox(height: 12),
                        Text('No notifications yet',
                            style: TextStyle(
                                fontSize: AppSizes.fontSmPlus,
                                color: AppColors.textTer)),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                );
              },
              customBorder: const CircleBorder(),
              child: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.card,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.borderMed),
                ),
                child: const Icon(LucideIcons.bell,
                    size: AppSizes.iconBase, color: AppColors.textSec),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroSpotlight(
      List<TemplateData> allTemplates, TemplatesResponse response) {
    final hotShots =
        allTemplates.where((t) => t.badge == 'HOT').toList();
    if (hotShots.isEmpty) return const SizedBox.shrink();
    final shot = hotShots[_spotlightIndex % hotShots.length];
    final imageUrl = response.buildImageUrl(shot.coverImage);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      child: GestureDetector(
        onTap: () => context.push('/create/detail/${shot.id}'),
        child: Container(
          height: 280,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSizes.radiusXl),
            border: Border.all(color: AppColors.borderMed),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppSizes.radiusXl),
            child: Stack(
              fit: StackFit.expand,
              children: [
                AnimatedSwitcher(
                  duration: AppDurations.slower,
                  child: PlaceholderImage(
                    key: ValueKey(shot.id),
                    index: hotShots.indexOf(shot),
                    borderRadius: 0,
                    imageUrl: imageUrl,
                  ),
                ),
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                      height: 2,
                      decoration:
                          const BoxDecoration(gradient: AppGradients.hero)),
                ),
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.transparent,
                          AppColors.bg.withValues(alpha: 0.95)
                        ],
                        stops: const [0.0, 0.4, 1.0],
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: 12,
                  left: 12,
                  right: 12,
                  child: Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.7),
                          borderRadius:
                              BorderRadius.circular(AppSizes.radiusFull),
                        ),
                        child: Text('SPOTLIGHT',
                            style: AppTextStyles.mono.copyWith(
                                fontSize: AppSizes.fontXxsPlus,
                                fontWeight: FontWeight.w700,
                                color: AppColors.brand,
                                letterSpacing: 1)),
                      ),
                      if (shot.hasBadge)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 5),
                          decoration: BoxDecoration(
                            color: shot.badge == 'HOT'
                                ? AppColors.red
                                : AppColors.brand,
                            borderRadius:
                                BorderRadius.circular(AppSizes.radiusFull),
                          ),
                          child: Text(shot.badge!,
                              style: AppTextStyles.mono.copyWith(
                                  fontSize: AppSizes.fontXxsPlus,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white)),
                        ),
                    ],
                  ),
                ),
                Positioned(
                  bottom: 16,
                  left: 16,
                  right: 16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(shot.style.toUpperCase(),
                          style: AppTextStyles.mono.copyWith(
                              fontSize: AppSizes.fontXxsPlus,
                              fontWeight: FontWeight.w600,
                              color: AppColors.brand,
                              letterSpacing: 1)),
                      const SizedBox(height: 4),
                      Text(shot.localizedName('en'),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              fontSize: AppSizes.font2xl,
                              fontWeight: FontWeight.w800,
                              fontStyle: FontStyle.italic,
                              color: AppColors.text,
                              letterSpacing: -0.5)),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Flexible(
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(LucideIcons.heart,
                                    size: AppSizes.iconXs,
                                    color: AppColors.textSec),
                                const SizedBox(width: 4),
                                Text('${shot.likes}',
                                    style: AppTextStyles.mono.copyWith(
                                        fontSize: AppSizes.fontXsPlus,
                                        color: AppColors.textSec)),
                                const SizedBox(width: 12),
                                Icon(LucideIcons.eye,
                                    size: AppSizes.iconXs,
                                    color: AppColors.textSec),
                                const SizedBox(width: 4),
                                Text('${shot.views}',
                                    style: AppTextStyles.mono.copyWith(
                                        fontSize: AppSizes.fontXsPlus,
                                        color: AppColors.textSec)),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Flexible(
                              child: DotIndicator(
                                  count: hotShots.length,
                                  activeIndex:
                                      _spotlightIndex % hotShots.length,
                                  dotSize: 5,
                                  activeDotWidth: 14,
                                  spacing: 2)),
                          const SizedBox(width: 8),
                          Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color:
                                    AppColors.brand.withValues(alpha: 0.2)),
                            child: const Icon(LucideIcons.chevronRight,
                                size: AppSizes.iconSm,
                                color: AppColors.brand),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// Builds a single category row: title + "View more" + horizontal list (top 6).
  Widget _buildCategoryRow({
    required String categoryId,
    required String categoryName,
    required List<TemplateData> templates,
    required TemplatesResponse response,
  }) {
    final top6 = templates.take(6).toList();
    final totalCount = templates.length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Category header
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 20, 12, 10),
          child: Row(
            children: [
              Text(
                categoryName.toUpperCase(),
                style: AppTextStyles.mono.copyWith(
                  fontSize: AppSizes.fontXsPlus,
                  fontWeight: FontWeight.w700,
                  color: AppColors.text,
                  letterSpacing: 1.5,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.brand.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                ),
                child: Text(
                  '$totalCount',
                  style: AppTextStyles.mono.copyWith(
                    fontSize: AppSizes.fontXxsPlus,
                    fontWeight: FontWeight.w700,
                    color: AppColors.brand,
                  ),
                ),
              ),
              const Spacer(),
              if (totalCount > 6)
                GestureDetector(
                  onTap: () =>
                      context.push('/create/category/$categoryId'),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'View more',
                        style: TextStyle(
                          fontSize: AppSizes.fontXs,
                          fontWeight: FontWeight.w600,
                          color: AppColors.brand,
                        ),
                      ),
                      const SizedBox(width: 2),
                      Icon(LucideIcons.chevronRight,
                          size: AppSizes.iconSm, color: AppColors.brand),
                    ],
                  ),
                ),
            ],
          ),
        ),

        // Horizontal template list (top 6)
        SizedBox(
          height: 220,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: top6.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) {
              final shot = top6[i];
              final imageUrl = response.buildImageUrl(shot.coverImage);
              return _CategoryTemplateCard(
                shot: shot,
                imageUrl: imageUrl,
                index: i,
                onTap: () =>
                    context.push('/create/detail/${shot.id}'),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildPremiumCollection(
      List<TemplateData> allTemplates, TemplatesResponse response) {
    final premium = allTemplates.where((t) => t.premium).toList();
    if (premium.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 10),
          child: Row(
            children: [
              Icon(LucideIcons.crown,
                  size: AppSizes.iconSm, color: AppColors.brand),
              const SizedBox(width: 6),
              Text('PREMIUM COLLECTION',
                  style: AppTextStyles.mono.copyWith(
                      fontSize: AppSizes.fontXxsPlus,
                      fontWeight: FontWeight.w700,
                      color: AppColors.brand,
                      letterSpacing: 2)),
            ],
          ),
        ),
        SizedBox(
          height: 210,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: premium.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (_, i) {
              final shot = premium[i];
              final imageUrl = response.buildImageUrl(shot.coverImage);
              return GestureDetector(
                onTap: () => context.push('/create/detail/${shot.id}'),
                child: Container(
                  width: 155,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                    border: Border.all(
                        color: AppColors.brand.withValues(alpha: 0.3)),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        PlaceholderImage(
                            index: i + 3,
                            borderRadius: 0,
                            imageUrl: imageUrl),
                        Positioned(
                            top: 0,
                            left: 0,
                            right: 0,
                            child: Container(
                                height: 2,
                                decoration: const BoxDecoration(
                                    gradient: AppGradients.hero))),
                        Positioned(
                          top: 10,
                          right: 10,
                          child: Container(
                            width: 26,
                            height: 26,
                            decoration: BoxDecoration(
                                color:
                                    AppColors.brand.withValues(alpha: 0.3),
                                shape: BoxShape.circle),
                            child: Icon(LucideIcons.crown,
                                size: AppSizes.iconXs,
                                color: AppColors.brand),
                          ),
                        ),
                        Positioned(
                          bottom: 0,
                          left: 0,
                          right: 0,
                          child: Container(
                            padding:
                                const EdgeInsets.fromLTRB(12, 20, 12, 12),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                                    Colors.transparent,
                                    AppColors.bg.withValues(alpha: 0.92)
                                  ]),
                            ),
                            child: Text(shot.localizedName('en'),
                                style: TextStyle(
                                    fontSize: AppSizes.fontXs,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.text)),
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
      ],
    );
  }
}

/// Template card used in category horizontal rows.
class _CategoryTemplateCard extends StatelessWidget {
  final TemplateData shot;
  final String imageUrl;
  final int index;
  final VoidCallback onTap;

  const _CategoryTemplateCard({
    required this.shot,
    required this.imageUrl,
    required this.index,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 150,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSizes.radiusXl),
          border: Border.all(color: AppColors.borderMed),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSizes.radiusXl),
          child: Stack(
            fit: StackFit.expand,
            children: [
              PlaceholderImage(
                  index: index, borderRadius: 0, imageUrl: imageUrl),
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        AppColors.bg.withValues(alpha: 0.92),
                      ],
                      stops: const [0.45, 1.0],
                    ),
                  ),
                ),
              ),
              if (shot.hasBadge)
                Positioned(
                  top: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: _badgeColor(shot.badge!),
                      borderRadius:
                          BorderRadius.circular(AppSizes.radiusFull),
                    ),
                    child: Text(
                      shot.badge!,
                      style: AppTextStyles.mono.copyWith(
                        fontSize: AppSizes.font2xs,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              if (shot.premium)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: AppColors.brand.withValues(alpha: 0.3),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(LucideIcons.crown,
                        size: AppSizes.iconXs, color: AppColors.brand),
                  ),
                ),
              Positioned(
                bottom: 10,
                left: 10,
                right: 10,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      shot.localizedName('en'),
                      style: TextStyle(
                        fontSize: AppSizes.fontXs,
                        fontWeight: FontWeight.w700,
                        color: AppColors.text,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        Icon(LucideIcons.zap,
                            size: 10, color: AppColors.brand),
                        const SizedBox(width: 2),
                        Text(
                          '${shot.credits}',
                          style: AppTextStyles.mono.copyWith(
                            fontSize: AppSizes.fontXxsPlus,
                            color: AppColors.brand,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          shot.style,
                          style: TextStyle(
                            fontSize: AppSizes.font3xs,
                            color: AppColors.textTer,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _badgeColor(String badge) {
    switch (badge) {
      case 'HOT':
        return AppColors.red;
      case 'NEW':
        return AppColors.green;
      case 'TRENDING':
        return AppColors.purple;
      case 'POPULAR':
        return AppColors.blue;
      default:
        return AppColors.brand;
    }
  }
}
