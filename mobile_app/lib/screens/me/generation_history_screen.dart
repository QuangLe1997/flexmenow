import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/design_tokens.dart';
import '../../providers/app_providers.dart';
import '../../widgets/image_slideshow.dart';

/// Generation history — list of user's FlexShot generations from Firestore.
class GenerationHistoryScreen extends ConsumerWidget {
  const GenerationHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final generationsAsync = ref.watch(userGenerationsProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.text),
          onPressed: () => context.pop(),
        ),
        title: Text('Generation History', style: const TextStyle(fontSize: AppSizes.fontBase, fontWeight: FontWeight.w600, color: AppColors.text)),
      ),
      body: generationsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.brand, strokeWidth: 2)),
        error: (_, __) => const Center(child: Text('Error loading generations')),
        data: (generations) {
          if (generations.isEmpty) return _buildEmptyState();

          return GridView.builder(
            padding: const EdgeInsets.all(8),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, childAspectRatio: 1.0),
            itemCount: generations.length,
            itemBuilder: (context, index) {
              final gen = generations[index];
              return GestureDetector(
                onTap: gen.isCompleted ? () => context.push('/create/result/${gen.id}') : null,
                child: Container(
                  margin: const EdgeInsets.all(2),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                    child: Stack(fit: StackFit.expand, children: [
                      if (gen.outputImageUrl != null && gen.outputImageUrl!.isNotEmpty)
                        CachedNetworkImage(imageUrl: gen.outputImageUrl!, fit: BoxFit.cover, placeholder: (_, __) => Container(color: AppColors.zinc900), errorWidget: (_, __, ___) => PlaceholderImage(index: index, borderRadius: AppSizes.radiusSm))
                      else
                        PlaceholderImage(index: index, borderRadius: AppSizes.radiusSm),
                      // Status badge
                      if (gen.isFailed)
                        Positioned(bottom: 4, right: 4, child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          decoration: BoxDecoration(color: AppColors.red.withValues(alpha: 0.8), borderRadius: BorderRadius.circular(4)),
                          child: Icon(LucideIcons.alertCircle, size: 10, color: Colors.white),
                        ))
                      else if (gen.isInProgress)
                        Positioned(bottom: 4, right: 4, child: Container(
                          width: 20, height: 20,
                          decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.6), shape: BoxShape.circle),
                          child: const Padding(padding: EdgeInsets.all(3), child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.brand)),
                        )),
                    ]),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80, height: 80,
            decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(AppSizes.radiusLg)),
            child: Icon(LucideIcons.sparkles, color: AppColors.textTer, size: AppSizes.icon5xl),
          ),
          const SizedBox(height: 16),
          Text('No generations yet', style: const TextStyle(fontSize: AppSizes.fontBase, fontWeight: FontWeight.w600, color: AppColors.text)),
          const SizedBox(height: 8),
          Text('Your FlexShot creations will appear here', style: const TextStyle(fontSize: AppSizes.fontSmPlus, color: AppColors.textSec)),
        ],
      ),
    );
  }
}
