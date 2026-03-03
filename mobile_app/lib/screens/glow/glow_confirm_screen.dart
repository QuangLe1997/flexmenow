import 'dart:async';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:path_provider/path_provider.dart';

import '../../core/app_animations.dart';
import '../../core/app_shadows.dart';
import '../../core/app_text_styles.dart';
import '../../core/constants.dart';
import '../../core/credit_utils.dart';
import '../../core/design_tokens.dart';
import '../../core/local_filters.dart';
import '../../data/services/gemini_service.dart';
import '../../providers/app_providers.dart';

/// Confirm screen after photo capture — preview image, apply local filter or AI Agent.
///
/// Two tabs:
/// - **Filters** (FREE): Local color filters processed on-device, adjustable intensity
/// - **AI Agent** (PREMIUM): Gemini analyzes photo → 5 suggestions → user picks or types custom
class GlowConfirmScreen extends ConsumerStatefulWidget {
  final String imagePath;
  const GlowConfirmScreen({super.key, required this.imagePath});

  @override
  ConsumerState<GlowConfirmScreen> createState() => _GlowConfirmScreenState();
}

enum _AgentState { idle, scanning, loaded, error }

class _GlowConfirmScreenState extends ConsumerState<GlowConfirmScreen> {
  // Tab: 0 = Filters (free), 1 = AI Agent (premium)
  int _activeTab = 0;

  // --- Local filter state ---
  int _selectedCategoryIndex = 0;
  int _selectedFilterIndex = 0;
  double _filterIntensity = 1.0;
  final _repaintKey = GlobalKey();

  // --- AI Agent state ---
  _AgentState _agentState = _AgentState.idle;
  List<GlowSuggestion> _suggestions = [];
  int? _selectedSuggestionIndex;
  int _reIdeaCount = 0;
  int _suggestionPage = 0; // pagination: 5 per page
  static const int _suggestionsPerPage = 5;
  final List<String> _allPreviousTitles = [];
  final TextEditingController _customTextController = TextEditingController();

  // --- Processing + result state (inline, no page navigation) ---
  bool _isProcessing = false;
  double _fakeProgress = 0.0;
  Timer? _progressTimer;
  String? _resultImageUrl;
  String? _resultError;
  String? _lastPrompt;

  bool _submitting = false;

  @override
  void dispose() {
    _progressTimer?.cancel();
    _customTextController.dispose();
    super.dispose();
  }

  void _selectCategory(int index) {
    if (index == _selectedCategoryIndex) return;
    setState(() {
      _selectedCategoryIndex = index;
      _selectedFilterIndex = 0;
    });
  }

  LocalFilter get _currentFilter {
    final category = kFilterCategories[_selectedCategoryIndex];
    final filters = filtersForCategory(category.id);
    return filters[_selectedFilterIndex];
  }

  bool get _isOriginalFilter => _currentFilter.id == 'original';

  // --- AI Agent methods ---

  Future<void> _analyzeImage() async {
    setState(() => _agentState = _AgentState.scanning);

    try {
      final gemini = ref.read(geminiServiceProvider);
      final locale = Localizations.localeOf(context).languageCode;
      final suggestions = await gemini.analyzeSuggestions(
        imagePath: widget.imagePath,
        languageCode: locale,
        excludeTitles: _allPreviousTitles,
      );

      if (!mounted) return;
      setState(() {
        _suggestions = suggestions;
        _selectedSuggestionIndex = null;
        _suggestionPage = 0;
        _agentState = _AgentState.loaded;
      });
    } catch (e, stack) {
      debugPrint('AI Agent error: $e');
      debugPrint('$stack');
      if (!mounted) return;
      setState(() => _agentState = _AgentState.error);
    }
  }

  void _reIdea() {
    if (_reIdeaCount >= 3) return;
    _allPreviousTitles.addAll(_suggestions.map((s) => s.title));
    _reIdeaCount++;
    _analyzeImage();
  }

  /// AI Agent: check credits → process inline with overlay
  Future<void> _submitAiAgent() async {
    if (_submitting || _isProcessing) return;

    // Determine the prompt to send
    final String customPrompt;
    if (_customTextController.text.trim().isNotEmpty) {
      customPrompt = _customTextController.text.trim();
    } else if (_selectedSuggestionIndex != null) {
      customPrompt = _suggestions[_selectedSuggestionIndex!].prompt;
    } else {
      return;
    }

    final user = ref.read(currentUserProvider).value;
    final glowUsedToday = user?.glowUsedToday ?? 0;
    const dailyFreeLimit = 10;
    const glowCreditCost = 0.5;

    if (glowUsedToday >= dailyFreeLimit) {
      final hasCredits = await ensureCredits(context, ref, glowCreditCost);
      if (!hasCredits || !mounted) return;
    }

    _processInline(customPrompt);
  }

  /// Run AI enhancement inline with fake progress overlay.
  Future<void> _processInline(String customPrompt) async {
    setState(() {
      _isProcessing = true;
      _fakeProgress = 0.0;
      _resultImageUrl = null;
      _resultError = null;
      _lastPrompt = customPrompt;
    });

    // Fake progress: asymptotically approach 90%
    _progressTimer?.cancel();
    _progressTimer = Timer.periodic(const Duration(milliseconds: 250), (timer) {
      if (!mounted) { timer.cancel(); return; }
      if (_fakeProgress < 0.9) {
        setState(() => _fakeProgress += (0.9 - _fakeProgress) * 0.06);
      }
    });

    try {
      final userId = FirebaseAuth.instance.currentUser?.uid;
      if (userId == null) throw Exception('Not authenticated');

      // Upload image
      final storageService = ref.read(storageServiceProvider);
      final storagePath = await storageService.uploadImage(
        userId: userId,
        file: File(widget.imagePath),
      );
      if (!mounted) return;

      // Call Cloud Function
      final functions = FirebaseFunctions.instanceFor(region: AppConstants.firebaseRegion);
      final callable = functions.httpsCallable(AppConstants.cfGenFlexLocket);
      final result = await callable.call<dynamic>({
        'inputImagePath': storagePath,
        'customPrompt': customPrompt,
      });
      if (!mounted) return;

      final data = Map<String, dynamic>.from(result.data as Map);
      final outputUrl = data['outputImageUrl'] as String?;

      _progressTimer?.cancel();
      setState(() => _fakeProgress = 1.0);

      // Pre-cache result image while still showing processing overlay
      if (outputUrl != null && mounted) {
        try {
          await precacheImage(CachedNetworkImageProvider(outputUrl), context);
        } catch (_) {
          // Image will load on display if precache fails
        }
      }

      // Brief pause at 100% for visual feedback
      await Future.delayed(const Duration(milliseconds: 400));
      if (!mounted) return;

      setState(() {
        _resultImageUrl = outputUrl;
        _isProcessing = false;
        _submitting = false;
      });
    } catch (e) {
      debugPrint('AI Agent processing error: $e');
      _progressTimer?.cancel();
      if (!mounted) return;
      setState(() {
        _resultError = e.toString();
        _isProcessing = false;
        _submitting = false;
      });
    }
  }

  /// Reset from result back to suggestion selection.
  void _resetFromResult() {
    setState(() {
      _resultImageUrl = null;
      _resultError = null;
      _fakeProgress = 0.0;
      _isProcessing = false;
      _submitting = false;
      _selectedSuggestionIndex = null;
      _customTextController.clear();
    });
  }

  /// Apply local filter: capture filtered image via RepaintBoundary → save → result
  Future<void> _applyLocalFilter() async {
    if (_submitting) return;
    setState(() => _submitting = true);

    try {
      final boundary = _repaintKey.currentContext!.findRenderObject() as RenderRepaintBoundary;
      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      if (byteData == null || !mounted) return;

      final tempDir = await getTemporaryDirectory();
      final ts = DateTime.now().millisecondsSinceEpoch;
      final outFile = File('${tempDir.path}/flexlocket_$ts.png');
      await outFile.writeAsBytes(byteData.buffer.asUint8List());

      if (!mounted) return;

      context.push('/glow/result', extra: {
        'imagePath': outFile.path,
        'originalPath': widget.imagePath,
        'filterName': _currentFilter.name,
        'categoryName': kFilterCategories[_selectedCategoryIndex].name,
        'isLocalFilter': true,
      });
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to apply filter'), backgroundColor: AppColors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider).value;
    final glowRemaining = 10 - (user?.glowUsedToday ?? 0);

    final showControls = !_isProcessing && _resultImageUrl == null && _resultError == null;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(glowRemaining),
            Expanded(child: _buildPhotoPreview()),
            const SizedBox(height: 12),
            if (showControls) ...[
              _buildTabSwitcher(),
              const SizedBox(height: 10),
              if (_activeTab == 0) ...[
                _buildCategoryPills(),
                const SizedBox(height: 8),
                _buildFilterTiles(),
                const SizedBox(height: 8),
                _buildIntensitySlider(),
              ] else
                _buildAiAgentContent(),
            ],
            const SizedBox(height: 12),
            _buildActionButtons(),
          ],
        ),
      ),
    );
  }

  // ---- Header ----
  Widget _buildHeader(int glowRemaining) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => context.pop(),
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
              style: const TextStyle(fontSize: AppSizes.fontLg, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic),
              children: const [
                TextSpan(text: 'Flex', style: TextStyle(color: AppColors.text)),
                TextSpan(text: 'Locket', style: TextStyle(color: AppColors.brand)),
              ],
            ),
          ),
          const Spacer(),
          if (_resultImageUrl != null)
            _badge(LucideIcons.check, 'Enhanced', AppColors.green)
          else if (_isProcessing)
            _badge(LucideIcons.loader, 'Processing', AppColors.brand)
          else if (_activeTab == 0)
            _badge(LucideIcons.zap, 'FREE', AppColors.green)
          else
            _badge(
              LucideIcons.sparkles,
              glowRemaining > 0 ? '$glowRemaining free' : '0.5 cr',
              AppColors.brand,
            ),
        ],
      ),
    );
  }

  Widget _badge(IconData icon, String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(AppSizes.radiusFull),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 13, color: color),
        const SizedBox(width: 4),
        Text(text, style: AppTextStyles.mono.copyWith(fontSize: AppSizes.fontXsPlus, fontWeight: FontWeight.w700, color: color)),
      ]),
    );
  }

  // ---- Photo preview with overlays ----
  Widget _buildPhotoPreview() {
    // Original image (always rendered as base layer)
    Widget originalImage = Image.file(
      File(widget.imagePath),
      fit: BoxFit.cover,
      width: double.infinity,
    );
    if (_activeTab == 0 && !_isOriginalFilter && _resultImageUrl == null) {
      originalImage = ColorFiltered(
        colorFilter: _currentFilter.colorFilter(intensity: _filterIntensity),
        child: originalImage,
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppSizes.radiusXl),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Base: original image (always present for RepaintBoundary)
            RepaintBoundary(
              key: _repaintKey,
              child: originalImage,
            ),
            // Result image: fade in over original with smooth animation
            if (_resultImageUrl != null)
              AnimatedOpacity(
                opacity: 1.0,
                duration: const Duration(milliseconds: 600),
                curve: AppCurves.standard,
                child: CachedNetworkImage(
                  imageUrl: _resultImageUrl!,
                  fit: BoxFit.cover,
                  width: double.infinity,
                  fadeInDuration: AppDurations.slow,
                  fadeOutDuration: AppDurations.fast,
                  placeholder: (_, __) => const SizedBox.shrink(),
                  errorWidget: (_, __, ___) => const SizedBox.shrink(),
                ),
              ),
            // Processing overlay
            if (_isProcessing)
              _buildProcessingOverlay(),
            // Result badge
            if (_resultImageUrl != null)
              _buildResultBadge(),
            // Error after processing
            if (_resultError != null && !_isProcessing)
              _buildProcessingErrorOverlay(),
            // AI Agent suggestion overlays (only when not processing/result)
            if (_activeTab == 1 && !_isProcessing && _resultImageUrl == null && _resultError == null) ...[
              if (_agentState == _AgentState.idle || _agentState == _AgentState.scanning)
                _buildScanningOverlay(),
              if (_agentState == _AgentState.loaded)
                _buildSuggestionsOverlay(),
              if (_agentState == _AgentState.error)
                _buildErrorOverlay(),
            ],
          ],
        ),
      ),
    );
  }

  // ---- Tab switcher: Filters | AI Agent ----
  Widget _buildTabSwitcher() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        height: 38,
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
          border: Border.all(color: AppColors.borderMed),
        ),
        child: Row(
          children: [
            _tabItem(0, LucideIcons.palette, 'Filters', null),
            _tabItem(1, LucideIcons.bot, 'AI Agent', 'PRO'),
          ],
        ),
      ),
    );
  }

  Widget _tabItem(int index, IconData icon, String label, String? badge) {
    final isActive = _activeTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() => _activeTab = index);
          // Auto-analyze when switching to AI Agent tab for the first time
          if (index == 1 && _agentState == _AgentState.idle) {
            _analyzeImage();
          }
        },
        child: AnimatedContainer(
          duration: AppDurations.fast,
          margin: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            color: isActive
                ? (index == 0 ? AppColors.green.withValues(alpha: 0.15) : AppColors.brand.withValues(alpha: 0.15))
                : Colors.transparent,
            borderRadius: BorderRadius.circular(AppSizes.radiusSm),
            border: isActive
                ? Border.all(color: index == 0 ? AppColors.green.withValues(alpha: 0.3) : AppColors.brand.withValues(alpha: 0.3))
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 13, color: isActive ? (index == 0 ? AppColors.green : AppColors.brand) : AppColors.textTer),
              const SizedBox(width: 5),
              Text(
                label,
                style: TextStyle(
                  fontSize: AppSizes.fontXs,
                  fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                  color: isActive ? (index == 0 ? AppColors.green : AppColors.brand) : AppColors.textTer,
                ),
              ),
              if (badge != null) ...[
                const SizedBox(width: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                  decoration: BoxDecoration(
                    color: AppColors.brand.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    badge,
                    style: AppTextStyles.mono.copyWith(fontSize: AppSizes.font3xs, fontWeight: FontWeight.w700, color: AppColors.brand),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // ---- Local filter: category pills ----
  Widget _buildCategoryPills() {
    return SizedBox(
      height: 34,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: kFilterCategories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 7),
        itemBuilder: (context, index) {
          final cat = kFilterCategories[index];
          final isActive = index == _selectedCategoryIndex;
          return GestureDetector(
            onTap: () => _selectCategory(index),
            child: AnimatedContainer(
              duration: AppDurations.fast,
              padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
              decoration: BoxDecoration(
                color: isActive ? cat.color.withValues(alpha: 0.15) : AppColors.card,
                borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                border: Border.all(color: isActive ? cat.color : AppColors.borderMed),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(cat.icon, size: 13, color: isActive ? cat.color : AppColors.textSec),
                const SizedBox(width: 5),
                Text(cat.name, style: TextStyle(fontSize: AppSizes.fontXsPlus, fontWeight: FontWeight.w600, color: isActive ? cat.color : AppColors.textSec)),
              ]),
            ),
          );
        },
      ),
    );
  }

  // ---- Local filter: filter tiles with image preview ----
  Widget _buildFilterTiles() {
    final category = kFilterCategories[_selectedCategoryIndex];
    final filters = filtersForCategory(category.id);

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 250),
      switchInCurve: AppCurves.enter,
      switchOutCurve: AppCurves.exit,
      transitionBuilder: (child, animation) => SlideTransition(
        position: Tween<Offset>(begin: const Offset(0.15, 0), end: Offset.zero).animate(animation),
        child: FadeTransition(opacity: animation, child: child),
      ),
      child: SizedBox(
        key: ValueKey(category.id),
        height: 88,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: filters.length,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (context, index) {
            final filter = filters[index];
            final isActive = index == _selectedFilterIndex;
            return GestureDetector(
              onTap: () => setState(() {
                _selectedFilterIndex = index;
                _filterIntensity = 1.0;
              }),
              child: SizedBox(
                width: 66,
                child: Column(
                  children: [
                    AnimatedContainer(
                      duration: AppDurations.fast,
                      width: 66, height: 66,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                        border: Border.all(
                          color: isActive ? filter.color : AppColors.borderMed,
                          width: isActive ? 2 : 1,
                        ),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(AppSizes.radiusMd - 1),
                        child: filter.id == 'original'
                            ? Image.file(File(widget.imagePath), fit: BoxFit.cover, cacheWidth: 132)
                            : ColorFiltered(
                                colorFilter: filter.colorFilter(),
                                child: Image.file(File(widget.imagePath), fit: BoxFit.cover, cacheWidth: 132),
                              ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      filter.name,
                      style: TextStyle(
                        fontSize: AppSizes.fontXxs,
                        fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                        color: isActive ? filter.color : AppColors.textTer,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  // ---- Intensity slider ----
  Widget _buildIntensitySlider() {
    if (_isOriginalFilter) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Icon(LucideIcons.sun, size: AppSizes.iconSm, color: AppColors.textTer),
          Expanded(
            child: SliderTheme(
              data: SliderThemeData(
                activeTrackColor: AppColors.brand,
                inactiveTrackColor: AppColors.zinc700,
                thumbColor: AppColors.brand,
                overlayColor: AppColors.brand.withValues(alpha: 0.1),
                trackHeight: 3,
                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
              ),
              child: Slider(
                value: _filterIntensity,
                min: 0.0,
                max: 1.0,
                onChanged: (v) => setState(() => _filterIntensity = v),
              ),
            ),
          ),
          SizedBox(
            width: 36,
            child: Text(
              '${(_filterIntensity * 100).round()}%',
              style: AppTextStyles.monoSmall.copyWith(color: AppColors.textSec),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }

  // ---- AI Agent: controls below image (only when loaded) ----
  Widget _buildAiAgentContent() {
    if (_agentState != _AgentState.loaded) return const SizedBox.shrink();

    final reIdeaRemaining = 3 - _reIdeaCount;

    return Column(
      children: [
        // Header: AI Agent + Re-idea button
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              const Icon(LucideIcons.bot, size: AppSizes.iconSm, color: AppColors.brand),
              const SizedBox(width: 6),
              Text(
                'AI Agent',
                style: TextStyle(fontSize: AppSizes.fontXs, fontWeight: FontWeight.w700, color: AppColors.brand),
              ),
              const SizedBox(width: 8),
              Text(
                'Tap a suggestion or type your own',
                style: TextStyle(fontSize: AppSizes.fontXxsPlus, color: AppColors.textTer),
              ),
              const Spacer(),
              if (reIdeaRemaining > 0)
                GestureDetector(
                  onTap: _reIdea,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.purple.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                      border: Border.all(color: AppColors.purple.withValues(alpha: 0.3)),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(LucideIcons.refreshCw, size: 11, color: AppColors.purple),
                      const SizedBox(width: 4),
                      Text(
                        'Re-idea ($reIdeaRemaining)',
                        style: AppTextStyles.monoSmall.copyWith(color: AppColors.purple),
                      ),
                    ]),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        // Custom text input
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Container(
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.input,
              borderRadius: BorderRadius.circular(AppSizes.radiusMd),
              border: Border.all(color: AppColors.borderMed),
            ),
            child: Row(
              children: [
                const SizedBox(width: 10),
                Icon(LucideIcons.pencil, size: 13, color: AppColors.textTer),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _customTextController,
                    style: const TextStyle(fontSize: AppSizes.fontXs, color: AppColors.text),
                    decoration: const InputDecoration(
                      hintText: 'Or type your own idea...',
                      hintStyle: TextStyle(fontSize: AppSizes.fontXs, color: AppColors.textTer),
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: EdgeInsets.zero,
                    ),
                    onChanged: (value) {
                      if (value.trim().isNotEmpty && _selectedSuggestionIndex != null) {
                        setState(() => _selectedSuggestionIndex = null);
                      } else {
                        setState(() {});
                      }
                    },
                  ),
                ),
                const SizedBox(width: 10),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ---- Overlays on image for AI Agent states ----

  Widget _buildScanningOverlay() {
    return Positioned.fill(
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.transparent,
              Colors.black.withValues(alpha: 0.7),
            ],
            stops: const [0.5, 1.0],
          ),
        ),
        alignment: Alignment.bottomCenter,
        padding: const EdgeInsets.only(bottom: 28),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppColors.brand.withValues(alpha: 0.8),
              ),
            ),
            const SizedBox(width: 10),
            Text(
              'Analyzing your photo...',
              style: TextStyle(fontSize: AppSizes.fontSmPlus, fontWeight: FontWeight.w600, color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }

  int get _totalPages => (_suggestions.length / _suggestionsPerPage).ceil();

  List<GlowSuggestion> get _currentPageSuggestions {
    final start = _suggestionPage * _suggestionsPerPage;
    final end = (start + _suggestionsPerPage).clamp(0, _suggestions.length);
    return _suggestions.sublist(start, end);
  }

  Widget _buildSuggestionsOverlay() {
    final pageSuggestions = _currentPageSuggestions;
    final startIndex = _suggestionPage * _suggestionsPerPage;
    final hasPrev = _suggestionPage > 0;
    final hasNext = _suggestionPage < _totalPages - 1;

    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.transparent,
              Colors.black.withValues(alpha: 0.85),
            ],
          ),
        ),
        padding: const EdgeInsets.fromLTRB(8, 40, 8, 10),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Suggestion chips
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: List.generate(pageSuggestions.length, (i) {
                final globalIndex = startIndex + i;
                final s = pageSuggestions[i];
                final isActive = globalIndex == _selectedSuggestionIndex;
                return GestureDetector(
                  onTap: () => setState(() {
                    _selectedSuggestionIndex = globalIndex;
                    _customTextController.clear();
                  }),
                  child: AnimatedContainer(
                    duration: AppDurations.fast,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: isActive
                          ? AppColors.brand
                          : Colors.white.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                      border: Border.all(
                        color: isActive
                            ? AppColors.brand
                            : Colors.white.withValues(alpha: 0.3),
                        width: isActive ? 1.5 : 1,
                      ),
                    ),
                    child: Text(
                      s.title,
                      style: TextStyle(
                        fontSize: AppSizes.fontSmPlus,
                        fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                        color: isActive ? AppColors.bg : Colors.white,
                      ),
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 8),
            // Page navigation: < 1/4 >
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                GestureDetector(
                  onTap: hasPrev ? () => setState(() => _suggestionPage--) : null,
                  child: Icon(
                    LucideIcons.chevronLeft,
                    size: AppSizes.iconBase,
                    color: hasPrev ? Colors.white : Colors.white24,
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  '${_suggestionPage + 1} / $_totalPages',
                  style: AppTextStyles.mono.copyWith(
                    fontSize: AppSizes.fontXsPlus,
                    color: Colors.white70,
                  ),
                ),
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: hasNext ? () => setState(() => _suggestionPage++) : null,
                  child: Icon(
                    LucideIcons.chevronRight,
                    size: AppSizes.iconBase,
                    color: hasNext ? Colors.white : Colors.white24,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorOverlay() {
    return Positioned.fill(
      child: GestureDetector(
        onTap: _analyzeImage,
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.transparent,
                Colors.black.withValues(alpha: 0.7),
              ],
              stops: const [0.5, 1.0],
            ),
          ),
          alignment: Alignment.bottomCenter,
          padding: const EdgeInsets.only(bottom: 28),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(LucideIcons.alertTriangle, size: AppSizes.iconMd, color: AppColors.red.withValues(alpha: 0.9)),
              const SizedBox(width: 8),
              Text(
                'Failed to analyze · Tap to retry',
                style: TextStyle(fontSize: AppSizes.fontSmPlus, fontWeight: FontWeight.w600, color: Colors.white),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ---- Processing overlay (fake progress on image) ----
  Widget _buildProcessingOverlay() {
    final pct = (_fakeProgress * 100).toInt();
    return Positioned.fill(
      child: Container(
        color: Colors.black.withValues(alpha: 0.65),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              width: 88,
              height: 88,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 88,
                    height: 88,
                    child: CircularProgressIndicator(
                      value: _fakeProgress,
                      strokeWidth: 3,
                      color: AppColors.brand,
                      backgroundColor: Colors.white.withValues(alpha: 0.1),
                    ),
                  ),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '$pct',
                        style: AppTextStyles.mono.copyWith(
                          fontSize: AppSizes.font2xl,
                          fontWeight: FontWeight.w900,
                          color: AppColors.brand,
                          height: 1,
                        ),
                      ),
                      Text(
                        '%',
                        style: AppTextStyles.monoSmall.copyWith(
                          fontWeight: FontWeight.w700,
                          color: AppColors.textTer,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Enhancing...',
              style: TextStyle(fontSize: AppSizes.fontMdPlus, fontWeight: FontWeight.w700, color: Colors.white),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(AppSizes.radiusFull),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.shield, size: 11, color: AppColors.green.withValues(alpha: 0.8)),
                  const SizedBox(width: 6),
                  Text(
                    'Subtle & undetectable',
                    style: TextStyle(fontSize: AppSizes.fontXsPlus, color: Colors.white.withValues(alpha: 0.5)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---- Result badge on image ----
  Widget _buildResultBadge() {
    return Positioned(
      top: 12,
      right: 12,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: AppColors.green,
          borderRadius: BorderRadius.circular(AppSizes.radiusFull),
          boxShadow: AppShadows.overlay,
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          const Icon(LucideIcons.check, size: AppSizes.iconXs, color: Colors.white),
          const SizedBox(width: 4),
          Text('Enhanced', style: TextStyle(fontSize: AppSizes.fontXsPlus, fontWeight: FontWeight.w700, color: Colors.white)),
        ]),
      ),
    );
  }

  // ---- Processing error overlay ----
  Widget _buildProcessingErrorOverlay() {
    return Positioned.fill(
      child: Container(
        color: Colors.black.withValues(alpha: 0.6),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.alertTriangle, size: AppSizes.icon4xl, color: AppColors.red.withValues(alpha: 0.8)),
            const SizedBox(height: 12),
            Text(
              'Enhancement failed',
              style: TextStyle(fontSize: AppSizes.fontMdPlus, fontWeight: FontWeight.w700, color: Colors.white),
            ),
            const SizedBox(height: 4),
            Text(
              'Try again or pick a different option',
              style: TextStyle(fontSize: AppSizes.fontXs, color: Colors.white.withValues(alpha: 0.5)),
            ),
          ],
        ),
      ),
    );
  }

  // ---- Action buttons ----
  Widget _buildActionButtons() {
    // Processing: no buttons
    if (_isProcessing) return const SizedBox.shrink();

    // Result: try another + save
    if (_resultImageUrl != null) return _buildResultActions();

    // Error after processing: back + retry
    if (_resultError != null) return _buildProcessingErrorActions();

    // Normal state
    final isFilterTab = _activeTab == 0;

    String buttonLabel;
    IconData buttonIcon;
    bool canSubmit;

    if (isFilterTab) {
      buttonLabel = 'Apply';
      buttonIcon = LucideIcons.check;
      canSubmit = true;
    } else {
      buttonLabel = 'Generate';
      buttonIcon = LucideIcons.sparkles;
      canSubmit = _selectedSuggestionIndex != null || _customTextController.text.trim().isNotEmpty;
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
      child: Row(
        children: [
          // Retake
          Expanded(
            child: SizedBox(
              height: 48,
              child: OutlinedButton.icon(
                onPressed: _submitting ? null : () => context.pop(),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.borderMed),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                ),
                icon: Icon(LucideIcons.refreshCw, size: AppSizes.iconMd, color: AppColors.text),
                label: Text('Retake', style: TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w600, color: AppColors.text)),
              ),
            ),
          ),
          const SizedBox(width: 10),
          // Apply / Generate
          Expanded(
            flex: 2,
            child: SizedBox(
              height: 48,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: (_submitting || !canSubmit) ? null : AppGradients.btn,
                  color: (_submitting || !canSubmit) ? AppColors.zinc700 : null,
                  borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                ),
                child: ElevatedButton.icon(
                  onPressed: (_submitting || !canSubmit)
                      ? null
                      : (isFilterTab ? _applyLocalFilter : _submitAiAgent),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    disabledBackgroundColor: Colors.transparent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                  ),
                  icon: _submitting
                      ? const SizedBox(width: AppSizes.iconMd, height: AppSizes.iconMd, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.bg))
                      : Icon(buttonIcon, size: AppSizes.iconMd, color: canSubmit ? AppColors.bg : AppColors.textTer),
                  label: Text(
                    _submitting ? 'Processing...' : buttonLabel,
                    style: TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w700, color: canSubmit ? AppColors.bg : AppColors.textTer),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Result actions: try another + save
  Widget _buildResultActions() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
      child: Row(
        children: [
          Expanded(
            child: SizedBox(
              height: 48,
              child: OutlinedButton.icon(
                onPressed: _resetFromResult,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.borderMed),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                ),
                icon: Icon(LucideIcons.refreshCw, size: AppSizes.iconMd, color: AppColors.text),
                label: Text('Try another', style: TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w600, color: AppColors.text)),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            flex: 2,
            child: SizedBox(
              height: 48,
              child: DecoratedBox(
                decoration: BoxDecoration(gradient: AppGradients.btn, borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                child: ElevatedButton.icon(
                  onPressed: () {
                    // Navigate to full result page for save/share
                    context.push('/glow/result', extra: {
                      'imagePath': widget.imagePath,
                      'imageUrl': _resultImageUrl,
                      'customPrompt': _lastPrompt,
                    });
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                  ),
                  icon: Icon(LucideIcons.download, size: AppSizes.iconMd, color: AppColors.bg),
                  label: Text('Save & Share', style: TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w700, color: AppColors.bg)),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Error actions: back + retry
  Widget _buildProcessingErrorActions() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
      child: Row(
        children: [
          Expanded(
            child: SizedBox(
              height: 48,
              child: OutlinedButton.icon(
                onPressed: _resetFromResult,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.borderMed),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                ),
                icon: Icon(LucideIcons.arrowLeft, size: AppSizes.iconMd, color: AppColors.text),
                label: Text('Back', style: TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w600, color: AppColors.text)),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            flex: 2,
            child: SizedBox(
              height: 48,
              child: DecoratedBox(
                decoration: BoxDecoration(gradient: AppGradients.btn, borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                child: ElevatedButton.icon(
                  onPressed: _lastPrompt != null ? () => _processInline(_lastPrompt!) : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppSizes.radiusMd)),
                  ),
                  icon: Icon(LucideIcons.refreshCw, size: AppSizes.iconMd, color: AppColors.bg),
                  label: Text('Retry', style: TextStyle(fontSize: AppSizes.fontSm, fontWeight: FontWeight.w700, color: AppColors.bg)),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
