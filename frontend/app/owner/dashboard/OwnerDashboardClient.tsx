"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { roleHomePath } from "@/lib/auth-types";
import { api } from "@/lib/api";
import { apiErrorMessage } from "@/lib/api-error";
import { AppHeader } from "@/components/AppHeader";

type OwnerStore = {
  id: number;
  name: string;
  email: string | null;
  address: string;
  averageRating: number | null;
  totalRatings: number;
};

type RatingRow = {
  id: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  user: { id: number; name: string; email: string };
};

type RatingsResponse = {
  store: {
    id: number;
    name: string;
    email: string | null;
    address: string;
    averageRating: number | null;
  };
  ratings: RatingRow[];
};

export default function OwnerDashboardClient() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dashboardStores, setDashboardStores] = useState<OwnerStore[]>([]);
  const [ratingsData, setRatingsData] = useState<RatingsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const storeIdFromUrl = searchParams.get("storeId");

  const loadDashboard = useCallback(async () => {
    const { data } = await api.get<{ stores: OwnerStore[] }>("/owner/dashboard");
    setDashboardStores(data.stores);
    return data.stores;
  }, []);

  const loadRatings = useCallback(
    async (stores: OwnerStore[]) => {
      if (stores.length === 0) {
        setRatingsData(null);
        return;
      }
      const params: Record<string, string> = {};
      if (stores.length > 1) {
        const parsed = storeIdFromUrl ? parseInt(storeIdFromUrl, 10) : NaN;
        const picked =
          !Number.isNaN(parsed) && stores.some((s) => s.id === parsed) ? parsed : stores[0].id;
        params.storeId = String(picked);
      }
      const { data } = await api.get<RatingsResponse>("/owner/ratings", { params });
      setRatingsData(data);
    },
    [storeIdFromUrl],
  );

  const loadAll = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const stores = await loadDashboard();
      await loadRatings(stores);
    } catch (e) {
      setError(apiErrorMessage(e, "Failed to load owner data"));
    } finally {
      setLoading(false);
    }
  }, [loadDashboard, loadRatings]);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "STORE_OWNER") {
      router.replace(roleHomePath(user.role));
      return;
    }
    loadAll();
  }, [ready, user, router, loadAll]);

  function selectStore(id: number) {
    router.push(`/owner/dashboard?storeId=${id}`);
  }

  if (!ready || !user || user.role !== "STORE_OWNER") {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500 dark:text-zinc-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader title="Store owner dashboard" />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-zinc-500">Loading…</p>
        ) : (
          <>
            <section>
              <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Your stores and average ratings
              </h2>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                Average rating is computed from all stars submitted for each store you own.
              </p>
              {dashboardStores.length === 0 ? (
                <p className="text-zinc-600 dark:text-zinc-400">
                  No stores assigned yet. An admin must create a store with you as owner.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {dashboardStores.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <p className="font-semibold text-zinc-900 dark:text-zinc-50">{s.name}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{s.address}</p>
                      <p className="mt-2 text-sm">
                        <span className="text-zinc-600 dark:text-zinc-400">Average rating:</span>{" "}
                        <span className="font-medium tabular-nums">
                          {s.averageRating != null ? s.averageRating.toFixed(2) : "—"}
                        </span>{" "}
                        <span className="text-zinc-500">({s.totalRatings} submitted)</span>
                      </p>
                      {dashboardStores.length > 1 && (
                        <button
                          type="button"
                          onClick={() => selectStore(s.id)}
                          className="mt-3 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          View ratings for this store
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {ratingsData && ratingsData.store && (
              <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Users who rated · {ratingsData.store.name}
                  </h2>
                  {dashboardStores.length > 1 && (
                    <label className="flex items-center gap-2 text-sm">
                      <span className="text-zinc-600 dark:text-zinc-400">Store</span>
                      <select
                        value={String(ratingsData.store.id)}
                        onChange={(e) => selectStore(Number(e.target.value))}
                        className="rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-600 dark:bg-zinc-950"
                      >
                        {dashboardStores.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">Average rating for this store:</span>{" "}
                  <strong className="tabular-nums text-zinc-900 dark:text-zinc-100">
                    {ratingsData.store.averageRating != null
                      ? ratingsData.store.averageRating.toFixed(2)
                      : "—"}
                  </strong>
                </p>
                <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                        <th className="px-3 py-2 font-medium">User name</th>
                        <th className="px-3 py-2 font-medium">Email</th>
                        <th className="px-3 py-2 font-medium">Submitted rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ratingsData.ratings.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-3 py-6 text-center text-zinc-500">
                            No ratings yet.
                          </td>
                        </tr>
                      ) : (
                        ratingsData.ratings.map((r) => (
                          <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800">
                            <td className="px-3 py-2">{r.user.name}</td>
                            <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{r.user.email}</td>
                            <td className="px-3 py-2 tabular-nums">{r.rating} ★</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
