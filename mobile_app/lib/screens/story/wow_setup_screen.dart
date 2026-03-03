import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

import '../../core/app_animations.dart';
import '../../core/app_shadows.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../../data/mock_data.dart';
import '../../providers/app_providers.dart';
import '../../widgets/image_slideshow.dart';

/// WOW Setup wizard — 5-step: upload face, pick topic, pick source,
/// set schedule (duration + time), review & subscribe.
/// Mirrors: docs/mockup_app/app.jsx WowSetup component.
class WowSetupScreen extends ConsumerStatefulWidget {
  const WowSetupScreen({super.key});

  @override
  ConsumerState<WowSetupScreen> createState() => _WowSetupScreenState();
}

class _WowSetupScreenState extends ConsumerState<WowSetupScreen> {
  int _step = 1; // 1-based to match mockup

  // Step 1: Face upload
  String _mode = 'solo'; // solo | couple
  final List<bool> _faceUploaded = [false, false];

  // Step 2: Topic
  String? _selectedTopicId;

  // Step 3: Source
  String _source = 'surprise'; // surprise | pick
  final Set<String> _pickedPacks = {};

  // Step 4: Schedule
  String _selectedDurationId = 'w7';
  String _selectedTimeId = 'morning';

  bool get _canNext {
    switch (_step) {
      case 1:
        return _faceUploaded[0];
      case 2:
        return _selectedTopicId != null;
      case 3:
        return true; // both options are valid
      case 4:
        return true; // defaults are set
      case 5:
        return true;
      default:
        return false;
    }
  }

  WowTopic? get _selectedTopicObj =>
      _selectedTopicId != null
          ? kWowTopics.where((t) => t.id == _selectedTopicId).firstOrNull
          : null;

  WowPlan get _selectedDurationObj =>
      kWowPlans.firstWhere((p) => p.id == _selectedDurationId,
          orElse: () => kWowPlans[1]);

  TimeSlot get _selectedTimeObj =>
      kTimeSlots.firstWhere((t) => t.id == _selectedTimeId,
          orElse: () => kTimeSlots[0]);

  void _handleBack() {
    if (_step > 1) {
      setState(() => _step--);
    } else {
      context.pop();
    }
  }

  void _handleNext() {
    if (_step < 5) {
      setState(() => _step++);
    }
  }

  Future<void> _handleSubscribe() async {
    try {
      final rcService = ref.read(revenueCatServiceProvider);
      final offerings = await rcService.getOfferings();
      final wowOffering = offerings.current;

      if (wowOffering == null || wowOffering.availablePackages.isEmpty) {
        // No offerings configured yet — skip to dashboard for now
        if (mounted) context.pushReplacement('/story/wow/dashboard');
        return;
      }

      // Find the matching package based on selected duration
      final durationMap = {'d3': '3_day', 'w7': '7_day', 'm30': '30_day', 'forever': 'monthly'};
      final targetId = durationMap[_selectedDurationId] ?? '7_day';
      final package = wowOffering.availablePackages.firstWhere(
        (p) => p.identifier.contains(targetId),
        orElse: () => wowOffering.availablePackages.first,
      );

      await rcService.purchase(package);

      if (mounted) context.pushReplacement('/story/wow/dashboard');
    } on PurchasesErrorCode catch (e) {
      if (e == PurchasesErrorCode.purchaseCancelledError) return;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Purchase failed. Please try again.')),
        );
      }
    } catch (e) {
      debugPrint('WOW subscribe error: $e');
      if (mounted) {
        // Fallback: navigate anyway for development
        context.pushReplacement('/story/wow/dashboard');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final progress = (_step / 5);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Column(
        children: [
          // Top bar with back, progress, step dots
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
              child: Row(
                children: [
                  // Back button
                  Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: _handleBack,
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
                  const SizedBox(width: 14),
                  // Progress bar
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'STEP $_step OF 5',
                          style: TextStyle(
                            fontSize: AppSizes.fontXxsPlus,
                            fontWeight: FontWeight.w800,
                            color: AppColors.brand,
                            letterSpacing: 2,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          height: 4,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(2),
                            color: AppColors.input,
                          ),
                          child: FractionallySizedBox(
                            alignment: Alignment.centerLeft,
                            widthFactor: progress,
                            child: Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(2),
                                color: AppColors.brand,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 14),
                  // Step dots
                  Row(
                    children: List.generate(5, (i) {
                      final s = i + 1;
                      final isActive = s == _step;
                      final isPast = s <= _step;
                      return AnimatedContainer(
                        duration: AppDurations.normal,
                        margin: const EdgeInsets.only(left: 4),
                        width: isActive ? 14 : 6,
                        height: 6,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(3),
                          color: isPast
                              ? AppColors.brand
                              : AppColors.textTer.withValues(alpha: 0.18),
                        ),
                      );
                    }),
                  ),
                ],
              ),
            ),
          ),

          // Content area
          Expanded(
            child: SingleChildScrollView(
              child: _buildStepContent(),
            ),
          ),

          // Bottom CTA
          _buildBottomCTA(),
        ],
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_step) {
      case 1:
        return _buildStep1Face();
      case 2:
        return _buildStep2Topic();
      case 3:
        return _buildStep3Source();
      case 4:
        return _buildStep4Schedule();
      case 5:
        return _buildStep5Review();
      default:
        return const SizedBox();
    }
  }

  // ── STEP 1: Upload Face ──
  Widget _buildStep1Face() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Upload your face',
            style: TextStyle(
              fontSize: AppSizes.fontXlPlus,
              fontWeight: FontWeight.w900,
              fontStyle: FontStyle.italic,
              color: AppColors.text,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'AI needs your face to create personalized content daily.',
            style: TextStyle(
              fontSize: AppSizes.fontXs,
              color: AppColors.textSec,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 20),

          // Solo / Couple toggle
          Row(
            children: [
              _ModeToggle(
                id: 'solo',
                label: 'Solo',
                desc: 'Just me',
                icon: LucideIcons.user,
                isActive: _mode == 'solo',
                onTap: () => setState(() {
                  _mode = 'solo';
                  _faceUploaded[1] = false;
                }),
              ),
              const SizedBox(width: 10),
              _ModeToggle(
                id: 'couple',
                label: 'Couple',
                desc: 'Me + bae',
                icon: LucideIcons.heart,
                isActive: _mode == 'couple',
                onTap: () => setState(() => _mode = 'couple'),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Upload circles
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _FaceUploadCircle(
                label: 'YOUR FACE',
                isUploaded: _faceUploaded[0],
                onTap: () => setState(() => _faceUploaded[0] = true),
              ),
              if (_mode == 'couple') ...[
                const SizedBox(width: 16),
                _FaceUploadCircle(
                  label: "BAE'S FACE",
                  isUploaded: _faceUploaded[1],
                  onTap: () => setState(() => _faceUploaded[1] = true),
                ),
              ],
            ],
          ),
          const SizedBox(height: 24),

          // Tips
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: AppColors.brand.withValues(alpha: 0.05),
              border:
                  Border.all(color: AppColors.brand.withValues(alpha: 0.09)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'TIPS FOR BEST RESULTS',
                  style: TextStyle(
                    fontSize: AppSizes.fontXxsPlus,
                    fontWeight: FontWeight.w800,
                    color: AppColors.brand,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 8),
                ...['Clear, front-facing selfie',
                    'Good lighting, no sunglasses',
                    'Neutral expression works best']
                    .map((tip) => Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            children: [
                              Icon(LucideIcons.check, size: AppSizes.fontXxsPlus,
                                  color: AppColors.brand),
                              const SizedBox(width: 8),
                              Text(
                                tip,
                                style: TextStyle(
                                  fontSize: AppSizes.fontXsPlus,
                                  color: AppColors.textSec,
                                ),
                              ),
                            ],
                          ),
                        )),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── STEP 2: Pick Topic ──
  Widget _buildStep2Topic() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Pick your vibe',
            style: TextStyle(
              fontSize: AppSizes.fontXlPlus,
              fontWeight: FontWeight.w900,
              fontStyle: FontStyle.italic,
              color: AppColors.text,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Choose a topic for your daily WOW content.',
            style: TextStyle(
              fontSize: AppSizes.fontXs,
              color: AppColors.textSec,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 20),

          // 2-col grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.3,
            ),
            itemCount: kWowTopics.length,
            itemBuilder: (_, i) {
              final topic = kWowTopics[i];
              final active = _selectedTopicId == topic.id;
              return GestureDetector(
                onTap: () => setState(() => _selectedTopicId = topic.id),
                child: AnimatedContainer(
                  duration: AppDurations.normal,
                  padding: const EdgeInsets.fromLTRB(14, 18, 14, 14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(18),
                    color: active
                        ? topic.color.withValues(alpha: 0.07)
                        : AppColors.card,
                    border: Border.all(
                      color: active ? topic.color : AppColors.borderMed,
                      width: active ? 2 : 1,
                    ),
                    boxShadow: active
                        ? [
                            ...AppShadows.colorGlow(topic.color, opacity: 0.09, blur: 20, spread: 0),
                            ...AppShadows.colorGlow(topic.color, opacity: 0.05, blur: 0, spread: 4),
                          ]
                        : null,
                  ),
                  child: Stack(
                    children: [
                      // Active top bar
                      if (active)
                        Positioned(
                          top: -18,
                          left: -14,
                          right: -14,
                          child: Container(
                            height: 2,
                            color: topic.color,
                          ),
                        ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(topic.emoji,
                              style: const TextStyle(fontSize: AppSizes.font2xl)),
                          const SizedBox(height: 8),
                          Text(
                            topic.name,
                            style: TextStyle(
                              fontSize: AppSizes.fontSm,
                              fontWeight: FontWeight.w800,
                              color:
                                  active ? AppColors.text : AppColors.textSec,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            topic.description,
                            style: TextStyle(
                              fontSize: AppSizes.fontXxsPlus,
                              color: active ? topic.color : AppColors.textTer,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // ── STEP 3: Pick Source ──
  Widget _buildStep3Source() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'How should we pick?',
            style: TextStyle(
              fontSize: AppSizes.fontXlPlus,
              fontWeight: FontWeight.w900,
              fontStyle: FontStyle.italic,
              color: AppColors.text,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Let AI surprise you or hand-pick your story packs.',
            style: TextStyle(
              fontSize: AppSizes.fontXs,
              color: AppColors.textSec,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 20),

          // Surprise option
          GestureDetector(
            onTap: () => setState(() {
              _source = 'surprise';
              _pickedPacks.clear();
            }),
            child: AnimatedContainer(
              duration: AppDurations.normal,
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(18, 20, 18, 20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                gradient: _source == 'surprise'
                    ? LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          AppColors.purple.withValues(alpha: 0.12),
                          AppColors.brand.withValues(alpha: 0.08),
                        ],
                      )
                    : null,
                color: _source != 'surprise' ? AppColors.card : null,
                border: Border.all(
                  color: _source == 'surprise'
                      ? AppColors.purple
                      : AppColors.borderMed,
                  width: _source == 'surprise' ? 2 : 1,
                ),
              ),
              child: Stack(
                children: [
                  if (_source == 'surprise')
                    Positioned(
                      top: -8,
                      right: -6,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 3),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          color: AppColors.purple,
                        ),
                        child: Text(
                          'RECOMMENDED',
                          style: TextStyle(
                            fontSize: AppSizes.font2xs,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                    ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('\ud83c\udfb2',
                          style: TextStyle(fontSize: AppSizes.font2xl)),
                      const SizedBox(height: 8),
                      Text(
                        'Surprise me daily',
                        style: TextStyle(
                          fontSize: AppSizes.fontBase,
                          fontWeight: FontWeight.w800,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'AI picks the best templates and styles for your topic each day. Maximum variety, zero effort.',
                        style: TextStyle(
                          fontSize: AppSizes.fontXsPlus,
                          color: AppColors.textSec,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Pick packs option
          GestureDetector(
            onTap: () => setState(() => _source = 'pick'),
            child: AnimatedContainer(
              duration: AppDurations.normal,
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(18, 20, 18, 20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: _source == 'pick'
                    ? AppColors.brand.withValues(alpha: 0.05)
                    : AppColors.card,
                border: Border.all(
                  color: _source == 'pick'
                      ? AppColors.brand
                      : AppColors.borderMed,
                  width: _source == 'pick' ? 2 : 1,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('\ud83d\udce6',
                      style: TextStyle(fontSize: AppSizes.font2xl)),
                  const SizedBox(height: 8),
                  Text(
                    'Choose story packs',
                    style: TextStyle(
                      fontSize: AppSizes.fontBase,
                      fontWeight: FontWeight.w800,
                      color: AppColors.text,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Hand-pick specific story packs to rotate through.',
                    style: TextStyle(
                      fontSize: AppSizes.fontXsPlus,
                      color: AppColors.textSec,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Pack selector (visible when "pick" chosen)
          if (_source == 'pick') ...[
            const SizedBox(height: 16),
            Text(
              'SELECT PACKS',
              style: TextStyle(
                fontSize: AppSizes.fontXxsPlus,
                fontWeight: FontWeight.w800,
                color: AppColors.textTer,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 10),
            ...kTales.take(5).map((tale) {
              final selected = _pickedPacks.contains(tale.id);
              return GestureDetector(
                onTap: () {
                  setState(() {
                    if (selected) {
                      _pickedPacks.remove(tale.id);
                    } else {
                      _pickedPacks.add(tale.id);
                    }
                  });
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    color: selected
                        ? AppColors.brand.withValues(alpha: 0.05)
                        : AppColors.card,
                    border: Border.all(
                      color: selected
                          ? AppColors.brand.withValues(alpha: 0.25)
                          : AppColors.borderMed,
                      width: selected ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      // Thumbnail placeholder
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: PlaceholderImage(
                          index: kTales.indexOf(tale),
                          width: 40,
                          height: 40,
                          borderRadius: 0,
                          icon: LucideIcons.bookOpen,
                          imageUrl: tale.imageUrl,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              tale.title,
                              style: TextStyle(
                                fontSize: AppSizes.fontXs,
                                fontWeight: FontWeight.w700,
                                color: AppColors.text,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              '${tale.imageCount} images \u00b7 ${tale.category}',
                              style: TextStyle(
                                fontSize: AppSizes.fontXxs,
                                color: AppColors.textTer,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Checkbox
                      Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(6),
                          color:
                              selected ? AppColors.brand : Colors.transparent,
                          border: selected
                              ? null
                              : Border.all(
                                  color: AppColors.borderMed, width: 2),
                        ),
                        child: selected
                            ? const Center(
                                child: Icon(LucideIcons.check, size: AppSizes.iconXs,
                                    color: Colors.white),
                              )
                            : null,
                      ),
                    ],
                  ),
                ),
              );
            }),
          ],
        ],
      ),
    );
  }

  // ── STEP 4: Schedule (duration + time) ──
  Widget _buildStep4Schedule() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Set your schedule',
            style: TextStyle(
              fontSize: AppSizes.fontXlPlus,
              fontWeight: FontWeight.w900,
              fontStyle: FontStyle.italic,
              color: AppColors.text,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'How long and when should we deliver your WOW?',
            style: TextStyle(
              fontSize: AppSizes.fontXs,
              color: AppColors.textSec,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 20),

          // DURATION label
          Text(
            'DURATION',
            style: TextStyle(
              fontSize: AppSizes.fontXxsPlus,
              fontWeight: FontWeight.w800,
              color: AppColors.textTer,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 10),

          // Duration 2x2 grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.3,
            ),
            itemCount: kWowPlans.length,
            itemBuilder: (_, i) {
              final plan = kWowPlans[i];
              final active = _selectedDurationId == plan.id;
              final isForever = plan.days < 0;
              final daysLabel = isForever ? '\u221e' : '${plan.days}d';

              Color badgeColor = AppColors.green;
              if (plan.badge == 'POPULAR') badgeColor = AppColors.brand;
              if (plan.badge == 'VIP') badgeColor = AppColors.purple;

              return GestureDetector(
                onTap: () => setState(() => _selectedDurationId = plan.id),
                child: AnimatedContainer(
                  duration: AppDurations.normal,
                  padding: const EdgeInsets.fromLTRB(14, 16, 14, 14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    color: active
                        ? AppColors.brand.withValues(alpha: 0.06)
                        : AppColors.card,
                    border: Border.all(
                      color: active ? AppColors.brand : AppColors.borderMed,
                      width: active ? 2 : 1,
                    ),
                  ),
                  child: Stack(
                    children: [
                      if (plan.badge != null)
                        Positioned(
                          top: -8,
                          right: -6,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              color: badgeColor,
                            ),
                            child: Text(
                              plan.badge!,
                              style: TextStyle(
                                fontSize: AppSizes.font3xs,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                letterSpacing: 1,
                              ),
                            ),
                          ),
                        ),
                      Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              daysLabel,
                              style: AppTextStyles.mono.copyWith(
                                fontSize: AppSizes.fontXlPlus,
                                fontWeight: FontWeight.w900,
                                color: active
                                    ? AppColors.text
                                    : AppColors.textSec,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '\$${plan.price.toStringAsFixed(2)}${isForever ? '/mo' : ''}',
                              style: TextStyle(
                                fontSize: AppSizes.fontSm,
                                fontWeight: FontWeight.w800,
                                color: active
                                    ? AppColors.brand
                                    : AppColors.textTer,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              plan.perDay,
                              style: TextStyle(
                                fontSize: AppSizes.fontXxs,
                                color: AppColors.textTer,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 24),

          // DELIVERY TIME label
          Text(
            'DELIVERY TIME',
            style: TextStyle(
              fontSize: AppSizes.fontXxsPlus,
              fontWeight: FontWeight.w800,
              color: AppColors.textTer,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 10),

          // Time slots 2x2 grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 2.5,
            ),
            itemCount: kTimeSlots.length,
            itemBuilder: (_, i) {
              final slot = kTimeSlots[i];
              final active = _selectedTimeId == slot.id;
              return GestureDetector(
                onTap: () => setState(() => _selectedTimeId = slot.id),
                child: AnimatedContainer(
                  duration: AppDurations.normal,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    color: active
                        ? AppColors.brand.withValues(alpha: 0.06)
                        : AppColors.card,
                    border: Border.all(
                      color: active ? AppColors.brand : AppColors.borderMed,
                      width: active ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Text(slot.emoji, style: const TextStyle(fontSize: AppSizes.fontXl)),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            slot.label,
                            style: TextStyle(
                              fontSize: AppSizes.fontXs,
                              fontWeight: FontWeight.w700,
                              color:
                                  active ? AppColors.text : AppColors.textSec,
                            ),
                          ),
                          Text(
                            slot.time,
                            style: AppTextStyles.monoSmall.copyWith(
                              color:
                                  active ? AppColors.brand : AppColors.textTer,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 24),

          // Preview info
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              color: AppColors.brand.withValues(alpha: 0.05),
              border:
                  Border.all(color: AppColors.brand.withValues(alpha: 0.09)),
            ),
            child: Row(
              children: [
                Icon(LucideIcons.zap, size: AppSizes.iconMd, color: AppColors.brand),
                const SizedBox(width: 10),
                Expanded(
                  child: RichText(
                    text: TextSpan(
                      style: TextStyle(
                        fontSize: AppSizes.fontXs,
                        color: AppColors.textSec,
                        fontWeight: FontWeight.w600,
                      ),
                      children: [
                        const TextSpan(text: 'Your first WOW drops: '),
                        TextSpan(
                          text: 'Tomorrow at ${_selectedTimeObj.time}',
                          style: TextStyle(
                            color: AppColors.brand,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── STEP 5: Review & Subscribe ──
  Widget _buildStep5Review() {
    final topicObj = _selectedTopicObj;
    final durationObj = _selectedDurationObj;
    final timeObj = _selectedTimeObj;
    final isForever = durationObj.days < 0;
    final daysLabel = isForever ? '\u221e' : '${durationObj.days}';

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Review & subscribe',
            style: TextStyle(
              fontSize: AppSizes.fontXlPlus,
              fontWeight: FontWeight.w900,
              fontStyle: FontStyle.italic,
              color: AppColors.text,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Double check your WOW setup before we start.',
            style: TextStyle(
              fontSize: AppSizes.fontXs,
              color: AppColors.textSec,
              height: 1.6,
            ),
          ),
          const SizedBox(height: 16),

          // Subscription badges
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: AppColors.purple.withValues(alpha: 0.07),
                  border: Border.all(
                      color: AppColors.purple.withValues(alpha: 0.18)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(LucideIcons.crown, size: AppSizes.fontXsPlus,
                        color: AppColors.purple),
                    const SizedBox(width: 5),
                    Text(
                      'SUBSCRIPTION',
                      style: TextStyle(
                        fontSize: AppSizes.fontXxs,
                        fontWeight: FontWeight.w900,
                        color: AppColors.purple,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  color: AppColors.green.withValues(alpha: 0.07),
                  border: Border.all(
                      color: AppColors.green.withValues(alpha: 0.18)),
                ),
                child: Text(
                  'NO CREDITS NEEDED',
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
          const SizedBox(height: 16),

          // Summary card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              color: AppColors.card,
              border: Border.all(color: AppColors.borderMed),
            ),
            child: Column(
              children: [
                _SummaryRow(
                  label: 'Plan',
                  value: 'WOW Subscription',
                  isBrand: true,
                ),
                _SummaryRow(
                  label: 'Mode',
                  value: _mode == 'solo' ? 'Solo' : 'Couple',
                ),
                _SummaryRow(
                  label: 'Topic',
                  value: topicObj != null
                      ? '${topicObj.emoji} ${topicObj.name}'
                      : '\u2014',
                ),
                _SummaryRow(
                  label: 'Source',
                  value: _source == 'surprise'
                      ? 'AI Surprise'
                      : '${_pickedPacks.length} packs',
                ),
                _SummaryRow(
                  label: 'Duration',
                  value: '$daysLabel days',
                ),
                _SummaryRow(
                  label: 'Time',
                  value: '${timeObj.emoji} ${timeObj.time}',
                ),
                _SummaryRow(
                  label: 'Starts',
                  value: 'Tomorrow',
                  showBorder: false,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Price display
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              color: AppColors.card,
              border:
                  Border.all(color: AppColors.brand.withValues(alpha: 0.12)),
            ),
            child: Column(
              children: [
                Text(
                  'SUBSCRIPTION PRICE',
                  style: TextStyle(
                    fontSize: AppSizes.fontXxs,
                    fontWeight: FontWeight.w900,
                    color: AppColors.brand,
                    letterSpacing: 3,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '\$${durationObj.price.toStringAsFixed(2)}',
                  style: AppTextStyles.mono.copyWith(
                    fontSize: AppSizes.font4xl,
                    fontWeight: FontWeight.w900,
                    color: AppColors.text,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${durationObj.perDay} \u00b7 Cancel anytime',
                  style: TextStyle(
                    fontSize: AppSizes.fontXs,
                    color: AppColors.textTer,
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    color: AppColors.green.withValues(alpha: 0.06),
                    border: Border.all(
                        color: AppColors.green.withValues(alpha: 0.12)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(LucideIcons.check, size: AppSizes.fontXxsPlus,
                          color: AppColors.green),
                      const SizedBox(width: 6),
                      Text(
                        'No credits deducted \u2014 flat subscription fee',
                        style: TextStyle(
                          fontSize: AppSizes.fontXxsPlus,
                          fontWeight: FontWeight.w700,
                          color: AppColors.green,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // VIP perks
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              color: AppColors.brand.withValues(alpha: 0.05),
              border:
                  Border.all(color: AppColors.brand.withValues(alpha: 0.09)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'YOUR SUBSCRIPTION INCLUDES',
                  style: TextStyle(
                    fontSize: AppSizes.fontXxsPlus,
                    fontWeight: FontWeight.w900,
                    color: AppColors.brand,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 10),
                ...[
                  '4 ready-to-post photos delivered daily',
                  'Captions + hashtags + platform-optimized ratios',
                  '1-tap share to Instagram, TikTok, Facebook',
                  'Redo any photo unlimited times',
                  'No credit usage \u2014 everything included in plan',
                ].map((perk) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        children: [
                          Icon(LucideIcons.checkCircle, size: AppSizes.iconSm,
                              color: AppColors.brand),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              perk,
                              style: TextStyle(
                                fontSize: AppSizes.fontXsPlus,
                                color: AppColors.textSec,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    )),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Bottom CTA ──
  Widget _buildBottomCTA() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 40),
      color: AppColors.bg,
      child: _step < 5
          ? SizedBox(
              width: double.infinity,
              height: 56,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: _canNext ? AppGradients.btn : null,
                  color: _canNext ? null : AppColors.input,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: _canNext
                      ? AppShadows.brandGlowLg(0.18)
                      : null,
                ),
                child: MaterialButton(
                  onPressed: _canNext ? _handleNext : null,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _step == 4 ? 'Review & Subscribe' : 'Next',
                    style: TextStyle(
                      fontSize: AppSizes.fontSmPlus,
                      fontWeight: FontWeight.w900,
                      color: _canNext ? Colors.black : AppColors.textTer,
                      letterSpacing: 1,
                    ),
                  ),
                ),
              ),
            )
          : SizedBox(
              width: double.infinity,
              height: 56,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      AppColors.brand,
                      AppColors.brand400,
                      AppColors.brand600,
                    ],
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: AppShadows.brandGlowLg(0.25),
                ),
                child: MaterialButton(
                  onPressed: _handleSubscribe,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(LucideIcons.crown, size: AppSizes.iconBase,
                          color: Colors.white),
                      const SizedBox(width: 8),
                      Text(
                        'Subscribe & Start WOW',
                        style: TextStyle(
                          fontSize: AppSizes.fontSmPlus,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                          letterSpacing: 1,
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

// ── Private sub-widgets ──

class _ModeToggle extends StatelessWidget {
  final String id;
  final String label;
  final String desc;
  final IconData icon;
  final bool isActive;
  final VoidCallback onTap;

  const _ModeToggle({
    required this.id,
    required this.label,
    required this.desc,
    required this.icon,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: AppDurations.normal,
          padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            color: isActive
                ? AppColors.brand.withValues(alpha: 0.06)
                : AppColors.card,
            border: Border.all(
              color: isActive ? AppColors.brand : AppColors.borderMed,
              width: isActive ? 2 : 1,
            ),
            boxShadow: isActive
                ? AppShadows.colorGlow(AppColors.brand, opacity: 0.05, blur: 0, spread: 4)
                : null,
          ),
          child: Column(
            children: [
              Icon(icon, size: AppSizes.icon2xl,
                  color: isActive ? AppColors.brand : AppColors.textTer),
              const SizedBox(height: 8),
              Text(
                label,
                style: TextStyle(
                  fontSize: AppSizes.fontSm,
                  fontWeight: FontWeight.w800,
                  color: isActive ? AppColors.text : AppColors.textTer,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                desc,
                style: TextStyle(
                  fontSize: AppSizes.fontXxsPlus,
                  color: isActive ? AppColors.brand : AppColors.textTer,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FaceUploadCircle extends StatelessWidget {
  final String label;
  final bool isUploaded;
  final VoidCallback onTap;

  const _FaceUploadCircle({
    required this.label,
    required this.isUploaded,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: AppDurations.normal,
        width: 120,
        height: 120,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: isUploaded
              ? AppColors.brand.withValues(alpha: 0.06)
              : AppColors.brand.withValues(alpha: 0.04),
          border: isUploaded
              ? Border.all(color: AppColors.brand, width: 3)
              : Border.all(
                  color: AppColors.brand.withValues(alpha: 0.25),
                  width: 2,
                  // dash effect simulated with opacity
                ),
          boxShadow: isUploaded
              ? AppShadows.brandGlow(0.12)
              : null,
        ),
        child: isUploaded
            ? Stack(
                children: [
                  // Placeholder for uploaded face
                  Center(
                    child: ClipOval(
                      child: PlaceholderImage(
                        width: 114,
                        height: 114,
                        borderRadius: 999,
                        icon: LucideIcons.user,
                      ),
                    ),
                  ),
                  // Check badge
                  Positioned(
                    bottom: 4,
                    right: 4,
                    child: Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.brand,
                        border: Border.all(color: AppColors.bg, width: 2),
                      ),
                      child: const Center(
                        child: Icon(LucideIcons.check, size: AppSizes.iconXs,
                            color: Colors.white),
                      ),
                    ),
                  ),
                ],
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.camera, size: AppSizes.icon3xl,
                      color: AppColors.brand.withValues(alpha: 0.38)),
                  const SizedBox(height: 6),
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: AppSizes.fontXxs,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textTer,
                      letterSpacing: 1,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBrand;
  final bool showBorder;

  const _SummaryRow({
    required this.label,
    required this.value,
    this.isBrand = false,
    this.showBorder = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: showBorder
          ? BoxDecoration(
              border: Border(
                bottom: BorderSide(color: AppColors.border),
              ),
            )
          : null,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: AppSizes.fontXs,
              color: AppColors.textTer,
              fontWeight: FontWeight.w600,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: AppSizes.fontXs,
              color: isBrand ? AppColors.brand : AppColors.text,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
