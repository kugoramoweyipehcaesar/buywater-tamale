"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import {
  ArrowLeft,
  Loader2,
  Package,
  RefreshCw,
  Bell,
  Droplets,
  MapPin,
  Phone,
} from "lucide-react";

const LIVE = ["PENDING", "PROCESSING", "CONFIRMED", "ON_THE_WAY"];

export default function OrderQueuePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [soundOn, setSoundOn] = useState(true);
  const knownIds = useRef(new Set());
  const firstLoad = useRef(true);
  const audioCtx = useRef(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function beep() {
    if (!soundOn) return;
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtx.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.value = 0.08;
      o.start();
      setTimeout(() => o.stop(), 180);
    } catch (_) {}
  }

  const load = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user || me.user.role !== "ADMIN") {
        router.push("/admin-login");
        return;
      }
      setUser(me.user);
      const res = await fetch("/api/orders?live=1").then((r) => r.json());
      const list = res.orders || [];
      if (!firstLoad.current) {
        const newOnes = list.filter((o) => !knownIds.current.has(o.id));
        if (newOnes.length) {
          beep();
          showToast(`${newOnes.length} new order(s)`);
        }
      }
      firstLoad.current = false;
      knownIds.current = new Set(list.map((o) => o.id));
      setOrders(list);
    } catch {
      router.push("/admin-login");
    } finally {
      setLoading(false);
    }
  }, [router, soundOn]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  async function setStatus(id, status) {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      showToast("Updated — Live now");
      await load();
    } catch (e) {
      showToast(e.message);
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

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0077C8]/10">
              <Package className="h-5 w-5 text-[#0077C8]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0B2545]">Order Queue</h1>
              <p className="text-sm text-slate-500">
                Live · auto-refresh 10s · {orders.length} active
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setSoundOn((v) => !v)}
              className={`rounded-lg p-2 ${soundOn ? "text-[#0077C8]" : "text-slate-300"}`}
              title="Sound for new orders"
            >
              <Bell className="h-4 w-4" />
            </button>
            <button type="button" onClick={load} className="rounded-lg p-2 text-slate-400">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center text-slate-500 shadow-sm">
            Queue is empty — waiting for orders
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o, i) => (
              <div key={o.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0077C8] text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="font-bold text-[#0B2545]">{o.orderNumber}</span>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                    {o.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#0B2545]">{o.customerName}</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {o.phone}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {o.hostel || o.address}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Droplets className="h-3 w-3" /> {o.gallons} gal
                  </span>
                  <span className="font-semibold text-[#0077C8]">
                    Ghc{Number(o.totalAmount).toFixed(2)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {LIVE.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={o.status === s}
                      onClick={() => setStatus(o.id, s)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                        o.status === s
                          ? "bg-[#0077C8] text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setStatus(o.id, "DELIVERED")}
                    className="rounded-lg bg-green-600 px-2.5 py-1 text-[11px] font-semibold text-white"
                  >
                    DELIVERED
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
