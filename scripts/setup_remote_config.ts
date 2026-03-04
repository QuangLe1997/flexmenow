/**
 * setup_remote_config.ts
 *
 * Initializes Firebase Remote Config with all parameters defined in
 * TECHNICAL_REQUIREMENTS.md Section 3.
 *
 * Usage:
 *   npx ts-node setup_remote_config.ts [--dry-run]
 *
 * Requires: GOOGLE_APPLICATION_CREDENTIALS or Firebase default credentials.
 */

import * as admin from "firebase-admin";

// ---------------------------------------------------------------------------
// Remote Config Parameters
// ---------------------------------------------------------------------------

interface RCParam {
  key: string;
  defaultValue: string;
  description: string;
}

const CONTENT_URLS: RCParam[] = [
  {
    key: "flexshot_json_url",
    defaultValue: "https://storage.googleapis.com/flexme-now.firebasestorage.app/config/flexshot_templates.json",
    description: "URL to FlexShot templates JSON on GCS",
  },
  {
    key: "flextale_json_url",
    defaultValue: "https://storage.googleapis.com/flexme-now.firebasestorage.app/config/flextale_stories.json",
    description: "URL to FlexTale stories JSON on GCS",
  },
  {
    key: "onboarding_json_url",
    defaultValue: "https://storage.googleapis.com/flexme-now.firebasestorage.app/config/onboarding_US.json",
    description: "URL to region-specific onboarding JSON (conditioned by region)",
  },
];

const FEATURE_FLAGS: RCParam[] = [
  { key: "wow_everyday_enabled", defaultValue: "true", description: "Enable WOW Everyday feature" },
  { key: "search_enabled", defaultValue: "true", description: "Enable search in template/story tabs" },
  { key: "search_supported_langs", defaultValue: "en,vi,es,pt", description: "Device languages that support search" },
  { key: "ai_chat_enabled", defaultValue: "true", description: "Enable AI chat assistant" },
  { key: "flexlocket_enabled", defaultValue: "true", description: "Enable FlexLocket (Glow) tab" },
  { key: "schedule_post_enabled", defaultValue: "false", description: "Enable schedule post (future)" },
  { key: "referral_enabled", defaultValue: "false", description: "Enable referral program (future)" },
  { key: "maintenance_mode", defaultValue: "false", description: "App-wide maintenance mode" },
];

const PRICING: RCParam[] = [
  { key: "default_template_credits", defaultValue: "1", description: "FlexShot default credit cost" },
  { key: "premium_template_credits", defaultValue: "2", description: "FlexShot premium credit cost" },
  { key: "new_user_free_credits", defaultValue: "12", description: "Credits for new users" },
  { key: "daily_free_glow_limit", defaultValue: "10", description: "FlexLocket free uses per day" },
  { key: "glow_credit_cost", defaultValue: "0.5", description: "FlexLocket cost after free limit" },
];

const PAYWALL_PLANS_JSON = JSON.stringify({
  plans: [
    {
      id: "starter",
      name: { en: "Starter", vi: "Khởi đầu", es: "Inicial", pt: "Inicial", ja: "スターター", ko: "스타터" },
      price: "$2.99",
      priceId: "price_starter_monthly",
      period: "month",
      credits: "10 Credits",
      color: "#525252",
      badge: null,
      features: {
        en: ["10 credits/month", "FlexShot access", "HD export", "Basic AI"],
        vi: ["10 credits/tháng", "Truy cập FlexShot", "Xuất HD", "AI cơ bản"],
        es: ["10 créditos/mes", "Acceso FlexShot", "Exportar HD", "AI básica"],
        pt: ["10 créditos/mês", "Acesso FlexShot", "Exportar HD", "AI básica"],
        ja: ["10クレジット/月", "FlexShotアクセス", "HD書き出し", "基本AI"],
        ko: ["10 크레딧/월", "FlexShot 접근", "HD 내보내기", "기본 AI"],
      },
    },
    {
      id: "pro",
      name: { en: "Pro", vi: "Pro", es: "Pro", pt: "Pro", ja: "プロ", ko: "프로" },
      price: "$7.99",
      priceId: "price_pro_monthly",
      period: "month",
      credits: "50 Credits",
      color: "#F59E0B",
      badge: "POPULAR",
      features: {
        en: ["50 credits/month", "All features", "4K export", "Priority AI", "Pro badge"],
        vi: ["50 credits/tháng", "Tất cả tính năng", "Xuất 4K", "AI ưu tiên", "Huy hiệu Pro"],
        es: ["50 créditos/mes", "Todas las funciones", "Exportar 4K", "AI prioritaria", "Insignia Pro"],
        pt: ["50 créditos/mês", "Todos os recursos", "Exportar 4K", "AI prioritária", "Badge Pro"],
        ja: ["50クレジット/月", "全機能", "4K書き出し", "優先AI", "Proバッジ"],
        ko: ["50 크레딧/월", "모든 기능", "4K 내보내기", "우선 AI", "Pro 배지"],
      },
    },
    {
      id: "elite",
      name: { en: "Elite", vi: "Elite", es: "Elite", pt: "Elite", ja: "エリート", ko: "엘리트" },
      price: "$19.99",
      priceId: "price_elite_monthly",
      period: "month",
      credits: "Unlimited",
      color: "#FBBF24",
      badge: "BEST VALUE",
      features: {
        en: ["Unlimited credits", "Early access", "Creator tools", "Custom AI style", "Dedicated support"],
        vi: ["Không giới hạn credits", "Truy cập sớm", "Công cụ sáng tạo", "AI style tùy chỉnh", "Hỗ trợ riêng"],
        es: ["Créditos ilimitados", "Acceso anticipado", "Herramientas de creador", "Estilo AI personalizado", "Soporte dedicado"],
        pt: ["Créditos ilimitados", "Acesso antecipado", "Ferramentas de criador", "Estilo AI personalizado", "Suporte dedicado"],
        ja: ["無制限クレジット", "早期アクセス", "クリエイターツール", "カスタムAIスタイル", "専用サポート"],
        ko: ["무제한 크레딧", "조기 접근", "크리에이터 도구", "커스텀 AI 스타일", "전담 지원"],
      },
    },
  ],
});

const WOW_PRICING_JSON = JSON.stringify({
  plans: [
    { id: "3d", days: 3, price: "$2.99", perDay: "$1.00", badge: "TRIAL", iapProductId: "wow_3d" },
    { id: "7d", days: 7, price: "$4.99", perDay: "$0.71", badge: "POPULAR", iapProductId: "wow_7d" },
    { id: "30d", days: 30, price: "$14.99", perDay: "$0.50", badge: null, iapProductId: "wow_30d" },
    { id: "forever", days: -1, price: "$29.99", perDay: "", badge: "VIP", sub: "/mo", iapProductId: "wow_forever" },
  ],
});

const PAYWALL_CONFIG: RCParam[] = [
  { key: "paywall_variant", defaultValue: "A", description: "Paywall A/B test variant (A|B|C)" },
  { key: "paywall_show_trial", defaultValue: "true", description: "Show free trial option in paywall" },
  { key: "paywall_trial_days", defaultValue: "3", description: "Free trial duration in days" },
  { key: "paywall_plans_json", defaultValue: PAYWALL_PLANS_JSON, description: "Paywall plans configuration JSON" },
  { key: "wow_pricing_json", defaultValue: WOW_PRICING_JSON, description: "WOW subscription pricing JSON" },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const allParams = [...CONTENT_URLS, ...FEATURE_FLAGS, ...PRICING, ...PAYWALL_CONFIG];

  console.log(`[setup_remote_config] ${allParams.length} parameters to configure`);
  console.log(`[setup_remote_config] Mode: ${dryRun ? "DRY RUN" : "LIVE"}\n`);

  // Print all params
  for (const param of allParams) {
    const preview = param.defaultValue.length > 80
      ? param.defaultValue.substring(0, 80) + "..."
      : param.defaultValue;
    console.log(`  ${param.key} = ${preview}`);
    console.log(`    ${param.description}`);
  }

  if (dryRun) {
    console.log("\n[setup_remote_config] Dry run complete. No changes made.");
    return;
  }

  // Initialize Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  // Note: Firebase Admin SDK doesn't have a direct Remote Config server API
  // for setting defaults. This would typically be done via the Firebase console
  // or the Firebase Remote Config REST API.
  //
  // The REST API approach:
  const projectId = process.env.GCLOUD_PROJECT || "flexme-now";
  const { google } = await import("googleapis");
  const authClient = await google.auth.getClient({
    scopes: ["https://www.googleapis.com/auth/firebase.remoteconfig"],
  });

  const rcUrl = `https://firebaseremoteconfig.googleapis.com/v1/projects/${projectId}/remoteConfig`;

  // Build the Remote Config template
  const parameters: Record<string, { defaultValue: { value: string }; description: string }> = {};
  for (const param of allParams) {
    parameters[param.key] = {
      defaultValue: { value: param.defaultValue },
      description: param.description,
    };
  }

  const template = {
    parameters,
    conditions: [
      {
        name: "Region_VN",
        expression: "device.country in ['VN']",
        tagColor: "ORANGE",
      },
      {
        name: "Region_JP",
        expression: "device.country in ['JP']",
        tagColor: "BLUE",
      },
      {
        name: "Region_KR",
        expression: "device.country in ['KR']",
        tagColor: "GREEN",
      },
    ],
  };

  // Add conditional values for onboarding URL
  parameters["onboarding_json_url"] = {
    ...parameters["onboarding_json_url"],
    ...({
      conditionalValues: {
        Region_VN: {
          value: "https://storage.googleapis.com/flexme-now.firebasestorage.app/config/onboarding_VN.json",
        },
        Region_JP: {
          value: "https://storage.googleapis.com/flexme-now.firebasestorage.app/config/onboarding_JP.json",
        },
      },
    } as any),
  };

  try {
    // Get current ETag
    const getRes = await authClient.request({ url: rcUrl, method: "GET" });
    const etag = (getRes.headers as any)["etag"] || "*";

    // Update template
    await authClient.request({
      url: rcUrl,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "If-Match": etag,
      },
      body: JSON.stringify(template),
    });

    console.log(`\n[setup_remote_config] Remote Config updated successfully.`);
    console.log(`[setup_remote_config] ${allParams.length} parameters set.`);
    console.log(`[setup_remote_config] ${template.conditions.length} conditions configured.`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\n[setup_remote_config] Failed to update Remote Config: ${message}`);
    console.error("[setup_remote_config] You may need to set up credentials or use Firebase console.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[setup_remote_config] Fatal error:", err);
  process.exit(1);
});
