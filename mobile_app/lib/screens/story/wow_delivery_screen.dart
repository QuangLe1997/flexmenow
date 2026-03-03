import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_shadows.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../../data/mock_data.dart';
import '../../widgets/image_slideshow.dart';

/// WOW Delivery screen — daily photo cards with captions, hashtags,
/// platform share buttons, copy/save/redo actions, and bottom sticky bar.
/// Mirrors: docs/mockup_app/app.jsx WowDelivery component.
class WowDeliveryScreen extends StatefulWidget {
  const WowDeliveryScreen({super.key});

  @override
  State<WowDeliveryScreen> createState() => _WowDeliveryScreenState();
}

class _WowDeliveryScreenState extends State<WowDeliveryScreen> {
  // Mock data — will be replaced by Firestore delivery doc
  final int _day = 5;
  final int _totalDays = 7;
  final String _date = 'Mar 5, 2026';
  final String _topicId = 'travel';

  // Mock photos matching wowDeliveryMock from app.jsx
  static const _photos = [
    _DeliveryPhoto(
      caption:
          'Lost in the streets of Santorini, where every corner is a postcard.',
      hashtags: '#Santorini #TravelVibes #WanderlustLife #FlexMe',
      ratio: '4:5',
      platform: 'Instagram',
    ),
    _DeliveryPhoto(
      caption: 'Sunset chasing is not a hobby, it\'s a lifestyle.',
      hashtags: '#SunsetLover #GoldenHour #TravelGram #FlexMe',
      ratio: '9:16',
      platform: 'TikTok',
    ),
    _DeliveryPhoto(
      caption: 'Blue waters, clear mind. This is where I belong.',
      hashtags: '#OceanVibes #LuxuryTravel #IslandLife #FlexMe',
      ratio: '1:1',
      platform: 'Facebook',
    ),
    _DeliveryPhoto(
      caption:
          'From Greek islands to neon streets \u2014 the world is my backdrop.',
      hashtags: '#WorldTraveler #NomadLife #ExploreMore #FlexMe',
      ratio: '4:5',
      platform: 'Instagram',
    ),
  ];

  WowTopic get _topicObj =>
      kWowTopics.firstWhere((t) => t.id == _topicId,
          orElse: () => kWowTopics[0]);

  void _showToast(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.card,
      ),
    );
  }

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
                          child: Icon(LucideIcons.arrowLeft,
                              size: AppSizes.iconBase,
                              color: AppColors.text),
                        ),
                      ),
                    ),
                  ),
                  // Title + date
                  Column(
                    children: [
                      Text(
                        "Today's WOW",
                        style: TextStyle(
                          fontSize: AppSizes.fontSm,
                          fontWeight: FontWeight.w800,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _date,
                        style: AppTextStyles.captionMono.copyWith(
                          letterSpacing: 2,
                        ),
                      ),
                    ],
                  ),
                  // Spacer for balance
                  const SizedBox(width: 40),
                ],
              ),
            ),
          ),

          // Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  // Day counter hero
                  _buildDayHero(),
                  const SizedBox(height: 16),

                  // Photo cards
                  ..._photos.asMap().entries.map((entry) {
                    final i = entry.key;
                    final photo = entry.value;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _buildPhotoCard(photo, i),
                    );
                  }),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),

          // Bottom sticky bar
          _buildBottomBar(),
        ],
      ),
    );
  }

  // ── Day counter hero ──
  Widget _buildDayHero() {
    return Column(
      children: [
        Text(
          'DAY $_day',
          style: AppTextStyles.mono.copyWith(
            fontSize: 42,
            fontWeight: FontWeight.w900,
            color: AppColors.brand,
            letterSpacing: -2,
          ),
        ),
        Text(
          'of $_totalDays \u00b7 $_date',
          style: TextStyle(
            fontSize: AppSizes.fontXs,
            color: AppColors.textTer,
          ),
        ),
        const SizedBox(height: 8),
        // Topic badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            color: _topicObj.color.withValues(alpha: 0.07),
            border:
                Border.all(color: _topicObj.color.withValues(alpha: 0.15)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_topicObj.emoji,
                  style: const TextStyle(fontSize: AppSizes.fontSm)),
              const SizedBox(width: 6),
              Text(
                _topicObj.name,
                style: TextStyle(
                  fontSize: AppSizes.fontXxsPlus,
                  fontWeight: FontWeight.w800,
                  color: _topicObj.color,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── Individual photo card ──
  Widget _buildPhotoCard(_DeliveryPhoto photo, int index) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: AppColors.card,
        border: Border.all(color: AppColors.border),
        boxShadow: [...AppShadows.lg],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          // Image area
          AspectRatio(
            aspectRatio: 4 / 3,
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Placeholder image
                PlaceholderImage(
                  index: index,
                  borderRadius: 0,
                  icon: LucideIcons.image,
                ),
                // Bottom gradient
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.bottomCenter,
                        end: Alignment.topCenter,
                        stops: const [0.0, 0.4],
                        colors: [
                          Colors.black.withValues(alpha: 0.5),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),
                // Ratio + platform badge (top left)
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      color: Colors.black.withValues(alpha: 0.5),
                      border: Border.all(
                          color: Colors.white.withValues(alpha: 0.1)),
                    ),
                    child: Text(
                      '${photo.ratio} \u00b7 ${photo.platform}',
                      style: TextStyle(
                        fontSize: AppSizes.fontXxs,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
                // Photo number badge (top right)
                Positioned(
                  top: 10,
                  right: 10,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      color: Colors.black.withValues(alpha: 0.5),
                    ),
                    child: Text(
                      '#${index + 1}',
                      style: TextStyle(
                        fontSize: AppSizes.fontXxs,
                        fontWeight: FontWeight.w800,
                        color: AppColors.brand,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Content area
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Caption
                Text(
                  '"${photo.caption}"',
                  style: TextStyle(
                    fontSize: AppSizes.fontSmPlus,
                    color: AppColors.textSec,
                    fontStyle: FontStyle.italic,
                    height: 1.6,
                  ),
                ),
                const SizedBox(height: 8),

                // Hashtags
                Text(
                  photo.hashtags,
                  style: TextStyle(
                    fontSize: AppSizes.fontXxsPlus,
                    fontWeight: FontWeight.w600,
                    color: AppColors.purple,
                    height: 1.6,
                  ),
                ),
                const SizedBox(height: 12),

                // Platform share buttons
                Row(
                  children: [
                    _PlatformShareButton(
                      name: 'IG',
                      color: const Color(0xFFE1306C),
                      onTap: () => _showToast('Shared to IG!'),
                    ),
                    const SizedBox(width: 8),
                    _PlatformShareButton(
                      name: 'FB',
                      color: const Color(0xFF1877F2),
                      onTap: () => _showToast('Shared to FB!'),
                    ),
                    const SizedBox(width: 8),
                    _PlatformShareButton(
                      name: 'TikTok',
                      color: Colors.white,
                      onTap: () => _showToast('Shared to TikTok!'),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Action row: Copy, Save, Redo
                Row(
                  children: [
                    _ActionChip(
                      icon: LucideIcons.edit,
                      label: 'Copy',
                      onTap: () => _showToast('Caption copied!'),
                    ),
                    const SizedBox(width: 6),
                    _ActionChip(
                      icon: LucideIcons.download,
                      label: 'Save',
                      onTap: () => _showToast('Photo saved!'),
                    ),
                    const SizedBox(width: 6),
                    _ActionChip(
                      icon: LucideIcons.refreshCw,
                      label: 'Redo',
                      onTap: () => _showToast('Regenerating...'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Bottom sticky bar ──
  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 40),
      decoration: BoxDecoration(
        color: AppColors.bg,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          // Download all
          Expanded(
            child: SizedBox(
              height: 52,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: AppGradients.btn,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [...AppShadows.brandGlow(0.15)],
                ),
                child: MaterialButton(
                  onPressed: () => _showToast('All photos saved!'),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(LucideIcons.download,
                          size: AppSizes.iconMd,
                          color: Colors.black),
                      const SizedBox(width: 8),
                      Text(
                        'Download all',
                        style: TextStyle(
                          fontSize: AppSizes.fontXsPlus,
                          fontWeight: FontWeight.w900,
                          color: Colors.black,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          // Share as carousel
          Expanded(
            child: SizedBox(
              height: 52,
              child: OutlinedButton(
                onPressed: () => _showToast('Carousel created!'),
                style: OutlinedButton.styleFrom(
                  backgroundColor: AppColors.card,
                  side: BorderSide(color: AppColors.borderMed),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  padding: EdgeInsets.zero,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(LucideIcons.layers,
                        size: AppSizes.iconMd,
                        color: AppColors.textSec),
                    const SizedBox(width: 8),
                    Text(
                      'Share as carousel',
                      style: TextStyle(
                        fontSize: AppSizes.fontXsPlus,
                        fontWeight: FontWeight.w800,
                        color: AppColors.text,
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
}

// ── Data class for delivery photos ──

class _DeliveryPhoto {
  final String caption;
  final String hashtags;
  final String ratio;
  final String platform;

  const _DeliveryPhoto({
    required this.caption,
    required this.hashtags,
    required this.ratio,
    required this.platform,
  });
}

// ── Platform share button ──

class _PlatformShareButton extends StatelessWidget {
  final String name;
  final Color color;
  final VoidCallback onTap;

  const _PlatformShareButton({
    required this.name,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 10),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: color.withValues(alpha: 0.08),
              border: Border.all(color: color.withValues(alpha: 0.15)),
            ),
            child: Center(
              child: Text(
                name,
                style: TextStyle(
                  fontSize: AppSizes.fontXxsPlus,
                  fontWeight: FontWeight.w800,
                  color: color,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Action chip (Copy, Save, Redo) ──

class _ActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _ActionChip({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.borderMed),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 11, color: AppColors.textTer),
                const SizedBox(width: 4),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: AppSizes.fontXxs,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textTer,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
