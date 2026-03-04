import { db } from "@/lib/firebase-admin";
import { buildTemplatesJson, buildStoriesJson } from "@/lib/firestore-store";

// Force dynamic rendering so dashboard always shows fresh data
export const dynamic = "force-dynamic";

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

async function getStats() {
  try {
    const statsDoc = await db.collection("_aggregates").doc("dashboard").get();
    if (statsDoc.exists) {
      return statsDoc.data() as Record<string, number>;
    }
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
  }
  return {
    totalUsers: 0,
    dau: 0,
    mau: 0,
    totalGenerations: 0,
    revenue: 0,
  };
}

async function getContentStats() {
  try {
    const [templates, stories] = await Promise.all([
      buildTemplatesJson(),
      buildStoriesJson(),
    ]);
    return {
      templateCount: templates.templates.length,
      templateActive: templates.templates.filter((t) => t.isActive).length,
      templateVersion: templates.version,
      storyCount: stories.stories.length,
      storyActive: stories.stories.filter((s) => s.isActive).length,
      storyVersion: stories.version,
    };
  } catch {
    return {
      templateCount: 0, templateActive: 0, templateVersion: "?",
      storyCount: 0, storyActive: 0, storyVersion: "?",
    };
  }
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(num);
}

export default async function DashboardPage() {
  const [stats, content] = await Promise.all([getStats(), getContentStats()]);

  const cards: StatCard[] = [
    {
      label: "Templates",
      value: `${content.templateActive} / ${content.templateCount}`,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      label: "Stories",
      value: `${content.storyActive} / ${content.storyCount}`,
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      label: "Total Users",
      value: formatNumber(stats.totalUsers ?? 0),
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      label: "Total Generations",
      value: formatNumber(stats.totalGenerations ?? 0),
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: "Daily Active Users",
      value: formatNumber(stats.dau ?? 0),
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: "Revenue",
      value: formatCurrency(stats.revenue ?? 0),
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Overview of FlexMe platform
          {content.templateVersion !== "?" && (
            <span className="ml-2">
              · Templates v{content.templateVersion} · Stories v{content.storyVersion}
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-400">{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {card.value}
                </p>
              </div>
              <div className="rounded-lg bg-brand/10 p-3 text-brand">
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a href="/templates/new" className="card group cursor-pointer transition-colors hover:border-brand/50">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-neutral-300 group-hover:text-white">
                New Template
              </span>
            </div>
          </a>
          <a href="/stories/new" className="card group cursor-pointer transition-colors hover:border-brand/50">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-neutral-300 group-hover:text-white">
                New Story
              </span>
            </div>
          </a>
          <a href="/templates" className="card group cursor-pointer transition-colors hover:border-brand/50">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2 text-green-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <span className="text-sm font-medium text-neutral-300 group-hover:text-white">
                Manage Templates
              </span>
            </div>
          </a>
          <a href="/stories" className="card group cursor-pointer transition-colors hover:border-brand/50">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-sm font-medium text-neutral-300 group-hover:text-white">
                Manage Stories
              </span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
