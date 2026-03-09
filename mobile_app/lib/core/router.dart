import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'design_tokens.dart';

import '../screens/onboarding/splash_screen.dart';
import '../screens/onboarding/tour_screen.dart';
import '../screens/onboarding/personalize_screen.dart';
import '../screens/onboarding/login_screen.dart';
import '../screens/glow/glow_tab.dart';
import '../screens/glow/glow_confirm_screen.dart';
import '../screens/glow/glow_processing_screen.dart';
import '../screens/glow/glow_result_screen.dart';
import '../screens/create/create_tab.dart';
import '../screens/create/shot_detail_screen.dart';
import '../screens/create/photo_upload_screen.dart';
import '../screens/create/shot_processing_screen.dart';
import '../screens/create/shot_result_screen.dart';
import '../screens/create/category_templates_screen.dart';
import '../screens/story/story_tab.dart';
import '../screens/story/tale_preview_screen.dart';
import '../screens/story/tale_upload_screen.dart';
import '../screens/story/tale_processing_screen.dart';
import '../screens/story/tale_reader_screen.dart';
import '../screens/story/wow_intro_screen.dart';
import '../screens/story/wow_setup_screen.dart';
import '../screens/story/wow_dashboard_screen.dart';
import '../screens/story/wow_delivery_screen.dart';
import '../screens/me/me_tab.dart';
import '../screens/me/generation_history_screen.dart';
import '../screens/me/story_history_screen.dart';
import '../widgets/main_shell.dart';

/// Onboarding routes that only unauthenticated users should access.
const _onboardingPaths = ['/tour', '/personalize', '/login'];

/// Main app routes that require authentication.
const _authedPaths = ['/glow', '/create', '/story', '/me'];

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    redirect: (context, state) {
      final user = FirebaseAuth.instance.currentUser;
      final path = state.uri.path;

      // Splash is always allowed (it handles its own routing)
      if (path == '/splash') return null;

      final isLoggedIn = user != null;
      final isOnboarding = _onboardingPaths.any((p) => path.startsWith(p));
      final isAuthed = _authedPaths.any((p) => path.startsWith(p));

      // Logged-in user trying to access onboarding → redirect to /create
      if (isLoggedIn && isOnboarding) return '/create';

      // Not logged in trying to access main app → redirect to /tour
      if (!isLoggedIn && isAuthed) return '/tour';

      return null;
    },
    errorBuilder: (context, state) => Scaffold(
      backgroundColor: AppColors.bg,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.textTer),
            const SizedBox(height: 16),
            const Text('Page not found', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.text)),
            const SizedBox(height: 8),
            Text(state.uri.path, style: const TextStyle(fontSize: 14, color: AppColors.textTer)),
            const SizedBox(height: 24),
            TextButton(
              onPressed: () => context.go('/create'),
              child: const Text('Go Home', style: TextStyle(color: AppColors.brand)),
            ),
          ],
        ),
      ),
    ),
    routes: [
      // Onboarding
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/tour', builder: (_, __) => const TourScreen()),
      GoRoute(path: '/personalize', builder: (_, __) => const PersonalizeScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),

      // Main shell with bottom nav
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (_, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: '/glow',
            builder: (_, __) => const GlowTab(),
            routes: [
              GoRoute(
                path: 'confirm',
                builder: (_, state) {
                  final imagePath = state.extra as String? ?? '';
                  return GlowConfirmScreen(imagePath: imagePath);
                },
              ),
              GoRoute(
                path: 'processing',
                builder: (_, state) {
                  final extra = state.extra as Map<String, dynamic>?;
                  return GlowProcessingScreen(
                    imagePath: extra?['imagePath'] as String?,
                    enhanceMode: extra?['enhanceMode'] as String?,
                    filterId: extra?['filterId'] as String?,
                    customPrompt: extra?['customPrompt'] as String?,
                  );
                },
              ),
              GoRoute(
                path: 'result',
                builder: (_, state) {
                  final extra = state.extra as Map<String, dynamic>?;
                  return GlowResultScreen(
                    imagePath: extra?['imagePath'] as String?,
                    originalPath: extra?['originalPath'] as String?,
                    imageUrl: extra?['imageUrl'] as String?,
                    enhanceMode: extra?['enhanceMode'] as String?,
                    filterId: extra?['filterId'] as String?,
                    filterName: extra?['filterName'] as String?,
                    categoryName: extra?['categoryName'] as String?,
                    customPrompt: extra?['customPrompt'] as String?,
                    isLocalFilter: extra?['isLocalFilter'] as bool? ?? false,
                  );
                },
              ),
            ],
          ),
          GoRoute(
            path: '/create',
            builder: (_, __) => const CreateTab(),
            routes: [
              GoRoute(
                path: 'category/:categoryId',
                builder: (_, state) => CategoryTemplatesScreen(
                  categoryId: state.pathParameters['categoryId']!,
                ),
              ),
              GoRoute(
                path: 'detail/:templateId',
                builder: (_, state) => ShotDetailScreen(
                  templateId: state.pathParameters['templateId']!,
                ),
              ),
              GoRoute(
                path: 'upload/:templateId',
                builder: (_, state) => PhotoUploadScreen(
                  templateId: state.pathParameters['templateId']!,
                ),
              ),
              GoRoute(
                path: 'processing/:generationId',
                builder: (_, state) => ShotProcessingScreen(
                  generationId: state.pathParameters['generationId']!,
                ),
              ),
              GoRoute(
                path: 'result/:generationId',
                builder: (_, state) => ShotResultScreen(
                  generationId: state.pathParameters['generationId']!,
                ),
              ),
            ],
          ),
          GoRoute(
            path: '/story',
            builder: (_, __) => const StoryTab(),
            routes: [
              GoRoute(
                path: 'preview/:storyId',
                builder: (_, state) => TalePreviewScreen(
                  storyId: state.pathParameters['storyId']!,
                ),
              ),
              GoRoute(
                path: 'upload/:storyId',
                builder: (_, state) => TaleUploadScreen(
                  storyId: state.pathParameters['storyId']!,
                ),
              ),
              GoRoute(
                path: 'processing/:storyId',
                builder: (_, state) => TaleProcessingScreen(
                  storyId: state.pathParameters['storyId']!,
                ),
              ),
              GoRoute(
                path: 'reader/:storyId',
                builder: (_, state) => TaleReaderScreen(
                  storyId: state.pathParameters['storyId']!,
                ),
              ),
              GoRoute(path: 'wow', builder: (_, __) => const WowIntroScreen()),
              GoRoute(path: 'wow/setup', builder: (_, __) => const WowSetupScreen()),
              GoRoute(path: 'wow/dashboard', builder: (_, __) => const WowDashboardScreen()),
              GoRoute(path: 'wow/delivery', builder: (_, __) => const WowDeliveryScreen()),
            ],
          ),
          GoRoute(
            path: '/me',
            builder: (_, __) => const MeTab(),
            routes: [
              GoRoute(path: 'generations', builder: (_, __) => const GenerationHistoryScreen()),
              GoRoute(path: 'stories', builder: (_, __) => const StoryHistoryScreen()),
            ],
          ),
        ],
      ),
    ],
  );
});
