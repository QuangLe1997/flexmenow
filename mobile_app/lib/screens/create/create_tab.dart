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

/// Create tab (FlexShot) — "FlexShot" header + Bell icon, Hero Spotlight,
/// FilterBar, Trending horizontal scroll, staggered 2-col grid with
/// Editor's Pick cards interspersed, Premium Collection horizontal scroll.
class CreateTab extends ConsumerStatefulWidget {
  const CreateTab({super.key});

  @override
  ConsumerState<CreateTab> createState() => _CreateTabState();
}

class _CreateTabState extends ConsumerState<CreateTab> {
  String _genderFilter = 'All';
  String _vibeFilter = 'All';
  String _catFilter = 'All';
  final TextEditingController _searchController = TextEditingController();

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

  List<TemplateData> _filteredTemplates(List<TemplateData> all) {
    var list = all.toList();
    if (_genderFilter != 'All') {
      list = list.where((t) => t.gender.toLowerCase() == _genderFilter.toLowerCase()).toList();
    }
    if (_vibeFilter != 'All') {
      list = list.where((t) => t.type.toLowerCase() == _vibeFilter.toLowerCase() || t.category.toLowerCase() == _vibeFilter.toLowerCase()).toList();
    }
    if (_catFilter != 'All') {
      list = list.where((t) => t.style.toLowerCase() == _catFilter.toLowerCase()).toList();
    }
    final query = _searchController.text.toLowerCase();
    if (query.isNotEmpty) {
      list = list.where((t) => t.localizedName('en').toLowerCase().contains(query)).toList();
    }
    return list;
  }

  int get _activeFilterCount {
    int c = 0;
    if (_genderFilter != 'All') c++;
    if (_vibeFilter != 'All') c++;
    if (_catFilter != 'All') c++;
    return c;
  }

  void _resetFilters() {
    setState(() {
      _genderFilter = 'All';
      _vibeFilter = 'All';
      _catFilter = 'All';
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
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
          loading: () => const Center(child: CircularProgressIndicator(color: AppColors.brand)),
          error: (err, _) => Center(child: Text('Failed to load templates', style: TextStyle(color: AppColors.textSec))),
          data: (response) => _buildContent(response),
        ),
      ),
    );
  }

  Widget _buildContent(TemplatesResponse response) {
    final allTemplates = response.activeTemplates;
    final filtered = _filteredTemplates(allTemplates);

    // Extract filter options from response metadata
    final genderFilters = ['All', ...response.genders.map((g) => (g['name'] as Map?)?['en'] as String? ?? g['id'] as String? ?? '').where((s) => s.isNotEmpty && s != 'All')];
    final typeFilters = ['All', ...response.types.map((t) => (t['name'] as Map?)?['en'] as String? ?? t['id'] as String? ?? '').where((s) => s.isNotEmpty && s != 'All')];
    final catFilters = ['All', ...{...allTemplates.map((t) => t.style)}.where((s) => s.isNotEmpty && s != 'All')];

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(child: _buildHeader()),
        SliverToBoxAdapter(child: _buildHeroSpotlight(allTemplates, response)),
        SliverToBoxAdapter(child: _buildFilterBar(genderFilters, typeFilters, catFilters)),
        SliverToBoxAdapter(child: _buildTrending(allTemplates, response)),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
            child: Text(
              'ALL TEMPLATES',
              style: AppTextStyles.mono.copyWith(
                fontSize: AppSizes.fontXxsPlus,
                fontWeight: FontWeight.w700,
                color: AppColors.textTer,
                letterSpacing: 2,
              ),
            ),
          ),
        ),
        _buildTemplateGrid(filtered, response),
        SliverToBoxAdapter(child: _buildPremiumCollection(allTemplates, response)),
        const SliverToBoxAdapter(child: SizedBox(height: 16)),
      ],
    );
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
                TextSpan(text: 'Flex', style: TextStyle(color: AppColors.text)),
                TextSpan(text: 'Shot', style: TextStyle(color: AppColors.brand)),
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
                  shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
                  builder: (_) => Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(children: [
                          Text('Notifications', style: TextStyle(fontSize: AppSizes.fontLg, fontWeight: FontWeight.w700, color: AppColors.text)),
                          const Spacer(),
                          GestureDetector(onTap: () => Navigator.of(context).pop(), child: Icon(LucideIcons.x, size: AppSizes.iconBase, color: AppColors.textSec)),
                        ]),
                        const SizedBox(height: 32),
                        Icon(LucideIcons.bellOff, size: AppSizes.icon4xl, color: AppColors.zinc700),
                        const SizedBox(height: 12),
                        Text('No notifications yet', style: TextStyle(fontSize: AppSizes.fontSmPlus, color: AppColors.textTer)),
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
                child: const Icon(LucideIcons.bell, size: AppSizes.iconBase, color: AppColors.textSec),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroSpotlight(List<TemplateData> allTemplates, TemplatesResponse response) {
    final hotShots = allTemplates.where((t) => t.badge == 'HOT').toList();
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
                  top: 0, left: 0, right: 0,
                  child: Container(height: 2, decoration: const BoxDecoration(gradient: AppGradients.hero)),
                ),
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Colors.transparent, AppColors.bg.withValues(alpha: 0.95)],
                        stops: const [0.0, 0.4, 1.0],
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: 12, left: 12,
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.7),
                          borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                        ),
                        child: Text('SPOTLIGHT', style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXxsPlus, fontWeight: FontWeight.w700, color: AppColors.brand, letterSpacing: 1)),
                      ),
                      if (shot.hasBadge) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                          decoration: BoxDecoration(
                            color: shot.badge == 'HOT' ? AppColors.red : AppColors.brand,
                            borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                          ),
                          child: Text(shot.badge!, style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXxsPlus, fontWeight: FontWeight.w700, color: Colors.white)),
                        ),
                      ],
                    ],
                  ),
                ),
                Positioned(
                  bottom: 16, left: 16, right: 16,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(shot.style.toUpperCase(), style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXxsPlus, fontWeight: FontWeight.w600, color: AppColors.brand, letterSpacing: 1)),
                      const SizedBox(height: 4),
                      Text(shot.localizedName('en'), style: TextStyle(fontSize: AppSizes.font2xl, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic, color: AppColors.text, letterSpacing: -0.5)),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(LucideIcons.heart, size: AppSizes.iconXs, color: AppColors.textSec),
                          const SizedBox(width: 4),
                          Text('${shot.likes}', style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXsPlus, color: AppColors.textSec)),
                          const SizedBox(width: 12),
                          Icon(LucideIcons.eye, size: AppSizes.iconXs, color: AppColors.textSec),
                          const SizedBox(width: 4),
                          Text('${shot.views}', style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXsPlus, color: AppColors.textSec)),
                          const Spacer(),
                          DotIndicator(count: hotShots.length, activeIndex: _spotlightIndex % hotShots.length, dotSize: 5, activeDotWidth: 14, spacing: 2),
                          const SizedBox(width: 8),
                          Container(
                            width: 28, height: 28,
                            decoration: BoxDecoration(shape: BoxShape.circle, color: AppColors.brand.withValues(alpha: 0.2)),
                            child: const Icon(LucideIcons.chevronRight, size: AppSizes.iconSm, color: AppColors.brand),
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

  Widget _buildFilterBar(List<String> genderFilters, List<String> typeFilters, List<String> catFilters) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Container(
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.input,
              borderRadius: BorderRadius.circular(AppSizes.radiusMd),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                const SizedBox(width: 12),
                Icon(LucideIcons.search, size: AppSizes.iconMd, color: AppColors.textTer),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    onChanged: (_) => setState(() {}),
                    style: TextStyle(color: AppColors.text, fontSize: AppSizes.fontSmPlus),
                    decoration: InputDecoration(
                      hintText: 'Search templates...',
                      hintStyle: TextStyle(color: AppColors.textTer, fontSize: AppSizes.fontSmPlus),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.zero,
                      isDense: true,
                    ),
                  ),
                ),
                if (_activeFilterCount > 0) ...[
                  GestureDetector(
                    onTap: _resetFilters,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        color: AppColors.brand.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('$_activeFilterCount', style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXxsPlus, color: AppColors.brand, fontWeight: FontWeight.w700)),
                          const SizedBox(width: 2),
                          Icon(LucideIcons.x, size: 10, color: AppColors.brand),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),
        _buildFilterRow('For', genderFilters, _genderFilter, (v) => setState(() => _genderFilter = v)),
        const SizedBox(height: 6),
        _buildFilterRow('Vibe', typeFilters, _vibeFilter, (v) => setState(() => _vibeFilter = v)),
        const SizedBox(height: 6),
        _buildFilterRow('Cat', catFilters, _catFilter, (v) => setState(() => _catFilter = v)),
      ],
    );
  }

  Widget _buildFilterRow(String label, List<String> options, String selected, ValueChanged<String> onSelect) {
    return SizedBox(
      height: 30,
      child: Row(
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16),
            child: Text(label, style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXxs, fontWeight: FontWeight.w600, color: AppColors.textTer, letterSpacing: 1)),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: options.length,
              separatorBuilder: (_, __) => const SizedBox(width: 6),
              itemBuilder: (_, i) {
                final opt = options[i];
                final isActive = opt == selected;
                return GestureDetector(
                  onTap: () => onSelect(opt),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: isActive ? AppColors.brand.withValues(alpha: 0.15) : Colors.transparent,
                      borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                      border: Border.all(color: isActive ? AppColors.brand.withValues(alpha: 0.4) : AppColors.borderMed),
                    ),
                    child: Text(opt, style: TextStyle(fontSize: AppSizes.fontXsPlus, fontWeight: isActive ? FontWeight.w600 : FontWeight.w400, color: isActive ? AppColors.brand : AppColors.textSec)),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrending(List<TemplateData> allTemplates, TemplatesResponse response) {
    final trending = allTemplates.where((t) => t.badge == 'TRENDING' || t.badge == 'HOT').toList();
    if (trending.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
          child: Text('TRENDING NOW', style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXxsPlus, fontWeight: FontWeight.w700, color: AppColors.textTer, letterSpacing: 2)),
        ),
        SizedBox(
          height: 230,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: trending.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (_, i) {
              final shot = trending[i];
              final imageUrl = response.buildImageUrl(shot.coverImage);
              return GestureDetector(
                onTap: () => context.push('/create/detail/${shot.id}'),
                child: Container(
                  width: 165,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                    border: Border.all(color: AppColors.borderMed),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        PlaceholderImage(index: i, borderRadius: 0, imageUrl: imageUrl),
                        Positioned.fill(
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter, end: Alignment.bottomCenter,
                                colors: [Colors.transparent, AppColors.bg.withValues(alpha: 0.92)],
                                stops: const [0.45, 1.0],
                              ),
                            ),
                          ),
                        ),
                        if (shot.hasBadge)
                          Positioned(
                            top: 10, left: 10,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(color: shot.badge == 'HOT' ? AppColors.red : AppColors.purple, borderRadius: BorderRadius.circular(AppSizes.radiusFull)),
                              child: Text(shot.badge!, style: AppTextStyles.mono.copyWith(fontSize: AppSizes.font2xs, fontWeight: FontWeight.w700, color: Colors.white)),
                            ),
                          ),
                        Positioned(
                          top: 10, right: 10,
                          child: Container(
                            width: 30, height: 30,
                            decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.5), shape: BoxShape.circle),
                            child: Icon(LucideIcons.heart, size: AppSizes.iconSm, color: AppColors.textSec),
                          ),
                        ),
                        Positioned(
                          bottom: 12, left: 12, right: 12,
                          child: Text(shot.localizedName('en'), style: TextStyle(fontSize: AppSizes.fontSmPlus, fontWeight: FontWeight.w700, color: AppColors.text), maxLines: 1, overflow: TextOverflow.ellipsis),
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

  Widget _buildTemplateGrid(List<TemplateData> templates, TemplatesResponse response) {
    final items = <_GridItem>[];
    for (int i = 0; i < templates.length; i++) {
      items.add(_GridItem(template: templates[i]));
      if (i > 0 && i % 6 == 5) {
        items.add(_GridItem(isEditorPick: true, template: templates[i]));
      }
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      sliver: SliverGrid(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            if (index >= items.length) return null;
            final item = items[index];
            if (item.isEditorPick) return _buildEditorPickCard(item.template, response);
            return _buildTemplateCard(item.template, index, response);
          },
          childCount: items.length,
        ),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 0.64,
        ),
      ),
    );
  }

  Widget _buildTemplateCard(TemplateData shot, int index, TemplatesResponse response) {
    final imageUrl = response.buildImageUrl(shot.coverImage);
    return GestureDetector(
      onTap: () => context.push('/create/detail/${shot.id}'),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSizes.radiusXl),
          border: Border.all(color: AppColors.borderMed),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSizes.radiusXl),
          child: Stack(
            fit: StackFit.expand,
            children: [
              PlaceholderImage(index: index, borderRadius: 0, imageUrl: imageUrl),
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter, end: Alignment.bottomCenter,
                      colors: [Colors.transparent, AppColors.bg.withValues(alpha: 0.92)],
                      stops: const [0.45, 1.0],
                    ),
                  ),
                ),
              ),
              if (shot.hasBadge)
                Positioned(
                  top: 10, left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: _badgeColor(shot.badge!), borderRadius: BorderRadius.circular(AppSizes.radiusFull)),
                    child: Text(shot.badge!, style: AppTextStyles.mono.copyWith(fontSize: AppSizes.font2xs, fontWeight: FontWeight.w700, color: Colors.white)),
                  ),
                ),
              if (shot.premium)
                Positioned(
                  top: 10, right: 10,
                  child: Container(
                    width: 26, height: 26,
                    decoration: BoxDecoration(color: AppColors.brand.withValues(alpha: 0.3), shape: BoxShape.circle),
                    child: Icon(LucideIcons.crown, size: AppSizes.iconXs, color: AppColors.brand),
                  ),
                ),
              Positioned(
                bottom: 12, left: 12, right: 12,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(shot.localizedName('en'), style: TextStyle(fontSize: AppSizes.fontSmPlus, fontWeight: FontWeight.w700, color: AppColors.text), maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(LucideIcons.zap, size: 10, color: AppColors.brand),
                        const SizedBox(width: 3),
                        Text('${shot.credits}', style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXxsPlus, color: AppColors.brand, fontWeight: FontWeight.w700)),
                        const Spacer(),
                        Text(shot.category, style: TextStyle(fontSize: AppSizes.fontXxsPlus, color: AppColors.textTer)),
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

  Widget _buildEditorPickCard(TemplateData shot, TemplatesResponse response) {
    final imageUrl = response.buildImageUrl(shot.coverImage);
    return GestureDetector(
      onTap: () => context.push('/create/detail/${shot.id}'),
      child: Container(
        height: 180,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSizes.radiusXl),
          gradient: AppGradients.glass,
          border: Border.all(color: AppColors.brand.withValues(alpha: 0.2)),
        ),
        child: Stack(
          children: [
            Positioned.fill(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                child: PlaceholderImage(index: 7, borderRadius: 0, imageUrl: imageUrl),
              ),
            ),
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                  gradient: LinearGradient(colors: [AppColors.bg.withValues(alpha: 0.7), AppColors.bg.withValues(alpha: 0.3)]),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text("EDITOR'S PICK", style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXxs, fontWeight: FontWeight.w700, color: AppColors.brand, letterSpacing: 2)),
                  const SizedBox(height: 6),
                  Text(shot.localizedName('en'), style: TextStyle(fontSize: AppSizes.fontLg, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic, color: AppColors.text)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumCollection(List<TemplateData> allTemplates, TemplatesResponse response) {
    final premium = allTemplates.where((t) => t.premium).toList();
    if (premium.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 10),
          child: Row(
            children: [
              Icon(LucideIcons.crown, size: AppSizes.iconSm, color: AppColors.brand),
              const SizedBox(width: 6),
              Text('PREMIUM COLLECTION', style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXxsPlus, fontWeight: FontWeight.w700, color: AppColors.brand, letterSpacing: 2)),
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
                    border: Border.all(color: AppColors.brand.withValues(alpha: 0.3)),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        PlaceholderImage(index: i + 3, borderRadius: 0, imageUrl: imageUrl),
                        Positioned(top: 0, left: 0, right: 0, child: Container(height: 2, decoration: const BoxDecoration(gradient: AppGradients.hero))),
                        Positioned(
                          top: 10, right: 10,
                          child: Container(
                            width: 26, height: 26,
                            decoration: BoxDecoration(color: AppColors.brand.withValues(alpha: 0.3), shape: BoxShape.circle),
                            child: Icon(LucideIcons.crown, size: AppSizes.iconXs, color: AppColors.brand),
                          ),
                        ),
                        Positioned(
                          bottom: 0, left: 0, right: 0,
                          child: Container(
                            padding: const EdgeInsets.fromLTRB(12, 20, 12, 12),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, AppColors.bg.withValues(alpha: 0.92)]),
                            ),
                            child: Text(shot.localizedName('en'), style: TextStyle(fontSize: AppSizes.fontXs, fontWeight: FontWeight.w700, color: AppColors.text)),
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

  Color _badgeColor(String badge) {
    switch (badge) {
      case 'HOT': return AppColors.red;
      case 'NEW': return AppColors.green;
      case 'TRENDING': return AppColors.purple;
      case 'POPULAR': return AppColors.blue;
      default: return AppColors.brand;
    }
  }
}

class _GridItem {
  final TemplateData template;
  final bool isEditorPick;
  const _GridItem({required this.template, this.isEditorPick = false});
}
