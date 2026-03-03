import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_images.dart';
import '../../core/app_shadows.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../../data/models/story_data.dart';
import '../../providers/app_providers.dart';
import '../../widgets/image_slideshow.dart';
import '../../widgets/story_cards/story_card_base.dart';

/// Story tab (FlexTale) — header + credits badge, banner, filter bar,
/// WOW hero card (animated gradient or mini-dashboard), story cards with varied styles.
class StoryTab extends ConsumerStatefulWidget {
  const StoryTab({super.key});

  @override
  ConsumerState<StoryTab> createState() => _StoryTabState();
}

class _StoryTabState extends ConsumerState<StoryTab> with TickerProviderStateMixin {
  String _forFilter = 'All';
  String _vibeFilter = 'All';
  String _timeFilter = 'All';
  final bool _isWowSubscribed = false; // placeholder

  late final AnimationController _wowGlowController;

  @override
  void initState() {
    super.initState();
    _wowGlowController = AnimationController(vsync: this, duration: const Duration(milliseconds: 4000))..repeat();
  }

  List<StoryData> _filteredStories(List<StoryData> all) {
    var list = all.toList();
    if (_forFilter != 'All') {
      list = list.where((t) => t.gender.toLowerCase() == _forFilter.toLowerCase()).toList();
    }
    if (_vibeFilter != 'All') {
      list = list.where((t) => t.category.toLowerCase() == _vibeFilter.toLowerCase()).toList();
    }
    if (_timeFilter != 'All') {
      final durMap = {'Moment': 'moment', 'One Day': 'once', 'Many Days': 'many'};
      list = list.where((t) => t.duration == (durMap[_timeFilter] ?? '')).toList();
    }
    return list;
  }

  @override
  void dispose() {
    _wowGlowController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final storiesAsync = ref.watch(storiesProvider);
    final credits = ref.watch(creditsProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: storiesAsync.when(
          loading: () => const Center(child: CircularProgressIndicator(color: AppColors.brand)),
          error: (_, __) => Center(child: Text('Failed to load stories', style: TextStyle(color: AppColors.textSec))),
          data: (response) => _buildContent(response, credits),
        ),
      ),
    );
  }

  Widget _buildContent(StoriesResponse response, double credits) {
    final allStories = response.activeStories;
    final filtered = _filteredStories(allStories);

    // Extract filter options
    final forFilters = ['All', ...response.genders.map((g) => (g['name'] as Map?)?['en'] as String? ?? g['id'] as String? ?? '').where((s) => s.isNotEmpty && s != 'All')];
    final vibeFilters = ['All', ...{...allStories.map((s) => s.category)}.where((s) => s.isNotEmpty && s != 'All')];
    final timeFilters = ['All', 'Moment', 'One Day', 'Many Days'];

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(child: _buildHeader(credits)),
        SliverToBoxAdapter(child: _buildBanner()),
        SliverToBoxAdapter(child: _buildFilterBar(forFilters, vibeFilters, timeFilters)),
        SliverToBoxAdapter(child: _buildWowCard()),
        SliverToBoxAdapter(child: _buildStoryListHeader()),
        _buildStoryList(filtered, response),
        const SliverToBoxAdapter(child: SizedBox(height: 16)),
      ],
    );
  }

  Widget _buildHeader(double credits) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Row(
        children: [
          RichText(
            text: TextSpan(
              style: TextStyle(fontSize: AppSizes.fontXlPlus, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic),
              children: const [
                TextSpan(text: 'Flex', style: TextStyle(color: AppColors.text)),
                TextSpan(text: 'Tale', style: TextStyle(color: AppColors.brand)),
              ],
            ),
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(AppSizes.radiusFull), border: Border.all(color: AppColors.borderMed)),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(LucideIcons.zap, size: 13, color: AppColors.brand),
              const SizedBox(width: 4),
              Text('${credits.toInt()}', style: AppTextStyles.mono.copyWith(fontWeight: FontWeight.w700, color: AppColors.brand)),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _buildBanner() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      child: Container(
        height: 100,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSizes.radiusLg),
          gradient: AppGradients.story,
          border: Border.all(color: AppColors.brand.withValues(alpha: 0.2)),
        ),
        child: Stack(children: [
          Positioned.fill(child: ClipRRect(borderRadius: BorderRadius.circular(AppSizes.radiusLg), child: Opacity(opacity: 0.1, child: PlaceholderImage(index: 3, borderRadius: 0, imageUrl: AppImages.bannerFlextale)))),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
              Text('Interactive Stories', style: TextStyle(fontSize: AppSizes.fontLg, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic, color: AppColors.text)),
              const SizedBox(height: 4),
              Text('Live the narrative — choose your path', style: TextStyle(fontSize: AppSizes.fontXs, color: AppColors.textSec)),
            ]),
          ),
        ]),
      ),
    );
  }

  Widget _buildFilterBar(List<String> forFilters, List<String> vibeFilters, List<String> timeFilters) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(children: [
        _filterRow('For', forFilters, _forFilter, (v) => setState(() => _forFilter = v)),
        const SizedBox(height: 6),
        _filterRow('Vibe', vibeFilters, _vibeFilter, (v) => setState(() => _vibeFilter = v)),
        const SizedBox(height: 6),
        _filterRow('Time', timeFilters, _timeFilter, (v) => setState(() => _timeFilter = v)),
      ]),
    );
  }

  Widget _filterRow(String label, List<String> options, String selected, ValueChanged<String> onSelect) {
    return SizedBox(
      height: 30,
      child: Row(children: [
        SizedBox(width: 32, child: Text(label, style: AppTextStyles.captionMono.copyWith(color: AppColors.textTer, letterSpacing: 1))),
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
                    color: isActive ? AppColors.purple.withValues(alpha: 0.15) : Colors.transparent,
                    borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                    border: Border.all(color: isActive ? AppColors.purple.withValues(alpha: 0.4) : AppColors.borderMed),
                  ),
                  child: Text(opt, style: TextStyle(fontSize: AppSizes.fontXsPlus, fontWeight: isActive ? FontWeight.w600 : FontWeight.w400, color: isActive ? AppColors.purple : AppColors.textSec)),
                ),
              );
            },
          ),
        ),
      ]),
    );
  }

  Widget _buildWowCard() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: GestureDetector(
        onTap: () => context.push('/story/wow'),
        child: _isWowSubscribed ? _buildWowDashboard() : _buildWowPromo(),
      ),
    );
  }

  Widget _buildWowPromo() {
    return AnimatedBuilder(
      animation: _wowGlowController,
      builder: (_, __) {
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSizes.radiusXl),
            gradient: LinearGradient(
              begin: Alignment(-1 + 2 * _wowGlowController.value, -1),
              end: Alignment(1 - 2 * _wowGlowController.value, 1),
              colors: const [AppColors.purple, AppColors.brand, AppColors.pink, AppColors.purple],
            ),
            boxShadow: AppShadows.colorGlow(AppColors.purple),
          ),
          child: Column(children: [
            Icon(LucideIcons.crown, size: AppSizes.icon4xl, color: Colors.white),
            const SizedBox(height: 12),
            Text('MAKE ME WOW EVERYDAY', style: TextStyle(fontSize: AppSizes.fontBase, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic, color: Colors.white, letterSpacing: 0.5)),
            const SizedBox(height: 6),
            Text('AI photos of you, delivered daily', style: TextStyle(fontSize: AppSizes.fontXs, color: Colors.white.withValues(alpha: 0.8))),
            const SizedBox(height: 12),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              _wowBadge('SUBSCRIPTION ONLY', Colors.white.withValues(alpha: 0.15)),
              const SizedBox(width: 8),
              _wowBadge('From \$2.99', AppColors.brand.withValues(alpha: 0.3)),
            ]),
            const SizedBox(height: 14),
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => context.push('/story/wow'),
                borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                child: Container(
                  width: double.infinity, height: 44,
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.95), borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                  child: Center(child: Text('Subscribe Now', style: TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w700, color: AppColors.bg))),
                ),
              ),
            ),
          ]),
        );
      },
    );
  }

  Widget _wowBadge(String text, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(AppSizes.radiusFull)),
      child: Text(text, style: AppTextStyles.captionMono.copyWith(color: Colors.white)),
    );
  }

  Widget _buildWowDashboard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(AppSizes.radiusXl), border: Border.all(color: AppColors.brand.withValues(alpha: 0.3))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(LucideIcons.crown, size: AppSizes.iconMd, color: AppColors.brand),
          const SizedBox(width: 6),
          Text('WOW Everyday', style: TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w700, color: AppColors.text)),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(color: AppColors.green.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(AppSizes.radiusFull)),
            child: Text('ACTIVE', style: AppTextStyles.captionMono.copyWith(fontWeight: FontWeight.w700, color: AppColors.green)),
          ),
        ]),
        const SizedBox(height: 12),
        ClipRRect(borderRadius: BorderRadius.circular(2), child: LinearProgressIndicator(value: 0.4, backgroundColor: AppColors.zinc800, valueColor: const AlwaysStoppedAnimation(AppColors.brand), minHeight: 4)),
        const SizedBox(height: 6),
        Text('Day 3 of 7', style: AppTextStyles.monoSmall.copyWith(color: AppColors.textSec)),
        const SizedBox(height: 12),
        Row(children: [
          Text("View today's WOW", style: TextStyle(fontSize: AppSizes.fontSmPlus, fontWeight: FontWeight.w600, color: AppColors.brand)),
          const SizedBox(width: 4),
          Icon(LucideIcons.chevronRight, size: AppSizes.iconSm, color: AppColors.brand),
        ]),
      ]),
    );
  }

  Widget _buildStoryListHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text('STORIES', style: AppTextStyles.monoSmall.copyWith(fontWeight: FontWeight.w700, color: AppColors.textTer, letterSpacing: 2)),
    );
  }

  SliverList _buildStoryList(List<StoryData> tales, StoriesResponse response) {
    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          if (index >= tales.length) return null;
          final tale = tales[index];
          final data = StoryCardData(
            tale: tale,
            response: response,
            cardIndex: index,
            onTap: () => context.push('/story/preview/${tale.id}'),
          );
          return Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: buildStoryCardForStyle(styleIndex: index, data: data),
          );
        },
        childCount: tales.length,
      ),
    );
  }
}
