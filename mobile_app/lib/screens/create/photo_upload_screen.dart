import 'dart:io';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_text_styles.dart';
import '../../core/credit_utils.dart';
import '../../core/design_tokens.dart';
import '../../data/models/template_data.dart';
import '../../providers/app_providers.dart';
import '../../widgets/image_slideshow.dart';

/// Photo upload screen — Dashed upload zone with Camera/Gallery buttons
/// OR image preview with crop corners + tools, template preview card, Generate CTA.
class PhotoUploadScreen extends ConsumerStatefulWidget {
  final String templateId;
  const PhotoUploadScreen({super.key, required this.templateId});

  @override
  ConsumerState<PhotoUploadScreen> createState() => _PhotoUploadScreenState();
}

class _PhotoUploadScreenState extends ConsumerState<PhotoUploadScreen> {
  File? _pickedFile;
  bool _isValidating = false;
  bool _isUploading = false;
  bool _faceValid = false;
  String? _faceError;
  final _picker = ImagePicker();

  Future<void> _onCameraCapture() async {
    final xfile = await _picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 90,
    );
    if (xfile != null) _handlePickedFile(File(xfile.path));
  }

  Future<void> _onGalleryPick() async {
    final xfile = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 90,
    );
    if (xfile != null) _handlePickedFile(File(xfile.path));
  }

  Future<void> _handlePickedFile(File file) async {
    setState(() {
      _pickedFile = file;
      _isValidating = true;
      _faceValid = false;
      _faceError = null;
    });

    final faceService = ref.read(faceDetectionServiceProvider);
    final result = await faceService.validateFace(file);

    if (!mounted) return;
    setState(() {
      _isValidating = false;
      _faceValid = result.isValid;
      _faceError = result.isValid ? null : result.message;
    });
  }

  Future<void> _generate() async {
    final templatesAsync = ref.read(templatesProvider).value;
    if (templatesAsync == null || _pickedFile == null) return;

    final shot = templatesAsync.activeTemplates.cast<TemplateData?>().firstWhere(
      (t) => t!.id == widget.templateId,
      orElse: () => null,
    );
    if (shot == null) return;

    // Credit check
    final hasCredits = await ensureCredits(context, ref, shot.credits.toDouble());
    if (!hasCredits || !mounted) return;

    setState(() => _isUploading = true);

    try {
      final userId = FirebaseAuth.instance.currentUser?.uid;
      if (userId == null) throw Exception('Not authenticated');

      // Upload image to Storage
      final storageService = ref.read(storageServiceProvider);
      final storagePath = await storageService.uploadImage(
        userId: userId,
        file: _pickedFile!,
      );

      if (!mounted) return;

      // Call Cloud Function
      final genRepo = ref.read(generationRepositoryProvider);
      final result = await genRepo.callGenFlexShot(
        inputImagePath: storagePath,
        templateId: widget.templateId,
      );

      if (!mounted) return;

      final generationId = result['generationId'] as String;
      context.push('/create/processing/$generationId');
    } catch (e) {
      if (!mounted) return;
      setState(() => _isUploading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Generation failed: ${e.toString()}'),
          backgroundColor: AppColors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final templatesAsync = ref.watch(templatesProvider);

    return templatesAsync.when(
      loading: () => const Scaffold(backgroundColor: AppColors.bg, body: Center(child: CircularProgressIndicator(color: AppColors.brand))),
      error: (_, __) => const Scaffold(backgroundColor: AppColors.bg, body: Center(child: Text('Error'))),
      data: (response) {
        final shot = response.activeTemplates.cast<TemplateData?>().firstWhere(
          (t) => t!.id == widget.templateId,
          orElse: () => response.activeTemplates.isNotEmpty ? response.activeTemplates.first : null,
        );
        if (shot == null) return const Scaffold(backgroundColor: AppColors.bg, body: Center(child: Text('Template not found')));
        return _buildScreen(shot, response);
      },
    );
  }

  Widget _buildScreen(TemplateData shot, TemplatesResponse response) {
    final hasPhoto = _pickedFile != null;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(children: [
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => context.pop(),
                    customBorder: const CircleBorder(),
                    child: Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(color: AppColors.card, shape: BoxShape.circle, border: Border.all(color: AppColors.borderMed)),
                      child: const Icon(LucideIcons.arrowLeft, size: AppSizes.iconBase, color: AppColors.text),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Text('Upload Photo', style: TextStyle(fontSize: AppSizes.fontBase, fontWeight: FontWeight.w600, color: AppColors.text)),
              ]),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: hasPhoto ? _buildPhotoPreview() : _buildUploadZone(),
              ),
            ),
            _buildTemplateCard(shot, response),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
              child: SizedBox(
                width: double.infinity, height: 52,
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: hasPhoto && _faceValid && !_isValidating ? AppGradients.btn : null,
                    color: !hasPhoto || _isValidating || !_faceValid ? AppColors.zinc800 : null,
                    borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                  ),
                  child: ElevatedButton(
                    onPressed: hasPhoto && _faceValid && !_isValidating && !_isUploading ? _generate : null,
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, disabledBackgroundColor: Colors.transparent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd))),
                    child: _isUploading
                        ? Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                            const SizedBox(width: AppSizes.iconBase, height: AppSizes.iconBase, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.bg)),
                            const SizedBox(width: 10),
                            Text('Generating...', style: TextStyle(fontSize: AppSizes.fontMdPlus, fontWeight: FontWeight.w700, color: AppColors.bg)),
                          ])
                        : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                            Icon(LucideIcons.wand, size: AppSizes.iconBase, color: hasPhoto && _faceValid ? AppColors.bg : AppColors.textTer),
                            const SizedBox(width: 8),
                            Text('Generate FlexShot', style: TextStyle(fontSize: AppSizes.fontMdPlus, fontWeight: FontWeight.w700, color: hasPhoto && _faceValid ? AppColors.bg : AppColors.textTer)),
                          ]),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUploadZone() {
    return Column(children: [
      const SizedBox(height: 24),
      Container(
        width: double.infinity, height: 300,
        decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(AppSizes.radiusXl), border: Border.all(color: AppColors.brand.withValues(alpha: 0.3), width: 1.5)),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(width: 64, height: 64, decoration: BoxDecoration(color: AppColors.brand.withValues(alpha: 0.1), shape: BoxShape.circle), child: Icon(LucideIcons.upload, size: AppSizes.icon3xl, color: AppColors.brand)),
          const SizedBox(height: 16),
          Text('Upload a clear face photo', style: TextStyle(fontSize: AppSizes.fontMdPlus, fontWeight: FontWeight.w600, color: AppColors.text)),
          const SizedBox(height: 4),
          Text('Front-facing, good lighting', style: TextStyle(fontSize: AppSizes.fontXs, color: AppColors.textSec)),
          const SizedBox(height: 20),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            _uploadBtn(LucideIcons.camera, 'Camera', _onCameraCapture),
            const SizedBox(width: 12),
            _uploadBtn(LucideIcons.image, 'Gallery', _onGalleryPick, primary: true),
          ]),
        ]),
      ),
      const Spacer(),
      Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: AppColors.brand.withValues(alpha: 0.06), borderRadius: BorderRadius.circular(AppSizes.radiusMd), border: Border.all(color: AppColors.brand.withValues(alpha: 0.15))),
        child: Row(children: [
          Icon(LucideIcons.zap, size: AppSizes.iconMd, color: AppColors.brand),
          const SizedBox(width: 10),
          Expanded(child: Text('Best results: face clearly visible, natural expression, no heavy filters', style: TextStyle(fontSize: AppSizes.fontXsPlus, color: AppColors.brand, height: 1.4))),
        ]),
      ),
      const SizedBox(height: 12),
    ]);
  }

  Widget _uploadBtn(IconData icon, String label, VoidCallback onTap, {bool primary = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(gradient: primary ? AppGradients.btn : null, color: primary ? null : AppColors.card, borderRadius: BorderRadius.circular(AppSizes.radiusMd), border: primary ? null : Border.all(color: AppColors.borderMed)),
        child: Row(children: [
          Icon(icon, size: AppSizes.iconMd, color: primary ? AppColors.bg : AppColors.text),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(fontSize: AppSizes.fontSmPlus, fontWeight: FontWeight.w600, color: primary ? AppColors.bg : AppColors.text)),
        ]),
      ),
    );
  }

  Widget _buildPhotoPreview() {
    return Column(children: [
      const Spacer(),
      Stack(children: [
        Container(
          width: 250, height: 300,
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(AppSizes.radiusXl), border: Border.all(color: _faceValid ? AppColors.green.withValues(alpha: 0.5) : _faceError != null ? AppColors.red.withValues(alpha: 0.5) : AppColors.brand.withValues(alpha: 0.4), width: 2)),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppSizes.radiusXl),
            child: Stack(fit: StackFit.expand, children: [
              Image.file(_pickedFile!, fit: BoxFit.cover),
              if (_isValidating) Container(color: Colors.black.withValues(alpha: 0.5), child: const Center(child: CircularProgressIndicator(color: AppColors.brand, strokeWidth: 2))),
              if (!_isValidating && _faceValid)
                Positioned(bottom: 10, right: 10, child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: AppColors.green.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(AppSizes.radiusFull)),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(LucideIcons.checkCircle, size: AppSizes.iconXs, color: AppColors.green),
                    const SizedBox(width: 4),
                    Text('Face OK', style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXxs, fontWeight: FontWeight.w600, color: AppColors.green)),
                  ]),
                )),
              if (!_isValidating && _faceError != null)
                Positioned(bottom: 10, left: 10, right: 10, child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: AppColors.red.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(AppSizes.radiusFull)),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(LucideIcons.alertCircle, size: AppSizes.iconXs, color: AppColors.red),
                    const SizedBox(width: 4),
                    Expanded(child: Text(_faceError!, style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXxs, fontWeight: FontWeight.w600, color: AppColors.red), maxLines: 2, overflow: TextOverflow.ellipsis)),
                  ]),
                )),
            ]),
          ),
        ),
      ]),
      const SizedBox(height: 16),
      if (!_isValidating) Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        _toolBtn(LucideIcons.crop, 'Crop'),
        const SizedBox(width: 12),
        _toolBtn(LucideIcons.maximize, 'Full'),
        const SizedBox(width: 12),
        _toolBtn(LucideIcons.refreshCw, 'Retry', onTap: () => setState(() {
          _pickedFile = null;
          _faceValid = false;
          _faceError = null;
        })),
      ]),
      const Spacer(),
    ]);
  }

  Future<void> _cropImage() async {
    if (_pickedFile == null) return;
    final cropped = await ImageCropper().cropImage(
      sourcePath: _pickedFile!.path,
      uiSettings: [
        AndroidUiSettings(
          toolbarTitle: 'Crop Photo',
          toolbarColor: AppColors.bg,
          toolbarWidgetColor: AppColors.text,
          backgroundColor: AppColors.bg,
          activeControlsWidgetColor: AppColors.brand,
        ),
        IOSUiSettings(title: 'Crop Photo'),
      ],
    );
    if (cropped != null && mounted) {
      _handlePickedFile(File(cropped.path));
    }
  }

  void _showFullView() {
    if (_pickedFile == null) return;
    showDialog(
      context: context,
      barrierColor: Colors.black,
      builder: (_) => GestureDetector(
        onTap: () => Navigator.of(context).pop(),
        child: InteractiveViewer(
          child: Center(child: Image.file(_pickedFile!, fit: BoxFit.contain)),
        ),
      ),
    );
  }

  Widget _toolBtn(IconData icon, String label, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap ?? () {
        if (label == 'Crop') {
          _cropImage();
        } else if (label == 'Full') {
          _showFullView();
        }
      },
      child: Column(children: [
        Container(width: 44, height: 44, decoration: BoxDecoration(color: AppColors.card, shape: BoxShape.circle, border: Border.all(color: AppColors.borderMed)), child: Icon(icon, size: AppSizes.iconBase, color: AppColors.textSec)),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: AppSizes.fontXs, color: AppColors.textTer)),
      ]),
    );
  }

  Widget _buildTemplateCard(TemplateData shot, TemplatesResponse response) {
    final imageUrl = response.buildImageUrl(shot.coverImage);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(AppSizes.radiusMd), border: Border.all(color: AppColors.borderMed)),
        child: Row(children: [
          ClipRRect(borderRadius: BorderRadius.circular(AppSizes.radiusSm), child: PlaceholderImage(index: 0, width: 44, height: 44, borderRadius: AppSizes.radiusSm, imageUrl: imageUrl)),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(shot.localizedName('en'), style: TextStyle(fontSize: AppSizes.fontSmPlus, fontWeight: FontWeight.w600, color: AppColors.text)),
            Text(shot.category, style: TextStyle(fontSize: AppSizes.fontXsPlus, color: AppColors.textTer)),
          ])),
          Row(children: [
            Icon(LucideIcons.zap, size: AppSizes.iconXs, color: AppColors.brand),
            const SizedBox(width: 3),
            Text('${shot.credits}', style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXs, fontWeight: FontWeight.w700, color: AppColors.brand)),
          ]),
        ]),
      ),
    );
  }
}
