import 'dart:async';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../core/app_animations.dart';
import '../core/design_tokens.dart';
import '../data/mock_data.dart';

/// Auto-cycling crossfade image widget used on splash, tour, create hero, story cards, etc.
/// Uses gradient Container placeholders until real assets are loaded from GCS.
class ImageSlideshow extends StatefulWidget {
  final int itemCount;
  final Duration interval;
  final double height;
  final double borderRadius;
  final Widget Function(BuildContext, int)? itemBuilder;
  final ValueChanged<int>? onIndexChanged;
  final BoxFit fit;

  const ImageSlideshow({
    super.key,
    this.itemCount = 5,
    this.interval = const Duration(milliseconds: 3000),
    this.height = 200,
    this.borderRadius = AppSizes.radiusLg,
    this.itemBuilder,
    this.onIndexChanged,
    this.fit = BoxFit.cover,
  });

  @override
  State<ImageSlideshow> createState() => _ImageSlideshowState();
}

class _ImageSlideshowState extends State<ImageSlideshow> {
  int _currentIndex = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(widget.interval, (_) {
      if (!mounted) return;
      setState(() {
        _currentIndex = (_currentIndex + 1) % widget.itemCount;
      });
      widget.onIndexChanged?.call(_currentIndex);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(widget.borderRadius),
      child: SizedBox(
        height: widget.height,
        width: double.infinity,
        child: AnimatedSwitcher(
          duration: AppDurations.slowest,
          switchInCurve: AppCurves.enter,
          switchOutCurve: AppCurves.exit,
          child: widget.itemBuilder != null
              ? KeyedSubtree(
                  key: ValueKey(_currentIndex),
                  child: widget.itemBuilder!(context, _currentIndex),
                )
              : _PlaceholderImage(
                  key: ValueKey(_currentIndex),
                  index: _currentIndex,
                ),
        ),
      ),
    );
  }
}

/// Gradient placeholder with subtle icon overlay.
/// When [imageUrl] is provided, displays a [CachedNetworkImage] with the
/// gradient as a loading/error fallback.
class PlaceholderImage extends StatelessWidget {
  final int index;
  final double? width;
  final double? height;
  final double borderRadius;
  final IconData icon;
  final Widget? child;
  final String? imageUrl;
  final BoxFit fit;

  const PlaceholderImage({
    super.key,
    this.index = 0,
    this.width,
    this.height,
    this.borderRadius = AppSizes.radiusLg,
    this.icon = Icons.image_outlined,
    this.child,
    this.imageUrl,
    this.fit = BoxFit.cover,
  });

  @override
  Widget build(BuildContext context) {
    final colors = kPlaceholderGradients[index % kPlaceholderGradients.length];

    final gradientBox = Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: colors,
        ),
      ),
      child: child ??
          Center(
            child: Icon(icon, size: AppSizes.icon4xl, color: Colors.white.withValues(alpha: 0.15)),
          ),
    );

    if (imageUrl == null) return gradientBox;

    // Local asset (bundled with app) vs network URL
    final isLocalAsset = imageUrl!.startsWith('assets/');

    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: SizedBox(
        width: width,
        height: height,
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (isLocalAsset)
              Image.asset(
                imageUrl!,
                fit: fit,
                errorBuilder: (_, __, ___) => gradientBox,
              )
            else
              CachedNetworkImage(
                imageUrl: imageUrl!,
                fit: fit,
                placeholder: (_, __) => gradientBox,
                errorWidget: (_, __, ___) => gradientBox,
              ),
            if (child != null) child!,
          ],
        ),
      ),
    );
  }
}

class _PlaceholderImage extends StatelessWidget {
  final int index;
  const _PlaceholderImage({super.key, required this.index});

  @override
  Widget build(BuildContext context) {
    return PlaceholderImage(index: index);
  }
}
