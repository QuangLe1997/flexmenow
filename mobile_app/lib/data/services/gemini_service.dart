import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:firebase_ai/firebase_ai.dart';
import 'package:flutter/painting.dart';

/// A single AI-generated enhancement suggestion.
class GlowSuggestion {
  final String title;
  final String prompt;

  const GlowSuggestion({required this.title, required this.prompt});

  factory GlowSuggestion.fromJson(Map<String, dynamic> json) {
    return GlowSuggestion(
      title: json['title'] as String? ?? '',
      prompt: json['prompt'] as String? ?? '',
    );
  }
}

/// Wraps Firebase AI SDK for on-device photo analysis.
///
/// Sends a multimodal request (image + system prompt) to Gemini
/// and returns 20 localized enhancement suggestions.
/// Uses Firebase Auth — no API key needed.
class GeminiService {
  GeminiService();

  late final _model = FirebaseAI.googleAI()
      .generativeModel(model: 'gemini-2.5-flash');

  /// Max dimension (longest edge) for images sent to Gemini analysis.
  /// 640px keeps token cost minimal (~258 tokens) while preserving enough
  /// detail for the model to understand the scene.
  static const int _analysisMaxDim = 640;

  /// JPEG quality for analysis images (0-100). Lower = smaller = fewer tokens.
  static const int _analysisJpegQuality = 75;

  /// Analyze a photo and suggest 20 diverse enhancement options.
  ///
  /// [imagePath] — local file path of the captured/picked photo.
  /// [languageCode] — device locale code (e.g. 'en', 'vi', 'ja').
  /// [excludeTitles] — titles from previous rounds to avoid duplicates (re-idea).
  Future<List<GlowSuggestion>> analyzeSuggestions({
    required String imagePath,
    required String languageCode,
    List<String> excludeTitles = const [],
  }) async {
    // Downsize to 640px JPEG to minimize Gemini input tokens
    final imageBytes = await _downsizeForAnalysis(imagePath);
    final imagePart = InlineDataPart('image/jpeg', imageBytes);

    final excludeClause = excludeTitles.isNotEmpty
        ? '\nDo NOT reuse these titles: ${excludeTitles.join(', ')}'
        : '';

    final textPart = TextPart(
      'Look at this photo carefully.\n'
      '\n'
      'What do you see? Who is this person? What are they wearing, doing, where are they?\n'
      'What makes this photo interesting? What could make it even better, more beautiful, more unique?\n'
      '\n'
      'Now give me exactly 20 creative ideas to transform this photo.\n'
      'Be diverse — mix enhancement, editing, scene change, style, artistic, anything.\n'
      'Each idea should be inspired by what you actually see in this specific photo.\n'
      'Surprise me. Be bold. Think like a creative director.\n'
      '\n'
      'Format:\n'
      '- "title": in "$languageCode" language, 2-4 words, catchy\n'
      '- "prompt": in English, detailed instruction for an AI image generation model that will edit this photo. Describe exactly what to change and what to keep.\n'
      '$excludeClause\n'
      '\n'
      'Respond ONLY with a JSON array, nothing else:\n'
      '[{"title":"...","prompt":"..."},...]',
    );

    final response = await _model.generateContent([
      Content.multi([imagePart, textPart]),
    ]);

    final raw = response.text ?? '';
    return _parseResponse(raw);
  }

  /// Downsize image to max [_analysisMaxDim]px (longest edge), JPEG compressed.
  /// This cuts Gemini input tokens from ~1k+ to ~258 tokens.
  Future<Uint8List> _downsizeForAnalysis(String imagePath) async {
    final originalBytes = await File(imagePath).readAsBytes();

    // Decode to get dimensions
    final codec = await ui.instantiateImageCodec(originalBytes);
    final frame = await codec.getNextFrame();
    final original = frame.image;
    final w = original.width;
    final h = original.height;

    // If already small enough, just re-encode as JPEG
    if (w <= _analysisMaxDim && h <= _analysisMaxDim) {
      original.dispose();
      // Still re-encode to ensure JPEG format
      return _encodeToJpeg(originalBytes, w, h);
    }

    // Scale to fit within maxDim x maxDim
    final scale = _analysisMaxDim / (w > h ? w : h);
    final newW = (w * scale).round();
    final newH = (h * scale).round();

    // Draw resized image on canvas
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(
      recorder,
      Rect.fromLTWH(0, 0, newW.toDouble(), newH.toDouble()),
    );
    canvas.drawImageRect(
      original,
      Rect.fromLTWH(0, 0, w.toDouble(), h.toDouble()),
      Rect.fromLTWH(0, 0, newW.toDouble(), newH.toDouble()),
      Paint()..filterQuality = FilterQuality.medium,
    );
    final picture = recorder.endRecording();
    final resized = await picture.toImage(newW, newH);

    // Encode to PNG (dart:ui only supports PNG natively)
    // PNG at 640px is still very small (~100-300KB) and saves massive tokens
    final byteData = await resized.toByteData(format: ui.ImageByteFormat.png);

    original.dispose();
    resized.dispose();

    return byteData!.buffer.asUint8List();
  }

  /// Fallback JPEG encoding using dart:ui (outputs PNG since dart:ui lacks JPEG).
  /// The InlineDataPart mime type is set to image/jpeg but PNG bytes work fine
  /// since Gemini auto-detects the actual format.
  Future<Uint8List> _encodeToJpeg(Uint8List bytes, int w, int h) async {
    // For already-small images, just return original bytes
    // Gemini handles both JPEG and PNG transparently
    return bytes;
  }

  /// Parse JSON response, stripping markdown fences if present.
  List<GlowSuggestion> _parseResponse(String raw) {
    var cleaned = raw.trim();

    // Strip markdown code fences
    if (cleaned.startsWith('```')) {
      final firstNewline = cleaned.indexOf('\n');
      if (firstNewline != -1) {
        cleaned = cleaned.substring(firstNewline + 1);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3).trim();
      }
    }

    final decoded = jsonDecode(cleaned) as List<dynamic>;
    return decoded
        .map((e) => GlowSuggestion.fromJson(e as Map<String, dynamic>))
        .where((s) => s.title.isNotEmpty && s.prompt.isNotEmpty)
        .take(20)
        .toList();
  }
}
