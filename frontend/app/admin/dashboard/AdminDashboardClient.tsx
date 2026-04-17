"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { roleHomePath, type UserRole } from "@/lib/auth-types";
import { api } from "@/lib/api";
import { apiErrorMessage } from "@/lib/api-error";
import { AppHeader } from "@/components/AppHeader";

type Dashboard = { totalUsers: number; totalStores: number; totalRatings: number };

type AdminUser = {
  id: number;
  name: string;
  email: string;
  address: string | null;
  role: UserRole;
  storeRatingAverage?: number | null;
};

type AdminStore = {
  id: number;
  name: string;
  email: string | null;
  address: string;
  averageRating: number | null;
  owner: { id: number; name: string; email: string } | null;
};

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "USER", label: "Normal user" },
  { value: "ADMIN", label: "Administrator" },
  { value: "STORE_OWNER", label: "Store owner" },
];

export default function AdminDashboardClient() {
  const { user, ready } = useAuth();
  const router = useRouter();

  const [dash, setDash] = useState<Dashboard | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stores, setStores] = useState<AdminStore[]>([]);
  const [storeOwners, setStoreOwners] = useState<AdminUser[]>([]);

  const [userFilters, setUserFilters] = useState({
    name: "",
    email: "",
    address: "",
    role: "" as "" | UserRole,
  });
  const [debouncedUserFilters, setDebouncedUserFilters] = useState(userFilters);

  const [storeFilters, setStoreFilters] = useState({ name: "", email: "", address: "" });
  const [debouncedStoreFilters, setDebouncedStoreFilters] = useState(storeFilters);

  const [createUser, setCreateUser] = useState({
    name: "",
    email: "",
    password: "",
    address: "",
    role: "USER" as UserRole,
  });
  const [createStore, setCreateStore] = useState({
    name: "",
    email: "",
    address: "",
    ownerId: "" as number | "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingUser, setSavingUser] = useState(false);
  const [savingStore, setSavingStore] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserFilters(userFilters), 400);
    return () => clearTimeout(t);
  }, [userFilters]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedStoreFilters(storeFilters), 400);
    return () => clearTimeout(t);
  }, [storeFilters]);

  const fetchAll = useCallback(async () => {
    const userParams: Record<string, string> = {};
    if (debouncedUserFilters.name.trim()) userParams.name = debouncedUserFilters.name.trim();
    if (debouncedUserFilters.email.trim()) userParams.email = debouncedUserFilters.email.trim();
    if (debouncedUserFilters.address.trim()) userParams.address = debouncedUserFilters.address.trim();
    if (debouncedUserFilters.role) userParams.role = debouncedUserFilters.role;

    const storeParams: Record<string, string> = {};
    if (debouncedStoreFilters.name.trim()) storeParams.name = debouncedStoreFilters.name.trim();
    if (debouncedStoreFilters.email.trim()) storeParams.email = debouncedStoreFilters.email.trim();
    if (debouncedStoreFilters.address.trim()) storeParams.address = debouncedStoreFilters.address.trim();

    const [d, u, s, o] = await Promise.all([
      api.get<Dashboard>("/admin/dashboard"),
      api.get<{ users: AdminUser[] }>("/admin/users", { params: userParams }),
      api.get<{ stores: AdminStore[] }>("/admin/stores", { params: storeParams }),
      api.get<{ users: AdminUser[] }>("/admin/users", { params: { role: "STORE_OWNER" } }),
    ]);

    setDash(d.data);
    setUsers(u.data.users);
    setStores(s.data.stores);
    setStoreOwners(o.data.users);
  }, [debouncedUserFilters, debouncedStoreFilters]);

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

    let cancelled = false;
    setError(null);
    setLoading(true);
    fetchAll()
      .catch((e) => {
        if (!cancelled) setError(apiErrorMessage(e, "Failed to load admin data"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, user, router, fetchAll]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setSavingUser(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post("/admin/users", {
        name: createUser.name,
        email: createUser.email.trim(),
        password: createUser.password,
        address: createUser.address.trim() || undefined,
        role: createUser.role,
      });
      setSuccess("User created successfully.");
      setCreateUser({ name: "", email: "", password: "", address: "", role: "USER" });
      await fetchAll();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create user"));
    } finally {
      setSavingUser(false);
    }
  }

  async function handleCreateStore(e: React.FormEvent) {
    e.preventDefault();
    setSavingStore(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post("/admin/stores", {
        name: createStore.name.trim(),
        email: createStore.email.trim() || undefined,
        address: createStore.address.trim(),
        ownerId: createStore.ownerId === "" ? null : createStore.ownerId,
      });
      setSuccess("Store created successfully.");
      setCreateStore({ name: "", email: "", address: "", ownerId: "" });
      await fetchAll();
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create store"));
    } finally {
      setSavingStore(false);
    }
  }

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [success]);

  if (!ready || !user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500 dark:text-zinc-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader title="System Administrator" />
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Manage users and stores, view totals and filtered listings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchAll()
                .catch((e) => setError(apiErrorMessage(e, "Failed to refresh")))
                .finally(() => setLoading(false));
            }}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            Refresh all
          </button>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            {success}
          </p>
        )}

        {loading && !dash ? (
          <p className="text-zinc-500">Loading…</p>
        ) : (
          dash && (
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Total users", value: dash.totalUsers },
                { label: "Total stores", value: dash.totalStores },
                { label: "Total ratings submitted", value: dash.totalRatings },
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

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Add user</h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Name 20–60 characters. Password 8–16 chars with one uppercase and one special character.
          </p>
          <form onSubmit={handleCreateUser} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Name</span>
              <input
                required
                minLength={20}
                maxLength={60}
                value={createUser.name}
                onChange={(e) => setCreateUser((p) => ({ ...p, name: e.target.value }))}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Email</span>
              <input
                type="email"
                required
                value={createUser.email}
                onChange={(e) => setCreateUser((p) => ({ ...p, email: e.target.value }))}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Password</span>
              <input
                type="password"
                required
                minLength={8}
                maxLength={16}
                value={createUser.password}
                onChange={(e) => setCreateUser((p) => ({ ...p, password: e.target.value }))}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Address (optional)</span>
              <input
                maxLength={400}
                value={createUser.address}
                onChange={(e) => setCreateUser((p) => ({ ...p, address: e.target.value }))}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Role</span>
              <select
                value={createUser.role}
                onChange={(e) => setCreateUser((p) => ({ ...p, role: e.target.value as UserRole }))}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={savingUser}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {savingUser ? "Creating…" : "Create user"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Add store</h3>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Assign a store owner (optional). Create store owners in Add user first.
          </p>
          <form onSubmit={handleCreateStore} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Name</span>
              <input
                required
                value={createStore.name}
                onChange={(e) => setCreateStore((p) => ({ ...p, name: e.target.value }))}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Email (optional)</span>
              <input
                type="email"
                value={createStore.email}
                onChange={(e) => setCreateStore((p) => ({ ...p, email: e.target.value }))}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Owner</span>
              <select
                value={createStore.ownerId === "" ? "" : String(createStore.ownerId)}
                onChange={(e) =>
                  setCreateStore((p) => ({
                    ...p,
                    ownerId: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
              >
                <option value="">No owner</option>
                {storeOwners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} — {o.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Address</span>
              <input
                required
                maxLength={400}
                value={createStore.address}
                onChange={(e) => setCreateStore((p) => ({ ...p, address: e.target.value }))}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={savingStore}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {savingStore ? "Creating…" : "Create store"}
              </button>
            </div>
          </form>
        </section>

        <section>
          <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">Users</h3>
          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">Filters apply automatically after you pause typing.</p>
          <div className="mb-4 grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs">
              <span>Name</span>
              <input
                value={userFilters.name}
                onChange={(e) => setUserFilters((p) => ({ ...p, name: e.target.value }))}
                className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span>Email</span>
              <input
                value={userFilters.email}
                onChange={(e) => setUserFilters((p) => ({ ...p, email: e.target.value }))}
                className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span>Address</span>
              <input
                value={userFilters.address}
                onChange={(e) => setUserFilters((p) => ({ ...p, address: e.target.value }))}
                className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span>Role</span>
              <select
                value={userFilters.role}
                onChange={(e) =>
                  setUserFilters((p) => ({ ...p, role: e.target.value as "" | UserRole }))
                }
                className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              >
                <option value="">All</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Address</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Rating (store owners)</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">
                      No users match the filters.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="px-3 py-2">{u.name}</td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{u.email}</td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{u.address ?? "—"}</td>
                      <td className="px-3 py-2">{u.role}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {u.role === "STORE_OWNER" &&
                        u.storeRatingAverage !== undefined &&
                        u.storeRatingAverage !== null
                          ? u.storeRatingAverage.toFixed(2)
                          : u.role === "STORE_OWNER"
                            ? "—"
                            : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">Stores</h3>
          <div className="mb-4 grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-xs">
              <span>Name</span>
              <input
                value={storeFilters.name}
                onChange={(e) => setStoreFilters((p) => ({ ...p, name: e.target.value }))}
                className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span>Email</span>
              <input
                value={storeFilters.email}
                onChange={(e) => setStoreFilters((p) => ({ ...p, email: e.target.value }))}
                className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span>Address</span>
              <input
                value={storeFilters.address}
                onChange={(e) => setStoreFilters((p) => ({ ...p, address: e.target.value }))}
                className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              />
            </label>
          </div>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Address</th>
                  <th className="px-3 py-2 font-medium">Rating</th>
                  <th className="px-3 py-2 font-medium">Owner</th>
                </tr>
              </thead>
              <tbody>
                {stores.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">
                      No stores match the filters.
                    </td>
                  </tr>
                ) : (
                  stores.map((s) => (
                    <tr key={s.id} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="px-3 py-2 font-medium">{s.name}</td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{s.email ?? "—"}</td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{s.address}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {s.averageRating != null ? s.averageRating.toFixed(2) : "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{s.owner ? s.owner.name : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
