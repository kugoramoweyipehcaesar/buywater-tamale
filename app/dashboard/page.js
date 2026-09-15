"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import {
  Package, Plus, History, MapPin, RefreshCw, Droplets, Minus,
  Banknote, Smartphone, Clock, Check, Truck, Box, XCircle, Loader2,
} from "lucide-react";

const STATUS_LABELS = {
  PENDING: "Pending", PROCESSING: "Preparing", CONFIRMED: "Order Confirmed",
  ON_THE_WAY: "On the Way", DELIVERED: "Delivered", CANCELLED: "Cancelled",
};
const STATUS_BADGE = {
  PENDING: "bg-amber-100 text-amber-700", PROCESSING: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700", ON_THE_WAY: "bg-cyan-100 text-cyan-700",
  DELIVERED: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-600",
};
const TRACK_STEPS = [
  { key: "CONFIRMED", label: "Order Confirmed", icon: Check },
  { key: "PROCESSING", label: "Preparing", icon: Box },
  { key: "ON_THE_WAY", label: "On the Way", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: MapPin },
];

function stepIndex(status) {
  if (status === "PENDING") return 0;
  if (status === "CANCELLED") return -1;
  const i = TRACK_STEPS.findIndex((s) => s.key === status);
  return i >= 0 ? i : 0;
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "order";
  const setTab = (t) => router.push(`/dashboard?tab=${t}`);

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gallons, setGallons] = useState(1);
  const [isSubscription, setIsSubscription] = useState(false);
  const [hostel, setHostel] = useState("");
  const [customHostel, setCustomHostel] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [blockNumber, setBlockNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [momoNumber, setMomoNumber] = useState("");
  const [momoReference, setMomoReference] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [busy, setBusy] = useState(false);

  const pricePerGallon = settings?.pricePerGallon ?? 2.5;
  const subPrice = settings?.subscriptionPrice ?? 22;
  const subGallons = settings?.subscriptionGallons ?? 10;
  const freeGallons = promoApplied?.rewardValue || 0;
  const billable = isSubscription ? subGallons : gallons;
  const total = isSubscription ? subPrice : billable * pricePerGallon;
  const totalGallons = billable + freeGallons;

  const load = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user) {
        router.push("/login");
        return;
      }
      setUser(me.user);
      const [ord, set, hos] = await Promise.all([
        fetch("/api/orders").then((r) => r.json()),
        fetch("/api/settings").then((r) => r.json()),
        fetch("/api/hostels").then((r) => r.json()),
      ]);
      const list = ord.orders || [];
      setOrders(list);
      setActiveOrder(list.find((o) => !["DELIVERED", "CANCELLED"].includes(o.status)) || null);
      setSettings(set.settings);
      setHostels((hos.hostels || []).filter((h) => h.active !== false));
      if (me.user.hostel) setHostel(me.user.hostel);
      if (me.user.customHostel) setCustomHostel(me.user.customHostel);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isSubscription) setGallons(subGallons);
  }, [isSubscription, subGallons]);

  async function applyPromo() {
    if (!promoCode.trim()) return;
    try {
      const res = await fetch(`/api/promotions?code=${encodeURIComponent(promoCode.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setPromoApplied(null);
        setOrderError(data.error || "Invalid promo");
        return;
      }
      setPromoApplied(data.promo);
      setOrderError("");
    } catch {
      setOrderError("Could not check promo");
    }
  }

  async function placeOrder(e) {
    e.preventDefault();
    setOrderError("");
    setOrderSuccess("");
    if (!hostel) {
      setOrderError("Please select your hostel");
      return;
    }
    if (hostel === "Other" && !customHostel.trim()) {
      setOrderError("Enter your hostel name");
      return;
    }
    if (paymentMethod === "momo" && !momoNumber.trim()) {
      setOrderError("Enter your MoMo number");
      return;
    }
    setOrderLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: user?.name || user?.username || "",
          username: user?.username || "",
          phone: user?.phone || "",
          email: user?.email,
          hostel: hostel === "Other" ? "Other" : hostel,
          customHostel: hostel === "Other" ? customHostel.trim() : "",
          address: hostel === "Other" ? customHostel.trim() : hostel,
          roomNumber,
          blockNumber,
          gallons: totalGallons,
          totalAmount: total,
          paymentMethod,
          momoNumber: paymentMethod === "momo" ? momoNumber : "",
          momoReference: paymentMethod === "momo" ? momoReference : "",
          isSubscription,
          notes: promoApplied
            ? `Promo: ${promoApplied.code} — ${promoApplied.rewardValue} free gallons`
            : "",
          products: JSON.stringify([
            { name: "20L Water Gallon", qty: totalGallons, price: pricePerGallon },
          ]),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOrderError(data.error || "Order failed");
        return;
      }
      if (promoApplied?.id) {
        try {
          await fetch("/api/promotions", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: promoApplied.id,
              timesUsed: (promoApplied.timesUsed || 0) + 1,
            }),
          });
        } catch (_) {}
      }
      setOrderSuccess(`Order ${data.order.orderNumber} placed!`);
      setGallons(1);
      setIsSubscription(false);
      setPromoApplied(null);
      setPromoCode("");
      await load();
      setTimeout(() => setTab("tracking"), 800);
    } catch {
      setOrderError("Network error");
    } finally {
      setOrderLoading(false);
    }
  }

  async function confirmCancel() {
    if (!activeOrder || !cancelReason.trim()) return;
    setBusy(true);
    try {
      await fetch(`/api/orders/${activeOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED",
          cancelReason: cancelReason.trim(),
        }),
      });
      setShowCancel(false);
      setCancelReason("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  let etaText = "";
  if (activeOrder) {
    const eta = new Date(new Date(activeOrder.createdAt).getTime() + 60 * 60 * 1000);
    etaText = eta.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  const si = activeOrder ? stepIndex(activeOrder.status) : -1;

  return (
    <div className="min-h-screen bg-[#EEF6FC] pb-12">
      {/* SiteHeader shows AnnouncementPopup only on /dashboard */}
      <SiteHeader user={user} />

      <main className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0077C8]/10">
            <Package className="h-5 w-5 text-[#0077C8]" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[#0B2545]">Order Water</h1>
            <p className="text-sm text-slate-500">
              Hi {user?.name || user?.username || "there"}, let&apos;s get you water!
            </p>
          </div>
          <button type="button" onClick={load} className="rounded-lg p-2 text-slate-400 hover:bg-white">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {activeOrder && (
          <button
            type="button"
            onClick={() => setTab("tracking")}
            className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-[#0077C8] px-4 py-3.5 text-left text-white shadow-md"
          >
            <Droplets className="h-5 w-5 shrink-0 opacity-90" />
            <div className="flex-1">
              <p className="font-semibold">Active Order · {activeOrder.orderNumber}</p>
              <p className="text-xs text-white/80">Tap to track your delivery</p>
            </div>
            <Box className="h-5 w-5 opacity-80" />
          </button>
        )}

        <div className="mb-5 flex gap-1 rounded-2xl bg-white p-1 shadow-sm">
          {[
            { id: "order", label: "New Order", icon: Plus },
            { id: "tracking", label: "Track", icon: MapPin },
            { id: "history", label: "History", icon: History },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition ${
                tab === t.id ? "bg-[#0077C8] text-white shadow" : "text-slate-500 hover:text-[#0B2545]"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "order" && (
          <form onSubmit={placeOrder} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            {orderError && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{orderError}</div>
            )}
            {orderSuccess && (
              <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{orderSuccess}</div>
            )}
            <div className="mb-5 flex justify-center">
              <img src="/product.jpg" alt="20L BuyWater" className="h-36 w-auto rounded-xl object-contain" />
            </div>
            <p className="mb-3 text-sm font-semibold text-[#0B2545]">Number of Gallons</p>
            <div className="mb-5 flex items-center justify-center gap-6">
              <button type="button" disabled={isSubscription} onClick={() => setGallons((g) => Math.max(1, g - 1))} className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#0077C8]/25 text-[#0077C8] disabled:opacity-40">
                <Minus className="h-5 w-5" />
              </button>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Droplets className="h-6 w-6 text-[#0077C8]" />
                  <span className="text-3xl font-bold text-[#0B2545]">{isSubscription ? subGallons : gallons}</span>
                </div>
                <p className="text-xs text-slate-500">Ghc{pricePerGallon.toFixed(2)} per gallon</p>
              </div>
              <button type="button" disabled={isSubscription} onClick={() => setGallons((g) => g + 1)} className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#0077C8]/25 text-[#0077C8] disabled:opacity-40">
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsSubscription(!isSubscription)}
              className={`mb-5 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left ${
                isSubscription ? "border-[#0077C8] bg-[#0077C8]/5" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${isSubscription ? "bg-[#0077C8] text-white" : "bg-slate-200"}`}>
                <RefreshCw className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#0B2545]">Subscribe &amp; Save</p>
                <p className="text-xs text-slate-500">{subGallons} gallons for Ghc{subPrice}</p>
              </div>
            </button>
            <label className="mb-1.5 block text-sm font-semibold text-[#0B2545]">Select Your Hostel</label>
            <div className="relative mb-3">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select required value={hostel} onChange={(e) => setHostel(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 py-2.5 pl-10 pr-8 text-sm outline-none focus:border-[#0077C8]">
                <option value="">Select hostel</option>
                {hostels.map((h) => (
                  <option key={h.id} value={h.name}>{h.name}</option>
                ))}
                <option value="Other">Other (specify)</option>
              </select>
            </div>
            {hostel === "Other" && (
              <input required value={customHostel} onChange={(e) => setCustomHostel(e.target.value)} placeholder="Hostel name" className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            )}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Room Number</label>
                <input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="e.g. 12" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Block Number</label>
                <input value={blockNumber} onChange={(e) => setBlockNumber(e.target.value)} placeholder="e.g. B" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              </div>
            </div>
            <p className="mb-2 text-sm font-semibold text-[#0B2545]">Payment Method</p>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setPaymentMethod("cash_on_delivery")} className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-sm font-medium ${paymentMethod === "cash_on_delivery" ? "border-[#0077C8] bg-[#0077C8]/5 text-[#0077C8]" : "border-slate-200 text-slate-600"}`}>
                <Banknote className="h-5 w-5" />Cash on Delivery
              </button>
              <button type="button" onClick={() => setPaymentMethod("momo")} className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-sm font-medium ${paymentMethod === "momo" ? "border-[#0077C8] bg-[#0077C8]/5 text-[#0077C8]" : "border-slate-200 text-slate-600"}`}>
                <Smartphone className="h-5 w-5" />Mobile Money
              </button>
            </div>
            {paymentMethod === "momo" && (
              <div className="mb-4 space-y-2">
                <input required value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} placeholder="MoMo number" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
                <input value={momoReference} onChange={(e) => setMomoReference(e.target.value)} placeholder="Transaction reference (optional)" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              </div>
            )}
            <div className="mb-4 flex gap-2">
              <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Promo code" className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
              <button type="button" onClick={applyPromo} className="rounded-xl border border-[#0077C8] px-3 py-2 text-sm font-semibold text-[#0077C8]">Apply</button>
            </div>
            {promoApplied && (
              <p className="mb-3 text-xs text-green-600">Promo applied: +{promoApplied.rewardValue} free gallons</p>
            )}
            <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <div className="flex justify-between"><span>Gallons</span><span className="font-semibold">{totalGallons}</span></div>
              <div className="mt-1 flex justify-between text-base font-bold text-[#0B2545]"><span>Total</span><span>Ghc{total.toFixed(2)}</span></div>
            </div>
            <button type="submit" disabled={orderLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0077C8] py-3 text-sm font-bold text-white disabled:opacity-60">
              {orderLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Place Order"}
            </button>
          </form>
        )}

        {tab === "tracking" && (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            {!activeOrder ? (
              <p className="py-8 text-center text-sm text-slate-500">No active order. Place one from New Order.</p>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#0B2545]">{activeOrder.orderNumber}</p>
                    <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[activeOrder.status] || "bg-slate-100"}`}>
                      {STATUS_LABELS[activeOrder.status] || activeOrder.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">ETA ~{etaText}</p>
                </div>
                <div className="mb-6 space-y-0">
                  {TRACK_STEPS.map((step, i) => {
                    const done = si >= i;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${done ? "bg-[#0077C8] text-white" : "bg-slate-100 text-slate-400"}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          {i < TRACK_STEPS.length - 1 && (
                            <div className={`w-0.5 flex-1 min-h-[20px] ${si > i ? "bg-[#0077C8]" : "bg-slate-200"}`} />
                          )}
                        </div>
                        <p className={`pt-1.5 text-sm font-medium ${done ? "text-[#0B2545]" : "text-slate-400"}`}>{step.label}</p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-slate-600">
                  {activeOrder.gallons} gal · Ghc{Number(activeOrder.totalAmount).toFixed(2)} · {activeOrder.hostel || activeOrder.address}
                </p>
                {activeOrder.status === "PENDING" && (
                  <button type="button" onClick={() => setShowCancel(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-600">
                    <XCircle className="h-4 w-4" /> Cancel order
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-2">
            {orders.length === 0 ? (
              <p className="rounded-2xl bg-white py-10 text-center text-sm text-slate-500 shadow-sm">No orders yet</p>
            ) : (
              orders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    if (!["DELIVERED", "CANCELLED"].includes(o.status)) setTab("tracking");
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-[#0B2545]">{o.orderNumber}</p>
                    <p className="mt-0.5 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ${STATUS_BADGE[o.status] || ""}`}>
                        {STATUS_LABELS[o.status] || o.status}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {o.hostel || o.address || "—"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(o.createdAt)}
                      </span>
                    </p>
                  </div>
                  <span className="text-base font-bold text-[#0077C8]">Ghc{Number(o.totalAmount).toFixed(2)}</span>
                </button>
              ))
            )}
          </div>
        )}
      </main>

      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="font-bold text-[#0B2545]">Cancel order?</h3>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason"
              className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              rows={3}
            />
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setShowCancel(false)} className="flex-1 rounded-xl border py-2.5 text-sm font-semibold">
                Keep
              </button>
              <button
                type="button"
                onClick={confirmCancel}
                disabled={busy || !cancelReason.trim()}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Cancel order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
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
      <DashboardInner />
    </Suspense>
  );
}
