"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { clientAuth, googleProvider } from "@/lib/firebase-client";

export default function LoginPage() {
  const [mode, setMode] = useState<"google" | "key">("google");
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(clientAuth, googleProvider);
      const idToken = await result.user.getIdToken();

      // Verify the token works with our API (server checks email whitelist)
      const res = await fetch("/api/templates?limit=1", {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) {
        // Sign out if not authorized
        await clientAuth.signOut();
        throw new Error("Access denied. Your account is not authorized for CMS.");
      }

      localStorage.setItem("adminToken", idToken);
      localStorage.setItem("adminEmail", result.user.email || "");
      localStorage.setItem("adminPhoto", result.user.photoURL || "");
      localStorage.setItem("adminName", result.user.displayName || "");

      // Set up token refresh
      setupTokenRefresh();

      window.location.href = "/";
    } catch (err) {
      if (err instanceof Error && err.message.includes("popup-closed")) {
        setError("Sign-in popup was closed");
      } else {
        setError(err instanceof Error ? err.message : "Google sign-in failed");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleKeyLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/templates?limit=1", {
        headers: { Authorization: `Bearer ${secretKey}` },
      });

      if (!res.ok) throw new Error("Invalid key");

      localStorage.setItem("adminToken", secretKey);
      localStorage.setItem("adminEmail", "admin");
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid key");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-md">
        <div className="card">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mb-2 flex items-center justify-center gap-1">
              <span className="text-3xl font-bold text-white">Flex</span>
              <span className="text-3xl font-bold text-brand">Me</span>
            </div>
            <p className="text-sm text-neutral-400">
              Admin Content Management System
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="mb-6 flex rounded-lg bg-bg-elevated p-1">
            <button
              onClick={() => setMode("google")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === "google"
                  ? "bg-bg-card text-white shadow"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Google
            </button>
            <button
              onClick={() => setMode("key")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === "key"
                  ? "bg-bg-card text-white shadow"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Admin Key
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Google Login */}
          {mode === "google" && (
            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-700 bg-bg-elevated px-4 py-3 text-sm font-medium text-white transition-colors hover:border-neutral-600 hover:bg-bg-hover disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {loading ? "Signing in..." : "Sign in with Google"}
              </button>
              <p className="text-center text-xs text-neutral-500">
                Only authorized admin accounts can access the CMS.
              </p>
            </div>
          )}

          {/* Key Login */}
          {mode === "key" && (
            <form onSubmit={handleKeyLogin} className="space-y-4">
              <div>
                <label htmlFor="secretKey" className="label">
                  CMS Secret Key
                </label>
                <input
                  id="secretKey"
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="input"
                  placeholder="Enter admin secret key"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? "Verifying..." : "Sign In"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// Refresh Firebase ID token periodically (tokens expire after 1 hour)
function setupTokenRefresh() {
  setInterval(async () => {
    try {
      const user = clientAuth.currentUser;
      if (user) {
        const newToken = await user.getIdToken(true);
        localStorage.setItem("adminToken", newToken);
      }
    } catch {
      // Token refresh failed — user will need to re-login
    }
  }, 50 * 60 * 1000); // Refresh every 50 minutes
}
