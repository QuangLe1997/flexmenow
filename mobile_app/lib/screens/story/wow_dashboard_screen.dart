import 'dart:io' show Platform;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/app_shadows.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../../data/mock_data.dart';
import '../../widgets/image_slideshow.dart';

/// WOW Dashboard — subscription status, current journey day, progress bar,
/// photo thumbnails, stats, upcoming schedule, subscription management.
/// Mirrors: docs/mockup_app/app.jsx WowDashboard component.
class WowDashboardScreen extends StatefulWidget {
  const WowDashboardScreen({super.key});

  @override
  State<WowDashboardScreen> createState() => _WowDashboardScreenState();
}

class _WowDashboardScreenState extends State<WowDashboardScreen> {
  bool _showSettings = false;

  // Mock data — will be replaced by Firestore/RevenueCat providers
  final int _deliveryDay = 5;
  final int _totalDays = 7;
  final String _topicId = 'travel';
  final String _durationId = 'w7';
  final String _timeId = 'morning';
  // ignore: unused_field
  final String _date = 'Mar 5, 2026';

  WowTopic get _topicObj =>
      kWowTopics.firstWhere((t) => t.id == _topicId,
          orElse: () => kWowTopics[0]);

  WowPlan get _durationObj =>
      kWowPlans.firstWhere((p) => p.id == _durationId,
          orElse: () => kWowPlans[1]);

  TimeSlot get _timeObj =>
      kTimeSlots.firstWhere((t) => t.id == _timeId,
          orElse: () => kTimeSlots[0]);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Column(
        children: [
          // Header
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Back button
                  Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => context.pop(),
                      customBorder: const CircleBorder(),
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.card,
                          border: Border.all(color: AppColors.borderMed),
                        ),
                        child: const Center(
                          child: Icon(LucideIcons.arrowLeft, size: AppSizes.iconBase,
                              color: AppColors.text),
                        ),
                      ),
                    ),
                  ),
                  // Title
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(LucideIcons.crown, size: AppSizes.iconMd,
                          color: AppColors.brand),
                      const SizedBox(width: 6),
                      Text(
                        'My WOW',
                        style: TextStyle(
                          fontSize: AppSizes.fontSm,
                          fontWeight: FontWeight.w800,
                          color: AppColors.text,
                        ),
                      ),
                    ],
                  ),
                  // Settings button
                  Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () =>
                          setState(() => _showSettings = !_showSettings),
                      customBorder: const CircleBorder(),
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.card,
                          border: Border.all(color: AppColors.borderMed),
                        ),
                        child: const Center(
                          child: Icon(LucideIcons.settings, size: AppSizes.iconBase,
                              color: AppColors.text),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeroStatus(),
                  const SizedBox(height: 16),
                  _buildStatsRow(),
                  const SizedBox(height: 16),
                  _buildTodaysDelivery(),
                  const SizedBox(height: 16),
                  _buildUpcoming(),
                  const SizedBox(height: 16),
                  _buildSubscriptionInfo(),
                  if (_showSettings) ...[
                    const SizedBox(height: 16),
                    _buildSettingsPanel(),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Hero status card ──
  Widget _buildHeroStatus() {
    final progressPercent = _deliveryDay / _totalDays;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.purple.withValues(alpha: 0.1),
            AppColors.brand.withValues(alpha: 0.08),
          ],
        ),
        border: Border.all(color: AppColors.brand.withValues(alpha: 0.12)),
      ),
      child: Stack(
        children: [
          // Decorative glow
          Positioned(
            top: -20,
            right: -20,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    AppColors.brand.withValues(alpha: 0.09),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Column(
            children: [
              // Top row: journey label + topic badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'YOUR JOURNEY',
                        style: TextStyle(
                          fontSize: AppSizes.fontXxsPlus,
                          fontWeight: FontWeight.w800,
                          color: AppColors.brand,
                          letterSpacing: 3,
                        ),
                      ),
                      const SizedBox(height: 4),
                      RichText(
                        text: TextSpan(
                          children: [
                            TextSpan(
                              text: 'DAY $_deliveryDay ',
                              style: AppTextStyles.mono.copyWith(
                                fontSize: AppSizes.font2xlMax,
                                fontWeight: FontWeight.w900,
                                color: AppColors.text,
                                letterSpacing: -1,
                              ),
                            ),
                            TextSpan(
                              text: 'of $_totalDays',
                              style: TextStyle(
                                fontSize: AppSizes.fontBase,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textTer,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  // Topic badge
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14),
                      color: _topicObj.color.withValues(alpha: 0.09),
                      border: Border.all(
                          color: _topicObj.color.withValues(alpha: 0.15)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_topicObj.emoji,
                            style: const TextStyle(fontSize: AppSizes.fontBase)),
                        const SizedBox(width: 6),
                        Text(
                          _topicObj.name,
                          style: TextStyle(
                            fontSize: AppSizes.fontXxsPlus,
                            fontWeight: FontWeight.w800,
                            color: _topicObj.color,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Progress bar
              Container(
                height: 6,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(3),
                  color: Colors.white.withValues(alpha: 0.06),
                ),
                child: FractionallySizedBox(
                  alignment: Alignment.centerLeft,
                  widthFactor: progressPercent.clamp(0.0, 1.0),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(3),
                      gradient: AppGradients.hero,
                      boxShadow: [...AppShadows.brandGlow(0.25)],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // Next delivery text
              Align(
                alignment: Alignment.centerLeft,
                child: RichText(
                  text: TextSpan(
                    style: TextStyle(
                      fontSize: AppSizes.fontXxsPlus,
                      color: AppColors.textTer,
                    ),
                    children: [
                      const TextSpan(text: 'Next delivery: '),
                      TextSpan(
                        text: 'Today at ${_timeObj.time}',
                        style: TextStyle(
                          color: AppColors.brand,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Stats row: Days, Photos, Shares ──
  Widget _buildStatsRow() {
    final stats = [
      _Stat(
          label: 'Days',
          value: _deliveryDay,
          icon: LucideIcons.flame),
      _Stat(
          label: 'Photos',
          value: _deliveryDay * 4,
          icon: LucideIcons.image),
      _Stat(
          label: 'Shares',
          value: (_deliveryDay * 2.3).floor(),
          icon: LucideIcons.share),
    ];

    return Row(
      children: stats.map((stat) {
        return Expanded(
          child: Container(
            margin: EdgeInsets.only(
                right: stat != stats.last ? 8 : 0),
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: AppColors.card,
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                Icon(stat.icon, size: AppSizes.iconMd, color: AppColors.brand400),
                const SizedBox(height: 6),
                Text(
                  '${stat.value}',
                  style: AppTextStyles.mono.copyWith(
                    fontSize: AppSizes.fontXl,
                    fontWeight: FontWeight.w900,
                    color: AppColors.text,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  stat.label.toUpperCase(),
                  style: TextStyle(
                    fontSize: AppSizes.font2xs,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textTer,
                    letterSpacing: 1.5,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  // ── Today's delivery card ──
  Widget _buildTodaysDelivery() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: AppColors.card,
        border: Border.all(color: AppColors.brand.withValues(alpha: 0.09)),
      ),
      child: Column(
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Today's Delivery",
                style: TextStyle(
                  fontSize: AppSizes.fontSmPlus,
                  fontWeight: FontWeight.w800,
                  color: AppColors.text,
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: AppColors.green.withValues(alpha: 0.09),
                  border: Border.all(
                      color: AppColors.green.withValues(alpha: 0.15)),
                ),
                child: Text(
                  'READY',
                  style: TextStyle(
                    fontSize: AppSizes.fontXxs,
                    fontWeight: FontWeight.w800,
                    color: AppColors.green,
                    letterSpacing: 1,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // 4 photo thumbnails
          Row(
            children: List.generate(4, (i) {
              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(right: i < 3 ? 8 : 0),
                  child: AspectRatio(
                    aspectRatio: 1,
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: PlaceholderImage(
                          index: i,
                          borderRadius: 0,
                          icon: LucideIcons.image,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
          const SizedBox(height: 12),

          // View & Share button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: AppGradients.btn,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [...AppShadows.brandGlow(0.15)],
              ),
              child: MaterialButton(
                onPressed: () => context.push('/story/wow/delivery'),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(LucideIcons.eye, size: AppSizes.iconMd,
                        color: Colors.black),
                    const SizedBox(width: 8),
                    Text(
                      'View & Share',
                      style: TextStyle(
                        fontSize: AppSizes.fontXs,
                        fontWeight: FontWeight.w800,
                        color: Colors.black,
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Upcoming schedule ──
  Widget _buildUpcoming() {
    final upcoming = <_UpcomingItem>[
      _UpcomingItem(day: _deliveryDay + 1, status: 'Generating...'),
      _UpcomingItem(day: _deliveryDay + 2, status: 'Scheduled'),
      _UpcomingItem(day: _deliveryDay + 3, status: 'Scheduled'),
    ].where((d) => d.day <= _totalDays).toList();

    if (upcoming.isEmpty) return const SizedBox();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'UPCOMING',
          style: TextStyle(
            fontSize: AppSizes.fontXxsPlus,
            fontWeight: FontWeight.w800,
            color: AppColors.textTer,
            letterSpacing: 2,
          ),
        ),
        const SizedBox(height: 10),
        ...upcoming.asMap().entries.map((entry) {
          final i = entry.key;
          final item = entry.value;
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              color: AppColors.card,
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                // Day number
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    color: AppColors.brand.withValues(alpha: 0.06),
                    border: Border.all(
                        color: AppColors.brand.withValues(alpha: 0.12)),
                  ),
                  child: Center(
                    child: Text(
                      '${item.day}',
                      style: AppTextStyles.mono.copyWith(
                        fontSize: AppSizes.fontXs,
                        fontWeight: FontWeight.w900,
                        color: AppColors.brand,
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
                        'Day ${item.day}',
                        style: TextStyle(
                          fontSize: AppSizes.fontXs,
                          fontWeight: FontWeight.w700,
                          color: AppColors.text,
                        ),
                      ),
                      Text(
                        _timeObj.time,
                        style: TextStyle(
                          fontSize: AppSizes.fontXxsPlus,
                          color: AppColors.textTer,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  item.status,
                  style: TextStyle(
                    fontSize: AppSizes.fontXxsPlus,
                    fontWeight: FontWeight.w600,
                    color: i == 0 ? AppColors.brand : AppColors.textTer,
                  ),
                ),
              ],
            ),
          );
        }),
      ],
    );
  }

  // ── Subscription info card ──
  Widget _buildSubscriptionInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: AppColors.card,
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(LucideIcons.crown, size: AppSizes.iconXs, color: AppColors.brand),
                  const SizedBox(width: 6),
                  Text(
                    'WOW Subscription',
                    style: TextStyle(
                      fontSize: AppSizes.fontXs,
                      fontWeight: FontWeight.w700,
                      color: AppColors.text,
                    ),
                  ),
                ],
              ),
              Text(
                '\$${_durationObj.price.toStringAsFixed(2)}${_durationObj.days < 0 ? '/mo' : ''}',
                style: AppTextStyles.monoSmall.copyWith(
                  fontSize: AppSizes.fontXsPlus,
                  fontWeight: FontWeight.w800,
                  color: AppColors.brand,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerLeft,
            child: Text(
              'Flat fee \u00b7 No credits used \u00b7 All features included',
              style: TextStyle(
                fontSize: AppSizes.fontXxsPlus,
                color: AppColors.textTer,
              ),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              // Pause button
              Expanded(
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Subscription paused')),
                      );
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        color: AppColors.input,
                        border: Border.all(color: AppColors.borderMed),
                      ),
                      child: Center(
                        child: Text(
                          'Pause',
                          style: TextStyle(
                            fontSize: AppSizes.fontXsPlus,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textSec,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Change topic button
              Expanded(
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      context.push('/story/wow/setup');
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        color: AppColors.brand.withValues(alpha: 0.06),
                        border: Border.all(
                            color: AppColors.brand.withValues(alpha: 0.15)),
                      ),
                      child: Center(
                        child: Text(
                          'Change topic',
                          style: TextStyle(
                            fontSize: AppSizes.fontXsPlus,
                            fontWeight: FontWeight.w700,
                            color: AppColors.brand,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Settings panel (expandable) ──
  Widget _buildSettingsPanel() {
    final items = [
      _SettingsItem(
        label: 'Change delivery time',
        onTap: () => context.push('/story/wow/setup'),
      ),
      _SettingsItem(
        label: 'Update my face photo',
        onTap: () => context.push('/story/wow/setup'),
      ),
      _SettingsItem(
        label: 'Cancel subscription',
        isDanger: true,
        onTap: () {
          showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              backgroundColor: AppColors.card,
              title: const Text('Cancel WOW?', style: TextStyle(color: AppColors.text, fontWeight: FontWeight.w700)),
              content: const Text(
                'Your subscription is managed by the App Store/Play Store. You\'ll be redirected to manage your subscriptions.',
                style: TextStyle(color: AppColors.textSec),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text('Keep WOW', style: TextStyle(color: AppColors.brand)),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    // Redirect to platform subscription management
                    final url = Platform.isIOS
                        ? 'https://apps.apple.com/account/subscriptions'
                        : 'https://play.google.com/store/account/subscriptions';
                    launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
                  },
                  child: const Text('Cancel', style: TextStyle(color: AppColors.red)),
                ),
              ],
            ),
          );
        },
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: AppColors.card,
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'MANAGE',
            style: TextStyle(
              fontSize: AppSizes.fontXxsPlus,
              fontWeight: FontWeight.w800,
              color: AppColors.textTer,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 10),
          ...items.asMap().entries.map((entry) {
            final i = entry.key;
            final item = entry.value;
            return Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: item.onTap,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: i < items.length - 1
                      ? BoxDecoration(
                          border: Border(
                            bottom: BorderSide(color: AppColors.border),
                          ),
                        )
                      : null,
                  child: Row(
                    children: [
                      if (item.isDanger)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Icon(LucideIcons.x, size: AppSizes.iconXs,
                              color: AppColors.red),
                        ),
                      Text(
                        item.label,
                        style: TextStyle(
                          fontSize: AppSizes.fontXs,
                          fontWeight: FontWeight.w600,
                          color:
                              item.isDanger ? AppColors.red : AppColors.textSec,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

// ── Data classes ──

class _Stat {
  final String label;
  final int value;
  final IconData icon;
  const _Stat({required this.label, required this.value, required this.icon});
}

class _UpcomingItem {
  final int day;
  final String status;
  const _UpcomingItem({required this.day, required this.status});
}

class _SettingsItem {
  final String label;
  final VoidCallback onTap;
  final bool isDanger;
  const _SettingsItem({
    required this.label,
    required this.onTap,
    this.isDanger = false,
  });
}
