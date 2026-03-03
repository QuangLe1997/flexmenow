import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_animations.dart';
import '../../core/app_images.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../../data/mock_data.dart';
import '../../widgets/image_slideshow.dart';

/// "What's your flex?" personalization screen.
///
/// Gold "YOUR VIBE" label, 3 cards with cycling thumbnails, accent-colored
/// selection (circle → check), auto-nav to login after 600ms.
class PersonalizeScreen extends StatefulWidget {
  const PersonalizeScreen({super.key});

  @override
  State<PersonalizeScreen> createState() => _PersonalizeScreenState();
}

class _PersonalizeScreenState extends State<PersonalizeScreen> {
  String? _selectedId;
  // Per-card cycling thumbnail index
  final List<int> _thumbIndex = [0, 0, 0];
  final List<Timer?> _thumbTimers = [null, null, null];

  @override
  void initState() {
    super.initState();
    // Start cycling thumbnails for each card
    for (int i = 0; i < 3; i++) {
      _thumbTimers[i] = Timer.periodic(
        Duration(milliseconds: 2000 + (i * 300)),
        (_) {
          if (mounted) {
            setState(() {
              _thumbIndex[i] = (_thumbIndex[i] + 1) % 4;
            });
          }
        },
      );
    }
  }

  @override
  void dispose() {
    for (final t in _thumbTimers) {
      t?.cancel();
    }
    super.dispose();
  }

  void _onSelect(String id) {
    setState(() => _selectedId = id);
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) context.go('/login');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 60),

              // "YOUR VIBE" gold label
              Text(
                'YOUR VIBE',
                style: AppTextStyles.monoSmall.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.brand,
                  letterSpacing: 3,
                ),
              ),
              const SizedBox(height: 12),

              // "What's your flex?"
              Text(
                "What's your\nflex?",
                style: TextStyle(
                  fontSize: 34,
                  fontWeight: FontWeight.w800,
                  fontStyle: FontStyle.italic,
                  color: AppColors.text,
                  letterSpacing: -1,
                  height: 1.1,
                ),
              ),
              const SizedBox(height: 32),

              // 3 option cards
              ...List.generate(kPersonalizeOptions.length, (index) {
                final option = kPersonalizeOptions[index];
                final isSelected = _selectedId == option.id;
                return Padding(
                  padding: EdgeInsets.only(
                    bottom: index < kPersonalizeOptions.length - 1 ? 12 : 0,
                  ),
                  child: _buildOptionCard(option, isSelected, index),
                );
              }),

              const Spacer(),

              // Skip link
              Center(
                child: TextButton(
                  onPressed: () => context.go('/login'),
                  child: Text(
                    'Skip for now',
                    style: TextStyle(
                      color: AppColors.textTer,
                      fontSize: AppSizes.fontSmPlus,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOptionCard(
      PersonalizeOption option, bool isSelected, int index) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _onSelect(option.id),
        borderRadius: BorderRadius.circular(AppSizes.radiusLg),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: AppCurves.enter,
          padding: const EdgeInsets.all(AppSizes.lg),
          decoration: BoxDecoration(
            color: isSelected
                ? option.accentColor.withValues(alpha: 0.12)
                : AppColors.card,
            borderRadius: BorderRadius.circular(AppSizes.radiusLg),
            border: Border.all(
              color:
                  isSelected ? option.accentColor : AppColors.borderMed,
              width: isSelected ? 2 : 1,
            ),
          ),
        child: Row(
          children: [
            // Cycling thumbnail
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 600),
              child: ClipRRect(
                key: ValueKey('${option.id}_${_thumbIndex[index]}'),
                borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                child: PlaceholderImage(
                  index: _thumbIndex[index] + (index * 2),
                  width: 56,
                  height: 56,
                  borderRadius: AppSizes.radiusMd,
                  imageUrl: [AppImages.onbFlexlocket, AppImages.onbFlexshot, AppImages.onbFlextale][index],
                  child: Center(
                    child: Icon(
                      index == 0
                          ? LucideIcons.sparkles
                          : index == 1
                              ? LucideIcons.wand
                              : LucideIcons.bookOpen,
                      size: AppSizes.iconXl,
                      color: option.accentColor.withValues(alpha: 0.5),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),

            // Title + subtitle
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    option.title,
                    style: TextStyle(
                      fontSize: AppSizes.fontBase,
                      fontWeight: FontWeight.w600,
                      color: AppColors.text,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    option.subtitle,
                    style: TextStyle(
                      fontSize: AppSizes.fontSmPlus,
                      color: AppColors.textSec,
                    ),
                  ),
                ],
              ),
            ),

            // Selection indicator (circle → check)
            AnimatedContainer(
              duration: AppDurations.fast,
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected
                    ? option.accentColor
                    : Colors.transparent,
                border: Border.all(
                  color: isSelected
                      ? option.accentColor
                      : AppColors.textTer,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? const Icon(
                      LucideIcons.check,
                      size: AppSizes.iconMd,
                      color: Colors.white,
                    )
                  : null,
            ),
          ],
        ),
      ),
      ),
    );
  }
}
