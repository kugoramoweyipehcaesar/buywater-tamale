"use client";

import { Suspense } from "react";
import DashboardClient from "@/components/DashboardClient";

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <DashboardClient />
    </Suspense>
  );
}
