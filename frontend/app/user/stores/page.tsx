"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { roleHomePath } from "@/lib/auth-types";
import { api } from "@/lib/api";
import { apiErrorMessage } from "@/lib/api-error";
import { AppHeader } from "@/components/AppHeader";

type StoreRow = {
  id: number;
  name: string;
  email: string | null;
  address: string;
  averageRating: number | null;
  yourRating: { ratingId: number; rating: number } | null;
};

export default function UserStoresPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingInputs, setRatingInputs] = useState<Record<number, number>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ stores: StoreRow[] }>("/stores", {
        params: debounced ? { search: debounced } : {},
      });
      setStores(data.stores);
      const next: Record<number, number> = {};
      for (const s of data.stores) {
        next[s.id] = s.yourRating?.rating ?? 3;
      }
      setRatingInputs((prev) => ({ ...next, ...prev }));
    } catch (e) {
      setError(apiErrorMessage(e, "Failed to load stores"));
    } finally {
      setLoading(false);
    }
  }, [debounced]);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "USER") {
      router.replace(roleHomePath(user.role));
      return;
    }
    setLoading(true);
    load();
  }, [ready, user, router, load]);

  async function saveRating(store: StoreRow) {
    const value = ratingInputs[store.id] ?? 3;
    if (value < 1 || value > 5) return;
    setSavingId(store.id);
    setError(null);
    try {
      if (store.yourRating) {
        await api.put(`/ratings/${store.yourRating.ratingId}`, { rating: value });
      } else {
        await api.post("/ratings", { storeId: store.id, rating: value });
      }
      await load();
    } catch (e) {
      setError(apiErrorMessage(e, "Could not save rating"));
    } finally {
      setSavingId(null);
    }
  }

  if (!ready || !user || user.role !== "USER") {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500 dark:text-zinc-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader title="Stores" />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Search by store name or address.</p>
          </div>
          <label className="flex max-w-md flex-1 flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">Search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to filter…"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </label>
        </div>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-zinc-500">Loading stores…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Store</th>
                  <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Address</th>
                  <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Avg</th>
                  <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Yours</th>
                  <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Rate</th>
                </tr>
              </thead>
              <tbody>
                {stores.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                      No stores yet. Ask an admin to create stores.
                    </td>
                  </tr>
                ) : (
                  stores.map((s) => (
                    <tr key={s.id} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{s.name}</td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{s.address}</td>
                      <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200">
                        {s.averageRating != null ? s.averageRating.toFixed(2) : "—"}
                      </td>
                      <td className="px-4 py-3">{s.yourRating ? `${s.yourRating.rating} ★` : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={ratingInputs[s.id] ?? s.yourRating?.rating ?? 3}
                            onChange={(e) =>
                              setRatingInputs((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))
                            }
                            className="rounded border border-zinc-300 bg-white px-2 py-1 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={savingId === s.id}
                            onClick={() => saveRating(s)}
                            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                          >
                            {s.yourRating ? "Update" : "Rate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
