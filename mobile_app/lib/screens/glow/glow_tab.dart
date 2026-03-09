import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_animations.dart';
import '../../core/app_shadows.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../../providers/app_providers.dart';

/// Camera-first Glow tab (FlexLocket).
///
/// Starts with a choice screen (Camera or Gallery).
/// No face detection required — works with any photo type.
class GlowTab extends ConsumerStatefulWidget {
  const GlowTab({super.key});

  @override
  ConsumerState<GlowTab> createState() => _GlowTabState();
}

class _GlowTabState extends ConsumerState<GlowTab>
    with SingleTickerProviderStateMixin, WidgetsBindingObserver {
  CameraController? _cameraController;
  bool _cameraReady = false;
  bool _isFrontCamera = true;
  bool _showCamera = false; // Start with choice screen
  File? _selectedImage;
  late final AnimationController _pulseController;
  final _picker = ImagePicker();
  List<CameraDescription> _cameras = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    // Don't auto-init camera — user chooses first
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!_showCamera) return;
    if (_cameraController == null || !_cameraController!.value.isInitialized) return;
    if (state == AppLifecycleState.inactive) {
      _cameraController?.dispose();
      _cameraController = null;
      if (mounted) setState(() => _cameraReady = false);
    } else if (state == AppLifecycleState.resumed) {
      _initCamera();
    }
  }

  Future<void> _initCameras() async {
    try {
      _cameras = await availableCameras();
    } catch (_) {
      _cameras = [];
    }
    await _initCamera();
  }

  Future<void> _initCamera() async {
    if (_cameras.isEmpty) {
      if (mounted) setState(() => _cameraReady = false);
      return;
    }

    final lens = _isFrontCamera ? CameraLensDirection.front : CameraLensDirection.back;
    final cam = _cameras.firstWhere(
      (c) => c.lensDirection == lens,
      orElse: () => _cameras.first,
    );

    _cameraController?.dispose();
    _cameraController = CameraController(
      cam,
      ResolutionPreset.high,
      enableAudio: false,
      imageFormatGroup: ImageFormatGroup.jpeg,
    );

    try {
      await _cameraController!.initialize();
      if (mounted) setState(() => _cameraReady = true);
    } catch (e) {
      if (mounted) setState(() => _cameraReady = false);
    }
  }

  Future<void> _flipCamera() async {
    setState(() {
      _isFrontCamera = !_isFrontCamera;
      _cameraReady = false;
    });
    await _initCamera();
  }

  /// Open camera mode from choice screen
  Future<void> _startCamera() async {
    setState(() => _showCamera = true);
    await _initCameras();
  }

  /// Open gallery from choice screen → go directly to confirm
  Future<void> _openGalleryFromChoice() async {
    final xfile = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 90,
    );
    if (xfile != null && mounted) {
      context.push('/glow/confirm', extra: xfile.path);
    }
  }

  /// Gallery pick from camera mode → show in viewfinder
  Future<void> _onGalleryPick() async {
    final xfile = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 90,
    );
    if (xfile != null && mounted) {
      setState(() => _selectedImage = File(xfile.path));
    }
  }

  void _clearSelectedImage() {
    setState(() => _selectedImage = null);
  }

  Future<void> _onCapture() async {
    if (_selectedImage != null) {
      _processImage(_selectedImage!);
      return;
    }

    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      final xfile = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 90,
      );
      if (xfile != null) _processImage(File(xfile.path));
      return;
    }

    try {
      final xfile = await _cameraController!.takePicture();
      _processImage(File(xfile.path));
    } catch (_) {
      final xfile = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 90,
      );
      if (xfile != null) _processImage(File(xfile.path));
    }
  }

  /// Navigate to confirm screen — no face detection required.
  /// Works with any photo type (portraits, food, landscapes, etc.)
  void _processImage(File file) {
    if (!mounted) return;
    context.push('/glow/confirm', extra: file.path);
  }

  /// Go back to choice screen from camera
  void _backToChoice() {
    _cameraController?.dispose();
    _cameraController = null;
    setState(() {
      _showCamera = false;
      _cameraReady = false;
      _selectedImage = null;
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _cameraController?.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_showCamera) {
      return _buildChoiceScreen();
    }
    return _buildCameraScreen();
  }

  // ===========================================================================
  // CHOICE SCREEN — Camera or Gallery
  // ===========================================================================

  Widget _buildChoiceScreen() {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const SizedBox(height: 32),
              // Header
              RichText(
                text: TextSpan(
                  style: TextStyle(fontSize: AppSizes.font2xlPlus, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic),
                  children: const [
                    TextSpan(text: 'Flex', style: TextStyle(color: Colors.white)),
                    TextSpan(text: 'Locket', style: TextStyle(color: AppColors.brand)),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Enhance any photo instantly',
                style: TextStyle(fontSize: AppSizes.fontSmPlus, color: Colors.white.withValues(alpha: 0.45)),
              ),
              const Spacer(),
              // Camera card
              _choiceCard(
                icon: LucideIcons.camera,
                title: 'Take Photo',
                subtitle: 'Open camera to capture',
                onTap: _startCamera,
                isPrimary: true,
              ),
              const SizedBox(height: 14),
              // Gallery card
              _choiceCard(
                icon: LucideIcons.image,
                title: 'Choose Photo',
                subtitle: 'Pick from your gallery',
                onTap: _openGalleryFromChoice,
                isPrimary: false,
              ),
              const Spacer(),
              // Trust badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                  border: Border.all(color: AppColors.green.withValues(alpha: 0.15)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(LucideIcons.shield, size: 13, color: AppColors.green.withValues(alpha: 0.7)),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        'Subtle & undetectable',
                        style: TextStyle(fontSize: AppSizes.fontXsPlus, fontWeight: FontWeight.w500, color: Colors.white.withValues(alpha: 0.5)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _choiceCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    required bool isPrimary,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 22),
        decoration: BoxDecoration(
          gradient: isPrimary ? AppGradients.glass : null,
          borderRadius: BorderRadius.circular(AppSizes.radiusXl),
          border: Border.all(
            color: isPrimary ? AppColors.brand.withValues(alpha: 0.3) : Colors.white.withValues(alpha: 0.12),
          ),
          boxShadow: isPrimary ? AppShadows.brandGlow(0.15) : null,
        ),
        child: Row(
          children: [
            // Icon container with gradient ring for primary
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: isPrimary ? AppGradients.btn : null,
                color: isPrimary ? null : Colors.white.withValues(alpha: 0.08),
                border: isPrimary
                    ? Border.all(color: AppColors.brand400.withValues(alpha: 0.5), width: 2)
                    : Border.all(color: Colors.white.withValues(alpha: 0.12)),
              ),
              child: Icon(icon, size: AppSizes.iconXl, color: isPrimary ? AppColors.bg : Colors.white),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontSize: AppSizes.fontBase, fontWeight: FontWeight.w700, color: Colors.white)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: TextStyle(fontSize: AppSizes.fontXs, color: Colors.white.withValues(alpha: 0.5))),
                ],
              ),
            ),
            // Animated arrow for primary card
            if (isPrimary)
              AnimatedBuilder(
                animation: _pulseController,
                builder: (_, __) => Transform.translate(
                  offset: Offset(3.0 * _pulseController.value, 0),
                  child: Icon(LucideIcons.chevronRight, size: AppSizes.iconBase, color: AppColors.brand),
                ),
              )
            else
              Icon(LucideIcons.chevronRight, size: AppSizes.iconBase, color: Colors.white.withValues(alpha: 0.3)),
          ],
        ),
      ),
    );
  }

  // ===========================================================================
  // CAMERA SCREEN — Full-screen viewfinder
  // ===========================================================================

  Widget _buildCameraScreen() {
    final credits = ref.watch(creditsProvider);
    final user = ref.watch(currentUserProvider).value;
    final glowRemaining = 10 - (user?.glowUsedToday ?? 0);

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          _buildViewfinder(),
          // Gradient overlay top
          Positioned(
            top: 0, left: 0, right: 0, height: 120,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.black.withValues(alpha: 0.7), Colors.transparent],
                ),
              ),
            ),
          ),
          // Gradient overlay bottom
          Positioned(
            bottom: 0, left: 0, right: 0, height: 200,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [Colors.black.withValues(alpha: 0.85), Colors.transparent],
                ),
              ),
            ),
          ),
          // Header with back button
          Positioned(top: 0, left: 0, right: 0, child: _buildCameraHeader(credits, glowRemaining)),
          // Bottom controls
          Positioned(bottom: 0, left: 0, right: 0, child: _buildBottomControls()),
        ],
      ),
    );
  }

  Widget _buildCameraHeader(double credits, int glowRemaining) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Row(
          children: [
            // Back to choice screen
            _circleBtn(LucideIcons.arrowLeft, _backToChoice),
            const SizedBox(width: 12),
            RichText(
              text: TextSpan(
                style: TextStyle(fontSize: AppSizes.fontXl, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic),
                children: const [
                  TextSpan(text: 'Flex', style: TextStyle(color: Colors.white)),
                  TextSpan(text: 'Locket', style: TextStyle(color: AppColors.brand)),
                ],
              ),
            ),
            const Spacer(),
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                  border: Border.all(color: AppColors.brand.withValues(alpha: 0.3)),
                  boxShadow: [BoxShadow(color: AppColors.brand.withValues(alpha: 0.15), blurRadius: 10)],
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(LucideIcons.zap, size: 13, color: AppColors.brand),
                  const SizedBox(width: 4),
                  Text(
                    glowRemaining > 0
                        ? '$glowRemaining free'
                        : credits.toStringAsFixed(credits.truncateToDouble() == credits ? 0 : 1),
                    style: AppTextStyles.mono.copyWith(fontWeight: FontWeight.w700, color: AppColors.brand),
                  ),
                ]),
              ),
              const SizedBox(width: 8),
              _circleBtn(
                _selectedImage == null ? LucideIcons.refreshCw : LucideIcons.x,
                _selectedImage == null ? _flipCamera : _clearSelectedImage,
              ),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _circleBtn(IconData icon, VoidCallback onTap) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.1),
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
          ),
          child: Icon(icon, size: AppSizes.iconBase, color: Colors.white),
        ),
      ),
    );
  }

  Widget _buildViewfinder() {
    return Stack(
      fit: StackFit.expand,
      children: [
        if (_selectedImage != null)
          Image.file(_selectedImage!, fit: BoxFit.cover)
        else if (_cameraReady && _cameraController != null && _cameraController!.value.isInitialized)
          SizedBox.expand(child: FittedBox(fit: BoxFit.cover, child: SizedBox(
            width: _cameraController!.value.previewSize!.height,
            height: _cameraController!.value.previewSize!.width,
            child: CameraPreview(_cameraController!),
          )))
        else
          Container(
            color: Colors.black,
            child: const Center(child: CircularProgressIndicator(color: AppColors.brand, strokeWidth: 2)),
          ),

        // Subtle face guide (only in camera mode, gold gradient border)
        if (_selectedImage == null && _cameraReady)
          Center(
            child: Container(
              width: 160, height: 220,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(80),
                border: Border.all(color: AppColors.brand.withValues(alpha: 0.15), width: 1.5),
                boxShadow: [BoxShadow(color: AppColors.brand.withValues(alpha: 0.06), blurRadius: 20, spreadRadius: 2)],
              ),
            ),
          ),

        // Status indicator
        if (_selectedImage != null)
          Positioned(
            bottom: 200, left: 0, right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                  border: Border.all(color: AppColors.brand.withValues(alpha: 0.2)),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(LucideIcons.image, size: AppSizes.iconXs, color: AppColors.brand),
                  const SizedBox(width: 6),
                  Text('Tap shutter to continue', style: TextStyle(fontSize: AppSizes.fontXsPlus, fontWeight: FontWeight.w500, color: Colors.white.withValues(alpha: 0.8))),
                ]),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildBottomControls() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Mode label
            if (_cameraReady && _selectedImage == null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: AnimatedBuilder(
                  animation: _pulseController,
                  builder: (_, __) => Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 5, height: 5,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle, color: AppColors.green,
                          boxShadow: [BoxShadow(color: AppColors.green.withValues(alpha: 0.4 + 0.3 * _pulseController.value), blurRadius: 6)],
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text('READY', style: AppTextStyles.monoSmall.copyWith(color: Colors.white.withValues(alpha: 0.5), letterSpacing: 2)),
                    ],
                  ),
                ),
              ),
            // Controls row
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Gallery (circle)
                GestureDetector(
                  onTap: _onGalleryPick,
                  child: Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                    ),
                    child: const Icon(LucideIcons.image, color: Colors.white, size: AppSizes.iconBase),
                  ),
                ),
                const SizedBox(width: 28),

                // Shutter with pulsing outer ring
                AnimatedBuilder(
                  animation: _pulseController,
                  builder: (_, __) => GestureDetector(
                    onTap: (_cameraReady || _selectedImage != null) ? _onCapture : null,
                    child: Container(
                      width: 82, height: 82,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.brand.withValues(alpha: 0.15 + 0.15 * _pulseController.value),
                            blurRadius: 16 + 8 * _pulseController.value,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: Container(
                        width: 82, height: 82,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.brand.withValues(alpha: 0.4 + 0.2 * _pulseController.value), width: 3),
                        ),
                        child: Center(
                          child: AnimatedContainer(
                            duration: AppDurations.fast,
                            width: 62, height: 62,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: _selectedImage != null ? null : AppGradients.btn,
                              color: _selectedImage != null ? AppColors.brand : null,
                            ),
                            child: _selectedImage != null
                                ? const Icon(LucideIcons.arrowRight, size: AppSizes.icon2xl, color: AppColors.bg)
                                : null,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 28),

                // Flip camera / Clear image (circle)
                GestureDetector(
                  onTap: _selectedImage != null ? _clearSelectedImage : _flipCamera,
                  child: Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
                    ),
                    child: Icon(
                      _selectedImage != null ? LucideIcons.x : LucideIcons.refreshCw,
                      color: Colors.white, size: AppSizes.iconBase,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
