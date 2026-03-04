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

/// Me tab — "PROFILE" header + Bell/Settings, profile card (avatar in gold-bordered
/// circle, name italic, @username gold, streak badge, 3-stat grid, Edit Profile btn),
/// 3-tab switcher (Shots/Saved/Tales), 3-col content grid, Upgrade card with Crown.
///
/// Wired to real user data, generations, and stories from Firestore.
class MeTab extends ConsumerStatefulWidget {
  const MeTab({super.key});

  @override
  ConsumerState<MeTab> createState() => _MeTabState();
}

class _MeTabState extends ConsumerState<MeTab> {
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
            )),
            SliverToBoxAdapter(child: _buildTabSwitcher()),
            _buildContentGrid(),
            if (!isPremium)
              SliverToBoxAdapter(child: _buildUpgradeCard()),
            const SliverToBoxAdapter(child: SizedBox(height: 16)),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
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

  Widget _buildProfileCard({
    required String displayName,
    required double credits,
    required int totalShots,
    required int totalStories,
    String? avatarUrl,
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
            // Avatar
            Container(
              width: 68, height: 68,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.brand, width: 2.5),
                boxShadow: AppShadows.brandGlow(0.25),
              ),
              child: ClipOval(
                child: avatarUrl != null && avatarUrl.isNotEmpty
                    ? CachedNetworkImage(imageUrl: avatarUrl, fit: BoxFit.cover, errorWidget: (_, __, ___) => _avatarFallback(displayName))
                    : _avatarFallback(displayName),
              ),
            ),
            const SizedBox(height: 12),
            Text(displayName, style: const TextStyle(fontSize: AppSizes.fontLg, fontWeight: FontWeight.w700, fontStyle: FontStyle.italic, color: AppColors.text)),
            const SizedBox(height: 16),
            // 3-stat grid
            Row(children: [
              _statItem('$totalShots', 'Shots'),
              _statDivider(),
              _statItem('$totalStories', 'Tales'),
              _statDivider(),
              _statItem(credits.toStringAsFixed(credits.truncateToDouble() == credits ? 0 : 1), 'Credits'),
            ]),
            const SizedBox(height: 16),
            // Edit Profile button
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => _showEditProfile(),
                borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                child: Container(
                  width: double.infinity, height: 44,
                  decoration: BoxDecoration(borderRadius: BorderRadius.circular(AppSizes.radiusMd), border: Border.all(color: AppColors.borderMed)),
                  child: Center(child: Text('Edit Profile', style: const TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w600, color: AppColors.textSec))),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

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
              Text('Notifications', style: TextStyle(fontSize: AppSizes.fontLg, fontWeight: FontWeight.w700, color: AppColors.text)),
              const Spacer(),
              GestureDetector(onTap: () => Navigator.of(context).pop(), child: Icon(LucideIcons.x, size: AppSizes.iconBase, color: AppColors.textSec)),
            ]),
            const SizedBox(height: 32),
            Icon(LucideIcons.bellOff, size: AppSizes.icon4xl, color: AppColors.zinc700),
            const SizedBox(height: 12),
            Text('No notifications yet', style: TextStyle(fontSize: AppSizes.fontSmPlus, color: AppColors.textTer)),
            const SizedBox(height: 8),
            Text('When you get likes or new content,\nthey\'ll show up here', style: TextStyle(fontSize: AppSizes.fontXs, color: AppColors.textTer, height: 1.5), textAlign: TextAlign.center),
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
              Text('Settings', style: TextStyle(fontSize: AppSizes.fontLg, fontWeight: FontWeight.w700, color: AppColors.text)),
              const Spacer(),
              GestureDetector(onTap: () => Navigator.of(context).pop(), child: Icon(LucideIcons.x, size: AppSizes.iconBase, color: AppColors.textSec)),
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
              Text('Edit Profile', style: TextStyle(fontSize: AppSizes.fontLg, fontWeight: FontWeight.w700, color: AppColors.text)),
              const Spacer(),
              GestureDetector(onTap: () => Navigator.of(ctx).pop(), child: Icon(LucideIcons.x, size: AppSizes.iconBase, color: AppColors.textSec)),
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
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Profile updated!')),
                        );
                      }
                    } catch (e) {
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          SnackBar(content: Text('Update failed: $e')),
                        );
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

  Widget _avatarFallback(String name) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'F';
    return Container(
      decoration: const BoxDecoration(gradient: AppGradients.hero),
      child: Center(child: Text(initial, style: const TextStyle(fontSize: AppSizes.font2xl, fontWeight: FontWeight.w800, color: AppColors.bg))),
    );
  }

  Widget _statItem(String value, String label) {
    return Expanded(child: Column(children: [
      Text(value, style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontLg, fontWeight: FontWeight.w700, color: AppColors.text)),
      const SizedBox(height: 2),
      Text(label, style: const TextStyle(fontSize: AppSizes.fontXsPlus, color: AppColors.textTer)),
    ]));
  }

  Widget _statDivider() => Container(width: 1, height: 30, color: AppColors.borderMed);

  Widget _buildTabSwitcher() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        height: 40,
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

  Widget _buildContentGrid() {
    switch (_selectedTabIndex) {
      case 0: // Glow (FlexLocket)
        return _buildGlowGrid();
      case 1: // Shots
        return _buildShotsGrid();
      case 2: // Tales
        return _buildTalesGrid();
      default:
        return _buildEmptyState('Nothing here yet');
    }
  }

  Widget _buildGlowGrid() {
    final enhancementsAsync = ref.watch(userEnhancementsProvider);

    return enhancementsAsync.when(
      loading: () => _buildEmptyState('Your FlexLocket enhancements will appear here'),
      error: (_, __) => _buildEmptyState('Your FlexLocket enhancements will appear here'),
      data: (enhancements) {
        final completed = enhancements.where((e) => e.isCompleted).toList();
        if (completed.isEmpty) return _buildEmptyState('Your FlexLocket enhancements will appear here');

        return SliverGrid(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              final enh = completed[index];
              final mode = kEnhanceModes.where((m) => m.id == enh.enhanceMode).firstOrNull ?? kEnhanceModes.first;
              return GestureDetector(
                onTap: () => context.push('/glow/result', extra: {
                  'imageUrl': enh.outputImageUrl,
                  'originalPath': enh.inputImageUrl,
                  'enhanceMode': enh.enhanceMode,
                  'filterId': enh.filterId,
                }),
                child: Container(
                  margin: const EdgeInsets.all(2),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                    child: Stack(fit: StackFit.expand, children: [
                      if (enh.outputImageUrl != null && enh.outputImageUrl!.isNotEmpty)
                        CachedNetworkImage(imageUrl: enh.outputImageUrl!, fit: BoxFit.cover, placeholder: (_, __) => Container(color: AppColors.zinc900), errorWidget: (_, __, ___) => PlaceholderImage(index: index, borderRadius: AppSizes.radiusSm))
                      else
                        PlaceholderImage(index: index, borderRadius: AppSizes.radiusSm),
                      Positioned(top: 6, right: 6, child: Container(
                        width: 22, height: 22,
                        decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.5), shape: BoxShape.circle),
                        child: Icon(mode.icon, size: 11, color: mode.color),
                      )),
                    ]),
                  ),
                ),
              );
            },
            childCount: completed.length,
          ),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, childAspectRatio: 1.0),
        );
      },
    );
  }

  Widget _buildShotsGrid() {
    final generationsAsync = ref.watch(userGenerationsProvider);

    return generationsAsync.when(
      loading: () => _buildEmptyState('Your FlexShot creations will appear here'),
      error: (_, __) => _buildEmptyState('Your FlexShot creations will appear here'),
      data: (generations) {
        final completed = generations.where((g) => g.isCompleted).toList();
        if (completed.isEmpty) return _buildEmptyState('Your FlexShot creations will appear here');

        return SliverGrid(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              final gen = completed[index];
              return GestureDetector(
                onTap: () => context.push('/create/result/${gen.id}'),
                child: Container(
                  margin: const EdgeInsets.all(2),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                    child: Stack(fit: StackFit.expand, children: [
                      if (gen.outputImageUrl != null && gen.outputImageUrl!.isNotEmpty)
                        CachedNetworkImage(imageUrl: gen.outputImageUrl!, fit: BoxFit.cover, placeholder: (_, __) => Container(color: AppColors.zinc900), errorWidget: (_, __, ___) => PlaceholderImage(index: index, borderRadius: AppSizes.radiusSm))
                      else
                        PlaceholderImage(index: index, borderRadius: AppSizes.radiusSm),
                      Positioned(top: 6, right: 6, child: Container(
                        width: 22, height: 22,
                        decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.5), shape: BoxShape.circle),
                        child: Icon(LucideIcons.sparkles, size: 11, color: AppColors.brand),
                      )),
                    ]),
                  ),
                ),
              );
            },
            childCount: completed.length,
          ),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, childAspectRatio: 1.0),
        );
      },
    );
  }

  Widget _buildTalesGrid() {
    final storiesAsync = ref.watch(userStoriesProvider);

    return storiesAsync.when(
      loading: () => _buildEmptyState('Your FlexTale stories will appear here'),
      error: (_, __) => _buildEmptyState('Your FlexTale stories will appear here'),
      data: (stories) {
        final completed = stories.where((s) => s.isCompleted).toList();
        if (completed.isEmpty) return _buildEmptyState('Your FlexTale stories will appear here');

        return SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              final story = completed[index];
              return GestureDetector(
                onTap: () => context.push('/story/reader/${story.id}'),
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(AppSizes.radiusMd), border: Border.all(color: AppColors.borderMed)),
                  child: Row(children: [
                    Container(
                      width: 48, height: 48,
                      decoration: BoxDecoration(borderRadius: BorderRadius.circular(AppSizes.radiusSm), color: AppColors.purple.withValues(alpha: 0.1)),
                      child: Icon(LucideIcons.bookOpen, size: AppSizes.iconLg, color: AppColors.purple),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(story.storyTitle, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w600, color: AppColors.text)),
                      Text('${story.completedScenes}/${story.totalScenes} scenes', style: const TextStyle(fontSize: AppSizes.fontXsPlus, color: AppColors.textTer)),
                    ])),
                    Icon(LucideIcons.chevronRight, size: AppSizes.iconMd, color: AppColors.textTer),
                  ]),
                ),
              );
            },
            childCount: completed.length,
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(String message) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.all(48),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(LucideIcons.image, size: AppSizes.icon6xl, color: AppColors.zinc700),
          const SizedBox(height: 12),
          Text(message, style: const TextStyle(fontSize: AppSizes.fontSmPlus, color: AppColors.textTer), textAlign: TextAlign.center),
        ]),
      ),
    );
  }

  Widget _buildUpgradeCard() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSizes.radiusXl),
          gradient: AppGradients.story,
          border: Border.all(color: AppColors.brand.withValues(alpha: 0.2)),
        ),
        child: Row(children: [
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(shape: BoxShape.circle, gradient: AppGradients.hero, boxShadow: AppShadows.brandGlow()),
            child: const Icon(LucideIcons.crown, size: AppSizes.iconXl, color: AppColors.bg),
          ),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Upgrade to Pro', style: const TextStyle(fontSize: AppSizes.fontBase, fontWeight: FontWeight.w700, color: AppColors.text)),
            const SizedBox(height: 2),
            Text('Unlimited generations & exclusive templates', style: const TextStyle(fontSize: AppSizes.fontXs, color: AppColors.textSec)),
          ])),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(gradient: AppGradients.btn, borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
            child: Text('View Plans', style: const TextStyle(fontSize: AppSizes.fontXs, fontWeight: FontWeight.w700, color: AppColors.bg)),
          ),
        ]),
      ),
    );
  }
}
