import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gal/gal.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_shadows.dart';
import '../../core/design_tokens.dart';
import '../../data/models/generation_model.dart';
import '../../providers/app_providers.dart';
import '../../widgets/image_slideshow.dart';

/// Shot result — Close + "FlexShot Ready" header, hero image with gold edge + overlay,
/// Like/Bookmark, Save/Retry buttons, "Ask AI to adjust" link.
///
/// Loads real output image from Firestore generation document.
class ShotResultScreen extends ConsumerWidget {
  final String generationId;
  const ShotResultScreen({super.key, required this.generationId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final genAsync = ref.watch(generationStatusProvider(generationId));

    return genAsync.when(
      loading: () => const Scaffold(
        backgroundColor: AppColors.bg,
        body: Center(child: CircularProgressIndicator(color: AppColors.brand)),
      ),
      error: (_, __) => Scaffold(
        backgroundColor: AppColors.bg,
        body: Center(child: Text('Error loading result', style: TextStyle(color: AppColors.textSec))),
      ),
      data: (gen) {
        final outputUrl = gen.outputImageUrl;

        return Scaffold(
          backgroundColor: AppColors.bg,
          body: Stack(
            fit: StackFit.expand,
            children: [
              // Hero image with gold edge
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 100, 16, 200),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                    border: Border.all(color: AppColors.brand.withValues(alpha: 0.3), width: 2),
                    boxShadow: [...AppShadows.brandGlowLg(0.15)],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(AppSizes.radiusXl),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        if (outputUrl != null && outputUrl.isNotEmpty)
                          CachedNetworkImage(
                            imageUrl: outputUrl,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => Container(
                              color: AppColors.zinc900,
                              child: const Center(child: CircularProgressIndicator(color: AppColors.brand, strokeWidth: 2)),
                            ),
                            errorWidget: (_, __, ___) => PlaceholderImage(index: 2, borderRadius: 0),
                          )
                        else
                          PlaceholderImage(index: 2, borderRadius: 0),
                        // Gold gradient overlay at top
                        Positioned(
                          top: 0, left: 0, right: 0,
                          child: Container(height: 3, decoration: const BoxDecoration(gradient: AppGradients.hero)),
                        ),
                        // Like/Bookmark overlay
                        Positioned(
                          top: 12, right: 12,
                          child: Column(children: [
                            _overlayBtn(LucideIcons.heart),
                            const SizedBox(height: 8),
                            _overlayBtn(LucideIcons.bookmark),
                          ]),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Top bar
              Positioned(
                top: 0, left: 0, right: 0,
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: () => context.go('/create'),
                            customBorder: const CircleBorder(),
                            child: Container(
                              width: 44, height: 44,
                              decoration: BoxDecoration(color: AppColors.card, shape: BoxShape.circle, border: Border.all(color: AppColors.borderMed)),
                              child: const Icon(LucideIcons.x, size: AppSizes.iconBase, color: AppColors.text),
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.green.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                            border: Border.all(color: AppColors.green.withValues(alpha: 0.3)),
                          ),
                          child: Row(mainAxisSize: MainAxisSize.min, children: [
                            Icon(LucideIcons.checkCircle, size: AppSizes.iconSm, color: AppColors.green),
                            const SizedBox(width: 6),
                            Text('FlexShot Ready', style: TextStyle(fontSize: AppSizes.fontXs, fontWeight: FontWeight.w700, color: AppColors.green)),
                          ]),
                        ),
                        const SizedBox(width: 36),
                      ],
                    ),
                  ),
                ),
              ),

              // Bottom actions
              Positioned(
                bottom: 0, left: 0, right: 0,
                child: SafeArea(
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter, end: Alignment.bottomCenter,
                        colors: [Colors.transparent, AppColors.bg.withValues(alpha: 0.8), AppColors.bg],
                      ),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(children: [
                          Expanded(
                            child: SizedBox(
                              height: 48,
                              child: DecoratedBox(
                                decoration: BoxDecoration(gradient: AppGradients.btn, borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                                child: ElevatedButton.icon(
                                  onPressed: () async {
                                    try {
                                      if (outputUrl != null && outputUrl.isNotEmpty) {
                                        final file = await DefaultCacheManager().getSingleFile(outputUrl);
                                        await Gal.putImage(file.path);
                                        if (context.mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(content: Text('Saved to gallery!')),
                                          );
                                        }
                                      }
                                    } catch (e) {
                                      if (context.mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(content: Text('Save failed: $e')),
                                        );
                                      }
                                    }
                                  },
                                  style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd))),
                                  icon: Icon(LucideIcons.download, size: AppSizes.iconMd, color: AppColors.bg),
                                  label: Text('Save', style: TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w700, color: AppColors.bg)),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: SizedBox(
                              height: 48,
                              child: OutlinedButton.icon(
                                onPressed: () {
                                  // Navigate back to create tab to pick a new template
                                  context.go('/create');
                                },
                                style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.borderMed), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd))),
                                icon: Icon(LucideIcons.refreshCw, size: AppSizes.iconMd, color: AppColors.text),
                                label: Text('Retry', style: TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w600, color: AppColors.text)),
                              ),
                            ),
                          ),
                        ]),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            _secondaryAction(LucideIcons.camera, 'New photo'),
                            _secondaryAction(LucideIcons.crop, 'Crop'),
                            _secondaryAction(LucideIcons.maximize, 'Full view'),
                          ],
                        ),
                        const SizedBox(height: 12),
                        InkWell(
                          onTap: () {
                            _showAiAdjustDialog(context, ref, gen);
                          },
                          borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: AppSizes.sm, vertical: AppSizes.sm),
                            child: Text('Ask AI to adjust →', style: TextStyle(fontSize: AppSizes.fontSmPlus, fontWeight: FontWeight.w600, color: AppColors.purple)),
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
      },
    );
  }

  static void _showAiAdjustDialog(BuildContext context, WidgetRef ref, GenerationModel gen) {
    final controller = TextEditingController();
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.card,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('AI Adjustment', style: TextStyle(fontSize: AppSizes.fontLg, fontWeight: FontWeight.w700, color: AppColors.text)),
            const SizedBox(height: 4),
            Text('Describe what you want to change', style: TextStyle(fontSize: AppSizes.fontXs, color: AppColors.textSec)),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              maxLines: 3,
              style: const TextStyle(color: AppColors.text),
              decoration: InputDecoration(
                hintText: 'e.g. "Make the background brighter" or "Add a warmer tone"',
                hintStyle: TextStyle(color: AppColors.textTer, fontSize: AppSizes.fontSm),
                filled: true,
                fillColor: AppColors.bg,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd), borderSide: BorderSide(color: AppColors.borderMed)),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd), borderSide: BorderSide(color: AppColors.borderMed)),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd), borderSide: BorderSide(color: AppColors.brand)),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: DecoratedBox(
                decoration: BoxDecoration(gradient: AppGradients.btn, borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                child: ElevatedButton(
                  onPressed: () {
                    final text = controller.text.trim();
                    if (text.isEmpty) return;
                    Navigator.of(ctx).pop();
                    // Navigate to upload with the same template, user can re-generate
                    context.push('/create/upload/${gen.templateId}');
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd))),
                  child: Text('Regenerate with AI', style: TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w700, color: AppColors.bg)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static Widget _overlayBtn(IconData icon) {
    return Container(
      width: 44, height: 44,
      decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.5), shape: BoxShape.circle),
      child: Icon(icon, size: AppSizes.iconBase, color: AppColors.text),
    );
  }

  static Widget _secondaryAction(IconData icon, String label) {
    return Column(children: [
      Container(
        width: 44, height: 44,
        decoration: BoxDecoration(color: AppColors.card, shape: BoxShape.circle, border: Border.all(color: AppColors.borderMed)),
        child: Icon(icon, size: AppSizes.iconBase, color: AppColors.textSec),
      ),
      const SizedBox(height: 4),
      Text(label, style: TextStyle(fontSize: AppSizes.fontXs, color: AppColors.textTer)),
    ]);
  }
}
