import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../../data/models/template_data.dart';
import '../../providers/app_providers.dart';
import '../../widgets/image_slideshow.dart';

/// Full-screen list of all templates in a single category.
class CategoryTemplatesScreen extends ConsumerWidget {
  final String categoryId;
  const CategoryTemplatesScreen({super.key, required this.categoryId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final templatesAsync = ref.watch(templatesProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: AppColors.text),
          onPressed: () => context.pop(),
        ),
        title: Text(
          _formatCategoryTitle(categoryId),
          style: TextStyle(
            fontSize: AppSizes.fontLg,
            fontWeight: FontWeight.w800,
            fontStyle: FontStyle.italic,
            color: AppColors.text,
          ),
        ),
        centerTitle: false,
      ),
      body: templatesAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.brand),
        ),
        error: (_, __) => Center(
          child: Text('Failed to load',
              style: TextStyle(color: AppColors.textSec)),
        ),
        data: (response) {
          final templates = response.activeTemplates
              .where((t) => t.category == categoryId)
              .toList()
            ..sort((a, b) => a.sortOrder.compareTo(b.sortOrder));

          if (templates.isEmpty) {
            return Center(
              child: Text('No templates in this category',
                  style: TextStyle(color: AppColors.textSec)),
            );
          }

          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 14,
              mainAxisSpacing: 14,
              childAspectRatio: 0.64,
            ),
            itemCount: templates.length,
            itemBuilder: (context, i) {
              final shot = templates[i];
              final imageUrl = response.buildImageUrl(shot.coverImage);
              return _TemplateCard(
                shot: shot,
                imageUrl: imageUrl,
                index: i,
                onTap: () => context.push('/create/detail/${shot.id}'),
              );
            },
          );
        },
      ),
    );
  }

  String _formatCategoryTitle(String id) {
    if (id.isEmpty) return '';
    return id[0].toUpperCase() + id.substring(1);
  }
}

class _TemplateCard extends StatelessWidget {
  final TemplateData shot;
  final String imageUrl;
  final int index;
  final VoidCallback onTap;

  const _TemplateCard({
    required this.shot,
    required this.imageUrl,
    required this.index,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppSizes.radiusXl),
          border: Border.all(color: AppColors.borderMed),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSizes.radiusXl),
          child: Stack(
            fit: StackFit.expand,
            children: [
              PlaceholderImage(
                  index: index, borderRadius: 0, imageUrl: imageUrl),
              Positioned.fill(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        AppColors.bg.withValues(alpha: 0.92),
                      ],
                      stops: const [0.45, 1.0],
                    ),
                  ),
                ),
              ),
              if (shot.hasBadge)
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: _badgeColor(shot.badge!),
                      borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                    ),
                    child: Text(
                      shot.badge!,
                      style: AppTextStyles.mono.copyWith(
                        fontSize: AppSizes.font2xs,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              if (shot.premium)
                Positioned(
                  top: 10,
                  right: 10,
                  child: Container(
                    width: 26,
                    height: 26,
                    decoration: BoxDecoration(
                      color: AppColors.brand.withValues(alpha: 0.3),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(LucideIcons.crown,
                        size: AppSizes.iconXs, color: AppColors.brand),
                  ),
                ),
              Positioned(
                bottom: 12,
                left: 12,
                right: 12,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      shot.localizedName('en'),
                      style: TextStyle(
                        fontSize: AppSizes.fontSmPlus,
                        fontWeight: FontWeight.w700,
                        color: AppColors.text,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(LucideIcons.zap,
                            size: 10, color: AppColors.brand),
                        const SizedBox(width: 3),
                        Text(
                          '${shot.credits}',
                          style: AppTextStyles.mono.copyWith(
                            fontSize: AppSizes.fontXxsPlus,
                            color: AppColors.brand,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const Spacer(),
                        Flexible(
                          child: Text(
                            shot.style,
                            style: TextStyle(
                              fontSize: AppSizes.fontXxsPlus,
                              color: AppColors.textTer,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _badgeColor(String badge) {
    switch (badge) {
      case 'HOT':
        return AppColors.red;
      case 'NEW':
        return AppColors.green;
      case 'TRENDING':
        return AppColors.purple;
      case 'POPULAR':
        return AppColors.blue;
      default:
        return AppColors.brand;
    }
  }
}
