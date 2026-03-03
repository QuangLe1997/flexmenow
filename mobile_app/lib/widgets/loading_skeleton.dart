import 'package:flutter/material.dart';

import '../core/design_tokens.dart';

/// Shimmer-like loading skeleton for dark theme.
///
/// Uses a repeating [AnimationController] to slide a highlight gradient
/// across a dark placeholder, giving the appearance of a loading shimmer.
/// No external package required.
class LoadingSkeleton extends StatefulWidget {
  /// Width of the skeleton. If null, expands to fill parent.
  final double? width;

  /// Height of the skeleton.
  final double height;

  /// Border radius of the skeleton.
  final double borderRadius;

  const LoadingSkeleton({
    super.key,
    this.width,
    required this.height,
    this.borderRadius = AppSizes.radiusMd,
  });

  @override
  State<LoadingSkeleton> createState() => _LoadingSkeletonState();
}

class _LoadingSkeletonState extends State<LoadingSkeleton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              begin: Alignment(-1.0 + 2.0 * _controller.value, 0),
              end: Alignment(-1.0 + 2.0 * _controller.value + 1.0, 0),
              colors: const [
                AppColors.zinc900,
                AppColors.zinc800,
                AppColors.zinc900,
              ],
            ),
          ),
        );
      },
    );
  }
}

/// Card-shaped skeleton placeholder for grid layouts.
///
/// Matches the 3:4 aspect ratio used by [TemplateCard] and [StoryCard].
class CardSkeleton extends StatelessWidget {
  const CardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return const AspectRatio(
      aspectRatio: 3 / 4,
      child: LoadingSkeleton(height: double.infinity),
    );
  }
}

/// List-item skeleton placeholder.
///
/// A horizontal row with a small square skeleton (avatar/icon) and two
/// text-line skeletons of different widths.
class ListSkeleton extends StatelessWidget {
  const ListSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSizes.lg,
        vertical: AppSizes.md,
      ),
      child: Row(
        children: [
          const LoadingSkeleton(
            width: 48,
            height: 48,
            borderRadius: AppSizes.radiusSm,
          ),
          const SizedBox(width: AppSizes.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                LoadingSkeleton(height: 14, borderRadius: AppSizes.xs),
                SizedBox(height: AppSizes.sm),
                LoadingSkeleton(height: 12, borderRadius: AppSizes.xs),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
