"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { ArrowLeft, Loader2, Activity, CheckCircle2 } from "lucide-react";

export default function UserActivityPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user || me.user.role !== "ADMIN") {
        router.push("/admin-login");
        return;
      }
      setUser(me.user);
      const res = await fetch("/api/orders").then((r) => r.json());
      setOrders(res.orders || []);
    } catch {
      router.push("/admin-login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500 dark:text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF6FC] pb-16 transition-colors duration-300 dark:bg-zinc-950">
      <SiteHeader user={user} />
      <main className="mx-auto max-w-lg px-4 py-6">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[#0077C8] dark:text-sky-400"
        >
          <ArrowLeft className="h-4 w-4" /> Admin Office
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0077C8] text-white">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0B2545] dark:text-zinc-50">
              User Activity Log
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Historical feed of sign-ups, updates, and orders
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {orders.length === 0 && (
            <div className="rounded-2xl border bg-white p-8 text-center text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              No activity yet
            </div>
          )}
          {orders.map((o) => (
            <div
              key={o.id}
              className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-green-600 dark:text-green-400">
                  Order Placed
                </p>
                <p className="text-sm font-semibold text-[#0B2545] dark:text-zinc-100">
                  Order {o.orderNumber} — {o.gallons} gallons
                  {o.hostel ? ` to ${o.hostel}` : ""}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {o.email || o.customerName}
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">
                  {new Date(o.createdAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
