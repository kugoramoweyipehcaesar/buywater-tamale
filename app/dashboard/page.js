"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function LoadClient() {
  const router = useRouter();
  const [Comp, setComp] = useState(null);
  useEffect(() => {
    let cancelled = false;
    import("@/components/DashboardClient")
      .then((m) => {
        if (!cancelled) setComp(() => m.default);
      })
      .catch(() => {
        if (!cancelled) router.replace("/order");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);
  if (!Comp) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }
  return <Comp />;
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-slate-500">
          Loading...
        </div>
      }
    >
      <LoadClient />
    </Suspense>
  );
}
