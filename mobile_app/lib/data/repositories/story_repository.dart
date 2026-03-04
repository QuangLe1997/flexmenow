import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/story_data.dart';

/// Repository for fetching and caching FlexTale story data.
///
/// Stories are loaded from a remote JSON file hosted on GCS.
/// The URL comes from Firebase Remote Config. The repository
/// caches the JSON locally and uses version checking to minimize
/// network requests. Same fetch/cache pattern as [TemplateRepository].
class StoryRepository {
  StoryRepository({Dio? dio}) : _dio = dio ?? Dio();

  final Dio _dio;

  static const _cacheFileName = 'flextale_stories.json';
  static const _versionKey = 'flextale_stories_version';

  StoriesResponse? _cached;

  /// Load stories, using cache-first strategy with version checking.
  ///
  /// [jsonUrl] is the URL to the stories JSON file (from Remote Config).
  /// If the cached version matches the remote version, returns cached data.
  /// Otherwise fetches fresh data from the URL.
  Future<StoriesResponse> loadStories(String jsonUrl) async {
    // ignore: avoid_print
    print('[StoryRepo] loadStories called, url=${jsonUrl.length > 40 ? '${jsonUrl.substring(0, 40)}...' : jsonUrl}');

    // Return in-memory cache if available.
    if (_cached != null) {
      // ignore: avoid_print
      print('[StoryRepo] returning in-memory cache (${_cached!.stories.length} stories)');
      return _cached!;
    }

    // Try to load from local file cache first.
    final localData = await _loadFromLocalCache();
    if (localData != null) {
      // ignore: avoid_print
      print('[StoryRepo] loaded from local cache (${localData.stories.length} stories)');
      _cached = localData;
    }

    // Fetch remote data and compare version.
    try {
      final remoteData = await _fetchRemote(jsonUrl);
      // ignore: avoid_print
      print('[StoryRepo] remote fetch result: ${remoteData != null ? '${remoteData.stories.length} stories' : 'null'}');
      if (remoteData != null) {
        final localVersion = await _getCachedVersion();
        final versionChanged = localVersion != remoteData.version;
        final contentChanged = _cached != null &&
            _cached!.stories.length != remoteData.stories.length;
        if (versionChanged || contentChanged || _cached == null) {
          // Remote has newer/different data — update local cache.
          await _saveToLocalCache(remoteData);
          await _setCachedVersion(remoteData.version);
          _cached = remoteData;
        }
      }
    } catch (e) {
      // ignore: avoid_print
      print('[StoryRepo] fetch error: $e');
    }

    // ignore: avoid_print
    print('[StoryRepo] final result: ${_cached?.stories.length ?? 0} stories');

    // If everything failed, return an empty response.
    return _cached ?? const StoriesResponse(
      version: '',
      updatedAt: '',
      categories: [],
      types: [],
      genders: [],
      durations: [],
      stories: [],
    );
  }

  /// Filter the loaded stories by various criteria.
  ///
  /// All parameters are optional. If a parameter is null or empty,
  /// that filter dimension is not applied.
  List<StoryData> filterStories({
    String? category,
    String? type,
    String? gender,
    String? duration,
    String? search,
    String? sort,
    String langCode = 'en',
  }) {
    if (_cached == null) return [];

    var results = _cached!.activeStories;

    // Filter by category.
    if (category != null && category.isNotEmpty && category != 'all') {
      results = results.where((s) =>
          s.category.toLowerCase() == category.toLowerCase()).toList();
    }

    // Filter by type.
    if (type != null && type.isNotEmpty && type != 'all') {
      results = results.where((s) =>
          s.type.toLowerCase() == type.toLowerCase()).toList();
    }

    // Filter by gender.
    if (gender != null && gender.isNotEmpty && gender != 'all') {
      results = results.where((s) =>
          s.gender.toLowerCase() == gender.toLowerCase() ||
          s.gender.toLowerCase() == 'couple').toList();
    }

    // Filter by duration.
    if (duration != null && duration.isNotEmpty && duration != 'all') {
      results = results.where((s) =>
          s.duration.toLowerCase() == duration.toLowerCase()).toList();
    }

    // Filter by search query (matches title in current locale).
    if (search != null && search.isNotEmpty) {
      final query = search.toLowerCase();
      results = results.where((s) {
        final title = s.localizedTitle(langCode).toLowerCase();
        final desc = s.localizedDescription(langCode).toLowerCase();
        final cat = s.category.toLowerCase();
        final tags = s.tags.map((tag) => tag.toLowerCase());
        return title.contains(query) ||
            desc.contains(query) ||
            cat.contains(query) ||
            tags.any((tag) => tag.contains(query));
      }).toList();
    }

    // Sort results.
    switch (sort) {
      case 'popular':
        results.sort((a, b) => b.likes.compareTo(a.likes));
        break;
      case 'newest':
        results.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        break;
      case 'credits_low':
        results.sort((a, b) => a.credits.compareTo(b.credits));
        break;
      case 'credits_high':
        results.sort((a, b) => b.credits.compareTo(a.credits));
        break;
      case 'shortest':
        results.sort((a, b) => a.totalPics.compareTo(b.totalPics));
        break;
      case 'longest':
        results.sort((a, b) => b.totalPics.compareTo(a.totalPics));
        break;
      default:
        // Default: sort by sortOrder.
        results.sort((a, b) => a.sortOrder.compareTo(b.sortOrder));
    }

    return results;
  }

  /// Get a single story by ID.
  StoryData? getStoryById(String id) {
    if (_cached == null) return null;
    try {
      return _cached!.stories.firstWhere((s) => s.id == id);
    } catch (_) {
      return null;
    }
  }

  /// Force refresh from remote, ignoring cache.
  Future<StoriesResponse> refresh(String jsonUrl) async {
    _cached = null;
    return loadStories(jsonUrl);
  }

  /// Clear all cached data (memory + disk).
  Future<void> clearCache() async {
    _cached = null;
    try {
      final file = await _getCacheFile();
      if (await file.exists()) {
        await file.delete();
      }
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_versionKey);
    } catch (_) {
      // Ignore cache clearing errors.
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  Future<StoriesResponse?> _fetchRemote(String url) async {
    if (url.isEmpty) return null;

    final response = await _dio.get<String>(url);
    if (response.statusCode == 200 && response.data != null) {
      final json = jsonDecode(response.data!) as Map<String, dynamic>;
      return StoriesResponse.fromJson(json);
    }
    return null;
  }

  Future<StoriesResponse?> _loadFromLocalCache() async {
    try {
      final file = await _getCacheFile();
      if (await file.exists()) {
        final content = await file.readAsString();
        final json = jsonDecode(content) as Map<String, dynamic>;
        return StoriesResponse.fromJson(json);
      }
    } catch (_) {
      // Corrupted cache — ignore.
    }
    return null;
  }

  Future<void> _saveToLocalCache(StoriesResponse data) async {
    try {
      final file = await _getCacheFile();
      final content = jsonEncode(data.toMap());
      await file.writeAsString(content);
    } catch (_) {
      // Saving failed — non-critical.
    }
  }

  Future<File> _getCacheFile() async {
    final dir = await getApplicationDocumentsDirectory();
    return File('${dir.path}/$_cacheFileName');
  }

  Future<String?> _getCachedVersion() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_versionKey);
  }

  Future<void> _setCachedVersion(String version) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_versionKey, version);
  }
}
