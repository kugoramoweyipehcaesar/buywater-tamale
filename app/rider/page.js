"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { Loader2, Package, RefreshCw } from "lucide-react";

const STATUS_FLOW = [
  "PENDING",
  "PROCESSING",
  "CONFIRMED",
  "ON_THE_WAY",
  "DELIVERED",
  "CANCELLED",
];

function badgeClass(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PENDING") return "bg-orange-100 text-orange-800";
  if (s === "DELIVERED") return "bg-emerald-100 text-emerald-800";
  if (s === "CANCELLED") return "bg-slate-200 text-slate-600";
  if (s === "ON_THE_WAY" || s === "CONFIRMED" || s === "PROCESSING")
    return "bg-sky-100 text-sky-800";
  return "bg-slate-100 text-slate-700";
}

export default function RiderQueuePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const load = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user || me.user.role !== "RIDER") {
        if (me.user && ["ADMIN", "SUPER_ADMIN"].includes(me.user.role)) {
          router.push("/admin/order-queue");
          return;
        }
        router.push("/login");
        return;
      }
      setUser(me.user);
      const res = await fetch("/api/orders?live=1").then((r) => r.json());
      if (res.error) throw new Error(res.error);
      setOrders(res.orders || []);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  async function setStatus(id, status) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      showToast(`Status → ${status}`);
      await load();
    } catch (e) {
      showToast(e.message || "Failed");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF6FC] pb-16">
      <SiteHeader user={user} />
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-[#0077C8]" />
            <h1 className="text-xl font-bold text-black">Rider queue</h1>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Live open orders. Update status as you deliver. No admin controls.
        </p>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            No open orders right now.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-black">{o.orderNumber}</p>
                    <p className="text-sm text-slate-700">{o.customerName}</p>
                    <p className="text-xs text-slate-500">{o.phone}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeClass(
                      o.status
                    )}`}
                  >
                    {o.status}
                  </span>
                </div>
                <p className="text-sm text-slate-700">
                  {o.gallons} gal · Ghc{Number(o.totalAmount).toFixed(2)} ·{" "}
                  {o.paymentMethod === "momo" ? "MoMo" : "Cash"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {[o.hostel || o.address, o.roomNumber && `Rm ${o.roomNumber}`, o.blockNumber && `Blk ${o.blockNumber}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {o.momoReference && (
                  <p className="mt-1 text-xs text-slate-500">
                    MoMo ref: {o.momoReference}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {STATUS_FLOW.filter((s) => s !== o.status).map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={busyId === o.id}
                      onClick={() => setStatus(o.id, s)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
