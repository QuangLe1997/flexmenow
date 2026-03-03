import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/app_images.dart';
import '../../core/app_shadows.dart';
import '../../core/design_tokens.dart';
import '../../providers/app_providers.dart';
import '../../widgets/image_slideshow.dart';

/// Login screen: cycling bg images, Zap icon logo, "Get 12 free credits" tagline,
/// Google button (white), Apple button (black), anonymous link, Terms/Privacy.
class LoginScreen extends ConsumerWidget {
  const LoginScreen({super.key});

  Future<void> _postLoginInit(BuildContext context, WidgetRef ref) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      final appInit = ref.read(appInitProvider);
      await appInit.initPostAuth(user.uid);
    }
    if (context.mounted) {
      context.go('/create');
    }
  }

  Future<void> _signInWithGoogle(BuildContext context, WidgetRef ref) async {
    try {
      final googleUser = await GoogleSignIn.instance.authenticate();
      final googleAuth = googleUser.authentication;

      final credential = GoogleAuthProvider.credential(
        idToken: googleAuth.idToken,
      );

      await FirebaseAuth.instance.signInWithCredential(credential);
      if (context.mounted) {
        await _postLoginInit(context, ref);
      }
    } on GoogleSignInException catch (e) {
      debugPrint('Google sign-in cancelled or failed: $e');
    } catch (e) {
      debugPrint('Google sign-in failed: $e');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Google sign-in failed. Please try again.')),
        );
      }
    }
  }

  Future<void> _signInWithApple(BuildContext context, WidgetRef ref) async {
    try {
      final appleCredential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );

      final oauthCredential = OAuthProvider('apple.com').credential(
        idToken: appleCredential.identityToken,
        accessToken: appleCredential.authorizationCode,
      );

      final userCredential = await FirebaseAuth.instance.signInWithCredential(oauthCredential);

      // Apple only provides name on first sign-in; update profile if available
      final displayName = [
        appleCredential.givenName,
        appleCredential.familyName,
      ].where((s) => s != null && s.isNotEmpty).join(' ');

      if (displayName.isNotEmpty && userCredential.user?.displayName == null) {
        await userCredential.user?.updateDisplayName(displayName);
      }

      if (context.mounted) {
        await _postLoginInit(context, ref);
      }
    } catch (e) {
      debugPrint('Apple sign-in failed: $e');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Apple sign-in failed. Please try again.')),
        );
      }
    }
  }

  Future<void> _continueAnonymously(BuildContext context, WidgetRef ref) async {
    await _signInAnonymouslyAndInit(context, ref);
  }

  Future<void> _signInAnonymouslyAndInit(BuildContext context, WidgetRef ref) async {
    try {
      await FirebaseAuth.instance.signInAnonymously();
      if (context.mounted) {
        await _postLoginInit(context, ref);
      }
    } catch (e) {
      debugPrint('Anonymous sign-in failed: $e');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Sign in failed. Please try again.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Cycling background images (local assets, blurred + dimmed)
          ImageSlideshow(
            itemCount: AppImages.splashLocal.length,
            interval: const Duration(milliseconds: 2500),
            height: double.infinity,
            borderRadius: 0,
            itemBuilder: (context, index) => Opacity(
              opacity: 0.12,
              child: Image.asset(
                AppImages.splashLocal[index % AppImages.splashLocal.length],
                fit: BoxFit.cover,
                width: double.infinity,
                height: double.infinity,
              ),
            ),
          ),

          // Dark vignette overlay
          Container(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: Alignment.center,
                radius: 1.0,
                colors: [
                  AppColors.bg.withValues(alpha: 0.4),
                  AppColors.bg.withValues(alpha: 0.95),
                ],
              ),
            ),
          ),

          // Content
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  const Spacer(flex: 3),

                  // Zap icon in gold square
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppSizes.radiusMd),
                      gradient: AppGradients.hero,
                      boxShadow: [...AppShadows.brandGlowLg(0.3)],
                    ),
                    child: const Icon(
                      LucideIcons.zap,
                      size: AppSizes.icon3xl,
                      color: AppColors.bg,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Brand name
                  RichText(
                    text: TextSpan(
                      style: TextStyle(
                        fontSize: AppSizes.font4xl,
                        fontWeight: FontWeight.w900,
                        fontStyle: FontStyle.italic,
                        letterSpacing: -1.5,
                      ),
                      children: const [
                        TextSpan(
                          text: 'Flex',
                          style: TextStyle(color: AppColors.text),
                        ),
                        TextSpan(
                          text: 'Me',
                          style: TextStyle(color: AppColors.brand),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // "Get 12 free credits" tagline
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.brand.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                      border: Border.all(
                        color: AppColors.brand.withValues(alpha: 0.2),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          LucideIcons.zap,
                          size: AppSizes.iconSm,
                          color: AppColors.brand,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Get 12 free credits to start',
                          style: TextStyle(
                            fontSize: AppSizes.fontSmPlus,
                            fontWeight: FontWeight.w600,
                            color: AppColors.brand,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const Spacer(flex: 3),

                  // Google button (white bg, gray text)
                  _AuthButton(
                    label: 'Continue with Google',
                    icon: Icons.g_mobiledata,
                    backgroundColor: Colors.white,
                    textColor: AppColors.zinc800,
                    onTap: () => _signInWithGoogle(context, ref),
                  ),

                  // Apple button (black bg, white text)
                  const SizedBox(height: 12),
                  _AuthButton(
                    label: 'Continue with Apple',
                    icon: Icons.apple,
                    backgroundColor: AppColors.zinc900,
                    textColor: Colors.white,
                    onTap: () => _signInWithApple(context, ref),
                  ),

                  const SizedBox(height: 20),

                  // Anonymous option (min 48dp touch target)
                  InkWell(
                    onTap: () => _continueAnonymously(context, ref),
                    borderRadius: BorderRadius.circular(AppSizes.radiusSm),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSizes.lg,
                        vertical: AppSizes.md,
                      ),
                      child: Text(
                        'Continue without account',
                        style: TextStyle(
                          fontSize: AppSizes.fontSm,
                          color: AppColors.textSec,
                          decoration: TextDecoration.underline,
                          decorationColor: AppColors.textTer,
                        ),
                      ),
                    ),
                  ),

                  const Spacer(),

                  // Terms & Privacy (purple links, clickable)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 32),
                    child: RichText(
                      textAlign: TextAlign.center,
                      text: TextSpan(
                        style: TextStyle(
                          fontSize: AppSizes.fontXs,
                          color: AppColors.textTer,
                          height: 1.5,
                        ),
                        children: [
                          const TextSpan(text: 'By continuing, you agree to our '),
                          TextSpan(
                            text: 'Terms',
                            style: const TextStyle(
                              color: AppColors.purple,
                              decoration: TextDecoration.underline,
                              decorationColor: AppColors.purple,
                            ),
                            recognizer: TapGestureRecognizer()
                              ..onTap = () {
                                launchUrl(
                                  Uri.parse('https://flexmenow.com/terms'),
                                  mode: LaunchMode.externalApplication,
                                );
                              },
                          ),
                          const TextSpan(text: ' and '),
                          TextSpan(
                            text: 'Privacy Policy',
                            style: const TextStyle(
                              color: AppColors.purple,
                              decoration: TextDecoration.underline,
                              decorationColor: AppColors.purple,
                            ),
                            recognizer: TapGestureRecognizer()
                              ..onTap = () {
                                launchUrl(
                                  Uri.parse('https://flexmenow.com/privacy'),
                                  mode: LaunchMode.externalApplication,
                                );
                              },
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AuthButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color backgroundColor;
  final Color textColor;
  final VoidCallback onTap;

  const _AuthButton({
    required this.label,
    required this.icon,
    required this.backgroundColor,
    required this.textColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          foregroundColor: textColor,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSizes.radiusMd),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: AppSizes.icon2xl),
            const SizedBox(width: 10),
            Text(
              label,
              style: TextStyle(
                fontSize: AppSizes.fontMdPlus,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
