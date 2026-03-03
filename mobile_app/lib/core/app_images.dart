/// Centralized image paths for all local and GCS-hosted assets.
///
/// Splash + onboarding images are bundled locally for instant first-launch.
/// Templates, banners, and UI images are served from Firebase Storage (GCS).
abstract final class AppImages {
  // ── GCS base URL ────────────────────────────────────────────────────────
  static const _base =
      'https://firebasestorage.googleapis.com/v0/b/flexme-now.firebasestorage.app/o/';
  static const _suffix = '?alt=media';

  /// Build full Firebase Storage URL from a GCS object path.
  static String gcsUrl(String objectPath) {
    return '$_base${Uri.encodeComponent(objectPath)}$_suffix';
  }

  // ── Local splash assets (bundled for offline first-launch) ──────────────
  static const splashLocal = [
    'assets/images/splash/splash_1.png',
    'assets/images/splash/splash_2.png',
    'assets/images/splash/splash_3.png',
  ];
  static const splashBg = 'assets/images/splash/splash_bg.png';
  static const splashSpotlight = 'assets/images/splash/splash_spotlight.png';

  // ── Onboarding (LOCAL — bundled for instant first-launch experience) ────
  static const onboardingSplash = splashLocal; // reuse splash images

  // Glow tutorial (tour slide 0 — FlexLocket)
  static const glowTutorial = [
    'assets/images/onboarding/glow_1.png',
    'assets/images/onboarding/glow_2.png',
    'assets/images/onboarding/glow_3.png',
    'assets/images/onboarding/glow_4.png',
  ];

  // Shot tutorial (tour slide 1 — FlexShot)
  static const shotTutorial = [
    'assets/images/onboarding/shot_1.png',
    'assets/images/onboarding/shot_2.png',
    'assets/images/onboarding/shot_3.png',
    'assets/images/onboarding/shot_4.png',
    'assets/images/onboarding/shot_5.png',
  ];

  // Tale tutorial (tour slide 2 — FlexTale)
  static const taleTutorial = [
    'assets/images/onboarding/tale_1.png',
    'assets/images/onboarding/tale_2.png',
    'assets/images/onboarding/tale_3.png',
    'assets/images/onboarding/tale_4.png',
    'assets/images/onboarding/tale_d1_arrival.png',
    'assets/images/onboarding/tale_d1_pool.png',
    'assets/images/onboarding/tale_d2_temple.png',
  ];

  // Tour images grouped by slide index
  static List<List<String>> get tourSlideImages => [
    glowTutorial,
    shotTutorial,
    taleTutorial,
  ];

  // Brand heroes (gold variant)
  static final heroGold = gcsUrl('mockup-images/onboarding/gold_hero.png');
  static final locketGold = gcsUrl('mockup-images/onboarding/gold_locket.png');
  static final shotGold = gcsUrl('mockup-images/onboarding/gold_shot.png');
  static final taleGold = gcsUrl('mockup-images/onboarding/gold_tale.png');

  // Onboarding screens (local assets)
  static const onbFlexlocket = 'assets/images/onboarding/onb_flexlocket.png';
  static const onbFlexshot = 'assets/images/onboarding/onb_flexshot.png';
  static const onbFlextale = 'assets/images/onboarding/onb_flextale.png';

  // ── Templates (gold variant — default) ─────────────────────────────────
  // IDs match Firestore `templates` collection (t001-t012)
  static final templates = {
    't001': gcsUrl('mockup-images/templates/gold/t1_paris_eiffel.png'),
    't002': gcsUrl('mockup-images/templates/gold/t2_lamborghini.png'),
    't003': gcsUrl('mockup-images/templates/gold/t3_ceo_office.png'),
    't004': gcsUrl('mockup-images/templates/gold/t4_anime_hero.png'),
    't005': gcsUrl('mockup-images/templates/gold/t5_tokyo_neon.png'),
    't006': gcsUrl('mockup-images/templates/gold/t6_yacht_life.png'),
    't007': gcsUrl('mockup-images/templates/gold/t7_coffee.png'),
    't008': gcsUrl('mockup-images/templates/gold/t8_cyberpunk.png'),
    't009': gcsUrl('mockup-images/templates/gold/t9_bali_sunset.png'),
    't010': gcsUrl('mockup-images/templates/gold/t10_gym_beast.png'),
    't011': gcsUrl('mockup-images/templates/gold/t11_christmas.png'),
    't012': gcsUrl('mockup-images/templates/gold/t12_magazine.png'),
  };

  /// Get template image URL by template ID (e.g. 't001', 't002', ...).
  static String? templateUrl(String templateId) => templates[templateId];

  // ── Banners ────────────────────────────────────────────────────────────
  static final bannerFlexshot = gcsUrl('mockup-images/banners/gold_flexshot.png');
  static final bannerFlextale = gcsUrl('mockup-images/banners/gold_flextale.png');

  // ── UI ─────────────────────────────────────────────────────────────────
  static final profileCover = gcsUrl('mockup-images/ui/gold_profile_cover.png');
}
