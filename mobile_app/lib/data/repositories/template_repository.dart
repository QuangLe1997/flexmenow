import 'package:dio/dio.dart';

import '../models/template_data.dart';
import '../services/remote_config_service.dart';

export '../models/template_data.dart';

/// Repository for fetching FlexShot template data from a JSON file on GCS.
///
/// The JSON URL is obtained from Firebase Remote Config via
/// [RemoteConfigService]. Results are cached in memory for the session.
class TemplateRepository {
  final RemoteConfigService _remoteConfig;
  final Dio _dio;
  TemplatesResponse? _cache;

  TemplateRepository(this._remoteConfig, {Dio? dio})
      : _dio = dio ?? Dio();

  /// Loads templates from the remote JSON file.
  ///
  /// Returns a cached response if previously loaded.
  Future<TemplatesResponse> loadTemplates() async {
    if (_cache != null) return _cache!;

    final url = _remoteConfig.flexshotJsonUrl;
    if (url.isEmpty) {
      return const TemplatesResponse(
        version: '',
        updatedAt: '',
        defaults: {},
        categories: [],
        types: [],
        genders: [],
        templates: [],
      );
    }

    final response = await _dio.get<Map<String, dynamic>>(url);
    final data = response.data;
    if (data == null) {
      return const TemplatesResponse(
        version: '',
        updatedAt: '',
        defaults: {},
        categories: [],
        types: [],
        genders: [],
        templates: [],
      );
    }

    _cache = TemplatesResponse.fromJson(data);
    return _cache!;
  }

  /// Clears the in-memory cache, forcing a fresh fetch on next call.
  void clearCache() => _cache = null;
}
