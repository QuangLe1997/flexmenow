import 'package:flutter/material.dart';

import '../core/design_tokens.dart';

/// Data class representing a single notification item.
class NotifItem {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String description;
  final String time;

  const NotifItem({
    required this.icon,
    this.iconColor = AppColors.brand,
    required this.title,
    required this.description,
    required this.time,
  });
}

/// Shows the notification panel as a modal bottom sheet.
///
/// Displays a list of [NotifItem] entries. If the list is empty, shows an
/// "No notifications yet" empty state.
Future<void> showNotifPanel(
  BuildContext context, {
  List<NotifItem>? notifications,
}) {
  final items = notifications ??
      const [
        NotifItem(
          icon: Icons.auto_awesome,
          iconColor: AppColors.brand,
          title: 'Welcome to FlexMe!',
          description: 'Start creating amazing AI content today.',
          time: 'Just now',
        ),
        NotifItem(
          icon: Icons.bolt,
          iconColor: AppColors.green,
          title: 'Free credits added',
          description: 'You received 10 free credits to get started.',
          time: '1 min ago',
        ),
      ];

  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _NotifSheet(notifications: items),
  );
}

class _NotifSheet extends StatelessWidget {
  final List<NotifItem> notifications;

  const _NotifSheet({required this.notifications});

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.7,
      ),
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
              child: Row(
                children: [
                  Icon(Icons.notifications_outlined,
                      size: AppSizes.iconXl, color: AppColors.text),
                  SizedBox(width: AppSizes.sm),
                  Text(
                    'Notifications',
                    style: TextStyle(
                      fontSize: AppSizes.fontXl,
                      fontWeight: FontWeight.w700,
                      color: AppColors.text,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSizes.md),

            // List or empty state
            if (notifications.isEmpty)
              const _EmptyState()
            else
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSizes.lg,
                    vertical: AppSizes.sm,
                  ),
                  itemCount: notifications.length,
                  separatorBuilder: (_, __) =>
                      const Divider(color: AppColors.border, height: 1),
                  itemBuilder: (_, index) =>
                      _NotifTile(item: notifications[index]),
                ),
              ),

            const SizedBox(height: AppSizes.lg),
          ],
        ),
      ),
    );
  }
}

class _NotifTile extends StatelessWidget {
  final NotifItem item;
  const _NotifTile({required this.item});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSizes.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Icon
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: item.iconColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(AppSizes.radiusSm),
            ),
            child: Icon(item.icon, size: AppSizes.iconLg, color: item.iconColor),
          ),
          const SizedBox(width: AppSizes.md),
          // Content
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: const TextStyle(
                    fontSize: AppSizes.fontSm,
                    fontWeight: FontWeight.w600,
                    color: AppColors.text,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  item.description,
                  style: const TextStyle(
                    fontSize: AppSizes.fontXs,
                    color: AppColors.textSec,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSizes.sm),
          // Time
          Text(
            item.time,
            style: const TextStyle(
              fontSize: AppSizes.fontXxsPlus,
              color: AppColors.textTer,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSizes.xxxl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.notifications_none,
            size: AppSizes.icon7xl,
            color: AppColors.textTer.withOpacity(0.5),
          ),
          const SizedBox(height: AppSizes.lg),
          const Text(
            'No notifications yet',
            style: TextStyle(
              fontSize: AppSizes.fontBase,
              color: AppColors.textSec,
            ),
          ),
        ],
      ),
    );
  }
}
