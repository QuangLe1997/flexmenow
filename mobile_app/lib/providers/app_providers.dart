import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/repositories/auth_repository.dart';
import '../data/repositories/user_repository.dart';
import '../data/repositories/template_repository.dart';
import '../data/repositories/story_repository.dart';
import '../data/repositories/generation_repository.dart';
import '../data/repositories/story_generation_repository.dart';
import '../data/repositories/enhancement_repository.dart';
import '../data/services/analytics_service.dart';
import '../data/services/app_init_service.dart';
import '../data/services/gemini_service.dart';
import '../data/services/remote_config_service.dart';
import '../data/services/storage_service.dart';
import '../data/services/revenuecat_service.dart';
import '../data/services/face_detection_service.dart';
import '../data/models/generation_model.dart';
import '../data/models/story_model.dart';
import '../data/models/enhancement_model.dart';
import '../data/models/user_model.dart';

// ---------------------------------------------------------------------------
// App init orchestrator
// ---------------------------------------------------------------------------

final appInitProvider = Provider<AppInitService>((ref) {
  return AppInitService();
});

// ---------------------------------------------------------------------------
// Service / Repository singletons
// ---------------------------------------------------------------------------

final remoteConfigProvider = Provider<RemoteConfigService>((ref) {
  return RemoteConfigService();
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

final userRepositoryProvider = Provider<UserRepository>((ref) {
  return UserRepository();
});

final templateRepositoryProvider = Provider<TemplateRepository>((ref) {
  final rc = ref.watch(remoteConfigProvider);
  return TemplateRepository(rc);
});

final storyRepositoryProvider = Provider<StoryRepository>((ref) {
  return StoryRepository();
});

final generationRepositoryProvider = Provider<GenerationRepository>((ref) {
  return GenerationRepository();
});

final storyGenerationRepositoryProvider =
    Provider<StoryGenerationRepository>((ref) {
  return StoryGenerationRepository();
});

final enhancementRepositoryProvider =
    Provider<EnhancementRepository>((ref) {
  return EnhancementRepository();
});

final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

final revenueCatServiceProvider = Provider<RevenueCatService>((ref) {
  return RevenueCatService();
});

final geminiServiceProvider = Provider<GeminiService>((ref) {
  return GeminiService();
});

final analyticsServiceProvider = Provider<AnalyticsService>((ref) {
  return AnalyticsService();
});

final faceDetectionServiceProvider = Provider<FaceDetectionService>((ref) {
  final service = FaceDetectionService();
  ref.onDispose(() => service.dispose());
  return service;
});

// ---------------------------------------------------------------------------
// Auth state
// ---------------------------------------------------------------------------

/// Stream of Firebase Auth state changes.
final authStateProvider = StreamProvider<User?>((ref) {
  final auth = ref.watch(authRepositoryProvider);
  return auth.authStateChanges();
});

// ---------------------------------------------------------------------------
// Current user profile (Firestore realtime)
// ---------------------------------------------------------------------------

/// Watches the current user's Firestore profile document in realtime.
/// Returns null if not authenticated or document doesn't exist.
final currentUserProvider = StreamProvider<UserModel?>((ref) {
  final authState = ref.watch(authStateProvider);
  final userRepo = ref.watch(userRepositoryProvider);

  return authState.when(
    data: (user) {
      if (user == null) return Stream.value(null);
      return userRepo.watchUser(user.uid);
    },
    loading: () => Stream.value(null),
    error: (_, __) => Stream.value(null),
  );
});

/// Convenience provider for the current user's credit balance.
final creditsProvider = Provider<double>((ref) {
  final user = ref.watch(currentUserProvider).value;
  return user?.creditsBalance ?? 0;
});

// ---------------------------------------------------------------------------
// Templates & Stories (JSON data)
// ---------------------------------------------------------------------------

/// Loads FlexShot templates from remote JSON.
final templatesProvider = FutureProvider((ref) {
  final repo = ref.watch(templateRepositoryProvider);
  return repo.loadTemplates();
});

/// Loads FlexTale stories from remote JSON.
final storiesProvider = FutureProvider((ref) {
  final rc = ref.watch(remoteConfigProvider);
  final repo = ref.watch(storyRepositoryProvider);
  return repo.loadStories(rc.flextaleJsonUrl);
});

// ---------------------------------------------------------------------------
// Generation status streams
// ---------------------------------------------------------------------------

/// Watches a single generation document by ID.
/// Use: ref.watch(generationStatusProvider('generationId'))
final generationStatusProvider =
    StreamProvider.family<GenerationModel, String>((ref, String generationId) {
  final repo = ref.watch(generationRepositoryProvider);
  return repo.watchGeneration(generationId);
});

/// Watches a single story generation document by ID.
/// Use: ref.watch(storyStatusProvider('storyId'))
final storyStatusProvider =
    StreamProvider.family<StoryGenerationModel, String>((ref, String storyId) {
  final repo = ref.watch(storyGenerationRepositoryProvider);
  return repo.watchStory(storyId);
});

// ---------------------------------------------------------------------------
// Scene status streams (FlexTale)
// ---------------------------------------------------------------------------

/// Watches all scenes for a story generation in realtime.
/// Use: ref.watch(scenesProvider('storyDocId'))
final scenesProvider =
    StreamProvider.family<List<SceneModel>, String>((ref, String storyDocId) {
  final repo = ref.watch(storyGenerationRepositoryProvider);
  return repo.watchScenes(storyDocId);
});

// ---------------------------------------------------------------------------
// User generation / story history
// ---------------------------------------------------------------------------

/// Watches the current user's FlexShot generations (latest first).
final userGenerationsProvider =
    StreamProvider<List<GenerationModel>>((ref) {
  final authState = ref.watch(authStateProvider);
  final repo = ref.watch(generationRepositoryProvider);

  return authState.when(
    data: (user) {
      if (user == null) return Stream.value([]);
      return repo.listGenerations(user.uid);
    },
    loading: () => Stream.value([]),
    error: (_, __) => Stream.value([]),
  );
});

/// Watches the current user's FlexTale stories (latest first).
final userStoriesProvider =
    StreamProvider<List<StoryGenerationModel>>((ref) {
  final authState = ref.watch(authStateProvider);
  final repo = ref.watch(storyGenerationRepositoryProvider);

  return authState.when(
    data: (user) {
      if (user == null) return Stream.value([]);
      return repo.listStories(user.uid);
    },
    loading: () => Stream.value([]),
    error: (_, __) => Stream.value([]),
  );
});

/// Watches the current user's FlexLocket enhancements (latest first).
final userEnhancementsProvider =
    StreamProvider<List<EnhancementModel>>((ref) {
  final authState = ref.watch(authStateProvider);
  final repo = ref.watch(enhancementRepositoryProvider);

  return authState.when(
    data: (user) {
      if (user == null) return Stream.value([]);
      return repo.listEnhancements(user.uid);
    },
    loading: () => Stream.value([]),
    error: (_, __) => Stream.value([]),
  );
});
