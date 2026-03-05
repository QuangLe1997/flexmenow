import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:gal/gal.dart';
import 'package:go_router/go_router.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/app_animations.dart';
import '../../core/app_images.dart';
import '../../core/app_shadows.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../../data/mock_data.dart';
import '../../widgets/image_slideshow.dart';

/// Glow result — supports both local filter results (free) and AI enhance results (premium).
///
/// For local filters: shows before/after slider, filter info, Save/Share.
/// For AI enhance: shows before/after slider, mode/filter info, Save/Share.
class GlowResultScreen extends StatefulWidget {
  final String? imagePath;
  final String? originalPath;
  final String? imageUrl;
  final String? enhanceMode;
  final String? filterId;
  final String? filterName;
  final String? categoryName;
  final String? customPrompt;
  final bool isLocalFilter;

  const GlowResultScreen({
    super.key,
    this.imagePath,
    this.originalPath,
    this.imageUrl,
    this.enhanceMode,
    this.filterId,
    this.filterName,
    this.categoryName,
    this.customPrompt,
    this.isLocalFilter = false,
  });

  @override
  State<GlowResultScreen> createState() => _GlowResultScreenState();
}

class _GlowResultScreenState extends State<GlowResultScreen> with SingleTickerProviderStateMixin {
  double _sliderPosition = 0.5;
  bool _hasInteracted = false;
  late final AnimationController _shimmerController;

  @override
  void initState() {
    super.initState();
    _shimmerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat();
  }

  @override
  void dispose() {
    _shimmerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(child: _buildHeader()),
            SliverToBoxAdapter(child: _buildSplitView()),
            SliverToBoxAdapter(child: _buildDetailsGrid()),
            SliverToBoxAdapter(child: _buildActions()),
            SliverToBoxAdapter(child: _buildSecondaryActions()),
            SliverToBoxAdapter(child: _buildUpsell()),
            const SliverToBoxAdapter(child: SizedBox(height: 20)),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    final statusLabel = widget.isLocalFilter ? 'Filtered' : 'Enhanced';
    final statusColor = widget.isLocalFilter ? AppColors.green : AppColors.green;
    final statusIcon = widget.isLocalFilter ? LucideIcons.palette : LucideIcons.checkCircle;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => context.go('/glow'),
                  customBorder: const CircleBorder(),
                  child: Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(color: AppColors.card, shape: BoxShape.circle, border: Border.all(color: AppColors.borderMed)),
                    child: const Icon(LucideIcons.arrowLeft, size: AppSizes.iconBase, color: AppColors.text),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              RichText(
                text: TextSpan(
                  style: TextStyle(fontSize: AppSizes.fontLg, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic),
                  children: const [
                    TextSpan(text: 'Glow ', style: TextStyle(color: AppColors.text)),
                    TextSpan(text: 'Result', style: TextStyle(color: AppColors.brand)),
                  ],
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(statusIcon, size: AppSizes.iconXs, color: statusColor),
                  const SizedBox(width: 4),
                  Text(statusLabel, style: AppTextStyles.captionMono.copyWith(fontWeight: FontWeight.w600, color: statusColor)),
                ]),
              ),
            ],
          ),
        ),
        // Gradient underline accent
        Container(
          height: 2,
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            gradient: AppGradients.btn,
            borderRadius: BorderRadius.circular(1),
          ),
        ),
      ],
    );
  }

  Widget _buildSplitView() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: AspectRatio(
        aspectRatio: 3 / 4,
        child: GestureDetector(
          onHorizontalDragUpdate: (details) {
            final box = context.findRenderObject() as RenderBox;
            final width = box.size.width - 32;
            setState(() {
              _sliderPosition = (details.localPosition.dx / width).clamp(0.0, 1.0);
              _hasInteracted = true;
            });
          },
          onDoubleTap: () {
            setState(() {
              _sliderPosition = _sliderPosition > 0.5 ? 0.0 : 1.0;
            });
          },
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppSizes.radiusXl),
            child: Stack(
              fit: StackFit.expand,
              children: [
                // After layer (full) — filtered/enhanced result
                _buildImageLayer(isAfter: true),
                // Before layer (clipped) — original
                ClipRect(
                  clipper: _SplitClipper(_sliderPosition),
                  child: _buildImageLayer(isAfter: false),
                ),
                // Slider handle with gold glow
                Positioned.fill(
                  child: Align(
                    alignment: Alignment(_sliderPosition * 2 - 1, 0),
                    child: Column(
                      children: [
                        Expanded(child: Container(width: 2, color: Colors.white.withValues(alpha: 0.8))),
                        Container(
                          width: 40, height: 40,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white,
                            boxShadow: [
                              ...AppShadows.overlay,
                              BoxShadow(color: AppColors.brand.withValues(alpha: 0.3), blurRadius: 12, spreadRadius: 1),
                            ],
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(LucideIcons.chevronLeft, size: 11, color: AppColors.bg),
                              Icon(LucideIcons.chevronRight, size: 11, color: AppColors.bg),
                            ],
                          ),
                        ),
                        Expanded(child: Container(width: 2, color: Colors.white.withValues(alpha: 0.8))),
                      ],
                    ),
                  ),
                ),
                // "Drag to compare" instruction (fades out after interaction)
                if (!_hasInteracted)
                  Positioned(
                    top: 12, left: 0, right: 0,
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.6),
                          borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                        ),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          Icon(LucideIcons.move, size: 11, color: Colors.white.withValues(alpha: 0.7)),
                          const SizedBox(width: 6),
                          Text('Drag to compare', style: TextStyle(fontSize: AppSizes.fontXxsPlus, color: Colors.white.withValues(alpha: 0.7))),
                        ]),
                      ),
                    ),
                  ),
                // Labels — Before: red tint, After: green tint
                Positioned(
                  bottom: 12, left: 12,
                  child: _label('Before', AppColors.red.withValues(alpha: 0.9)),
                ),
                Positioned(
                  bottom: 12, right: 12,
                  child: _label('After', AppColors.green),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _label(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(AppSizes.radiusFull),
      ),
      child: Text(text, style: AppTextStyles.captionMono.copyWith(color: color)),
    );
  }

  /// Returns true if [path] looks like a network URL rather than a local file.
  static bool _isUrl(String? path) =>
      path != null && (path.startsWith('http://') || path.startsWith('https://'));

  Widget _buildImageLayer({required bool isAfter}) {
    if (isAfter) {
      // Result image (filtered locally or enhanced by AI)
      if (widget.imageUrl != null) {
        return CachedNetworkImage(
          imageUrl: widget.imageUrl!,
          fit: BoxFit.cover,
          placeholder: (_, __) => Container(color: AppColors.zinc900),
          errorWidget: (_, __, ___) => widget.imagePath != null
              ? Image.file(File(widget.imagePath!), fit: BoxFit.cover)
              : PlaceholderImage(index: 3, borderRadius: 0),
        );
      }
      if (widget.imagePath != null) {
        return Image.file(File(widget.imagePath!), fit: BoxFit.cover);
      }
      return PlaceholderImage(
        index: 3, borderRadius: 0,
        imageUrl: AppImages.glowTutorial.length > 1 ? AppImages.glowTutorial[1] : null,
      );
    } else {
      // Original image (before filter/enhance)
      // Determine source: local filter uses originalPath, AI enhance uses imagePath
      final source = widget.isLocalFilter ? widget.originalPath : widget.imagePath;
      // Fallback: if source is null, try originalPath (from Me tab history)
      final effectiveSource = source ?? widget.originalPath;
      if (effectiveSource != null) {
        // Handle network URLs (from Me tab / Firestore) vs local file paths
        if (_isUrl(effectiveSource)) {
          return CachedNetworkImage(
            imageUrl: effectiveSource,
            fit: BoxFit.cover,
            placeholder: (_, __) => Container(color: AppColors.zinc900),
            errorWidget: (_, __, ___) => PlaceholderImage(index: 1, borderRadius: 0),
          );
        }
        return Image.file(File(effectiveSource), fit: BoxFit.cover);
      }
      return PlaceholderImage(
        index: 1, borderRadius: 0,
        imageUrl: AppImages.glowTutorial.isNotEmpty ? AppImages.glowTutorial[0] : null,
      );
    }
  }

  Widget _buildDetailsGrid() {
    final List<(String, IconData, String)> items;

    if (widget.isLocalFilter) {
      items = [
        ('Category', LucideIcons.layers, widget.categoryName ?? 'Natural'),
        ('Filter', LucideIcons.palette, widget.filterName ?? 'Original'),
        ('Type', LucideIcons.zap, 'Local'),
        ('Cost', LucideIcons.coins, 'Free'),
      ];
    } else if (widget.customPrompt != null || widget.enhanceMode == 'agent') {
      items = [
        ('Mode', LucideIcons.bot, 'AI Agent'),
        ('Style', LucideIcons.palette, 'Custom'),
        ('Type', LucideIcons.sparkles, 'AI Enhanced'),
        ('Quality', LucideIcons.eye, 'HD'),
      ];
    } else {
      final modeId = widget.enhanceMode ?? 'real';
      final mode = kEnhanceModes.firstWhere((m) => m.id == modeId, orElse: () => kEnhanceModes.first);
      final modeFilters = filtersForMode(modeId);
      final filter = modeFilters.isNotEmpty
          ? modeFilters.firstWhere((f) => f.id == widget.filterId, orElse: () => modeFilters.first)
          : null;
      items = [
        ('Mode', LucideIcons.layers, mode.name),
        ('Filter', LucideIcons.palette, filter?.name ?? 'Auto'),
        ('Type', LucideIcons.sparkles, 'AI Enhanced'),
        ('Quality', LucideIcons.eye, 'HD'),
      ];
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.isLocalFilter ? 'FILTER DETAILS' : 'ENHANCEMENT DETAILS',
            style: AppTextStyles.captionMono.copyWith(fontWeight: FontWeight.w700, color: AppColors.textTer, letterSpacing: 2),
          ),
          const SizedBox(height: 10),
          GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 2.5,
            children: items.map((item) {
              return Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                  border: Border.all(color: AppColors.borderMed),
                  boxShadow: const [BoxShadow(color: Color(0x0D000000), blurRadius: 4, offset: Offset(0, 1))],
                ),
                child: Row(children: [
                  // Icon with colored background circle
                  Container(
                    width: 28, height: 28,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.brand.withValues(alpha: 0.12),
                    ),
                    child: Icon(item.$2, size: AppSizes.iconSm, color: AppColors.brand),
                  ),
                  const SizedBox(width: 10),
                  Expanded(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(item.$1, style: TextStyle(fontSize: AppSizes.fontXsPlus, color: AppColors.textSec)),
                      Text(item.$3, style: AppTextStyles.mono.copyWith(fontWeight: FontWeight.w700, color: AppColors.text)),
                    ],
                  )),
                ]),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildActions() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        children: [
          Expanded(
            child: SizedBox(
              height: 48,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: AppGradients.btn,
                  borderRadius: BorderRadius.circular(AppSizes.radiusLg),
                  boxShadow: AppShadows.brandGlow(0.2),
                ),
                child: ElevatedButton.icon(
                  onPressed: () async {
                    try {
                      final path = widget.imagePath ?? widget.imageUrl;
                      if (path == null) return;
                      if (widget.imagePath != null) {
                        await Gal.putImage(widget.imagePath!);
                      } else if (widget.imageUrl != null) {
                        final file = await DefaultCacheManager().getSingleFile(widget.imageUrl!);
                        await Gal.putImage(file.path);
                      }
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Saved to gallery!')),
                        );
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Save failed: $e')),
                        );
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusLg)),
                  ),
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
                onPressed: () async {
                  try {
                    if (widget.imagePath != null) {
                      await SharePlus.instance.share(
                        ShareParams(files: [XFile(widget.imagePath!)], text: 'Check out my FlexLocket glow-up!'),
                      );
                    } else if (widget.imageUrl != null) {
                      final file = await DefaultCacheManager().getSingleFile(widget.imageUrl!);
                      await SharePlus.instance.share(
                        ShareParams(files: [XFile(file.path)], text: 'Check out my FlexLocket glow-up!'),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Share failed: $e')),
                      );
                    }
                  }
                },
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.borderMed),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusLg)),
                ),
                icon: Icon(LucideIcons.share, size: AppSizes.iconMd, color: AppColors.text),
                label: Text('Share', style: TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w600, color: AppColors.text)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSecondaryActions() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _toolBtn(LucideIcons.camera, 'Camera', () => context.go('/glow'), accentColor: AppColors.blue),
          _toolBtn(LucideIcons.crop, 'Crop', () async {
            final sourcePath = widget.imagePath;
            if (sourcePath == null) return;
            final cropped = await ImageCropper().cropImage(
              sourcePath: sourcePath,
              uiSettings: [
                AndroidUiSettings(
                  toolbarTitle: 'Crop',
                  toolbarColor: AppColors.bg,
                  toolbarWidgetColor: AppColors.text,
                  backgroundColor: AppColors.bg,
                  activeControlsWidgetColor: AppColors.brand,
                ),
                IOSUiSettings(title: 'Crop'),
              ],
            );
            if (cropped != null && context.mounted) {
              setState(() {
                // Update the displayed image path with cropped result
              });
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Image cropped!')),
              );
            }
          }, accentColor: AppColors.brand),
          _toolBtn(LucideIcons.maximize, 'Full view', () {
            showDialog(
              context: context,
              barrierColor: Colors.black,
              builder: (_) => GestureDetector(
                onTap: () => Navigator.of(context).pop(),
                child: InteractiveViewer(
                  child: Center(child: _buildImageLayer(isAfter: true)),
                ),
              ),
            );
          }, accentColor: AppColors.purple),
        ],
      ),
    );
  }

  Widget _toolBtn(IconData icon, String label, VoidCallback onTap, {Color? accentColor}) {
    final color = accentColor ?? AppColors.textSec;
    return GestureDetector(
      onTap: onTap,
      child: Column(children: [
        Container(
          width: 48, height: 48,
          decoration: BoxDecoration(color: AppColors.card, shape: BoxShape.circle, border: Border.all(color: AppColors.borderMed)),
          child: Icon(icon, size: AppSizes.iconLg, color: color),
        ),
        const SizedBox(height: 5),
        Text(label, style: TextStyle(fontSize: AppSizes.fontXs, fontWeight: FontWeight.w500, color: color)),
      ]),
    );
  }

  Widget _buildUpsell() {
    // For local filter results, upsell AI Enhance; for AI results, upsell FlexShot
    final isLocal = widget.isLocalFilter;
    final title = isLocal ? 'Want AI-powered enhancement?' : 'Want more than a glow-up?';
    final subtitle = isLocal ? 'Try AI Agent for undetectable retouching' : 'Try FlexShot for AI-generated photos';
    final icon = isLocal ? LucideIcons.bot : LucideIcons.wand;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => isLocal ? context.go('/glow') : context.go('/create'),
          borderRadius: BorderRadius.circular(AppSizes.radiusLg),
          child: AnimatedBuilder(
            animation: _shimmerController,
            builder: (_, __) {
              final shimmerValue = _shimmerController.value;
              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: AppGradients.glass,
                  borderRadius: BorderRadius.circular(AppSizes.radiusLg),
                  border: Border.all(
                    color: Color.lerp(
                      AppColors.brand.withValues(alpha: 0.15),
                      AppColors.brand.withValues(alpha: 0.4),
                      (0.5 + 0.5 * (shimmerValue * 2 - 1).abs()).clamp(0.0, 1.0) < 0.7 ? 0.0 : (0.5 + 0.5 * (shimmerValue * 2 - 1).abs() - 0.7) / 0.3,
                    )!,
                  ),
                ),
                child: Row(children: [
                  Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(shape: BoxShape.circle, gradient: AppGradients.hero),
                    child: Icon(icon, size: AppSizes.iconBase, color: AppColors.bg),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: TextStyle(fontSize: AppSizes.fontSmPlus, fontWeight: FontWeight.w600, color: AppColors.text)),
                      Text(subtitle, style: TextStyle(fontSize: AppSizes.fontXsPlus, color: AppColors.textSec)),
                    ],
                  )),
                  // Bouncing arrow
                  Transform.translate(
                    offset: Offset(3.0 * (0.5 + 0.5 * (shimmerValue * 2 - 1).abs()), 0),
                    child: Icon(LucideIcons.chevronRight, size: AppSizes.iconMd, color: AppColors.brand),
                  ),
                ]),
              );
            },
          ),
        ),
      ),
    );
  }
}

class _SplitClipper extends CustomClipper<Rect> {
  final double position;
  _SplitClipper(this.position);

  @override
  Rect getClip(Size size) => Rect.fromLTWH(0, 0, size.width * position, size.height);

  @override
  bool shouldReclip(covariant _SplitClipper oldClipper) => oldClipper.position != position;
}
