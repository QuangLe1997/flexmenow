import 'dart:async';

import 'package:flutter/material.dart';
import 'package:visibility_detector/visibility_detector.dart';

import '../../data/models/story_data.dart';
import 'story_card_cinematic.dart';
import 'story_card_glass.dart';
import 'story_card_accordion.dart';
import 'story_card_polaroid.dart';
import 'story_card_diagonal.dart';
import 'story_card_triptych.dart';
import 'story_card_spotlight.dart';
import 'story_card_magazine.dart';

// ── Custom Curves ──
// Smooth ease-out with minimal overshoot — feels premium, no jank.

const kBouncyCurve = Cubic(0.22, 1.0, 0.36, 1.0); // B, D — gentle ease-out
const kSmoothBounce = Cubic(0.16, 1.0, 0.3, 1.0); // F, G — silky smooth
const kSpringBounce = Cubic(0.2, 1.0, 0.32, 1.0); // H — subtle spring
const kAccordionCurve = Cubic(0.25, 0.8, 0.25, 1.0); // C — unchanged

// ── Data holder ──

class StoryCardData {
  final StoryData tale;
  final StoriesResponse response;
  final int cardIndex;
  final VoidCallback onTap;

  const StoryCardData({
    required this.tale,
    required this.response,
    required this.cardIndex,
    required this.onTap,
  });

  /// Build full URLs from previewImages, falls back to [coverImage].
  List<String> get imageUrls {
    if (tale.previewImages.isEmpty) {
      final cover = response.buildImageUrl(tale.coverImage);
      return cover.isEmpty ? [] : [cover];
    }
    return tale.previewImages
        .map((p) => response.buildImageUrl(p))
        .where((u) => u.isNotEmpty)
        .toList();
  }

  /// Ensures at least 3 images by duplicating last.
  List<String> get paddedImageUrls {
    final urls = imageUrls;
    if (urls.isEmpty) return [];
    while (urls.length < 3) {
      urls.add(urls.last);
    }
    return urls;
  }
}

// ── Slideshow Mixin ──

/// Provides auto-cycling slideshow logic with visibility-based pause/resume.
mixin StoryCardSlideshowMixin<T extends StatefulWidget> on State<T> {
  Timer? _slideshowTimer;
  int currentImageIndex = 0;
  bool _isVisible = true;

  /// Override in each style for custom interval.
  Duration get slideshowInterval;

  /// Override in each style for number of images to cycle through.
  int get imageCount;

  void startSlideshow() {
    _slideshowTimer?.cancel();
    if (imageCount <= 1) return;
    _slideshowTimer = Timer.periodic(slideshowInterval, (_) {
      if (!mounted || !_isVisible) return;
      setState(() {
        currentImageIndex = (currentImageIndex + 1) % imageCount;
      });
    });
  }

  void stopSlideshow() {
    _slideshowTimer?.cancel();
    _slideshowTimer = null;
  }

  void onVisibilityChanged(VisibilityInfo info) {
    final visible = info.visibleFraction > 0.1;
    if (visible == _isVisible) return;
    _isVisible = visible;
    if (visible) {
      startSlideshow();
    } else {
      stopSlideshow();
    }
  }

  Widget wrapWithVisibility({required String id, required Widget child}) {
    return VisibilityDetector(
      key: Key('story-card-$id'),
      onVisibilityChanged: onVisibilityChanged,
      child: child,
    );
  }

  @override
  void dispose() {
    stopSlideshow();
    super.dispose();
  }
}

// ── Factory ──

Widget buildStoryCardForStyle({required int styleIndex, required StoryCardData data}) {
  switch (styleIndex % 8) {
    case 0:
      return StoryCardCinematic(data: data);
    case 1:
      return StoryCardGlass(data: data);
    case 2:
      return StoryCardAccordion(data: data);
    case 3:
      return StoryCardPolaroid(data: data);
    case 4:
      return StoryCardDiagonal(data: data);
    case 5:
      return StoryCardTriptych(data: data);
    case 6:
      return StoryCardSpotlight(data: data);
    case 7:
      return StoryCardMagazine(data: data);
    default:
      return StoryCardCinematic(data: data);
  }
}
