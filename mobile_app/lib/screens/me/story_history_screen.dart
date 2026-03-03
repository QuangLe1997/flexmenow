import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/app_text_styles.dart';
import '../../core/design_tokens.dart';
import '../../providers/app_providers.dart';

/// Story history — list of user's FlexTale story generations from Firestore.
class StoryHistoryScreen extends ConsumerWidget {
  const StoryHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final storiesAsync = ref.watch(userStoriesProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.text),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Story History',
          style: TextStyle(
            fontSize: AppSizes.fontLg,
            fontWeight: FontWeight.w600,
            color: AppColors.text,
          ),
        ),
      ),
      body: storiesAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.brand, strokeWidth: 2),
        ),
        error: (_, __) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: AppColors.red, size: AppSizes.icon7xl),
              const SizedBox(height: AppSizes.lg),
              const Text(
                'Failed to load stories',
                style: TextStyle(fontSize: AppSizes.fontBase, color: AppColors.text),
              ),
              const SizedBox(height: AppSizes.sm),
              OutlinedButton(
                onPressed: () => ref.invalidate(userStoriesProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (stories) {
          if (stories.isEmpty) {
            return _buildEmptyState(context);
          }

          return ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: AppSizes.lg, vertical: AppSizes.sm),
            itemCount: stories.length,
            itemBuilder: (context, index) {
              final story = stories[index];
              final statusColor = story.isCompleted
                  ? AppColors.green
                  : story.isFailed
                      ? AppColors.red
                      : AppColors.brand;
              final statusLabel = story.isCompleted
                  ? 'COMPLETED'
                  : story.isFailed
                      ? 'FAILED'
                      : 'PROCESSING';

              return GestureDetector(
                onTap: story.isCompleted
                    ? () => context.push('/story/reader/${story.id}')
                    : null,
                child: Container(
                  margin: const EdgeInsets.only(bottom: AppSizes.sm),
                  padding: const EdgeInsets.all(AppSizes.md),
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                    border: Border.all(color: AppColors.borderMed),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                          color: AppColors.purple.withValues(alpha: 0.1),
                        ),
                        child: Icon(LucideIcons.bookOpen, size: AppSizes.iconLg, color: AppColors.purple),
                      ),
                      const SizedBox(width: AppSizes.md),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              story.storyTitle,
                              style: const TextStyle(
                                fontSize: AppSizes.fontSm,
                                fontWeight: FontWeight.w600,
                                color: AppColors.text,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Text(
                                  '${story.completedScenes}/${story.totalScenes} scenes',
                                  style: const TextStyle(
                                    fontSize: AppSizes.fontXs,
                                    color: AppColors.textTer,
                                  ),
                                ),
                                const SizedBox(width: AppSizes.sm),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: statusColor.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                                  ),
                                  child: Text(
                                    statusLabel,
                                    style: AppTextStyles.mono.copyWith(
                                      fontSize: AppSizes.fontXxs,
                                      fontWeight: FontWeight.w700,
                                      color: statusColor,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      if (story.isCompleted)
                        Icon(LucideIcons.chevronRight, size: AppSizes.iconMd, color: AppColors.textTer),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(AppSizes.radiusLg),
            ),
            child: const Icon(
              Icons.auto_stories,
              color: AppColors.textTer,
              size: AppSizes.icon5xl,
            ),
          ),
          const SizedBox(height: AppSizes.lg),
          const Text(
            'No stories yet',
            style: TextStyle(
              fontSize: AppSizes.fontLg,
              fontWeight: FontWeight.w600,
              color: AppColors.text,
            ),
          ),
          const SizedBox(height: AppSizes.sm),
          const Text(
            'Your FlexTale stories will appear here',
            style: TextStyle(
              fontSize: AppSizes.fontSm,
              color: AppColors.textSec,
            ),
          ),
          const SizedBox(height: AppSizes.xxl),
          SizedBox(
            width: 200,
            height: 44,
            child: OutlinedButton.icon(
              onPressed: () => context.go('/story'),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.borderMed),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                ),
              ),
              icon: const Icon(LucideIcons.bookOpen, size: AppSizes.iconMd, color: AppColors.purple),
              label: const Text(
                'Browse Stories',
                style: TextStyle(
                  fontSize: AppSizes.fontSm,
                  fontWeight: FontWeight.w600,
                  color: AppColors.text,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
