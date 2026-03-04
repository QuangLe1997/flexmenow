"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface UserDetail {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  authProvider: string;
  creditsBalance: number;
  subscriptionPlan: string;
  subscriptionExpiresAt: string | null;
  revenuecatAppUserId: string | null;
  totalGenerations: number;
  totalStories: number;
  locale: string;
  timezone: string;
  fcmToken: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastActiveAt: string | null;
}

interface CreditLog {
  id: string;
  amount: number;
  type: string;
  description: string;
  balanceAfter: number;
  referenceId: string | null;
  createdAt: string | null;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const uid = params.uid as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [creditLogs, setCreditLogs] = useState<CreditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editLocale, setEditLocale] = useState("");

  // Credit dialog
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [creditSaving, setCreditSaving] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch(`/api/users/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 404) {
          alert("User not found");
          router.push("/users");
          return;
        }
        throw new Error("Failed to fetch user");
      }
      const data = await res.json();
      setUser(data.user);
      setCreditLogs(data.creditLogs || []);
      setEditName(data.user.displayName);
      setEditEmail(data.user.email);
      setEditPlan(data.user.subscriptionPlan);
      setEditLocale(data.user.locale);
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  }, [uid, router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  async function handleSave() {
    setSaving(true);
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch(`/api/users/${uid}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: editName,
          email: editEmail,
          subscriptionPlan: editPlan,
          locale: editLocale,
        }),
      });
      if (res.ok) {
        await fetchUser();
        alert("User updated");
      } else {
        const data = await res.json();
        alert(data.error || "Update failed");
      }
    } catch {
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreditSubmit() {
    const amount = Number(creditAmount);
    if (!amount || isNaN(amount)) {
      alert("Enter a valid amount");
      return;
    }
    if (!creditReason.trim()) {
      alert("Enter a reason");
      return;
    }

    setCreditSaving(true);
    try {
      const token = localStorage.getItem("adminToken") || "";
      const res = await fetch(`/api/users/${uid}/credits`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount, reason: creditReason.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Credits updated. New balance: ${data.newBalance}`);
        setShowCreditDialog(false);
        setCreditAmount("");
        setCreditReason("");
        await fetchUser();
      } else {
        alert(data.error || "Failed to update credits");
      }
    } catch {
      alert("Failed to update credits");
    } finally {
      setCreditSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-neutral-500">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20 text-neutral-500">
        User not found
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/users" className="rounded p-1 text-neutral-400 hover:bg-bg-elevated hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-elevated text-neutral-400 font-bold">
                {(user.displayName || user.email || "?")[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{user.displayName || "Anonymous"}</h1>
              <p className="text-sm text-neutral-400">{user.uid}</p>
            </div>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: User info form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">User Info</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Display Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Subscription Plan</label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value)}
                  className="select"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              <div>
                <label className="label">Locale</label>
                <select
                  value={editLocale}
                  onChange={(e) => setEditLocale(e.target.value)}
                  className="select"
                >
                  <option value="en">English</option>
                  <option value="vi">Vietnamese</option>
                  <option value="es">Spanish</option>
                  <option value="pt">Portuguese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                </select>
              </div>
            </div>

            {/* Read-only fields */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <span className="text-xs text-neutral-500">Auth Provider</span>
                <p className="text-sm text-neutral-300 capitalize">{user.authProvider}</p>
              </div>
              <div>
                <span className="text-xs text-neutral-500">Created</span>
                <p className="text-sm text-neutral-300">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                </p>
              </div>
              <div>
                <span className="text-xs text-neutral-500">Last Active</span>
                <p className="text-sm text-neutral-300">
                  {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : "—"}
                </p>
              </div>
              <div>
                <span className="text-xs text-neutral-500">Sub Expires</span>
                <p className="text-sm text-neutral-300">
                  {user.subscriptionExpiresAt
                    ? new Date(user.subscriptionExpiresAt).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Credit Logs */}
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Credit History</h2>
            {creditLogs.length === 0 ? (
              <p className="text-sm text-neutral-500">No credit logs</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="table-header">Amount</th>
                      <th className="table-header">Type</th>
                      <th className="table-header">Balance After</th>
                      <th className="table-header">Description</th>
                      <th className="table-header">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {creditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-bg-hover">
                        <td className="table-cell">
                          <span className={`font-medium ${log.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                            {log.amount > 0 ? "+" : ""}{log.amount}
                          </span>
                        </td>
                        <td className="table-cell">
                          <span className="rounded bg-bg-elevated px-1.5 py-0.5 text-xs text-neutral-400">
                            {log.type}
                          </span>
                        </td>
                        <td className="table-cell text-neutral-400">{log.balanceAfter}</td>
                        <td className="table-cell text-sm text-neutral-400 max-w-xs truncate">
                          {log.description}
                        </td>
                        <td className="table-cell text-xs text-neutral-500">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Stats + Actions */}
        <div className="space-y-6">
          {/* Credits Card */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Credits</h2>
              <button
                onClick={() => setShowCreditDialog(true)}
                className="btn-primary text-xs"
              >
                +/- Credits
              </button>
            </div>
            <div className="text-4xl font-bold text-brand">{user.creditsBalance}</div>
            <p className="mt-1 text-sm text-neutral-500">Current balance</p>
          </div>

          {/* Stats Card */}
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Usage Stats</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">Generations</span>
                <span className="font-medium text-white">{user.totalGenerations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">Stories</span>
                <span className="font-medium text-white">{user.totalStories}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-400">Plan</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.subscriptionPlan === "pro"
                    ? "bg-purple-500/10 text-purple-400"
                    : user.subscriptionPlan === "basic"
                    ? "bg-blue-500/10 text-blue-400"
                    : "bg-neutral-500/10 text-neutral-400"
                }`}>
                  {user.subscriptionPlan}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Dialog */}
      {showCreditDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Adjust Credits</h3>
            <p className="mb-4 text-sm text-neutral-400">
              Current balance: <span className="font-medium text-brand">{user.creditsBalance}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="label">Amount</label>
                <input
                  type="number"
                  placeholder="e.g. 50 to add, -10 to deduct"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="input"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Positive = add, Negative = deduct
                </p>
              </div>
              <div>
                <label className="label">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Compensation for bug, Manual top-up"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  className="input"
                />
              </div>

              {creditAmount && !isNaN(Number(creditAmount)) && (
                <div className="rounded-lg border border-neutral-700 bg-bg-elevated p-3 text-sm">
                  <span className="text-neutral-400">New balance: </span>
                  <span className="font-medium text-white">
                    {user.creditsBalance + Number(creditAmount)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreditDialog(false);
                  setCreditAmount("");
                  setCreditReason("");
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreditSubmit}
                disabled={creditSaving}
                className="btn-primary"
              >
                {creditSaving ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
