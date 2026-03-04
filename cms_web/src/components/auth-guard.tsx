"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { clientAuth } from "@/lib/firebase-client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === "/login") {
      setChecked(true);
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    // Listen for Firebase auth state to refresh tokens automatically
    const unsubscribe = onAuthStateChanged(clientAuth, async (user) => {
      if (user) {
        try {
          const freshToken = await user.getIdToken();
          localStorage.setItem("adminToken", freshToken);
        } catch {
          // ignore refresh errors
        }
      }
    });

    setChecked(true);
    return () => unsubscribe();
  }, [pathname]);

  if (!checked && pathname !== "/login") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
