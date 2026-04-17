"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { roleHomePath } from "@/lib/auth-types";
import { api } from "@/lib/api";
import { apiErrorMessage } from "@/lib/api-error";
import { AppHeader } from "@/components/AppHeader";
import type { UserRole } from "@/lib/auth-types";

type Dashboard = { totalUsers: number; totalStores: number; totalRatings: number };

type AdminUser = {
  id: number;
  name: string;
  email: string;
  address: string | null;
  role: UserRole;
};

type AdminStore = {
  id: number;
  name: string;
  email: string | null;
  address: string;
  averageRating: number | null;
  owner: { id: number; name: string; email: string } | null;
};

export default function AdminDashboardPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [d, u, s] = await Promise.all([
        api.get<Dashboard>("/admin/dashboard"),
        api.get<{ users: AdminUser[] }>("/admin/users"),
        api.get<{ stores: AdminStore[] }>("/admin/stores"),
      ]);
      setDash(d.data);
      setUsers(u.data.users);
      setStores(s.data.stores);
    } catch (e) {
      setError(apiErrorMessage(e, "Failed to load admin data"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "ADMIN") {
      router.replace(roleHomePath(user.role));
      return;
    }
    load();
  }, [ready, user, router, load]);

  if (!ready || !user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500 dark:text-zinc-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader title="Admin" />
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h2>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            Refresh
          </button>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}

        {loading && !dash ? (
          <p className="text-zinc-500">Loading…</p>
        ) : (
          dash && (
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Users", value: dash.totalUsers },
                { label: "Stores", value: dash.totalStores },
                { label: "Ratings", value: dash.totalRatings },
              ].map((c) => (
                <div
                  key={c.label}
                  className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{c.label}</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{c.value}</p>
                </div>
              ))}
            </div>
          )
        )}

        <section>
          <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">Users</h3>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Address</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-3 py-2">{u.name}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{u.email}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{u.address ?? "—"}</td>
                    <td className="px-3 py-2">{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">Stores</h3>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Address</th>
                  <th className="px-3 py-2 font-medium">Avg rating</th>
                  <th className="px-3 py-2 font-medium">Owner</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((s) => (
                  <tr key={s.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-3 py-2 font-medium">{s.name}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{s.email ?? "—"}</td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{s.address}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {s.averageRating != null ? s.averageRating.toFixed(2) : "—"}
                    </td>
                    <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                      {s.owner ? s.owner.name : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          To create users or stores, use the REST API (e.g. Postman):{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">POST /api/admin/users</code>,{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-800">POST /api/admin/stores</code>, or add forms later.
        </p>
      </div>
    </div>
  );
}
