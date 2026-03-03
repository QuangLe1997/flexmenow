import 'package:flutter/material.dart';

import '../core/design_tokens.dart';
import 'gold_button.dart';

/// Data class for a subscription plan displayed in the paywall.
class PaywallPlan {
  final String name;
  final String price;
  final String period;
  final int credits;
  final List<String> features;
  final bool isPopular;

  const PaywallPlan({
    required this.name,
    required this.price,
    required this.period,
    required this.credits,
    required this.features,
    this.isPopular = false,
  });
}

/// Data class for a credit pack displayed in the paywall.
class CreditPack {
  final int credits;
  final String price;

  const CreditPack({required this.credits, required this.price});
}

/// Shows the paywall as a modal bottom sheet.
///
/// Displays 3 subscription plans (Starter, Pro, Elite) and optional credit
/// packs. The [onSelectPlan] callback is invoked with the plan name when a
/// user taps a plan's button. The [onSelectCreditPack] callback is invoked
/// with the credit amount.
Future<void> showPaywall(
  BuildContext context, {
  List<PaywallPlan>? plans,
  List<CreditPack>? creditPacks,
  ValueChanged<String>? onSelectPlan,
  ValueChanged<int>? onSelectCreditPack,
}) {
  final defaultPlans = plans ??
      const [
        PaywallPlan(
          name: 'Starter',
          price: '\$4.99',
          period: '/mo',
          credits: 50,
          features: ['50 credits/month', 'FlexShot access', 'Standard quality'],
        ),
        PaywallPlan(
          name: 'Pro',
          price: '\$9.99',
          period: '/mo',
          credits: 150,
          features: [
            '150 credits/month',
            'FlexShot + FlexTale',
            'HD quality',
            'Priority generation',
          ],
          isPopular: true,
        ),
        PaywallPlan(
          name: 'Elite',
          price: '\$19.99',
          period: '/mo',
          credits: 400,
          features: [
            '400 credits/month',
            'All features',
            'HD quality',
            'Priority generation',
            'Early access',
          ],
        ),
      ];

  final defaultCreditPacks = creditPacks ??
      const [
        CreditPack(credits: 10, price: '\$1.99'),
        CreditPack(credits: 30, price: '\$4.99'),
        CreditPack(credits: 80, price: '\$9.99'),
      ];

  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _PaywallSheet(
      plans: defaultPlans,
      creditPacks: defaultCreditPacks,
      onSelectPlan: onSelectPlan,
      onSelectCreditPack: onSelectCreditPack,
    ),
  );
}

class _PaywallSheet extends StatelessWidget {
  final List<PaywallPlan> plans;
  final List<CreditPack> creditPacks;
  final ValueChanged<String>? onSelectPlan;
  final ValueChanged<int>? onSelectCreditPack;

  const _PaywallSheet({
    required this.plans,
    required this.creditPacks,
    this.onSelectPlan,
    this.onSelectCreditPack,
  });

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: AppColors.bg,
            borderRadius: BorderRadius.vertical(
              top: Radius.circular(AppSizes.radiusXl),
            ),
          ),
          child: Column(
            children: [
              // Handle bar + close button
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

              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.symmetric(horizontal: AppSizes.lg),
                  children: [
                    // Title
                    const Text(
                      'Upgrade Your Flex',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: AppSizes.font2xl,
                        fontWeight: FontWeight.w700,
                        color: AppColors.text,
                      ),
                    ),
                    const SizedBox(height: AppSizes.xs),
                    const Text(
                      'Choose a plan that fits your creative needs',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: AppSizes.fontSm,
                        color: AppColors.textSec,
                      ),
                    ),
                    const SizedBox(height: AppSizes.xxl),

                    // Plan cards
                    for (final plan in plans) ...[
                      _PlanCard(
                        plan: plan,
                        onSelect: () => onSelectPlan?.call(plan.name),
                      ),
                      const SizedBox(height: AppSizes.md),
                    ],

                    const SizedBox(height: AppSizes.xxl),

                    // Credit packs section
                    if (creditPacks.isNotEmpty) ...[
                      const Text(
                        'Or buy credit packs',
                        style: TextStyle(
                          fontSize: AppSizes.fontBase,
                          fontWeight: FontWeight.w600,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: AppSizes.md),
                      Row(
                        children: [
                          for (int i = 0; i < creditPacks.length; i++) ...[
                            if (i > 0) const SizedBox(width: AppSizes.sm),
                            Expanded(
                              child: _CreditPackCard(
                                pack: creditPacks[i],
                                onTap: () => onSelectCreditPack
                                    ?.call(creditPacks[i].credits),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],

                    const SizedBox(height: AppSizes.xxxl),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _PlanCard extends StatelessWidget {
  final PaywallPlan plan;
  final VoidCallback? onSelect;

  const _PlanCard({required this.plan, this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(AppSizes.radiusMd),
        border: Border.all(
          color: plan.isPopular ? AppColors.brand : AppColors.border,
          width: plan.isPopular ? 2 : 1,
        ),
      ),
      padding: const EdgeInsets.all(AppSizes.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Plan name + POPULAR badge
          Row(
            children: [
              Text(
                plan.name,
                style: const TextStyle(
                  fontSize: AppSizes.fontLg,
                  fontWeight: FontWeight.w700,
                  color: AppColors.text,
                ),
              ),
              if (plan.isPopular) ...[
                const SizedBox(width: AppSizes.sm),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSizes.sm,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.brand,
                    borderRadius: BorderRadius.circular(AppSizes.radiusFull),
                  ),
                  child: const Text(
                    'POPULAR',
                    style: TextStyle(
                      fontSize: AppSizes.fontXxsPlus,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: AppSizes.sm),

          // Price
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                plan.price,
                style: const TextStyle(
                  fontSize: AppSizes.font2xl,
                  fontWeight: FontWeight.w800,
                  color: AppColors.brand,
                ),
              ),
              Text(
                plan.period,
                style: const TextStyle(
                  fontSize: AppSizes.fontSm,
                  color: AppColors.textSec,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSizes.sm),

          // Credits
          Row(
            children: [
              const Icon(Icons.bolt, size: AppSizes.iconMd, color: AppColors.brand),
              const SizedBox(width: AppSizes.xs),
              Text(
                '${plan.credits} credits',
                style: const TextStyle(
                  fontSize: AppSizes.fontSm,
                  fontWeight: FontWeight.w600,
                  color: AppColors.brand,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSizes.md),

          // Features list
          for (final feature in plan.features)
            Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(
                children: [
                  const Icon(Icons.check, size: AppSizes.iconSm, color: AppColors.green),
                  const SizedBox(width: AppSizes.sm),
                  Text(
                    feature,
                    style: const TextStyle(
                      fontSize: AppSizes.fontXs,
                      color: AppColors.textSec,
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: AppSizes.md),

          // Select button
          GoldButton(
            label: 'Select ${plan.name}',
            onPressed: onSelect,
            fullWidth: true,
          ),
        ],
      ),
    );
  }
}

class _CreditPackCard extends StatelessWidget {
  final CreditPack pack;
  final VoidCallback? onTap;

  const _CreditPackCard({required this.pack, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppSizes.radiusMd),
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSizes.md,
          vertical: AppSizes.lg,
        ),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(AppSizes.radiusMd),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            const Icon(Icons.bolt, size: AppSizes.icon2xl, color: AppColors.brand),
            const SizedBox(height: AppSizes.xs),
            Text(
              '${pack.credits}',
              style: const TextStyle(
                fontSize: AppSizes.fontLg,
                fontWeight: FontWeight.w700,
                color: AppColors.text,
              ),
            ),
            const SizedBox(height: 2),
            const Text(
              'credits',
              style: TextStyle(
                fontSize: AppSizes.fontXs,
                color: AppColors.textSec,
              ),
            ),
            const SizedBox(height: AppSizes.sm),
            Text(
              pack.price,
              style: const TextStyle(
                fontSize: AppSizes.fontSm,
                fontWeight: FontWeight.w700,
                color: AppColors.brand,
              ),
            ),
          ],
        ),
      ),
      ),
    );
  }
}
