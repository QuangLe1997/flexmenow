import 'package:flutter/widgets.dart';
import 'constants.dart';

/// Resolves an i18n map {en: "...", vi: "...", ...} to the correct string
/// for the current device locale. Falls back to English if locale not found.
String localized(Map<String, dynamic>? i18nMap, [BuildContext? context]) {
  if (i18nMap == null || i18nMap.isEmpty) return '';

  String lang = AppConstants.defaultLocale;

  if (context != null) {
    final locale = Localizations.localeOf(context).languageCode;
    if (AppConstants.supportedLocales.contains(locale)) {
      lang = locale;
    }
  }

  return (i18nMap[lang] ?? i18nMap[AppConstants.defaultLocale] ?? '') as String;
}

/// Same as [localized] but takes a locale code directly.
String localizedFor(Map<String, dynamic>? i18nMap, String langCode) {
  if (i18nMap == null || i18nMap.isEmpty) return '';
  return (i18nMap[langCode] ?? i18nMap[AppConstants.defaultLocale] ?? '') as String;
}

/// Resolves an i18n list (e.g. choices) for the given locale.
List<String> localizedList(Map<String, dynamic>? i18nMap, [BuildContext? context]) {
  if (i18nMap == null || i18nMap.isEmpty) return [];

  String lang = AppConstants.defaultLocale;
  if (context != null) {
    final locale = Localizations.localeOf(context).languageCode;
    if (AppConstants.supportedLocales.contains(locale)) {
      lang = locale;
    }
  }

  final value = i18nMap[lang] ?? i18nMap[AppConstants.defaultLocale];
  if (value is List) return value.cast<String>();
  return [];
}
