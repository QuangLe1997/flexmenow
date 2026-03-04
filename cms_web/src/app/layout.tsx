import type { Metadata } from "next";
import "./globals.css";
import { SidebarNav } from "@/components/sidebar-nav";
import { AuthGuard } from "@/components/auth-guard";

export const metadata: Metadata = {
  title: "FlexMe CMS",
  description: "Content Management System for FlexMe",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen">
        <AuthGuard>
          {/* Sidebar */}
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-neutral-800 bg-bg-card">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 border-b border-neutral-800 px-6">
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-white">Flex</span>
                <span className="text-xl font-bold text-brand">Me</span>
              </div>
              <span className="ml-2 rounded bg-bg-elevated px-2 py-0.5 text-xs text-neutral-400">
                CMS
              </span>
            </div>

            {/* Navigation */}
            <SidebarNav />

            {/* Footer */}
            <div className="border-t border-neutral-800 p-4">
              <p className="text-xs text-neutral-500">FlexMe CMS v1.0</p>
            </div>
          </aside>

          {/* Main Content */}
          <main className="ml-64 flex-1 bg-bg">
            <div className="p-8">{children}</div>
          </main>
        </AuthGuard>
      </body>
    </html>
  );
}
