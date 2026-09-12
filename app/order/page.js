"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Droplets,
  Loader2,
  Minus,
  Plus,
  Banknote,
  Smartphone,
  BadgePercent,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";

export default function OrderPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
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

  const pricePerGallon = settings?.pricePerGallon ?? 2.5;
  const subPrice = settings?.subscriptionPrice ?? 22;
  const subGallons = settings?.subscriptionGallons ?? 10;
  const cashEnabled = settings?.cashEnabled !== false;
  const momoEnabled = settings?.momoEnabled !== false;
  const maintenanceOn = !!settings?.maintenanceMode;
  const freeGallons = promoApplied?.rewardValue || 0;
  const billableGallons = isSubscription ? subGallons : gallons;
  const total = isSubscription ? subPrice : billableGallons * pricePerGallon;
  const totalGallons = billableGallons + freeGallons;

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/hostels").then((r) => r.json()),
    ])
      .then(([me, set, hos]) => {
        setUser(me.user);
        setSettings(set.settings);
        setHostels((hos.hostels || []).filter((h) => h.active !== false));
        if (me.user?.hostel) setHostel(me.user.hostel);
        if (me.user?.customHostel) setCustomHostel(me.user.customHostel);
        const s = set.settings || {};
        if (s.cashEnabled === false && s.momoEnabled !== false) {
          setPaymentMethod("momo");
        } else if (s.momoEnabled === false && s.cashEnabled !== false) {
          setPaymentMethod("cash_on_delivery");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isSubscription) setGallons(subGallons);
  }, [isSubscription, subGallons]);

  async function applyPromo() {
    if (!promoCode.trim()) return;
    try {
      const res = await fetch(
        `/api/promotions?code=${encodeURIComponent(promoCode.trim())}`
      );
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
    if (maintenanceOn) {
      setOrderError("Site is under maintenance. Ordering is unavailable.");
      return;
    }
    if (!user) {
      router.push("/login");
      return;
    }
    if (!hostel) {
      setOrderError("Please select your hostel");
      return;
    }
    if (hostel === "Other" && !customHostel.trim()) {
      setOrderError("Enter your hostel name");
      return;
    }
    if (paymentMethod === "momo" && !momoEnabled) {
      setOrderError("Mobile Money is not available");
      return;
    }
    if (paymentMethod === "cash_on_delivery" && !cashEnabled) {
      setOrderError("Cash on delivery is not available");
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
            {
              name: "20L Water Gallon",
              qty: totalGallons,
              price: pricePerGallon,
            },
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
      setTimeout(() => router.push("/dashboard?tab=tracking"), 1200);
    } catch {
      setOrderError("Network error");
    } finally {
      setOrderLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF6FC] pb-12">
      <div className="mx-auto max-w-lg px-4 py-6">
        <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[#0077C8]">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="mb-4 flex items-center gap-3">
          <img src="/logo.jpg" alt="BuyWater" className="h-12 w-12 rounded-full object-cover ring-2 ring-sky-200" />
          <div>
            <h1 className="text-xl font-bold text-black">Order Water</h1>
            <p className="text-sm text-slate-500">
              Ghc{pricePerGallon} per gallon · Fresh Water Delivered
            </p>
          </div>
        </div>

        {maintenanceOn && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Maintenance mode is on</p>
              <p className="text-xs">
                {settings?.maintenanceMessage ||
                  "Ordering is temporarily unavailable."}
              </p>
            </div>
          </div>
        )}

        {!user && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Please <Link href="/login" className="font-semibold underline">login</Link> to place an order.
          </div>
        )}

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

          <p className="mb-3 text-sm font-semibold text-black">Number of Gallons</p>
          <div className="mb-5 flex items-center justify-center gap-6">
            <button type="button" disabled={isSubscription || maintenanceOn} onClick={() => setGallons((g) => Math.max(1, g - 1))} className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#0077C8]/25 text-[#0077C8] disabled:opacity-40">
              <Minus className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Droplets className="h-6 w-6 text-[#0077C8]" />
                <span className="text-3xl font-bold text-black">{isSubscription ? subGallons : gallons}</span>
              </div>
              <p className="text-xs text-slate-500">Ghc{pricePerGallon.toFixed(2)} each</p>
            </div>
            <button type="button" disabled={isSubscription || maintenanceOn} onClick={() => setGallons((g) => g + 1)} className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#0077C8]/25 text-[#0077C8] disabled:opacity-40">
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <button type="button" disabled={maintenanceOn} onClick={() => setIsSubscription(!isSubscription)} className={`mb-5 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left ${
            isSubscription ? "border-[#0077C8] bg-[#0077C8]/5" : "border-slate-200 bg-slate-50"
          }`}>
            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${isSubscription ? "bg-[#0077C8] text-white" : "bg-slate-200"}`}>
              <BadgePercent className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-black">Subscribe & Save</p>
              <p className="text-xs text-slate-500">{subGallons} gallons for Ghc{subPrice}</p>
            </div>
          </button>

          <label className="mb-1.5 block text-sm font-semibold text-black">Select Your Hostel</label>
          <select required value={hostel} onChange={(e) => setHostel(e.target.value)} disabled={maintenanceOn} className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-black">
            <option value="">Select hostel</option>
            {hostels.map((h) => (
              <option key={h.id} value={h.name}>{h.name}</option>
            ))}
            <option value="Other">Other (specify)</option>
          </select>
          {hostel === "Other" && (
            <input required value={customHostel} onChange={(e) => setCustomHostel(e.target.value)} placeholder="Hostel name" className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-black" />
          )}

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Room Number</label>
              <input value={roomNumber} onChange={(e) => setRoomNumber(e.target.value)} placeholder="e.g. 12" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-black" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Block Number</label>
              <input value={blockNumber} onChange={(e) => setBlockNumber(e.target.value)} placeholder="e.g. B" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-black" />
            </div>
          </div>

          <p className="mb-2 text-sm font-semibold text-black">Payment Method</p>
          {!cashEnabled && !momoEnabled && (
            <p className="mb-3 text-sm text-red-600">No payment methods are enabled. Contact admin.</p>
          )}
          <div className="mb-4 grid grid-cols-2 gap-3">
            {cashEnabled && (
              <button type="button" onClick={() => setPaymentMethod("cash_on_delivery")} className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-sm font-medium ${
                paymentMethod === "cash_on_delivery" ? "border-[#0077C8] bg-[#0077C8]/5 text-[#0077C8]" : "border-slate-200 text-slate-600"
              }`}>
                <Banknote className="h-5 w-5" /> Cash on Delivery
              </button>
            )}
            {momoEnabled && (
              <button type="button" onClick={() => setPaymentMethod("momo")} className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-sm font-medium ${
                paymentMethod === "momo" ? "border-[#0077C8] bg-[#0077C8]/5 text-[#0077C8]" : "border-slate-200 text-slate-600"
              }`}>
                <Smartphone className="h-5 w-5" /> Mobile Money
              </button>
            )}
          </div>

          {paymentMethod === "momo" && momoEnabled && (
            <div className="mb-4 space-y-2">
              <input value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} placeholder="Your MoMo number" className="w-full rounded-xl border px-3 py-2.5 text-sm text-black" />
              <input value={momoReference} onChange={(e) => setMomoReference(e.target.value)} placeholder="Transaction reference (optional)" className="w-full rounded-xl border px-3 py-2.5 text-sm text-black" />
            </div>
          )}

          <div className="mb-4 flex gap-2">
            <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="PROMO CODE" className="flex-1 rounded-xl border px-3 py-2.5 text-sm uppercase text-black" />
            <button type="button" onClick={applyPromo} className="rounded-xl border px-4 text-sm font-semibold text-[#0077C8]">Apply</button>
          </div>
          {promoApplied && (
            <p className="mb-3 text-xs text-green-600">Promo applied: +{promoApplied.rewardValue} free gallons</p>
          )}

          <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <div className="flex justify-between text-black"><span>Gallons</span><span>{totalGallons}</span></div>
            <div className="mt-1 flex justify-between font-semibold text-black"><span>Total</span><span>Ghc{Number(total).toFixed(2)}</span></div>
          </div>

          <button type="submit" disabled={orderLoading || !user || maintenanceOn || (!cashEnabled && !momoEnabled)} className="w-full rounded-xl bg-[#0077C8] py-3 text-sm font-semibold text-white shadow hover:bg-[#0066AD] disabled:opacity-60">
            {orderLoading ? "Placing…" : maintenanceOn ? "Ordering unavailable" : `Place order — Ghc${Number(total).toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  );
}
