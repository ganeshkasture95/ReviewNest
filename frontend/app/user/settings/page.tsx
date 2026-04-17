"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { roleHomePath } from "@/lib/auth-types";
import { AppHeader } from "@/components/AppHeader";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default function UserSettingsPage() {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "USER") {
      router.replace(roleHomePath(user.role));
    }
  }, [ready, user, router]);

  if (!ready || !user || user.role !== "USER") {
    return (
      <div className="flex min-h-screen items-center justify-center text-zinc-500 dark:text-zinc-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader title="Account settings" />
      <div className="mx-auto max-w-lg px-4 py-8">
        <ChangePasswordForm backHref="/user/stores" backLabel="← Back to stores" />
      </div>
    </div>
  );
}
