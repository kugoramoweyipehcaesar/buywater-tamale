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
  User,
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
      showToast(approve ? "Order approved — Live now" : "Order rejected");
      await load();
    } catch (e) {
      showToast(e.message);
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
        <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[#0077C8]">
          <ArrowLeft className="h-4 w-4" /> Admin Office
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
            <ClipboardCheck className="h-5 w-5 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0B2545]">Order Verification</h1>
            <p className="text-sm text-slate-500">
              Approve or reject pending orders · {orders.length} waiting
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center text-slate-500 shadow-sm">
            No pending orders to verify
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-50 bg-slate-50/80 px-4 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0B2545]">{o.orderNumber}</span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                      PENDING
                    </span>
                  </div>
                </div>
                <div className="space-y-2 px-4 py-3 text-sm">
                  <Row icon={User} label="Customer" value={o.customerName} />
                  <Row icon={Phone} label="Phone" value={o.phone} />
                  <Row
                    icon={MapPin}
                    label="Location"
                    value={`${o.hostel || o.address}${o.roomNumber ? ` · Rm ${o.roomNumber}` : ""}`}
                  />
                  <Row
                    icon={Droplets}
                    label="Order"
                    value={`${o.gallons} gallons · Ghc${Number(o.totalAmount).toFixed(2)} · ${
                      o.paymentMethod === "momo" ? "MoMo" : "Cash"
                    }`}
                  />
                  {o.notes && (
                    <p className="rounded-lg bg-slate-50 px-2 py-1.5 text-xs text-slate-600">
                      Note: {o.notes}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-50 p-3">
                  <button
                    type="button"
                    disabled={busyId === o.id}
                    onClick={() => decide(o.id, false)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-50"
                  >
                    {busyId === o.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Reject
                  </button>
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
                    Approve
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

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <div>
        <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
        <p className="font-medium text-[#0B2545]">{value}</p>
      </div>
    </div>
  );
}
