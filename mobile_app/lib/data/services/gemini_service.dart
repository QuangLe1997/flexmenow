import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:firebase_ai/firebase_ai.dart';

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
/// and returns 5 localized enhancement suggestions.
/// Uses Firebase Auth — no API key needed.
class GeminiService {
  GeminiService();

  late final _model = FirebaseAI.googleAI()
      .generativeModel(model: 'gemini-2.5-flash');

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
    final Uint8List imageBytes = await File(imagePath).readAsBytes();
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
