import { Suspense } from "react";
import OwnerDashboardClient from "./OwnerDashboardClient";

export default function OwnerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-zinc-500 dark:text-zinc-400">
          Loading…
        </div>
      }
    >
      <OwnerDashboardClient />
    </Suspense>
  );
}
