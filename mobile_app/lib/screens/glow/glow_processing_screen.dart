import 'dart:io';
import 'dart:math' as math;

import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_animations.dart';
import '../../core/app_text_styles.dart';
import '../../core/constants.dart';
import '../../core/design_tokens.dart';
import '../../data/mock_data.dart';
import '../../providers/app_providers.dart';
import '../../widgets/image_slideshow.dart';

/// Glow processing — premium circular photo with SVG progress ring,
/// rotating ambient rings, 6-step vertical timeline,
/// Gen Z motivational text, "Subtle & undetectable" trust badge.
class GlowProcessingScreen extends ConsumerStatefulWidget {
  final String? imagePath;
  final String? enhanceMode;
  final String? filterId;
  final String? customPrompt;
  const GlowProcessingScreen({super.key, this.imagePath, this.enhanceMode, this.filterId, this.customPrompt});

  @override
  ConsumerState<GlowProcessingScreen> createState() => _GlowProcessingScreenState();
}

class _GlowProcessingScreenState extends ConsumerState<GlowProcessingScreen>
    with TickerProviderStateMixin {
  late final AnimationController _ringController;
  late final AnimationController _ambientController;
  late final AnimationController _pulseController;
  late final AnimationController _vibeController;
  double _progress = 0;
  int _currentStep = 0;
  int _vibeIndex = 0;
  String? _uploadedImageUrl;

  // Step colors for the timeline — each step has a unique accent
  static const _stepColors = [
    AppColors.pink,    // Reading your vibe
    AppColors.brand400, // Matching glow tone
    AppColors.brand,   // Finding best light
    AppColors.purple,  // Polishing to perfection
    AppColors.blue,    // Chef's kiss
    AppColors.green,   // Serving looks
  ];

  @override
  void initState() {
    super.initState();
    _ringController = AnimationController(vsync: this, duration: const Duration(seconds: 1))..repeat();
    _ambientController = AnimationController(vsync: this, duration: const Duration(seconds: 12))..repeat();
    _pulseController = AnimationController(vsync: this, duration: const Duration(milliseconds: 2500))..repeat(reverse: true);
    _vibeController = AnimationController(vsync: this, duration: const Duration(seconds: 4))
      ..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          setState(() => _vibeIndex = (_vibeIndex + 1) % kGlowVibes.length);
          _vibeController.forward(from: 0);
        }
      })
      ..forward();

    _processImage();
  }

  String? _enhancedImageUrl;
  String? _errorMessage;

  Future<void> _processImage() async {
    if (widget.imagePath == null) return;

    try {
      final userId = FirebaseAuth.instance.currentUser?.uid;
      if (userId == null) throw Exception('Not authenticated');

      // Step 1: Upload image to Storage
      setState(() { _currentStep = 0; _progress = 0.1; });
      final storageService = ref.read(storageServiceProvider);
      final storagePath = await storageService.uploadImage(
        userId: userId,
        file: File(widget.imagePath!),
      );
      if (!mounted) return;

      setState(() { _currentStep = 1; _progress = 0.2; });
      final url = await storageService.getDownloadUrl(storagePath);
      if (!mounted) return;
      setState(() => _uploadedImageUrl = url);

      // Step 2-5: Call genFlexLocket CF (handles AI enhancement server-side)
      setState(() { _currentStep = 2; _progress = 0.35; });
      final functions = FirebaseFunctions.instanceFor(region: AppConstants.firebaseRegion);
      final callable = functions.httpsCallable(AppConstants.cfGenFlexLocket);
      final result = await callable.call<dynamic>({
        'inputImagePath': storagePath,
        if (widget.enhanceMode != null) 'enhanceMode': widget.enhanceMode,
        if (widget.filterId != null) 'filterId': widget.filterId,
        if (widget.customPrompt != null) 'customPrompt': widget.customPrompt,
      });
      if (!mounted) return;

      final data = Map<String, dynamic>.from(result.data as Map);
      final outputImageUrl = data['outputImageUrl'] as String?;

      // Step 6: Done
      setState(() {
        _currentStep = kGlowSteps.length - 1;
        _progress = 1.0;
        _enhancedImageUrl = outputImageUrl;
      });

      await Future.delayed(AppDurations.medium);
      if (mounted) {
        context.go('/glow/result', extra: {
          'imagePath': widget.imagePath,
          'imageUrl': _enhancedImageUrl ?? _uploadedImageUrl,
          'enhanceMode': widget.enhanceMode,
          'filterId': widget.filterId,
          'customPrompt': widget.customPrompt,
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
      // Wait a moment then navigate back with original image
      await Future.delayed(const Duration(seconds: 2));
      if (mounted) {
        context.go('/glow/result', extra: {
          'imagePath': widget.imagePath,
          'imageUrl': _uploadedImageUrl,
          'enhanceMode': widget.enhanceMode,
          'filterId': widget.filterId,
          'customPrompt': widget.customPrompt,
        });
      }
    }
  }

  @override
  void dispose() {
    _ringController.dispose();
    _ambientController.dispose();
    _pulseController.dispose();
    _vibeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pct = (_progress * 100).toInt();

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Container(
        decoration: const BoxDecoration(gradient: AppGradients.processing),
        child: Stack(
          children: [
            // ── Rotating ambient rings ──
            AnimatedBuilder(
              animation: _ambientController,
              builder: (_, __) => Positioned(
                top: MediaQuery.of(context).size.height * 0.22,
                left: 0,
                right: 0,
                child: Center(
                  child: Transform.rotate(
                    angle: _ambientController.value * 2 * math.pi,
                    child: Container(
                      width: 300,
                      height: 300,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppColors.brand.withValues(alpha: 0.04 + 0.02 * _pulseController.value),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            AnimatedBuilder(
              animation: _ambientController,
              builder: (_, __) => Positioned(
                top: MediaQuery.of(context).size.height * 0.22 - 15,
                left: 0,
                right: 0,
                child: Center(
                  child: Transform.rotate(
                    angle: -_ambientController.value * 2 * math.pi * 0.6,
                    child: Container(
                      width: 330,
                      height: 330,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppColors.purple.withValues(alpha: 0.03),
                          style: BorderStyle.solid,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),

            SafeArea(
              child: Column(
                children: [
                  // ── Top: Back button ──
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                    child: Align(
                      alignment: Alignment.centerLeft,
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () => context.pop(),
                          customBorder: const CircleBorder(),
                          child: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withValues(alpha: 0.04),
                              border: Border.all(color: AppColors.borderMed),
                            ),
                            child: const Icon(LucideIcons.x, size: AppSizes.iconBase, color: AppColors.textTer),
                          ),
                        ),
                      ),
                    ),
                  ),

                  const Spacer(flex: 2),

                  // ── Center: Photo + circular progress ──
                  SizedBox(
                    width: 220,
                    height: 220,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Outer glow
                        AnimatedBuilder(
                          animation: _pulseController,
                          builder: (_, __) => Container(
                            width: 220,
                            height: 220,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.brand.withValues(alpha: 0.08 + 0.06 * _pulseController.value),
                                  blurRadius: 40 + 20 * _pulseController.value,
                                  spreadRadius: 4,
                                ),
                              ],
                            ),
                          ),
                        ),

                        // SVG circular progress ring
                        CustomPaint(
                          size: const Size(210, 210),
                          painter: _GlowProgressRingPainter(
                            progress: _progress,
                            stepColor: _currentStep < _stepColors.length
                                ? _stepColors[_currentStep]
                                : AppColors.brand,
                          ),
                        ),

                        // Circular photo with sweep overlay
                        AnimatedBuilder(
                          animation: _pulseController,
                          builder: (_, child) => Transform.scale(
                            scale: 1.0 + 0.015 * _pulseController.value,
                            child: child,
                          ),
                          child: Container(
                            width: 170,
                            height: 170,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.card, width: 3),
                              boxShadow: [BoxShadow(color: AppColors.brand.withValues(alpha: 0.1), blurRadius: 20)],
                            ),
                            child: ClipOval(
                              child: Stack(
                                fit: StackFit.expand,
                                children: [
                                  widget.imagePath != null
                                      ? Image.file(File(widget.imagePath!), fit: BoxFit.cover)
                                      : PlaceholderImage(index: 4, borderRadius: 0, icon: LucideIcons.user),
                                  // Gold sweep line that moves with progress
                                  IgnorePointer(
                                    child: AnimatedContainer(
                                      duration: AppDurations.slow,
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          begin: Alignment(-1 + 2 * _progress, 0),
                                          end: Alignment(-0.5 + 2 * _progress, 0),
                                          colors: [
                                            Colors.transparent,
                                            AppColors.brand.withValues(alpha: 0.15),
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

                        // Percentage badge (bottom-right)
                        Positioned(
                          bottom: 8,
                          right: 8,
                          child: Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColors.bg,
                              border: Border.all(color: AppColors.brand.withValues(alpha: 0.3), width: 2),
                              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.5), blurRadius: 12)],
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  '$pct',
                                  style: AppTextStyles.monoLarge.copyWith(
                                    fontSize: AppSizes.fontMdPlus,
                                    fontWeight: FontWeight.w900,
                                    color: AppColors.brand,
                                    height: 1,
                                  ),
                                ),
                                Text(
                                  '%',
                                  style: AppTextStyles.captionMono.copyWith(
                                    fontSize: AppSizes.font3xs,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textTer,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // ── Title + current step ──
                  ShaderMask(
                    shaderCallback: (bounds) => const LinearGradient(
                      colors: [AppColors.brand400, Colors.white, AppColors.brand400],
                    ).createShader(bounds),
                    child: Text(
                      'Glow Enhancement',
                      style: TextStyle(
                        fontSize: AppSizes.font2xl,
                        fontWeight: FontWeight.w900,
                        fontStyle: FontStyle.italic,
                        color: Colors.white,
                        letterSpacing: -0.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),

                  // Current step with colored dot
                  AnimatedSwitcher(
                    duration: AppDurations.normal,
                    child: Row(
                      key: ValueKey(_errorMessage ?? _currentStep),
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (_errorMessage == null && _currentStep < _stepColors.length) ...[
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _stepColors[_currentStep],
                              boxShadow: [BoxShadow(color: _stepColors[_currentStep].withValues(alpha: 0.6), blurRadius: 6)],
                            ),
                          ),
                          const SizedBox(width: 8),
                        ],
                        Text(
                          _errorMessage != null
                              ? 'Enhancement failed — showing original'
                              : _currentStep < kGlowSteps.length ? kGlowSteps[_currentStep] : 'Done!',
                          style: TextStyle(
                            fontSize: AppSizes.fontSmPlus,
                            fontWeight: FontWeight.w600,
                            color: _errorMessage != null ? AppColors.red : AppColors.brand400,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 4),

                  // Rotating vibe text
                  AnimatedSwitcher(
                    duration: AppDurations.slow,
                    child: Text(
                      kGlowVibes[_vibeIndex],
                      key: ValueKey(_vibeIndex),
                      style: TextStyle(
                        fontSize: AppSizes.fontXs,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textTer,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // ── Step timeline — vertical checklist ──
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 44),
                    child: Column(
                      children: List.generate(kGlowSteps.length, (i) {
                        final isDone = i < _currentStep;
                        final isActive = i == _currentStep;
                        final isPending = i > _currentStep;
                        final stepColor = _stepColors[i];

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            children: [
                              // Connector + indicator
                              SizedBox(
                                width: 24,
                                child: Stack(
                                  alignment: Alignment.center,
                                  children: [
                                    if (i < kGlowSteps.length - 1)
                                      Positioned(
                                        top: 16,
                                        bottom: -8,
                                        child: Container(
                                          width: 1,
                                          color: isDone
                                              ? AppColors.brand.withValues(alpha: 0.25)
                                              : AppColors.zinc800.withValues(alpha: 0.5),
                                        ),
                                      ),
                                    AnimatedContainer(
                                      duration: AppDurations.normal,
                                      width: 20,
                                      height: 20,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: isDone
                                            ? AppColors.green.withValues(alpha: 0.12)
                                            : isActive
                                                ? stepColor.withValues(alpha: 0.12)
                                                : Colors.transparent,
                                        border: Border.all(
                                          color: isDone
                                              ? AppColors.green.withValues(alpha: 0.5)
                                              : isActive
                                                  ? stepColor.withValues(alpha: 0.6)
                                                  : AppColors.zinc700.withValues(alpha: 0.4),
                                          width: 1.5,
                                        ),
                                        boxShadow: isActive
                                            ? [BoxShadow(color: stepColor.withValues(alpha: 0.3), blurRadius: 8)]
                                            : null,
                                      ),
                                      child: isDone
                                          ? const Icon(LucideIcons.check, size: 10, color: AppColors.green)
                                          : isActive
                                              ? Center(
                                                  child: Container(
                                                    width: 6,
                                                    height: 6,
                                                    decoration: BoxDecoration(
                                                      shape: BoxShape.circle,
                                                      color: stepColor,
                                                      boxShadow: [BoxShadow(color: stepColor.withValues(alpha: 0.6), blurRadius: 4)],
                                                    ),
                                                  ),
                                                )
                                              : Center(
                                                  child: Container(
                                                    width: 4,
                                                    height: 4,
                                                    decoration: BoxDecoration(
                                                      shape: BoxShape.circle,
                                                      color: AppColors.textTer.withValues(alpha: 0.3),
                                                    ),
                                                  ),
                                                ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  kGlowSteps[i],
                                  style: TextStyle(
                                    fontSize: AppSizes.fontXs,
                                    fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                                    color: isDone
                                        ? AppColors.green
                                        : isActive
                                            ? stepColor
                                            : AppColors.textTer.withValues(alpha: isPending ? 0.35 : 1),
                                  ),
                                ),
                              ),
                              if (isDone)
                                Text(
                                  'DONE',
                                  style: AppTextStyles.captionMono.copyWith(
                                    fontSize: AppSizes.font3xs,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.green.withValues(alpha: 0.5),
                                    letterSpacing: 1,
                                  ),
                                ),
                            ],
                          ),
                        );
                      }),
                    ),
                  ),

                  const Spacer(),

                  // ── Bottom: Trust badge + branding ──
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.03),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(LucideIcons.shield, size: AppSizes.iconXs, color: AppColors.green.withValues(alpha: 0.7)),
                        const SizedBox(width: 8),
                        Text(
                          'Subtle & undetectable — your secret',
                          style: TextStyle(
                            fontSize: AppSizes.fontXxsPlus,
                            color: AppColors.textTer,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'FLEXLOCKET · IMAGEN AI',
                    style: AppTextStyles.captionMono.copyWith(
                      fontSize: AppSizes.font2xs,
                      color: AppColors.textTer.withValues(alpha: 0.3),
                      letterSpacing: 2,
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Draws a progress ring with glow and color-shifting accent.
class _GlowProgressRingPainter extends CustomPainter {
  final double progress;
  final Color stepColor;

  _GlowProgressRingPainter({required this.progress, required this.stepColor});

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(3, 3, size.width - 6, size.height - 6);

    // Background ring
    final bgPaint = Paint()
      ..color = AppColors.zinc800.withValues(alpha: 0.4)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;
    canvas.drawArc(rect, 0, 2 * math.pi, false, bgPaint);

    if (progress <= 0) return;

    final sweepAngle = progress * 2 * math.pi;

    // Glow layer
    final glowPaint = Paint()
      ..strokeWidth = 8
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..color = stepColor.withValues(alpha: 0.2)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);
    canvas.drawArc(rect, -math.pi / 2, sweepAngle, false, glowPaint);

    // Main progress ring
    final fgPaint = Paint()
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..shader = SweepGradient(
        startAngle: 0,
        endAngle: 2 * math.pi,
        colors: [AppColors.brand600, stepColor, AppColors.brand400, AppColors.brand],
      ).createShader(rect);
    canvas.drawArc(rect, -math.pi / 2, sweepAngle, false, fgPaint);
  }

  @override
  bool shouldRepaint(covariant _GlowProgressRingPainter old) =>
      old.progress != progress || old.stepColor != stepColor;
}
