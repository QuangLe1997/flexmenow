import 'package:flutter/material.dart';

import '../core/app_images.dart';
import '../core/design_tokens.dart';

/// Mock data for all screens until real data loads from Firestore/GCS.
/// Mirrors the mockup's shots, tales, vibes, wowTopics, etc.

// ── Enhancement Modes & Glow Filters (FlexLocket) ──────────────────────────
class EnhanceMode {
  final String id;
  final String name;
  final IconData icon;
  final String description;
  final Color color;
  const EnhanceMode({
    required this.id,
    required this.name,
    required this.icon,
    required this.description,
    required this.color,
  });
}

class GlowFilter {
  final String id;
  final String modeId;
  final String name;
  final Color color;
  final IconData icon;
  const GlowFilter({
    required this.id,
    required this.modeId,
    required this.name,
    required this.color,
    required this.icon,
  });
}

const kEnhanceModes = [
  EnhanceMode(id: 'real', name: 'Real', icon: Icons.auto_awesome, description: 'Undetectable retouching', color: AppColors.green),
  EnhanceMode(id: 'moment', name: 'Moment', icon: Icons.camera_alt_outlined, description: 'Atmospheric vibes', color: AppColors.brand),
  EnhanceMode(id: 'locket', name: 'Locket', icon: Icons.favorite_border, description: 'Warm & intimate', color: AppColors.pink),
  EnhanceMode(id: 'face', name: 'Face', icon: Icons.face_retouching_natural, description: 'Targeted retouching', color: AppColors.purple),
  EnhanceMode(id: 'filters', name: 'Filters', icon: Icons.color_lens_outlined, description: 'Color presets', color: AppColors.blue),
  EnhanceMode(id: 'semantic', name: 'Smart', icon: Icons.auto_fix_high, description: 'AI scene detection', color: AppColors.indigo),
];

const kGlowFilters = [
  // Real
  GlowFilter(id: 'natural', modeId: 'real', name: 'Natural', color: AppColors.green, icon: Icons.wb_sunny_outlined),
  GlowFilter(id: 'studio', modeId: 'real', name: 'Studio', color: AppColors.zinc400, icon: Icons.photo_camera_outlined),
  GlowFilter(id: 'outdoor', modeId: 'real', name: 'Outdoor', color: AppColors.blue, icon: Icons.park_outlined),
  GlowFilter(id: 'night_out', modeId: 'real', name: 'Night Out', color: AppColors.purple, icon: Icons.nightlife_outlined),
  // Moment
  GlowFilter(id: 'candid', modeId: 'moment', name: 'Candid', color: AppColors.brand, icon: Icons.directions_walk_outlined),
  GlowFilter(id: 'golden_hour', modeId: 'moment', name: 'Golden', color: AppColors.brand400, icon: Icons.wb_twilight_outlined),
  GlowFilter(id: 'rainy_day', modeId: 'moment', name: 'Rainy', color: AppColors.blue, icon: Icons.water_drop_outlined),
  GlowFilter(id: 'cozy', modeId: 'moment', name: 'Cozy', color: AppColors.brand600, icon: Icons.local_cafe_outlined),
  // Locket
  GlowFilter(id: 'classic', modeId: 'locket', name: 'Classic', color: AppColors.pink, icon: Icons.favorite_outlined),
  GlowFilter(id: 'vintage', modeId: 'locket', name: 'Vintage', color: AppColors.brand600, icon: Icons.photo_album_outlined),
  GlowFilter(id: 'soft_glow', modeId: 'locket', name: 'Soft Glow', color: AppColors.brand400, icon: Icons.blur_on_outlined),
  // Face
  GlowFilter(id: 'skin_smooth', modeId: 'face', name: 'Skin', color: AppColors.pink, icon: Icons.spa_outlined),
  GlowFilter(id: 'eye_bright', modeId: 'face', name: 'Eyes', color: AppColors.blue, icon: Icons.visibility_outlined),
  GlowFilter(id: 'teeth_white', modeId: 'face', name: 'Teeth', color: AppColors.zinc50, icon: Icons.mood_outlined),
  GlowFilter(id: 'full_face', modeId: 'face', name: 'Full Face', color: AppColors.purple, icon: Icons.face_outlined),
  // Filters
  GlowFilter(id: 'paris', modeId: 'filters', name: 'Paris', color: AppColors.pink, icon: Icons.location_city_outlined),
  GlowFilter(id: 'tokyo', modeId: 'filters', name: 'Tokyo', color: AppColors.blue, icon: Icons.temple_buddhist_outlined),
  GlowFilter(id: 'la', modeId: 'filters', name: 'LA', color: AppColors.brand, icon: Icons.wb_sunny_outlined),
  GlowFilter(id: 'film', modeId: 'filters', name: 'Film', color: AppColors.brand600, icon: Icons.camera_roll_outlined),
  GlowFilter(id: 'noir', modeId: 'filters', name: 'Noir', color: AppColors.zinc400, icon: Icons.contrast_outlined),
  GlowFilter(id: 'candy', modeId: 'filters', name: 'Candy', color: AppColors.red, icon: Icons.cake_outlined),
  // Semantic
  GlowFilter(id: 'auto', modeId: 'semantic', name: 'Auto', color: AppColors.indigo, icon: Icons.auto_fix_high_outlined),
  GlowFilter(id: 'food_scene', modeId: 'semantic', name: 'Food', color: AppColors.brand, icon: Icons.restaurant_outlined),
  GlowFilter(id: 'travel_scene', modeId: 'semantic', name: 'Travel', color: AppColors.green, icon: Icons.flight_outlined),
];

/// Helper: get filters for a given mode
List<GlowFilter> filtersForMode(String modeId) =>
    kGlowFilters.where((f) => f.modeId == modeId).toList();

// ── Shot templates ──────────────────────────────────────────────────────────
class ShotTemplate {
  final String id;
  final String title;
  final String category;
  final String gender; // male, female, couple
  final String type; // professional, fantasy, lifestyle, fashion
  final String style;
  final int likes;
  final int views;
  final int credits;
  final String? badge; // HOT, NEW, TRENDING, POPULAR, null
  final bool premium;
  final Color accentColor;
  final String? imageUrl;

  const ShotTemplate({
    required this.id,
    required this.title,
    required this.category,
    required this.gender,
    required this.type,
    required this.style,
    required this.likes,
    required this.views,
    required this.credits,
    this.badge,
    this.premium = false,
    this.accentColor = AppColors.brand,
    this.imageUrl,
  });
}

final kShots = [
  ShotTemplate(id: 't001', title: 'Paris Eiffel', category: 'Travel', gender: 'female', type: 'travel', style: 'Realistic', likes: 12345, views: 45200, credits: 1, badge: 'HOT', accentColor: AppColors.brand, imageUrl: AppImages.templateUrl('t001')),
  ShotTemplate(id: 't002', title: 'Lambo Night', category: 'Luxury', gender: 'male', type: 'sexy', style: 'Cinematic', likes: 8900, views: 32000, credits: 2, badge: 'HOT', premium: true, accentColor: AppColors.brand400, imageUrl: AppImages.templateUrl('t002')),
  ShotTemplate(id: 't003', title: 'CEO Office', category: 'Lifestyle', gender: 'male', type: 'business', style: 'Corporate', likes: 6200, views: 21000, credits: 1, accentColor: AppColors.purple, imageUrl: AppImages.templateUrl('t003')),
  ShotTemplate(id: 't004', title: 'Anime Hero', category: 'Art', gender: 'male', type: 'trend', style: 'Anime', likes: 15600, views: 58000, credits: 1, badge: 'NEW', accentColor: AppColors.blue, imageUrl: AppImages.templateUrl('t004')),
  ShotTemplate(id: 't005', title: 'Tokyo Neon', category: 'Travel', gender: 'female', type: 'travel', style: 'Neon', likes: 7800, views: 28400, credits: 1, accentColor: AppColors.purple, imageUrl: AppImages.templateUrl('t005')),
  ShotTemplate(id: 't006', title: 'Yacht Life', category: 'Luxury', gender: 'couple', type: 'sexy', style: 'Luxury', likes: 9400, views: 35200, credits: 2, badge: 'POPULAR', premium: true, accentColor: AppColors.brand, imageUrl: AppImages.templateUrl('t006')),
  ShotTemplate(id: 't007', title: 'Coffee Aesthetic', category: 'Lifestyle', gender: 'female', type: 'travel', style: 'Warm', likes: 4200, views: 16800, credits: 1, accentColor: AppColors.brand600, imageUrl: AppImages.templateUrl('t007')),
  ShotTemplate(id: 't008', title: 'Cyberpunk City', category: 'Art', gender: 'male', type: 'trend', style: 'Cyberpunk', likes: 11200, views: 42000, credits: 1, badge: 'HOT', accentColor: AppColors.blue, imageUrl: AppImages.templateUrl('t008')),
  ShotTemplate(id: 't009', title: 'Bali Sunset', category: 'Travel', gender: 'couple', type: 'travel', style: 'Warm', likes: 5600, views: 20400, credits: 1, accentColor: AppColors.green, imageUrl: AppImages.templateUrl('t009')),
  ShotTemplate(id: 't010', title: 'Gym Beast', category: 'Lifestyle', gender: 'male', type: 'business', style: 'Dynamic', likes: 8100, views: 30200, credits: 1, accentColor: AppColors.red, imageUrl: AppImages.templateUrl('t010')),
  ShotTemplate(id: 't011', title: 'Christmas', category: 'Seasonal', gender: 'couple', type: 'traditional', style: 'Festive', likes: 6800, views: 24500, credits: 1, badge: 'NEW', accentColor: AppColors.red, imageUrl: AppImages.templateUrl('t011')),
  ShotTemplate(id: 't012', title: 'Magazine Cover', category: 'Art', gender: 'female', type: 'trend', style: 'Editorial', likes: 13200, views: 48000, credits: 2, badge: 'TRENDING', premium: true, accentColor: AppColors.pink, imageUrl: AppImages.templateUrl('t012')),
];

// ── Story / Tale data ───────────────────────────────────────────────────────
class TaleChapter {
  final String heading;
  final String text;
  final List<String> choices;
  const TaleChapter({required this.heading, required this.text, this.choices = const []});
}

class TaleData {
  final String id;
  final String title;
  final String category;
  final String gender;
  final String type;
  final String duration; // moment, once, many
  final int credits;
  final String description;
  final int imageCount;
  final List<TaleChapter> chapters;
  final String? badge;
  final Color accentColor;
  final String? imageUrl;

  const TaleData({
    required this.id,
    required this.title,
    required this.category,
    required this.gender,
    required this.type,
    required this.duration,
    required this.credits,
    required this.description,
    required this.imageCount,
    required this.chapters,
    this.badge,
    this.accentColor = AppColors.purple,
    this.imageUrl,
  });
}

final kTales = [
  TaleData(
    id: 'tale_paris_7days', title: 'Paris 7 Days', category: 'Travel', gender: 'female', type: 'travel', duration: 'many',
    credits: 8, description: 'A 7-day journey through Paris — from the airport to Eiffel Tower, through Louvre and along the Seine.', imageCount: 9,
    badge: 'HOT', accentColor: AppColors.brand,
    imageUrl: AppImages.templateUrl('t001'),
    chapters: [
      TaleChapter(heading: 'Airport check-in', text: "Let's go! Paris here I come! 12-hour flight but totally worth it!"),
      TaleChapter(heading: 'Landing at CDG', text: 'Made it to Paris safe and sound! Cold but happy.'),
      TaleChapter(heading: 'Hotel with Eiffel view', text: 'Dropped my bags and look at this view! The Eiffel Tower right outside my window!'),
    ],
  ),
  TaleData(
    id: 'tale_got_a_bae', title: 'Got a Bae', category: 'Romance', gender: 'couple', type: 'sexy', duration: 'once',
    credits: 8, description: 'A love story unfolds — from the first date to a dreamy sunset together.', imageCount: 9,
    badge: 'NEW', accentColor: AppColors.pink,
    imageUrl: AppImages.templateUrl('t009'),
    chapters: [
      TaleChapter(heading: 'First date', text: 'We matched online and met at a cozy cafe. The vibe was instant!', choices: ['Coffee date', 'Dinner date']),
      TaleChapter(heading: 'Getting closer', text: 'Walking together through the park, sharing dreams and laughter...'),
    ],
  ),
  TaleData(
    id: 'tale_ceo_day', title: 'CEO for a Day', category: 'Career', gender: 'male', type: 'business', duration: 'many',
    credits: 8, description: 'Experience a day in the life of a CEO — boardroom to penthouse.', imageCount: 9,
    badge: 'TRENDING', accentColor: AppColors.green,
    imageUrl: AppImages.templateUrl('t003'),
    chapters: [
      TaleChapter(heading: 'Morning routine', text: 'Alarm at 5:30 AM. Cold shower. Black coffee. Ready to conquer.'),
      TaleChapter(heading: 'Boardroom', text: 'The team is assembled. Time to make decisions that matter...'),
      TaleChapter(heading: 'Power lunch', text: 'A deal sealed over steak and champagne at the rooftop restaurant.'),
    ],
  ),
  TaleData(
    id: 'tale_tokyo_5days', title: 'Tokyo 5 Days', category: 'Travel', gender: 'male', type: 'travel', duration: 'many',
    credits: 8, description: 'Navigate the neon-lit streets of Tokyo — from Shibuya to Akihabara.', imageCount: 9,
    badge: 'HOT', accentColor: AppColors.red,
    imageUrl: AppImages.templateUrl('t005'),
    chapters: [
      TaleChapter(heading: 'Narita arrival', text: 'The plane touched down at Narita as golden light flooded through the terminal windows...'),
      TaleChapter(heading: 'Shibuya Crossing', text: 'Thousands of people moved in perfect chaos across the famous intersection...'),
      TaleChapter(heading: 'Akihabara', text: 'Neon lights and anime everywhere — otaku paradise!'),
    ],
  ),
  TaleData(
    id: 'tale_fitness_journey', title: 'Fitness Journey', category: 'Fitness', gender: 'male', type: 'business', duration: 'many',
    credits: 8, description: '12 weeks of dedication. One incredible transformation.', imageCount: 9,
    badge: 'NEW', accentColor: AppColors.green,
    imageUrl: AppImages.templateUrl('t010'),
    chapters: [
      TaleChapter(heading: 'Day One', text: 'The gym felt intimidating, but the fire inside burned brighter...'),
      TaleChapter(heading: 'Week 6', text: 'The mirror told a story of discipline and progress...'),
      TaleChapter(heading: 'The Result', text: 'Twelve weeks later, a champion looked back from the reflection...'),
    ],
  ),
];

// ── Tour slides ─────────────────────────────────────────────────────────────
class TourSlideData {
  final String badge;
  final String title;
  final String slogan;
  final String subtitle;
  final Color accentColor;
  final String animationType; // flip3d, carousel3d, stack3d
  final List<String> imageUrls;

  const TourSlideData({
    required this.badge,
    required this.title,
    required this.slogan,
    required this.subtitle,
    required this.accentColor,
    required this.animationType,
    this.imageUrls = const [],
  });
}

final kTourSlides = [
  TourSlideData(
    badge: 'FlexLocket',
    title: 'Glow different',
    slogan: 'SUBTLE • UNDETECTABLE • BEAUTIFUL',
    subtitle: 'AI enhancement so natural, nobody can tell. Just you, but on your best day.',
    accentColor: AppColors.purple,
    animationType: 'flip3d',
    imageUrls: AppImages.glowTutorial,
  ),
  TourSlideData(
    badge: 'FlexShot',
    title: 'Be anywhere',
    slogan: 'TEMPLATES • AI MAGIC • YOUR FACE',
    subtitle: 'Pick any template, add your photo, and watch AI create stunning results.',
    accentColor: AppColors.brand,
    animationType: 'carousel3d',
    imageUrls: AppImages.shotTutorial,
  ),
  TourSlideData(
    badge: 'FlexTale',
    title: 'Own the feed',
    slogan: 'STORIES • SERIES • STARRING YOU',
    subtitle: 'Generate multi-scene visual stories with you as the main character.',
    accentColor: AppColors.purple,
    animationType: 'stack3d',
    imageUrls: AppImages.taleTutorial,
  ),
];

// ── Personalize options ─────────────────────────────────────────────────────
class PersonalizeOption {
  final String id;
  final String title;
  final String subtitle;
  final Color accentColor;

  const PersonalizeOption({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.accentColor,
  });
}

const kPersonalizeOptions = [
  PersonalizeOption(id: 'glow', title: 'Enhance my photos', subtitle: 'Natural AI glow-up', accentColor: AppColors.purple),
  PersonalizeOption(id: 'create', title: 'Create AI photos', subtitle: 'Templates with my face', accentColor: AppColors.brand),
  PersonalizeOption(id: 'story', title: 'Generate stories', subtitle: 'Visual series starring me', accentColor: AppColors.blue),
];

// ── WOW Topics ──────────────────────────────────────────────────────────────
class WowTopic {
  final String id;
  final String name;
  final String emoji;
  final String description;
  final Color color;

  const WowTopic({required this.id, required this.name, required this.emoji, required this.description, required this.color});
}

const kWowTopics = [
  WowTopic(id: 'travel', name: 'Travel', emoji: '✈️', description: 'Explore dream destinations', color: AppColors.blue),
  WowTopic(id: 'lifestyle', name: 'Lifestyle', emoji: '✨', description: 'Luxury living moments', color: AppColors.brand),
  WowTopic(id: 'fashion', name: 'Fashion', emoji: '👗', description: 'Runway-ready looks', color: AppColors.pink),
  WowTopic(id: 'romance', name: 'Romance', emoji: '💕', description: 'Love story moments', color: AppColors.red),
  WowTopic(id: 'adventure', name: 'Adventure', emoji: '🏔️', description: 'Epic outdoor scenes', color: AppColors.green),
  WowTopic(id: 'food', name: 'Food', emoji: '🍽️', description: 'Gourmet experiences', color: AppColors.brand400),
  WowTopic(id: 'fitness', name: 'Fitness', emoji: '💪', description: 'Peak performance', color: AppColors.green),
  WowTopic(id: 'luxury', name: 'Luxury', emoji: '👑', description: 'VIP lifestyle', color: AppColors.brand),
];

// ── WOW Pricing ─────────────────────────────────────────────────────────────
class WowPlan {
  final String id;
  final int days;
  final String label;
  final double price;
  final String? badge; // TRIAL, POPULAR, VIP
  final String perDay;

  const WowPlan({required this.id, required this.days, required this.label, required this.price, this.badge, required this.perDay});
}

const kWowPlans = [
  WowPlan(id: 'w3', days: 3, label: '3 days', price: 2.99, badge: 'TRIAL', perDay: '\$1.00/day'),
  WowPlan(id: 'w7', days: 7, label: '7 days', price: 4.99, badge: 'POPULAR', perDay: '\$0.71/day'),
  WowPlan(id: 'w30', days: 30, label: '30 days', price: 14.99, perDay: '\$0.50/day'),
  WowPlan(id: 'wf', days: -1, label: 'Forever', price: 29.99, badge: 'VIP', perDay: '\$29.99/mo'),
];

// ── Time slots for WOW schedule ─────────────────────────────────────────────
class TimeSlot {
  final String id;
  final String label;
  final String emoji;
  final String time;

  const TimeSlot({required this.id, required this.label, required this.emoji, required this.time});
}

const kTimeSlots = [
  TimeSlot(id: 'morning', label: 'Morning', emoji: '🌅', time: '8:00 AM'),
  TimeSlot(id: 'noon', label: 'Noon', emoji: '☀️', time: '12:00 PM'),
  TimeSlot(id: 'evening', label: 'Evening', emoji: '🌇', time: '6:00 PM'),
  TimeSlot(id: 'night', label: 'Night', emoji: '🌙', time: '10:00 PM'),
];

// ── Processing steps ────────────────────────────────────────────────────────
const kGlowSteps = [
  'Reading your vibe...',
  'Matching your glow tone',
  'Finding your best light',
  'Polishing to perfection',
  'Adding that chef\'s kiss',
  'Serving looks rn',
];

const kShotSteps = [
  'Locking in the scene',
  'Learning your features',
  'Placing you in frame',
  'AI doing its thing',
  'Making colors pop',
  'Almost iconic...',
];

const kShotVibes = [
  'This is gonna be fire',
  'Your feed won\'t be ready',
  'Main character loading...',
  'About to eat and leave no crumbs',
  'Lowkey obsessed already',
  'The algorithm will thank you',
];

const kTaleVibes = [
  'Plot twist: you\'re the star',
  'Every scene hits different',
  'This story writes itself',
  'Your fans aren\'t ready',
  'Cinema in the making',
  'No cap, this is art',
];

const kGlowVibes = [
  'Subtle flex incoming',
  'They won\'t know it\'s AI',
  'Natural beauty, amplified',
  'Your skin said thank you',
  'Effortlessly stunning',
  'The glow up is real',
];

// ── Filter categories ───────────────────────────────────────────────────────
const kGenderFilters = ['All', 'Male', 'Female', 'Couple'];
const kVibeFilters = ['All', 'Professional', 'Fantasy', 'Lifestyle', 'Fashion'];
const kCategoryFilters = ['All', 'Corporate', 'Natural', 'Sci-Fi', 'Editorial', 'Street', 'Anime', 'Vintage', 'Cyberpunk'];

const kStoryForFilters = ['All', 'Male', 'Female', 'Couple'];
const kStoryVibeFilters = ['All', 'Travel', 'Romance', 'Career', 'Fashion', 'Fantasy', 'Fitness', 'Adventure'];
const kStoryTimeFilters = ['All', 'Moment', 'One Day', 'Many Days'];

// ── Placeholder gradient colors for image placeholders ──────────────────────
const kPlaceholderGradients = [
  [Color(0xFF1A1A2E), Color(0xFF16213E)],
  [Color(0xFF0F3460), Color(0xFF533483)],
  [Color(0xFF2C3333), Color(0xFF395B64)],
  [Color(0xFF1B262C), Color(0xFF3282B8)],
  [Color(0xFF2D132C), Color(0xFF801336)],
  [Color(0xFF1A1A40), Color(0xFF270082)],
  [Color(0xFF1B1B2F), Color(0xFF162447)],
  [Color(0xFF0C0032), Color(0xFF190061)],
];
