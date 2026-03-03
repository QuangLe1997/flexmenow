import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_shadows.dart';
import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../../data/models/template_data.dart';
import '../../providers/app_providers.dart';
import '../../widgets/dot_indicator.dart';
import '../../widgets/image_slideshow.dart';

/// Shot detail — Full-screen hero image, gradient overlay, back/wand/bookmark buttons,
/// title+category, stats card, Like/Share/Create actions.
class ShotDetailScreen extends ConsumerStatefulWidget {
  final String templateId;
  const ShotDetailScreen({super.key, required this.templateId});

  @override
  ConsumerState<ShotDetailScreen> createState() => _ShotDetailScreenState();
}

class _ShotDetailScreenState extends ConsumerState<ShotDetailScreen> {
  final PageController _previewController = PageController();
  int _currentPreview = 0;
  bool _isBookmarked = false;

  @override
  void dispose() {
    _previewController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final templatesAsync = ref.watch(templatesProvider);

    return templatesAsync.when(
      loading: () => const Scaffold(backgroundColor: AppColors.bg, body: Center(child: CircularProgressIndicator(color: AppColors.brand))),
      error: (_, __) => const Scaffold(backgroundColor: AppColors.bg, body: Center(child: Text('Error loading template'))),
      data: (response) {
        final shot = response.activeTemplates.cast<TemplateData?>().firstWhere(
          (t) => t!.id == widget.templateId,
          orElse: () => response.activeTemplates.isNotEmpty ? response.activeTemplates.first : null,
        );
        if (shot == null) {
          return const Scaffold(backgroundColor: AppColors.bg, body: Center(child: Text('Template not found')));
        }
        return _buildDetail(shot, response);
      },
    );
  }

  Widget _buildDetail(TemplateData shot, TemplatesResponse response) {
    final imageUrl = response.buildImageUrl(shot.coverImage);
    final previewCount = shot.previewImages.isEmpty ? 1 : shot.previewImages.length;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Column(
        children: [
          Expanded(
            flex: 5,
            child: Stack(
              fit: StackFit.expand,
              children: [
                PageView.builder(
                  controller: _previewController,
                  onPageChanged: (i) => setState(() => _currentPreview = i),
                  itemCount: previewCount,
                  itemBuilder: (_, index) {
                    final url = shot.previewImages.isNotEmpty
                        ? response.buildImageUrl(shot.previewImages[index])
                        : imageUrl;
                    return PlaceholderImage(index: index, borderRadius: 0, imageUrl: url);
                  },
                ),
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter, end: Alignment.bottomCenter,
                        colors: [Colors.transparent, AppColors.bg.withValues(alpha: 0.6), AppColors.bg],
                        stops: const [0.3, 0.8, 1.0],
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: 0, left: 0, right: 0,
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _circleButton(LucideIcons.arrowLeft, () => context.pop()),
                          Row(children: [
                            _circleButton(LucideIcons.wand, () {}, gradient: true),
                            const SizedBox(width: 8),
                            _circleButton(LucideIcons.bookmark, () => setState(() => _isBookmarked = !_isBookmarked), filled: _isBookmarked),
                          ]),
                        ],
                      ),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 12, left: 0, right: 0,
                  child: Center(child: DotIndicator(count: previewCount, activeIndex: _currentPreview, dotSize: 6, activeDotWidth: 18)),
                ),
              ],
            ),
          ),
          Expanded(
            flex: 4,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(shot.localizedName('en'), style: TextStyle(fontSize: AppSizes.font2xlPlus, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic, color: AppColors.text, letterSpacing: -0.5)),
                  const SizedBox(height: 8),
                  Row(children: [
                    _chipLabel(shot.category, AppColors.brand),
                    const SizedBox(width: 8),
                    _chipLabel(shot.style, AppColors.textTer),
                  ]),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(AppSizes.radiusMd), border: Border.all(color: AppColors.borderMed)),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _statItem(LucideIcons.eye, '${shot.views}', 'Views'),
                        Container(width: 1, height: 36, color: AppColors.borderMed),
                        _statItem(LucideIcons.heart, '${shot.likes}', 'Likes'),
                        Container(width: 1, height: 36, color: AppColors.borderMed),
                        _statItem(LucideIcons.zap, '${shot.credits}', 'Credits'),
                      ],
                    ),
                  ),
                  const Spacer(),
                  Row(
                    children: [
                      _actionIcon(LucideIcons.heart, 'Like'),
                      const SizedBox(width: 12),
                      _actionIcon(LucideIcons.share, 'Share'),
                      const SizedBox(width: 16),
                      Expanded(
                        child: SizedBox(
                          height: 52,
                          child: DecoratedBox(
                            decoration: BoxDecoration(gradient: AppGradients.btn, borderRadius: BorderRadius.circular(AppSizes.radiusMd), boxShadow: AppShadows.brandGlow()),
                            child: ElevatedButton(
                              onPressed: () => context.push('/create/upload/${widget.templateId}'),
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.transparent, shadowColor: Colors.transparent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd))),
                              child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                                Icon(LucideIcons.wand, size: AppSizes.iconBase, color: AppColors.bg),
                                const SizedBox(width: 8),
                                Text('Create Now', style: TextStyle(fontSize: AppSizes.fontBase, fontWeight: FontWeight.w700, color: AppColors.bg)),
                              ]),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _circleButton(IconData icon, VoidCallback onTap, {bool gradient = false, bool filled = false}) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: gradient ? AppGradients.btn : null,
            color: gradient ? null : Colors.black.withValues(alpha: 0.5),
            border: Border.all(color: gradient ? Colors.transparent : AppColors.borderMed),
          ),
          child: Icon(icon, size: AppSizes.iconBase, color: gradient ? AppColors.bg : (filled ? AppColors.brand : AppColors.text)),
        ),
      ),
    );
  }

  Widget _chipLabel(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(AppSizes.radiusFull)),
      child: Text(text, style: TextStyle(fontSize: AppSizes.fontXs, fontWeight: FontWeight.w600, color: color)),
    );
  }

  Widget _statItem(IconData icon, String value, String label) {
    return Column(children: [
      Icon(icon, size: AppSizes.iconMd, color: AppColors.brand),
      const SizedBox(height: 4),
      Text(value, style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w700, color: AppColors.text)),
      Text(label, style: TextStyle(fontSize: AppSizes.fontXxsPlus, color: AppColors.textTer)),
    ]);
  }

  Widget _actionIcon(IconData icon, String label) {
    return Column(children: [
      Container(
        width: 48, height: 48,
        decoration: BoxDecoration(color: AppColors.card, shape: BoxShape.circle, border: Border.all(color: AppColors.borderMed)),
        child: Icon(icon, size: AppSizes.iconLg, color: AppColors.textSec),
      ),
      const SizedBox(height: 4),
      Text(label, style: TextStyle(fontSize: AppSizes.fontXxsPlus, color: AppColors.textTer)),
    ]);
  }
}
