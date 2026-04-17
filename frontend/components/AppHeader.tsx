"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import type { UserRole } from "@/lib/auth-types";

const roleLabel: Record<UserRole, string> = {
  ADMIN: "Admin",
  USER: "User",
  STORE_OWNER: "Store owner",
};

export function AppHeader({ title }: { title: string }) {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
          {user && (
            <p className="text-sm text-zinc-500">
              {user.name} · {roleLabel[user.role]}
            </p>
          )}
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/" className="text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400">
            Home
          </Link>
          {user?.role === "USER" && (
            <Link
              href="/user/stores"
              className="text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400"
            >
              Stores
            </Link>
          )}
          {user?.role === "ADMIN" && (
            <Link
              href="/admin/dashboard"
              className="text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400"
            >
              Admin
            </Link>
          )}
          {user?.role === "STORE_OWNER" && (
            <Link
              href="/owner/dashboard"
              className="text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400"
            >
              My store
            </Link>
          )}
          {user && (
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Log out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
