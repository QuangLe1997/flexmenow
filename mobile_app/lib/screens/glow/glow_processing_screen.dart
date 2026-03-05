import 'dart:io';
import 'dart:math' as math;
import 'dart:ui' as ui;

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

/// Glow processing — Lensa/Remini style photo-centric processing screen.
/// User's photo dominates with progressive blur-to-sharp reveal, scanning line,
/// floating particles, and compact step dots.
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
  late final AnimationController _scanController;
  late final AnimationController _particleController;
  late final AnimationController _pulseController;
  late final AnimationController _vibeController;
  double _progress = 0;
  int _currentStep = 0;
  int _vibeIndex = 0;
  String? _uploadedImageUrl;

  static const _stepColors = [
    AppColors.pink,
    AppColors.brand400,
    AppColors.brand,
    AppColors.purple,
    AppColors.blue,
    AppColors.green,
  ];

  @override
  void initState() {
    super.initState();
    _scanController = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat();
    _particleController = AnimationController(vsync: this, duration: const Duration(seconds: 6))..repeat();
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
    _scanController.dispose();
    _particleController.dispose();
    _pulseController.dispose();
    _vibeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pct = (_progress * 100).toInt();
    final accentColor = _currentStep < _stepColors.length
        ? _stepColors[_currentStep]
        : AppColors.brand;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Container(
        decoration: const BoxDecoration(gradient: AppGradients.processing),
        child: SafeArea(
          child: Column(
            children: [
              // ── Top bar: close + badge ──
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
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
                            color: Colors.white.withValues(alpha: 0.04),
                            border: Border.all(color: AppColors.borderMed),
                          ),
                          child: const Icon(LucideIcons.x, size: AppSizes.iconBase, color: AppColors.textTer),
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.green.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                        border: Border.all(color: AppColors.green.withValues(alpha: 0.2)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(LucideIcons.shield, size: 12, color: AppColors.green.withValues(alpha: 0.7)),
                          const SizedBox(width: 5),
                          Text('Undetectable', style: TextStyle(fontSize: AppSizes.fontXxsPlus, color: AppColors.green, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // ── Hero photo area (60%) ──
              Expanded(
                flex: 6,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: AnimatedBuilder(
                    animation: Listenable.merge([_scanController, _particleController, _pulseController]),
                    builder: (context, _) {
                      return Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: accentColor.withValues(alpha: 0.2 + 0.2 * _pulseController.value),
                              blurRadius: 20 + 15 * _pulseController.value,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(20),
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              // Progressive blur reveal
                              ImageFiltered(
                                imageFilter: ui.ImageFilter.blur(
                                  sigmaX: 8.0 * (1.0 - _progress),
                                  sigmaY: 8.0 * (1.0 - _progress),
                                ),
                                child: widget.imagePath != null
                                    ? Image.file(File(widget.imagePath!), fit: BoxFit.cover)
                                    : Container(color: AppColors.zinc800),
                              ),

                              // Scanning line
                              Positioned(
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                child: LayoutBuilder(
                                  builder: (context, constraints) {
                                    final scanY = _scanController.value * constraints.maxHeight;
                                    return Stack(
                                      children: [
                                        Positioned(
                                          top: scanY - 1,
                                          left: 0,
                                          right: 0,
                                          child: Container(
                                            height: 2,
                                            decoration: BoxDecoration(
                                              gradient: LinearGradient(
                                                colors: [
                                                  Colors.transparent,
                                                  accentColor.withValues(alpha: 0.8),
                                                  Colors.transparent,
                                                ],
                                              ),
                                              boxShadow: [
                                                BoxShadow(
                                                  color: accentColor.withValues(alpha: 0.5),
                                                  blurRadius: 20,
                                                  spreadRadius: 4,
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    );
                                  },
                                ),
                              ),

                              // Floating particles
                              CustomPaint(
                                painter: _ParticlePainter(
                                  progress: _particleController.value,
                                  color: accentColor,
                                ),
                              ),

                              // Percentage badge (bottom-right)
                              Positioned(
                                bottom: 12,
                                right: 12,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: AppColors.bg.withValues(alpha: 0.85),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: accentColor.withValues(alpha: 0.3)),
                                  ),
                                  child: Text(
                                    '$pct%',
                                    style: AppTextStyles.mono.copyWith(
                                      fontSize: AppSizes.fontMdPlus,
                                      fontWeight: FontWeight.w900,
                                      color: accentColor,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // ── Bottom info area (40%) ──
              Expanded(
                flex: 4,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Column(
                    children: [
                      // Title
                      Text(
                        'Enhancing your glow',
                        style: TextStyle(
                          fontSize: AppSizes.fontXlPlus,
                          fontWeight: FontWeight.w800,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Compact step dots
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(kGlowSteps.length, (i) {
                          final isDone = i < _currentStep;
                          final isActive = i == _currentStep;
                          return Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 2),
                            child: AnimatedContainer(
                              duration: AppDurations.normal,
                              width: isActive ? 20 : 6,
                              height: 6,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(3),
                                color: isDone
                                    ? AppColors.green
                                    : isActive
                                        ? accentColor
                                        : AppColors.zinc700,
                              ),
                            ),
                          );
                        }),
                      ),
                      const SizedBox(height: 10),

                      // Current step text
                      AnimatedSwitcher(
                        duration: AppDurations.normal,
                        child: Text(
                          _errorMessage != null
                              ? 'Enhancement failed — showing original'
                              : _currentStep < kGlowSteps.length ? kGlowSteps[_currentStep] : 'Done!',
                          key: ValueKey(_errorMessage ?? _currentStep),
                          style: TextStyle(
                            fontSize: AppSizes.fontSmPlus,
                            fontWeight: FontWeight.w600,
                            color: _errorMessage != null ? AppColors.red : accentColor,
                          ),
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

                      const Spacer(),

                      // Thin progress bar
                      Container(
                        height: 3,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(2),
                          color: AppColors.zinc800.withValues(alpha: 0.5),
                        ),
                        child: LayoutBuilder(
                          builder: (context, constraints) => Stack(
                            children: [
                              AnimatedContainer(
                                duration: AppDurations.medium,
                                width: constraints.maxWidth * _progress,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(2),
                                  gradient: LinearGradient(
                                    colors: [AppColors.brand600, accentColor, AppColors.brand400],
                                  ),
                                  boxShadow: [
                                    BoxShadow(color: accentColor.withValues(alpha: 0.5), blurRadius: 8),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Trust badge
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
                      const SizedBox(height: 8),

                      // Branding
                      Text(
                        'FLEXLOCKET · IMAGEN AI',
                        style: AppTextStyles.captionMono.copyWith(
                          fontSize: AppSizes.font2xs,
                          color: AppColors.textTer.withValues(alpha: 0.3),
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Floating particles that drift upward with pulsing opacity.
class _ParticlePainter extends CustomPainter {
  final double progress;
  final Color color;
  static final _rng = math.Random(42);
  static final _particles = List.generate(18, (i) => _ParticleData(
    x: _rng.nextDouble(),
    y: _rng.nextDouble(),
    size: 1.5 + _rng.nextDouble() * 2.5,
    speed: 0.3 + _rng.nextDouble() * 0.7,
    phase: _rng.nextDouble() * math.pi * 2,
  ));

  _ParticlePainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    for (final p in _particles) {
      final y = (p.y - progress * p.speed) % 1.0;
      final opacity = (0.3 + 0.4 * math.sin(progress * math.pi * 2 + p.phase)).clamp(0.0, 1.0);
      final paint = Paint()
        ..color = color.withValues(alpha: opacity * 0.6)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 1);
      canvas.drawCircle(
        Offset(p.x * size.width, y * size.height),
        p.size,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _ParticlePainter old) => old.progress != progress;
}

class _ParticleData {
  final double x, y, size, speed, phase;
  const _ParticleData({required this.x, required this.y, required this.size, required this.speed, required this.phase});
}
