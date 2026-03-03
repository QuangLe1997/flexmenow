import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../core/app_animations.dart';
import '../core/app_shadows.dart';
import '../core/app_text_styles.dart';
import '../core/design_tokens.dart';

/// Bottom navigation shell with backdrop blur, Lucide icons, gold active dot, 9px uppercase labels.
class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    if (location.startsWith('/glow')) return 0;
    if (location.startsWith('/create')) return 1;
    if (location.startsWith('/story')) return 2;
    if (location.startsWith('/me')) return 3;
    return 1; // default to Create
  }

  static const _tabs = [
    _TabItem(icon: LucideIcons.sparkles, label: 'LOCKET', route: '/glow'),
    _TabItem(icon: LucideIcons.camera, label: 'SHOT', route: '/create'),
    _TabItem(icon: LucideIcons.bookOpen, label: 'TALE', route: '/story'),
    _TabItem(icon: LucideIcons.userCircle, label: 'ME', route: '/me'),
  ];

  @override
  Widget build(BuildContext context) {
    final index = _currentIndex(context);
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      body: child,
      bottomNavigationBar: ClipRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
          child: Container(
            height: AppSizes.bottomNavHeight + bottomPadding,
            padding: EdgeInsets.only(bottom: bottomPadding),
            decoration: BoxDecoration(
              color: AppColors.bg.withValues(alpha: 0.85),
              border: const Border(
                top: BorderSide(color: AppColors.border),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(_tabs.length, (i) {
                final tab = _tabs[i];
                final isActive = i == index;
                return Expanded(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => context.go(tab.route),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Icon with gold circle background when active
                        AnimatedContainer(
                          duration: AppDurations.fast,
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isActive
                                ? AppColors.brand.withValues(alpha: 0.2)
                                : Colors.transparent,
                          ),
                          child: Icon(
                            tab.icon,
                            size: AppSizes.iconXl,
                            color: isActive ? AppColors.brand : AppColors.textTer,
                          ),
                        ),
                        // Gold dot below icon
                        AnimatedContainer(
                          duration: AppDurations.fast,
                          width: isActive ? 4 : 0,
                          height: isActive ? 4 : 0,
                          margin: const EdgeInsets.symmetric(vertical: 2),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isActive ? AppColors.brand : Colors.transparent,
                            boxShadow: isActive
                                ? AppShadows.colorGlow(AppColors.brand, opacity: 0.5, blur: 6, spread: 0)
                                : null,
                          ),
                        ),
                        // Label (9px uppercase monospace)
                        Text(
                          tab.label,
                          style: AppTextStyles.captionMono.copyWith(
                            fontWeight: FontWeight.w700,
                            color: isActive ? AppColors.brand : AppColors.textTer,
                            letterSpacing: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _TabItem {
  final IconData icon;
  final String label;
  final String route;
  const _TabItem({required this.icon, required this.label, required this.route});
}
