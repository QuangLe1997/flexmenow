import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import 'design_tokens.dart';

// ---------------------------------------------------------------------------
// Identity matrix (no effect) — 4×5 row-major, 20 elements
// ---------------------------------------------------------------------------

const List<double> _identity = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
];

// ---------------------------------------------------------------------------
// Matrix math utilities
// ---------------------------------------------------------------------------

/// Lerp between identity and [filter] matrix. [t] = 0.0 → original, 1.0 → full effect.
List<double> lerpMatrix(List<double> filter, double t) {
  final clamped = t.clamp(0.0, 1.0);
  return List<double>.generate(20, (i) => _identity[i] + (filter[i] - _identity[i]) * clamped);
}

/// Multiply two 4×5 color matrices (treat as 5×5 with implicit row [0,0,0,0,1]).
List<double> multiplyMatrices(List<double> a, List<double> b) {
  final r = List<double>.filled(20, 0);
  for (int row = 0; row < 4; row++) {
    for (int col = 0; col < 5; col++) {
      double sum = 0;
      for (int k = 0; k < 4; k++) {
        sum += a[row * 5 + k] * b[k * 5 + col];
      }
      if (col == 4) sum += a[row * 5 + 4];
      r[row * 5 + col] = sum;
    }
  }
  return r;
}

/// Compose a list of matrices into one.
List<double> composeMatrices(List<List<double>> matrices) {
  var result = List<double>.from(_identity);
  for (final m in matrices) {
    result = multiplyMatrices(result, m);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Adjustment matrix generators
// ---------------------------------------------------------------------------

class FilterAdjust {
  /// Brightness: -1.0 to 1.0 (0 = no change)
  static List<double> brightness(double v) {
    final d = (v * 255).clamp(-255.0, 255.0);
    return [1, 0, 0, 0, d, 0, 1, 0, 0, d, 0, 0, 1, 0, d, 0, 0, 0, 1, 0];
  }

  /// Contrast: -1.0 to 1.0 (0 = no change)
  static List<double> contrast(double v) {
    final c = 1.0 + v;
    final t = (1.0 - c) / 2.0 * 255;
    return [c, 0, 0, 0, t, 0, c, 0, 0, t, 0, 0, c, 0, t, 0, 0, 0, 1, 0];
  }

  /// Saturation: -1.0 to 1.0 (0 = no change, -1 = grayscale)
  static List<double> saturation(double v) {
    final s = 1.0 + v;
    final sr = (1 - s) * 0.2126;
    final sg = (1 - s) * 0.7152;
    final sb = (1 - s) * 0.0722;
    return [sr + s, sg, sb, 0, 0, sr, sg + s, sb, 0, 0, sr, sg, sb + s, 0, 0, 0, 0, 0, 1, 0];
  }

  /// Temperature: -1.0 (cool) to 1.0 (warm)
  static List<double> temperature(double v) {
    final r = v > 0 ? v * 20 : 0.0;
    final b = v < 0 ? v.abs() * 20 : 0.0;
    return [1, 0, 0, 0, r, 0, 1, 0, 0, 0, 0, 0, 1, 0, -r + b, 0, 0, 0, 1, 0];
  }

  /// Exposure: -1.0 to 1.0
  static List<double> exposure(double v) {
    final e = 1.0 + v;
    return [e, 0, 0, 0, 0, 0, e, 0, 0, 0, 0, 0, e, 0, 0, 0, 0, 0, 1, 0];
  }
}

// ---------------------------------------------------------------------------
// Data classes
// ---------------------------------------------------------------------------

class FilterCategory {
  final String id;
  final String name;
  final IconData icon;
  final Color color;

  const FilterCategory({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
  });
}

class LocalFilter {
  final String id;
  final String name;
  final String categoryId;
  final IconData icon;
  final Color color;
  final List<double> matrix;

  const LocalFilter({
    required this.id,
    required this.name,
    required this.categoryId,
    required this.icon,
    required this.color,
    required this.matrix,
  });

  /// Return ColorFilter.matrix at given intensity (0..1)
  ColorFilter colorFilter({double intensity = 1.0}) {
    return ColorFilter.matrix(lerpMatrix(matrix, intensity));
  }
}

// ---------------------------------------------------------------------------
// 7 Categories
// ---------------------------------------------------------------------------

const kFilterCategories = <FilterCategory>[
  FilterCategory(id: 'natural', name: 'Natural', icon: LucideIcons.sun, color: AppColors.brand),
  FilterCategory(id: 'warm', name: 'Warm', icon: LucideIcons.flame, color: Color(0xFFFF8C00)),
  FilterCategory(id: 'cool', name: 'Cool', icon: LucideIcons.snowflake, color: Color(0xFF5BC0EB)),
  FilterCategory(id: 'film', name: 'Film', icon: LucideIcons.film, color: Color(0xFFA78BFA)),
  FilterCategory(id: 'bw', name: 'B&W', icon: LucideIcons.contrast, color: Color(0xFF9CA3AF)),
  FilterCategory(id: 'vivid', name: 'Vivid', icon: LucideIcons.palette, color: Color(0xFFF472B6)),
  FilterCategory(id: 'mood', name: 'Mood', icon: LucideIcons.cloud, color: Color(0xFF6EE7B7)),
  FilterCategory(id: 'preset', name: 'Preset', icon: LucideIcons.sparkle, color: Color(0xFFE879F9)),
];

// ---------------------------------------------------------------------------
// 28 Local Filters (4 per category)
// ---------------------------------------------------------------------------

const kLocalFilters = <LocalFilter>[
  // ---- Natural (subtle, skin-friendly) ----
  LocalFilter(
    id: 'original', name: 'Original', categoryId: 'natural',
    icon: LucideIcons.circle, color: AppColors.brand,
    matrix: _identity,
  ),
  LocalFilter(
    id: 'fresh', name: 'Fresh', categoryId: 'natural',
    icon: LucideIcons.leaf, color: Color(0xFF34D399),
    matrix: [
      1.05, 0, 0, 0, 5,
      0, 1.08, 0, 0, 3,
      0, 0, 1.02, 0, 0,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'clean', name: 'Clean', categoryId: 'natural',
    icon: LucideIcons.sparkles, color: Color(0xFF93C5FD),
    matrix: [
      1.08, 0, 0, 0, 8,
      0, 1.06, 0, 0, 6,
      0, 0, 1.04, 0, 4,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'soft', name: 'Soft', categoryId: 'natural',
    icon: LucideIcons.feather, color: Color(0xFFFDA4AF),
    matrix: [
      1.02, 0.05, 0, 0, 8,
      0, 1.04, 0.02, 0, 5,
      0.02, 0, 1.0, 0, 8,
      0, 0, 0, 1, 0,
    ],
  ),

  // ---- Warm (golden, amber, sunset) ----
  LocalFilter(
    id: 'sunlit', name: 'Sunlit', categoryId: 'warm',
    icon: LucideIcons.sunrise, color: Color(0xFFFBBF24),
    matrix: [
      1.15, 0.05, 0, 0, 12,
      0, 1.08, 0, 0, 6,
      0, 0, 0.88, 0, -8,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'amber', name: 'Amber', categoryId: 'warm',
    icon: LucideIcons.flame, color: Color(0xFFF59E0B),
    matrix: [
      1.2, 0.1, 0, 0, 15,
      0.05, 1.1, 0, 0, 10,
      0, 0, 0.85, 0, -5,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'golden_hour', name: 'Golden', categoryId: 'warm',
    icon: LucideIcons.sunset, color: Color(0xFFD97706),
    matrix: [
      1.25, 0.12, 0, 0, 18,
      0.08, 1.12, 0.02, 0, 12,
      0, 0, 0.8, 0, -10,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'honey', name: 'Honey', categoryId: 'warm',
    icon: LucideIcons.heart, color: Color(0xFFEA580C),
    matrix: [
      1.18, 0.08, 0, 0, 10,
      0.04, 1.12, 0.04, 0, 8,
      0, 0.02, 0.82, 0, 5,
      0, 0, 0, 1, 0,
    ],
  ),

  // ---- Cool (blue, teal, icy) ----
  LocalFilter(
    id: 'arctic', name: 'Arctic', categoryId: 'cool',
    icon: LucideIcons.snowflake, color: Color(0xFF38BDF8),
    matrix: [
      0.88, 0, 0, 0, -8,
      0, 1.02, 0.05, 0, 2,
      0, 0, 1.2, 0, 15,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'ocean', name: 'Ocean', categoryId: 'cool',
    icon: LucideIcons.waves, color: Color(0xFF0EA5E9),
    matrix: [
      0.9, 0, 0.05, 0, -5,
      0, 1.05, 0.08, 0, 5,
      0.05, 0.05, 1.15, 0, 12,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'twilight', name: 'Twilight', categoryId: 'cool',
    icon: LucideIcons.moon, color: Color(0xFF818CF8),
    matrix: [
      0.92, 0.05, 0.08, 0, -3,
      0, 0.95, 0.1, 0, 0,
      0.08, 0.05, 1.18, 0, 10,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'frost', name: 'Frost', categoryId: 'cool',
    icon: LucideIcons.thermometer, color: Color(0xFF67E8F9),
    matrix: [
      0.95, 0.02, 0, 0, 5,
      0, 1.06, 0.04, 0, 8,
      0.03, 0.02, 1.12, 0, 10,
      0, 0, 0, 1, 0,
    ],
  ),

  // ---- Film (professional analog stock emulations — rn-color-matrices) ----
  LocalFilter(
    id: 'kodachrome', name: 'Kodachrome', categoryId: 'film',
    icon: LucideIcons.aperture, color: Color(0xFFEF4444),
    matrix: [
      1.1286, -0.3967, -0.0399, 0, 63.73,
      -0.1640, 1.0835, -0.0550, 0, 24.73,
      -0.1679, -0.5603, 1.6015, 0, 35.63,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'polaroid', name: 'Polaroid', categoryId: 'film',
    icon: LucideIcons.image, color: Color(0xFFA78BFA),
    matrix: [
      1.438, -0.062, -0.062, 0, 0,
      -0.122, 1.378, -0.122, 0, 0,
      -0.016, -0.016, 1.483, 0, 0,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'technicolor', name: 'Techniclr', categoryId: 'film',
    icon: LucideIcons.film, color: Color(0xFFD946EF),
    matrix: [
      1.9125, -0.8545, -0.0916, 0, 11.79,
      -0.3088, 1.7659, -0.1060, 0, -70.35,
      -0.2311, -0.7502, 1.8476, 0, 30.95,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'browni', name: 'Browni', categoryId: 'film',
    icon: LucideIcons.coffee, color: Color(0xFFD4A373),
    matrix: [
      0.5997, 0.3455, -0.2708, 0, 47.43,
      -0.0377, 0.8610, 0.1506, 0, -36.97,
      0.2411, -0.0744, 0.4497, 0, -7.56,
      0, 0, 0, 1, 0,
    ],
  ),

  // ---- B&W (monochrome variations) ----
  LocalFilter(
    id: 'classic_bw', name: 'Classic', categoryId: 'bw',
    icon: LucideIcons.circle, color: Color(0xFF9CA3AF),
    matrix: [
      0.2126, 0.7152, 0.0722, 0, 0,
      0.2126, 0.7152, 0.0722, 0, 0,
      0.2126, 0.7152, 0.0722, 0, 0,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'noir', name: 'Noir', categoryId: 'bw',
    icon: LucideIcons.moon, color: Color(0xFF374151),
    matrix: [
      0.35, 0.75, 0.15, 0, -20,
      0.30, 0.70, 0.12, 0, -20,
      0.25, 0.60, 0.10, 0, -5,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'silver', name: 'Silver', categoryId: 'bw',
    icon: LucideIcons.sparkle, color: Color(0xFFD1D5DB),
    matrix: [
      0.25, 0.65, 0.10, 0, 15,
      0.25, 0.65, 0.10, 0, 15,
      0.25, 0.65, 0.10, 0, 18,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'dramatic_bw', name: 'Dramatic', categoryId: 'bw',
    icon: LucideIcons.zap, color: Color(0xFF6B7280),
    matrix: [
      0.35, 0.90, 0.10, 0, -35,
      0.35, 0.90, 0.10, 0, -35,
      0.35, 0.90, 0.10, 0, -35,
      0, 0, 0, 1, 0,
    ],
  ),

  // ---- Vivid (saturated, punchy) ----
  LocalFilter(
    id: 'vibrant', name: 'Vibrant', categoryId: 'vivid',
    icon: LucideIcons.sun, color: Color(0xFFF472B6),
    matrix: [
      1.3, -0.1, 0, 0, 5,
      -0.05, 1.25, -0.05, 0, 5,
      0, -0.1, 1.3, 0, 5,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'neon', name: 'Neon', categoryId: 'vivid',
    icon: LucideIcons.zap, color: Color(0xFFA855F7),
    matrix: [
      1.4, -0.15, 0.1, 0, 0,
      -0.1, 1.35, -0.1, 0, 0,
      0.1, -0.15, 1.4, 0, 0,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'pop', name: 'Pop', categoryId: 'vivid',
    icon: LucideIcons.star, color: Color(0xFFEC4899),
    matrix: [
      1.35, 0, 0, 0, 10,
      0, 1.30, 0, 0, 10,
      0, 0, 1.25, 0, 10,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'electric', name: 'Electric', categoryId: 'vivid',
    icon: LucideIcons.zap, color: Color(0xFF22D3EE),
    matrix: [
      1.1, -0.2, 0.15, 0, 10,
      -0.1, 1.3, -0.1, 0, 5,
      0.15, -0.2, 1.4, 0, 15,
      0, 0, 0, 1, 0,
    ],
  ),

  // ---- Mood (atmospheric, cinematic) ----
  LocalFilter(
    id: 'dreamy', name: 'Dreamy', categoryId: 'mood',
    icon: LucideIcons.cloud, color: Color(0xFFC4B5FD),
    matrix: [
      1.05, 0.08, 0.08, 0, 12,
      0.04, 1.02, 0.06, 0, 10,
      0.06, 0.06, 1.08, 0, 15,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'haze', name: 'Haze', categoryId: 'mood',
    icon: LucideIcons.cloudFog, color: Color(0xFF94A3B8),
    matrix: [
      0.95, 0.05, 0.02, 0, 18,
      0.02, 0.93, 0.05, 0, 18,
      0.02, 0.05, 0.95, 0, 22,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'moody', name: 'Moody', categoryId: 'mood',
    icon: LucideIcons.cloudRain, color: Color(0xFF475569),
    matrix: [
      0.9, 0.05, 0.05, 0, -8,
      0.02, 0.88, 0.08, 0, -5,
      0.05, 0.08, 0.92, 0, 0,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'cinematic', name: 'Cinema', categoryId: 'mood',
    icon: LucideIcons.clapperboard, color: Color(0xFF6EE7B7),
    matrix: [
      1.1, -0.05, 0.08, 0, -5,
      -0.05, 1.08, 0.05, 0, 2,
      0.05, 0.1, 1.15, 0, 8,
      0, 0, 0, 1, 0,
    ],
  ),

  // ---- Preset (Instagram/VSCO-style named presets) ----
  LocalFilter(
    id: 'clarendon', name: 'Clarendon', categoryId: 'preset',
    icon: LucideIcons.sun, color: Color(0xFF60A5FA),
    matrix: [
      1.28, -0.08, 0, 0, 8,
      -0.06, 1.22, -0.06, 0, 8,
      0, -0.08, 1.18, 0, 5,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'lark', name: 'Lark', categoryId: 'preset',
    icon: LucideIcons.leaf, color: Color(0xFF4ADE80),
    matrix: [
      1.15, 0.04, 0, 0, 10,
      0, 1.12, 0, 0, 8,
      0, -0.08, 0.95, 0, 5,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'valencia', name: 'Valencia', categoryId: 'preset',
    icon: LucideIcons.sunset, color: Color(0xFFFB923C),
    matrix: [
      1.08, 0.08, 0.04, 0, 5,
      0.04, 1.04, 0.04, 0, 3,
      0, 0.05, 0.92, 0, 10,
      0, 0, 0, 1, 0,
    ],
  ),
  LocalFilter(
    id: 'sepia', name: 'Sepia', categoryId: 'preset',
    icon: LucideIcons.clock, color: Color(0xFFD4A373),
    matrix: [
      0.393, 0.769, 0.189, 0, 0,
      0.349, 0.686, 0.168, 0, 0,
      0.272, 0.534, 0.131, 0, 0,
      0, 0, 0, 1, 0,
    ],
  ),
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Get filters for a given category ID.
List<LocalFilter> filtersForCategory(String categoryId) {
  return kLocalFilters.where((f) => f.categoryId == categoryId).toList();
}
