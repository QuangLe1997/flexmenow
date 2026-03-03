import 'package:flutter/material.dart';

import '../core/design_tokens.dart';

/// Shows the AI Chat panel as a modal bottom sheet.
///
/// Currently a placeholder shell with a "Coming Soon" message,
/// chat bubble UI area, and input bar at the bottom.
Future<void> showAiChat(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const _AiChatSheet(),
  );
}

class _AiChatSheet extends StatelessWidget {
  const _AiChatSheet();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: AppColors.bg,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppSizes.radiusXl),
        ),
      ),
      child: Column(
        children: [
          // Handle bar + header
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSizes.lg,
              vertical: AppSizes.md,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const SizedBox(width: 32),
                // Handle bar
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.zinc700,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                // Close button
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => Navigator.of(context).pop(),
                    customBorder: const CircleBorder(),
                    child: const Padding(
                      padding: EdgeInsets.all(10),
                      child: Icon(
                        Icons.close,
                        size: AppSizes.icon2xl,
                        color: AppColors.textSec,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Title
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: AppSizes.lg),
            child: Row(
              children: [
                Icon(Icons.auto_awesome, size: AppSizes.iconXl, color: AppColors.brand),
                SizedBox(width: AppSizes.sm),
                Text(
                  'AI Assistant',
                  style: TextStyle(
                    fontSize: AppSizes.fontXl,
                    fontWeight: FontWeight.w700,
                    color: AppColors.text,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSizes.sm),

          // Chat area (empty with "Coming Soon")
          Expanded(
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.brand.withOpacity(0.1),
                    ),
                    child: const Icon(
                      Icons.chat_bubble_outline,
                      size: AppSizes.icon4xl,
                      color: AppColors.brand,
                    ),
                  ),
                  const SizedBox(height: AppSizes.lg),
                  const Text(
                    'Coming Soon',
                    style: TextStyle(
                      fontSize: AppSizes.fontLg,
                      fontWeight: FontWeight.w600,
                      color: AppColors.text,
                    ),
                  ),
                  const SizedBox(height: AppSizes.sm),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: AppSizes.xxxl),
                    child: Text(
                      'Our AI assistant will help you create amazing content. Stay tuned!',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: AppSizes.fontSm,
                        color: AppColors.textSec,
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Input bar (disabled)
          Container(
            padding: const EdgeInsets.all(AppSizes.lg),
            decoration: const BoxDecoration(
              border: Border(
                top: BorderSide(color: AppColors.border),
              ),
            ),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 44,
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSizes.lg,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.input,
                        borderRadius:
                            BorderRadius.circular(AppSizes.radiusFull),
                        border: Border.all(color: AppColors.border),
                      ),
                      alignment: Alignment.centerLeft,
                      child: const Text(
                        'Ask anything...',
                        style: TextStyle(
                          fontSize: AppSizes.fontSm,
                          color: AppColors.textTer,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSizes.sm),
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.zinc700,
                      borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                    ),
                    child: const Icon(
                      Icons.send,
                      size: AppSizes.iconLg,
                      color: AppColors.textTer,
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
