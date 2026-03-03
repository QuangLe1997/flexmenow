import 'package:flutter/material.dart';

import '../core/design_tokens.dart';
import '../core/constants.dart';

/// Shows the settings panel as a modal bottom sheet.
///
/// Contains items for Language, Account, About, Privacy Policy, and Sign Out.
/// [onLanguageChanged] is called with the selected locale code when the user
/// picks a language. [onSignOut] is called when the user taps Sign Out.
Future<void> showSettingsPanel(
  BuildContext context, {
  String currentLanguage = 'en',
  ValueChanged<String>? onLanguageChanged,
  VoidCallback? onAccountTap,
  VoidCallback? onAboutTap,
  VoidCallback? onPrivacyTap,
  VoidCallback? onSignOut,
}) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _SettingsSheet(
      currentLanguage: currentLanguage,
      onLanguageChanged: onLanguageChanged,
      onAccountTap: onAccountTap,
      onAboutTap: onAboutTap,
      onPrivacyTap: onPrivacyTap,
      onSignOut: onSignOut,
    ),
  );
}

class _SettingsSheet extends StatefulWidget {
  final String currentLanguage;
  final ValueChanged<String>? onLanguageChanged;
  final VoidCallback? onAccountTap;
  final VoidCallback? onAboutTap;
  final VoidCallback? onPrivacyTap;
  final VoidCallback? onSignOut;

  const _SettingsSheet({
    required this.currentLanguage,
    this.onLanguageChanged,
    this.onAccountTap,
    this.onAboutTap,
    this.onPrivacyTap,
    this.onSignOut,
  });

  @override
  State<_SettingsSheet> createState() => _SettingsSheetState();
}

class _SettingsSheetState extends State<_SettingsSheet> {
  bool _showLanguageSelector = false;

  static const _languageLabels = {
    'en': 'English',
    'vi': 'Tieng Viet',
    'es': 'Espanol',
    'pt': 'Portugues',
    'ja': 'Japanese',
    'ko': 'Korean',
  };

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.bg,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppSizes.radiusXl),
        ),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Padding(
              padding: const EdgeInsets.symmetric(vertical: AppSizes.md),
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.zinc700,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Title
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: AppSizes.lg),
              child: Text(
                'Settings',
                style: TextStyle(
                  fontSize: AppSizes.fontXl,
                  fontWeight: FontWeight.w700,
                  color: AppColors.text,
                ),
              ),
            ),
            const SizedBox(height: AppSizes.lg),

            // Language selector or main items
            if (_showLanguageSelector)
              _buildLanguageSelector()
            else
              _buildMainItems(),

            const SizedBox(height: AppSizes.lg),
          ],
        ),
      ),
    );
  }

  Widget _buildMainItems() {
    final currentLabel =
        _languageLabels[widget.currentLanguage] ?? 'English';

    return Column(
      children: [
        _SettingsItem(
          icon: Icons.language,
          label: 'Language',
          trailing: Text(
            currentLabel,
            style: const TextStyle(
              fontSize: AppSizes.fontSm,
              color: AppColors.textSec,
            ),
          ),
          onTap: () => setState(() => _showLanguageSelector = true),
        ),
        _SettingsItem(
          icon: Icons.person_outline,
          label: 'Account',
          onTap: widget.onAccountTap,
        ),
        _SettingsItem(
          icon: Icons.info_outline,
          label: 'About',
          onTap: widget.onAboutTap,
        ),
        _SettingsItem(
          icon: Icons.privacy_tip_outlined,
          label: 'Privacy Policy',
          onTap: widget.onPrivacyTap,
        ),
        const Divider(color: AppColors.border, indent: 16, endIndent: 16),
        _SettingsItem(
          icon: Icons.logout,
          label: 'Sign Out',
          isDestructive: true,
          onTap: widget.onSignOut,
        ),
      ],
    );
  }

  Widget _buildLanguageSelector() {
    return Column(
      children: [
        // Back button
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSizes.lg),
          child: Row(
            children: [
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => setState(() => _showLanguageSelector = false),
                  customBorder: const CircleBorder(),
                  child: const Padding(
                    padding: EdgeInsets.all(12),
                    child: Icon(
                      Icons.arrow_back,
                      size: AppSizes.iconLg,
                      color: AppColors.textSec,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: AppSizes.md),
              const Text(
                'Select Language',
                style: TextStyle(
                  fontSize: AppSizes.fontBase,
                  fontWeight: FontWeight.w600,
                  color: AppColors.text,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSizes.md),
        for (final locale in AppConstants.supportedLocales)
          _SettingsItem(
            icon: widget.currentLanguage == locale
                ? Icons.radio_button_checked
                : Icons.radio_button_unchecked,
            label: _languageLabels[locale] ?? locale,
            iconColor: widget.currentLanguage == locale
                ? AppColors.brand
                : AppColors.textTer,
            onTap: () {
              widget.onLanguageChanged?.call(locale);
              setState(() => _showLanguageSelector = false);
            },
          ),
      ],
    );
  }
}

class _SettingsItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final Widget? trailing;
  final bool isDestructive;
  final Color? iconColor;
  final VoidCallback? onTap;

  const _SettingsItem({
    required this.icon,
    required this.label,
    this.trailing,
    this.isDestructive = false,
    this.iconColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveIconColor =
        iconColor ?? (isDestructive ? AppColors.red : AppColors.textSec);
    final textColor = isDestructive ? AppColors.red : AppColors.text;

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSizes.lg,
          vertical: AppSizes.md,
        ),
        child: Row(
          children: [
            Icon(icon, size: AppSizes.iconXl, color: effectiveIconColor),
            const SizedBox(width: AppSizes.md),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: AppSizes.fontBase,
                  color: textColor,
                ),
              ),
            ),
            if (trailing != null)
              trailing!
            else
              const Icon(
                Icons.chevron_right,
                size: AppSizes.iconLg,
                color: AppColors.textTer,
              ),
          ],
        ),
      ),
    );
  }
}
