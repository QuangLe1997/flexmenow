import 'dart:io';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../../data/models/story_data.dart';
import '../../providers/app_providers.dart';
import '../../widgets/image_slideshow.dart';

/// Tale upload screen — Photo upload for FlexTale stories.
///
/// Single photo for solo stories, or 2 photos for couple stories
/// (based on `story.gender == 'couple'`). Face detection, upload to Storage,
/// call genFlexTale CF, navigate to processing screen.
class TaleUploadScreen extends ConsumerStatefulWidget {
  final String storyId;
  const TaleUploadScreen({super.key, required this.storyId});

  @override
  ConsumerState<TaleUploadScreen> createState() => _TaleUploadScreenState();
}

class _TaleUploadScreenState extends ConsumerState<TaleUploadScreen> {
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

  Future<void> _startGeneration(StoryData tale) async {
    if (_pickedFile == null) return;

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
      final storyGenRepo = ref.read(storyGenerationRepositoryProvider);
      final result = await storyGenRepo.callGenFlexTale(
        inputImagePath: storagePath,
        storyId: widget.storyId,
      );

      if (!mounted) return;

      final storyDocId = result['storyId'] as String;
      context.go('/story/processing/$storyDocId');
    } catch (e) {
      if (!mounted) return;
      setState(() => _isUploading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to start story: ${e.toString()}'),
          backgroundColor: AppColors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final storiesAsync = ref.watch(storiesProvider);

    return storiesAsync.when(
      loading: () => const Scaffold(backgroundColor: AppColors.bg, body: Center(child: CircularProgressIndicator(color: AppColors.brand))),
      error: (_, __) => const Scaffold(backgroundColor: AppColors.bg, body: Center(child: Text('Error'))),
      data: (response) {
        final tale = response.stories.cast<StoryData?>().firstWhere(
          (s) => s!.id == widget.storyId,
          orElse: () => null,
        );
        if (tale == null) return const Scaffold(backgroundColor: AppColors.bg, body: Center(child: Text('Story not found')));
        return _buildScreen(tale, response);
      },
    );
  }

  Widget _buildScreen(StoryData tale, StoriesResponse response) {
    final hasPhoto = _pickedFile != null;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            // Header
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
                      child: Icon(LucideIcons.arrowLeft, size: AppSizes.iconBase, color: AppColors.text),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Upload Photo', style: TextStyle(fontSize: AppSizes.fontBase, fontWeight: FontWeight.w600, color: AppColors.text)),
                      Text(tale.localizedTitle('en'), style: TextStyle(fontSize: AppSizes.fontXsPlus, color: AppColors.brand)),
                    ],
                  ),
                ),
              ]),
            ),

            // Upload zone or preview
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: hasPhoto ? _buildPhotoPreview() : _buildUploadZone(tale),
              ),
            ),

            // Story info card
            _buildStoryCard(tale, response),

            // Generate button
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
                    onPressed: hasPhoto && _faceValid && !_isValidating && !_isUploading ? () => _startGeneration(tale) : null,
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, disabledBackgroundColor: Colors.transparent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd))),
                    child: _isUploading
                        ? Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                            const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.bg)),
                            const SizedBox(width: 10),
                            Text('Starting story...', style: TextStyle(fontSize: AppSizes.fontMdPlus, fontWeight: FontWeight.w700, color: AppColors.bg)),
                          ])
                        : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                            Icon(LucideIcons.play, size: AppSizes.iconBase, color: hasPhoto && _faceValid ? AppColors.bg : AppColors.textTer),
                            const SizedBox(width: 8),
                            Text('Start Story', style: TextStyle(fontSize: AppSizes.fontMdPlus, fontWeight: FontWeight.w700, color: hasPhoto && _faceValid ? AppColors.bg : AppColors.textTer)),
                            const SizedBox(width: 8),
                            Text('${tale.credits} ⚡', style: AppTextStyles.mono.copyWith(color: hasPhoto && _faceValid ? AppColors.bg.withValues(alpha: 0.7) : AppColors.textTer)),
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

  Widget _buildUploadZone(StoryData tale) {
    final isCouple = tale.gender == 'couple';

    return Column(children: [
      const Spacer(),
      Container(
        width: double.infinity, height: 300,
        decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(AppSizes.radiusXl), border: Border.all(color: AppColors.purple.withValues(alpha: 0.3), width: 1.5)),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(width: 64, height: 64, decoration: BoxDecoration(color: AppColors.purple.withValues(alpha: 0.1), shape: BoxShape.circle), child: Icon(LucideIcons.upload, size: AppSizes.icon3xl, color: AppColors.purple)),
          const SizedBox(height: 16),
          Text(
            isCouple ? 'Upload a couple photo' : 'Upload a clear face photo',
            style: TextStyle(fontSize: AppSizes.fontMdPlus, fontWeight: FontWeight.w600, color: AppColors.text),
          ),
          const SizedBox(height: 4),
          Text(
            isCouple ? 'Both faces clearly visible' : 'Front-facing, good lighting',
            style: TextStyle(fontSize: AppSizes.fontXs, color: AppColors.textSec),
          ),
          const SizedBox(height: 20),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            _uploadBtn(LucideIcons.camera, 'Camera', _onCameraCapture),
            const SizedBox(width: 12),
            _uploadBtn(LucideIcons.image, 'Gallery', _onGalleryPick, primary: true),
          ]),
        ]),
      ),
      const Spacer(),
    ]);
  }

  Widget _uploadBtn(IconData icon, String label, VoidCallback onTap, {bool primary = false}) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppSizes.radiusMd),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          gradient: primary ? AppGradients.story : null,
          color: primary ? null : AppColors.card,
          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
          border: primary ? null : Border.all(color: AppColors.borderMed),
        ),
        child: Row(children: [
          Icon(icon, size: AppSizes.iconMd, color: primary ? AppColors.bg : AppColors.text),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(fontSize: AppSizes.fontSmPlus, fontWeight: FontWeight.w600, color: primary ? AppColors.bg : AppColors.text)),
        ]),
      ),
      ),
    );
  }

  Widget _buildPhotoPreview() {
    return Column(children: [
      const Spacer(),
      Container(
        width: 250, height: 300,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSizes.radiusXl),
          border: Border.all(
            color: _faceValid ? AppColors.green.withValues(alpha: 0.5) : _faceError != null ? AppColors.red.withValues(alpha: 0.5) : AppColors.purple.withValues(alpha: 0.4),
            width: 2,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSizes.radiusXl),
          child: Stack(fit: StackFit.expand, children: [
            Image.file(_pickedFile!, fit: BoxFit.cover),
            if (_isValidating)
              Container(color: Colors.black.withValues(alpha: 0.5), child: const Center(child: CircularProgressIndicator(color: AppColors.purple, strokeWidth: 2))),
            if (!_isValidating && _faceValid)
              Positioned(bottom: 10, right: 10, child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: AppColors.green.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(AppSizes.radiusFull)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(LucideIcons.checkCircle, size: AppSizes.iconXs, color: AppColors.green),
                  const SizedBox(width: 4),
                  Text('Face OK', style: AppTextStyles.captionMono.copyWith(color: AppColors.green)),
                ]),
              )),
            if (!_isValidating && _faceError != null)
              Positioned(bottom: 10, left: 10, right: 10, child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: AppColors.red.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(AppSizes.radiusFull)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(LucideIcons.alertCircle, size: AppSizes.iconXs, color: AppColors.red),
                  const SizedBox(width: 4),
                  Expanded(child: Text(_faceError!, style: AppTextStyles.captionMono.copyWith(color: AppColors.red), maxLines: 2, overflow: TextOverflow.ellipsis)),
                ]),
              )),
          ]),
        ),
      ),
      const SizedBox(height: 16),
      if (!_isValidating)
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => setState(() {
              _pickedFile = null;
              _faceValid = false;
              _faceError = null;
            }),
            borderRadius: BorderRadius.circular(AppSizes.radiusSm),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSizes.md, vertical: AppSizes.sm),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(LucideIcons.refreshCw, size: AppSizes.iconSm, color: AppColors.textSec),
                const SizedBox(width: 6),
                Text('Choose different photo', style: TextStyle(fontSize: AppSizes.fontXs, fontWeight: FontWeight.w600, color: AppColors.textSec)),
              ]),
            ),
          ),
        ),
      const Spacer(),
    ]);
  }

  Widget _buildStoryCard(StoryData tale, StoriesResponse response) {
    final imageUrl = response.buildImageUrl(tale.coverImage);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(AppSizes.radiusMd), border: Border.all(color: AppColors.borderMed)),
        child: Row(children: [
          ClipRRect(borderRadius: BorderRadius.circular(AppSizes.radiusSm), child: PlaceholderImage(index: 0, width: 44, height: 44, borderRadius: AppSizes.radiusSm, imageUrl: imageUrl)),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(tale.localizedTitle('en'), style: TextStyle(fontSize: AppSizes.fontSmPlus, fontWeight: FontWeight.w600, color: AppColors.text)),
            Text('${tale.chapterCount} chapters · ${tale.totalPics} images', style: TextStyle(fontSize: AppSizes.fontXsPlus, color: AppColors.textTer)),
          ])),
          Row(children: [
            Icon(LucideIcons.zap, size: AppSizes.iconXs, color: AppColors.brand),
            const SizedBox(width: 3),
            Text('${tale.credits}', style: AppTextStyles.mono.copyWith(fontWeight: FontWeight.w700, color: AppColors.brand)),
          ]),
        ]),
      ),
    );
  }
}
