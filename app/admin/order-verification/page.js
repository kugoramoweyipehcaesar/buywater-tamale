"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import {
  ArrowLeft,
  Loader2,
  ClipboardCheck,
  Check,
  X,
  Droplets,
  MapPin,
  Phone,
} from "lucide-react";

export default function OrderVerificationPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const load = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user || me.user.role !== "ADMIN") {
        router.push("/admin-login");
        return;
      }
      setUser(me.user);
      const res = await fetch("/api/orders?status=PENDING").then((r) => r.json());
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

  async function decide(id, approve) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: approve ? "CONFIRMED" : "CANCELLED",
          cancelReason: approve ? undefined : "Rejected by admin verification",
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      showToast(approve ? "Order confirmed — Live now" : "Order rejected");
      await load();
    } catch (e) {
      showToast(e.message);
    } finally {
      setBusyId(null);
    }
  }

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
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-lg px-4 py-6">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[#0077C8] dark:text-sky-400"
        >
          <ArrowLeft className="h-4 w-4" /> Admin Office
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0077C8] text-white">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0B2545] dark:text-zinc-50">
              Verification Queue
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              {orders.length} pending order{orders.length === 1 ? "" : "s"} awaiting confirmation
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            No pending orders to verify
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-bold text-[#0B2545] dark:text-zinc-50">
                    {o.orderNumber}
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                    Pending
                  </span>
                </div>
                <div className="mb-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600 dark:text-zinc-300">
                  <span className="inline-flex items-center gap-1">
                    <Droplets className="h-3.5 w-3.5" />
                    {o.gallons} gal
                  </span>
                  <span className="font-semibold text-[#0077C8] dark:text-sky-400">
                    Ghc{Number(o.totalAmount).toFixed(2)}
                  </span>
                  <span>
                    {o.paymentMethod === "momo" ? "Mobile Money" : "Cash On Delivery"}
                  </span>
                </div>
                <p className="mb-3 text-xs text-slate-500 dark:text-zinc-400">
                  {o.hostel || o.address}
                  {o.customHostel ? ` · ${o.customHostel}` : ""}
                  {" · "}
                  {o.phone}
                  {" · "}
                  {new Date(o.createdAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={() => decide(o.id, true)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {busyId === o.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Confirm Order
                  </button>
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={() => decide(o.id, false)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50 dark:border-red-900 dark:bg-zinc-950 dark:text-red-400"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
