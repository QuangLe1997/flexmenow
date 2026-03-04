import 'package:cached_network_image/cached_network_image.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_animations.dart';
import '../../core/app_shadows.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../../data/mock_data.dart';
import '../../providers/app_providers.dart';
import '../../widgets/image_slideshow.dart';

/// Me tab — Premium profile + history gallery.
class MeTab extends ConsumerStatefulWidget {
  const MeTab({super.key});

  @override
  ConsumerState<MeTab> createState() => _MeTabState();
}

class _MeTabState extends ConsumerState<MeTab> with SingleTickerProviderStateMixin {
  int _selectedTabIndex = 0;
  static const _tabs = ['Glow', 'Shots', 'Tales'];

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider).value;
    final displayName = user?.displayName ?? 'FlexMe User';
    final credits = user?.creditsBalance ?? 0;
    final totalShots = user?.totalGenerations ?? 0;
    final totalStories = user?.totalStories ?? 0;
    final isPremium = user?.isPaidSubscriber ?? false;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(child: _buildHeader()),
            SliverToBoxAdapter(child: _buildProfileCard(
              displayName: displayName,
              credits: credits,
              totalShots: totalShots,
              totalStories: totalStories,
              avatarUrl: user?.avatarUrl,
              isPremium: isPremium,
            )),
            SliverToBoxAdapter(child: _buildTabSwitcher()),
            const SliverToBoxAdapter(child: SizedBox(height: 12)),
            _buildContentGrid(),
            if (!isPremium)
              SliverToBoxAdapter(child: _buildUpgradeCard()),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }

  // ── Header ──

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 16, 8),
      child: Row(
        children: [
          Text('PROFILE', style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXsPlus, fontWeight: FontWeight.w700, color: AppColors.textTer, letterSpacing: 3)),
          const Spacer(),
          _headerIcon(LucideIcons.bell, () => _showNotifications()),
          const SizedBox(width: 8),
          _headerIcon(LucideIcons.settings, () => _showSettings()),
        ],
      ),
    );
  }

  Widget _headerIcon(IconData icon, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Container(
          width: 44, height: 44,
          decoration: BoxDecoration(color: AppColors.card, shape: BoxShape.circle, border: Border.all(color: AppColors.borderMed)),
          child: Icon(icon, size: AppSizes.iconBase, color: AppColors.textSec),
        ),
      ),
    );
  }

  // ── Profile Card ──

  Widget _buildProfileCard({
    required String displayName,
    required double credits,
    required int totalShots,
    required int totalStories,
    String? avatarUrl,
    required bool isPremium,
  }) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(AppSizes.radiusXl),
          border: Border.all(color: AppColors.borderMed),
        ),
        child: Column(
          children: [
            // Avatar + Name row
            Row(
              children: [
                Container(
                  width: 56, height: 56,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.brand, width: 2.5),
                    boxShadow: AppShadows.brandGlow(0.2),
                  ),
                  child: ClipOval(
                    child: avatarUrl != null && avatarUrl.isNotEmpty
                        ? CachedNetworkImage(imageUrl: avatarUrl, fit: BoxFit.cover, errorWidget: (_, __, ___) => _avatarFallback(displayName))
                        : _avatarFallback(displayName),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Flexible(child: Text(displayName, style: const TextStyle(fontSize: AppSizes.fontLg, fontWeight: FontWeight.w700, color: AppColors.text), maxLines: 1, overflow: TextOverflow.ellipsis)),
                      if (isPremium) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(gradient: AppGradients.btn, borderRadius: BorderRadius.circular(AppSizes.radiusFull)),
                          child: Row(mainAxisSize: MainAxisSize.min, children: [
                            Icon(LucideIcons.crown, size: 10, color: AppColors.bg),
                            const SizedBox(width: 3),
                            Text('PRO', style: AppTextStyles.mono.copyWith(fontSize: 9, fontWeight: FontWeight.w800, color: AppColors.bg)),
                          ]),
                        ),
                      ],
                    ]),
                    const SizedBox(height: 2),
                    GestureDetector(
                      onTap: _showEditProfile,
                      child: Text('Edit Profile', style: TextStyle(fontSize: AppSizes.fontXsPlus, color: AppColors.brand, fontWeight: FontWeight.w500)),
                    ),
                  ],
                )),
              ],
            ),
            const SizedBox(height: 18),
            // 3-stat grid
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.bg,
                borderRadius: BorderRadius.circular(AppSizes.radiusMd),
              ),
              child: Row(children: [
                _statItem('$totalShots', 'Shots', LucideIcons.sparkles, AppColors.brand),
                _statDivider(),
                _statItem('$totalStories', 'Tales', LucideIcons.bookOpen, AppColors.purple),
                _statDivider(),
                _statItem(credits.toStringAsFixed(credits.truncateToDouble() == credits ? 0 : 1), 'Credits', LucideIcons.zap, AppColors.brand),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _avatarFallback(String name) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'F';
    return Container(
      decoration: const BoxDecoration(gradient: AppGradients.hero),
      child: Center(child: Text(initial, style: const TextStyle(fontSize: AppSizes.fontXl, fontWeight: FontWeight.w800, color: AppColors.bg))),
    );
  }

  Widget _statItem(String value, String label, IconData icon, Color color) {
    return Expanded(child: Column(children: [
      Row(mainAxisAlignment: MainAxisAlignment.center, mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 12, color: color.withValues(alpha: 0.6)),
        const SizedBox(width: 4),
        Text(value, style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontBase, fontWeight: FontWeight.w700, color: AppColors.text)),
      ]),
      const SizedBox(height: 2),
      Text(label, style: const TextStyle(fontSize: AppSizes.fontXs, color: AppColors.textTer)),
    ]));
  }

  Widget _statDivider() => Container(width: 1, height: 28, color: AppColors.borderMed);

  // ── Tab Switcher ──

  Widget _buildTabSwitcher() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        height: 42,
        decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(AppSizes.radiusMd), border: Border.all(color: AppColors.borderMed)),
        child: Row(
          children: List.generate(_tabs.length, (i) {
            final isActive = i == _selectedTabIndex;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selectedTabIndex = i),
                child: AnimatedContainer(
                  duration: AppDurations.fast,
                  decoration: BoxDecoration(
                    color: isActive ? AppColors.brand.withValues(alpha: 0.15) : Colors.transparent,
                    borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                    border: isActive ? Border.all(color: AppColors.brand.withValues(alpha: 0.3)) : null,
                  ),
                  margin: const EdgeInsets.all(3),
                  child: Center(child: Text(_tabs[i], style: TextStyle(fontSize: AppSizes.fontSmPlus, fontWeight: isActive ? FontWeight.w600 : FontWeight.w400, color: isActive ? AppColors.brand : AppColors.textTer))),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }

  // ── Content ──

  Widget _buildContentGrid() {
    switch (_selectedTabIndex) {
      case 0:
        return _buildGlowGrid();
      case 1:
        return _buildShotsGrid();
      case 2:
        return _buildTalesList();
      default:
        return _buildEmptyState('Nothing here yet', LucideIcons.image);
    }
  }

  // ── Glow Grid ──

  Widget _buildGlowGrid() {
    final enhancementsAsync = ref.watch(userEnhancementsProvider);

    return enhancementsAsync.when(
      loading: () => _buildLoadingState(),
      error: (_, __) => _buildEmptyState('Your enhancements will appear here', LucideIcons.sun),
      data: (enhancements) {
        if (enhancements.isEmpty) return _buildEmptyState('Your enhancements will appear here', LucideIcons.sun);

        return SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverGrid(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final enh = enhancements[index];
                final mode = kEnhanceModes.where((m) => m.id == enh.enhanceMode).firstOrNull ?? kEnhanceModes.first;
                final isCompleted = enh.isCompleted;
                final isFailed = enh.isFailed;

                return GestureDetector(
                  onTap: isCompleted ? () => context.push('/glow/result', extra: {
                    'imageUrl': enh.outputImageUrl,
                    'originalPath': enh.inputImageUrl,
                    'enhanceMode': enh.enhanceMode,
                    'filterId': enh.filterId,
                  }) : null,
                  child: Container(
                    margin: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                      border: Border.all(color: isFailed ? AppColors.red.withValues(alpha: 0.3) : AppColors.border),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(AppSizes.radiusMd - 1),
                      child: Stack(fit: StackFit.expand, children: [
                        if (enh.outputImageUrl != null && enh.outputImageUrl!.isNotEmpty)
                          CachedNetworkImage(imageUrl: enh.outputImageUrl!, fit: BoxFit.cover, placeholder: (_, __) => Container(color: AppColors.zinc900), errorWidget: (_, __, ___) => PlaceholderImage(index: index, borderRadius: 0))
                        else
                          PlaceholderImage(index: index, borderRadius: 0),
                        // Gradient overlay at bottom
                        Positioned(left: 0, right: 0, bottom: 0, child: Container(
                          height: 36,
                          decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Colors.black.withValues(alpha: 0.7)])),
                        )),
                        // Mode badge
                        Positioned(left: 6, bottom: 6, child: Row(mainAxisSize: MainAxisSize.min, children: [
                          Icon(mode.icon, size: 10, color: mode.color),
                          const SizedBox(width: 3),
                          Text(mode.name, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: Colors.white.withValues(alpha: 0.9))),
                        ])),
                        // Status overlays
                        if (isFailed)
                          Positioned.fill(child: Container(
                            decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.5)),
                            child: const Center(child: Icon(LucideIcons.alertCircle, size: 20, color: AppColors.red)),
                          ))
                        else if (enh.isInProgress)
                          Positioned.fill(child: Container(
                            decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.4)),
                            child: const Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.brand))),
                          )),
                      ]),
                    ),
                  ),
                );
              },
              childCount: enhancements.length,
            ),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, childAspectRatio: 0.85),
          ),
        );
      },
    );
  }

  // ── Shots Grid ──

  Widget _buildShotsGrid() {
    final generationsAsync = ref.watch(userGenerationsProvider);

    return generationsAsync.when(
      loading: () => _buildLoadingState(),
      error: (_, __) => _buildEmptyState('Your creations will appear here', LucideIcons.sparkles),
      data: (generations) {
        if (generations.isEmpty) return _buildEmptyState('Your creations will appear here', LucideIcons.sparkles);

        return SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverGrid(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final gen = generations[index];
                final isCompleted = gen.isCompleted;
                final isFailed = gen.isFailed;

                return GestureDetector(
                  onTap: isCompleted ? () => context.push('/create/result/${gen.id}') : null,
                  child: Container(
                    margin: const EdgeInsets.all(3),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                      border: Border.all(color: isFailed ? AppColors.red.withValues(alpha: 0.3) : AppColors.border),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(AppSizes.radiusMd - 1),
                      child: Stack(fit: StackFit.expand, children: [
                        if (gen.outputImageUrl != null && gen.outputImageUrl!.isNotEmpty)
                          CachedNetworkImage(imageUrl: gen.outputImageUrl!, fit: BoxFit.cover, placeholder: (_, __) => Container(color: AppColors.zinc900), errorWidget: (_, __, ___) => PlaceholderImage(index: index, borderRadius: 0))
                        else
                          PlaceholderImage(index: index, borderRadius: 0),
                        // Bottom gradient
                        Positioned(left: 0, right: 0, bottom: 0, child: Container(
                          height: 44,
                          decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Colors.black.withValues(alpha: 0.8)])),
                        )),
                        // Template name + time
                        Positioned(left: 6, right: 6, bottom: 6, child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(gen.templateName, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.white)),
                            Text(_timeAgo(gen.createdAt), style: TextStyle(fontSize: 8, color: Colors.white.withValues(alpha: 0.6))),
                          ],
                        )),
                        // Status overlays
                        if (isFailed)
                          Positioned.fill(child: Container(
                            decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.5)),
                            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                              const Icon(LucideIcons.alertCircle, size: 20, color: AppColors.red),
                              const SizedBox(height: 4),
                              Text('Failed', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: AppColors.red)),
                            ]),
                          ))
                        else if (gen.isInProgress)
                          Positioned.fill(child: Container(
                            decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.4)),
                            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                              const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.brand)),
                              const SizedBox(height: 6),
                              Text('Generating...', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w500, color: AppColors.brand)),
                            ]),
                          )),
                      ]),
                    ),
                  ),
                );
              },
              childCount: generations.length,
            ),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, childAspectRatio: 0.85),
          ),
        );
      },
    );
  }

  // ── Tales List ──

  Widget _buildTalesList() {
    final storiesAsync = ref.watch(userStoriesProvider);

    return storiesAsync.when(
      loading: () => _buildLoadingState(),
      error: (_, __) => _buildEmptyState('Your stories will appear here', LucideIcons.bookOpen),
      data: (stories) {
        if (stories.isEmpty) return _buildEmptyState('Your stories will appear here', LucideIcons.bookOpen);

        return SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final story = stories[index];
                final isCompleted = story.isCompleted;
                final isFailed = story.isFailed;
                final isProcessing = story.isInProgress;
                final progress = story.totalScenes > 0 ? story.completedScenes / story.totalScenes : 0.0;

                final statusColor = isCompleted ? AppColors.green : isFailed ? AppColors.red : AppColors.brand;
                final statusLabel = isCompleted ? 'Done' : isFailed ? 'Failed' : '${story.completedScenes}/${story.totalScenes}';

                return GestureDetector(
                  onTap: isCompleted ? () => context.push('/story/reader/${story.id}') : null,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.card,
                      borderRadius: BorderRadius.circular(AppSizes.radiusLg),
                      border: Border.all(color: isFailed ? AppColors.red.withValues(alpha: 0.2) : AppColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            // Scene count circle
                            Container(
                              width: 42, height: 42,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColors.bg,
                                border: Border.all(color: statusColor.withValues(alpha: 0.3), width: 2),
                              ),
                              child: Center(
                                child: isProcessing
                                    ? SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.brand, value: progress > 0 ? progress : null))
                                    : Text('${story.totalScenes}', style: TextStyle(fontSize: AppSizes.fontSmPlus, fontWeight: FontWeight.w700, color: statusColor)),
                              ),
                            ),
                            const SizedBox(width: 12),
                            // Title + meta
                            Expanded(child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(story.storyTitle, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: AppSizes.fontSmPlus, fontWeight: FontWeight.w600, color: AppColors.text)),
                                const SizedBox(height: 3),
                                Row(children: [
                                  // Status pill
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: statusColor.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                                      border: Border.all(color: statusColor.withValues(alpha: 0.2)),
                                    ),
                                    child: Text(statusLabel, style: AppTextStyles.mono.copyWith(fontSize: 9, fontWeight: FontWeight.w700, color: statusColor)),
                                  ),
                                  const SizedBox(width: 8),
                                  // Credits
                                  Icon(LucideIcons.zap, size: 10, color: AppColors.textTer),
                                  const SizedBox(width: 2),
                                  Text('${story.creditsSpent}', style: TextStyle(fontSize: AppSizes.fontXs, color: AppColors.textTer)),
                                  const Spacer(),
                                  // Time
                                  Text(_timeAgo(story.createdAt), style: TextStyle(fontSize: AppSizes.fontXs, color: AppColors.textTer)),
                                ]),
                              ],
                            )),
                            if (isCompleted)
                              Padding(
                                padding: const EdgeInsets.only(left: 8),
                                child: Icon(LucideIcons.chevronRight, size: AppSizes.iconMd, color: AppColors.textTer),
                              ),
                          ],
                        ),
                        // Progress bar for in-progress stories
                        if (isProcessing) ...[
                          const SizedBox(height: 10),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(2),
                            child: LinearProgressIndicator(
                              value: progress > 0 ? progress : null,
                              backgroundColor: AppColors.zinc800,
                              color: AppColors.brand,
                              minHeight: 3,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
              childCount: stories.length,
            ),
          ),
        );
      },
    );
  }

  // ── Empty / Loading States ──

  Widget _buildEmptyState(String message, IconData icon) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 56, horizontal: 32),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(color: AppColors.card, shape: BoxShape.circle, border: Border.all(color: AppColors.borderMed)),
            child: Icon(icon, size: AppSizes.iconXl, color: AppColors.zinc700),
          ),
          const SizedBox(height: 16),
          Text(message, style: const TextStyle(fontSize: AppSizes.fontSm, color: AppColors.textTer), textAlign: TextAlign.center),
        ]),
      ),
    );
  }

  Widget _buildLoadingState() {
    return const SliverToBoxAdapter(
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: 56),
        child: Center(child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.brand))),
      ),
    );
  }

  // ── Upgrade Card ──

  Widget _buildUpgradeCard() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSizes.radiusXl),
          gradient: AppGradients.story,
          border: Border.all(color: AppColors.brand.withValues(alpha: 0.2)),
        ),
        child: Row(children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(shape: BoxShape.circle, gradient: AppGradients.hero, boxShadow: AppShadows.brandGlow()),
            child: const Icon(LucideIcons.crown, size: AppSizes.iconLg, color: AppColors.bg),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Upgrade to Pro', style: TextStyle(fontSize: AppSizes.fontSmPlus, fontWeight: FontWeight.w700, color: AppColors.text)),
            const SizedBox(height: 2),
            Text('Unlimited generations & exclusive templates', style: TextStyle(fontSize: AppSizes.fontXs, color: AppColors.textSec)),
          ])),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(gradient: AppGradients.btn, borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
            child: const Text('Go', style: TextStyle(fontSize: AppSizes.fontXs, fontWeight: FontWeight.w700, color: AppColors.bg)),
          ),
        ]),
      ),
    );
  }

  // ── Helpers ──

  String _timeAgo(DateTime? dt) {
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}';
  }

  // ── Bottom Sheets (Notifications / Settings / Edit Profile) ──

  void _showNotifications() {
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
              const Text('Notifications', style: TextStyle(fontSize: AppSizes.fontLg, fontWeight: FontWeight.w700, color: AppColors.text)),
              const Spacer(),
              GestureDetector(onTap: () => Navigator.of(context).pop(), child: const Icon(LucideIcons.x, size: AppSizes.iconBase, color: AppColors.textSec)),
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
  }

  void _showSettings() {
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
              const Text('Settings', style: TextStyle(fontSize: AppSizes.fontLg, fontWeight: FontWeight.w700, color: AppColors.text)),
              const Spacer(),
              GestureDetector(onTap: () => Navigator.of(context).pop(), child: const Icon(LucideIcons.x, size: AppSizes.iconBase, color: AppColors.textSec)),
            ]),
            const SizedBox(height: 16),
            _settingsItem(LucideIcons.globe, 'Language', 'English', () {}),
            _settingsItem(LucideIcons.moon, 'Theme', 'Dark', () {}),
            _settingsItem(LucideIcons.bell, 'Push Notifications', 'On', () {}),
            _settingsItem(LucideIcons.shield, 'Privacy Policy', '', () {}),
            _settingsItem(LucideIcons.fileText, 'Terms of Service', '', () {}),
            _settingsItem(LucideIcons.info, 'About', 'v1.0.0', () {}),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton(
                onPressed: () async {
                  Navigator.of(context).pop();
                  await FirebaseAuth.instance.signOut();
                  if (context.mounted) context.go('/tour');
                },
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.red),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                ),
                child: Text('Sign Out', style: TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w600, color: AppColors.red)),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _settingsItem(IconData icon, String label, String value, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(children: [
          Icon(icon, size: AppSizes.iconBase, color: AppColors.textSec),
          const SizedBox(width: 12),
          Expanded(child: Text(label, style: TextStyle(fontSize: AppSizes.fontSmPlus, color: AppColors.text), maxLines: 1, overflow: TextOverflow.ellipsis)),
          if (value.isNotEmpty) Text(value, style: TextStyle(fontSize: AppSizes.fontXs, color: AppColors.textTer), maxLines: 1, overflow: TextOverflow.ellipsis),
          const SizedBox(width: 4),
          Icon(LucideIcons.chevronRight, size: AppSizes.iconSm, color: AppColors.textTer),
        ]),
      ),
    );
  }

  void _showEditProfile() {
    final user = ref.read(currentUserProvider).value;
    final nameController = TextEditingController(text: user?.displayName ?? '');

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.card,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(24, 24, 24, MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              const Text('Edit Profile', style: TextStyle(fontSize: AppSizes.fontLg, fontWeight: FontWeight.w700, color: AppColors.text)),
              const Spacer(),
              GestureDetector(onTap: () => Navigator.of(ctx).pop(), child: const Icon(LucideIcons.x, size: AppSizes.iconBase, color: AppColors.textSec)),
            ]),
            const SizedBox(height: 20),
            Text('Display Name', style: TextStyle(fontSize: AppSizes.fontXs, fontWeight: FontWeight.w600, color: AppColors.textSec)),
            const SizedBox(height: 8),
            TextField(
              controller: nameController,
              style: const TextStyle(color: AppColors.text),
              decoration: InputDecoration(
                hintText: 'Enter your name',
                hintStyle: TextStyle(color: AppColors.textTer),
                filled: true,
                fillColor: AppColors.bg,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd), borderSide: BorderSide(color: AppColors.borderMed)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd), borderSide: BorderSide(color: AppColors.borderMed)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd), borderSide: BorderSide(color: AppColors.brand)),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: DecoratedBox(
                decoration: BoxDecoration(gradient: AppGradients.btn, borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                child: ElevatedButton(
                  onPressed: () async {
                    final name = nameController.text.trim();
                    if (name.isEmpty) return;
                    try {
                      await FirebaseAuth.instance.currentUser?.updateDisplayName(name);
                      if (ctx.mounted) Navigator.of(ctx).pop();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated!')));
                      }
                    } catch (e) {
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Update failed: $e')));
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd))),
                  child: Text('Save', style: TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w700, color: AppColors.bg)),
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
