"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface UserRow {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  authProvider: string;
  creditsBalance: number;
  subscriptionPlan: string;
  totalGenerations: number;
  totalStories: number;
  createdAt: string | null;
  lastActiveAt: string | null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const [sort, setSort] = useState("created");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken") || "";
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        sort,
        ...(search && { search }),
        ...(plan && { plan }),
      });

      const res = await fetch(`/api/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, plan, sort]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {total > 0 ? `${total} users` : "Manage app users"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by email, name, or UID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-10"
          />
        </div>
        <select
          value={plan}
          onChange={(e) => { setPlan(e.target.value); setPage(1); }}
          className="select w-auto"
        >
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
        </select>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="select w-auto"
        >
          <option value="created">Newest</option>
          <option value="active">Last Active</option>
          <option value="credits">Most Credits</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-800 bg-bg-elevated">
                <th className="table-header">User</th>
                <th className="table-header">Plan</th>
                <th className="table-header">Credits</th>
                <th className="table-header">Generations</th>
                <th className="table-header">Stories</th>
                <th className="table-header">Last Active</th>
                <th className="table-header">Joined</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-neutral-500">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-neutral-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.uid} className="transition-colors hover:bg-bg-hover">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-elevated text-neutral-500 text-xs font-bold">
                            {(u.displayName || u.email || "?")[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-white text-sm">
                            {u.displayName || "Anonymous"}
                          </div>
                          <div className="text-xs text-neutral-500">{u.email || u.uid.slice(0, 12)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.subscriptionPlan === "pro"
                          ? "bg-purple-500/10 text-purple-400"
                          : u.subscriptionPlan === "basic"
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-neutral-500/10 text-neutral-400"
                      }`}>
                        {u.subscriptionPlan}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`font-medium ${u.creditsBalance > 0 ? "text-brand" : "text-neutral-500"}`}>
                        {u.creditsBalance}
                      </span>
                    </td>
                    <td className="table-cell text-neutral-400">{u.totalGenerations}</td>
                    <td className="table-cell text-neutral-400">{u.totalStories}</td>
                    <td className="table-cell text-neutral-500 text-xs">{timeAgo(u.lastActiveAt)}</td>
                    <td className="table-cell text-neutral-500 text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="table-cell">
                      <Link
                        href={`/users/${u.uid}`}
                        className="rounded p-1 text-neutral-400 transition-colors hover:bg-bg-elevated hover:text-white"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-800 px-4 py-3">
            <p className="text-sm text-neutral-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-secondary text-xs"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn-secondary text-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
