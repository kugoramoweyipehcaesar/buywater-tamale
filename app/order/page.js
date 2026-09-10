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
} from "lucide-react";

export default function OrderPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [hostels, setHostels] = useState([]);
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
  const [promoLoading, setPromoLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const pricePerGallon = settings?.pricePerGallon ?? 3;
  const subPrice = settings?.subscriptionPrice ?? 27;
  const subGallons = settings?.subscriptionGallons ?? 10;
  const cashEnabled = settings?.cashEnabled !== false;
  const momoEnabled = settings?.momoEnabled !== false;

  const freeGallons = promoApplied?.rewardValue || 0;
  const billableGallons = isSubscription ? subGallons : gallons;
  const total = isSubscription
    ? subPrice
    : billableGallons * pricePerGallon;
  const totalGallonsDelivered = billableGallons + freeGallons;

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/hostels").then((r) => r.json()),
    ]).then(([me, set, hos]) => {
      if (!me.user) {
        router.push("/login");
        return;
      }
      setUser(me.user);
      setSettings(set.settings);
      setHostels((hos.hostels || []).filter((h) => h.active !== false));
      if (me.user.hostel) setHostel(me.user.hostel);
      if (me.user.customHostel) setCustomHostel(me.user.customHostel);
    });
  }, [router]);

  useEffect(() => {
    if (isSubscription) setGallons(subGallons);
  }, [isSubscription, subGallons]);

  async function applyPromo() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/promotions?code=${encodeURIComponent(promoCode.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        setPromoApplied(null);
        setError(data.error || "Invalid promo code");
        return;
      }
      setPromoApplied(data.promo);
      setError("");
    } catch {
      setError("Could not check promo code");
    } finally {
      setPromoLoading(false);
    }
  }

  async function placeOrder(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!hostel) {
      setError("Please select your hostel");
      return;
    }
    if (hostel === "Other" && !customHostel.trim()) {
      setError("Enter your hostel name");
      return;
    }
    if (paymentMethod === "momo" && !momoNumber.trim()) {
      setError("Enter your MoMo number");
      return;
    }
    setLoading(true);
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
          gallons: totalGallonsDelivered,
          totalAmount: total,
          paymentMethod,
          momoNumber: paymentMethod === "momo" ? momoNumber : "",
          momoReference: paymentMethod === "momo" ? momoReference : "",
          isSubscription,
          deliveryNotes,
          notes: promoApplied
            ? `Promo: ${promoApplied.code} — ${promoApplied.rewardValue} free gallons`
            : "",
          products: JSON.stringify([
            {
              name: "20L Water Gallon",
              qty: totalGallonsDelivered,
              price: pricePerGallon,
            },
          ]),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Order failed");
        return;
      }
      // increment promo use
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
      setSuccess(`Order ${data.order.orderNumber} placed successfully!`);
      setTimeout(() => router.push("/dashboard"), 1600);
    } catch {
      setError("Network error – try again");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">Loading...</div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <Link href="/dashboard" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2 font-bold text-brand">
            <Droplets className="h-5 w-5" /> New Order
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={placeOrder} className="space-y-5">
          {/* Product */}
          <div className="rounded-2xl border bg-white p-5 text-center shadow-sm">
            <img
              src="/product.jpg"
              alt="BuyWater 20L"
              className="mx-auto mb-3 h-40 w-auto object-contain"
            />
            <p className="font-semibold text-brand-navy">20L Water Gallon</p>
            <p className="text-sm text-slate-500">
              Ghc{pricePerGallon} per gallon · Delivery 45–60 min
            </p>
          </div>

          {/* Subscription toggle */}
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <label className="flex cursor-pointer items-center justify-between">
              <div>
                <p className="font-semibold text-brand-navy">Weekly subscription</p>
                <p className="text-xs text-slate-500">
                  {subGallons} gallons for Ghc{subPrice}
                </p>
              </div>
              <input
                type="checkbox"
                checked={isSubscription}
                onChange={(e) => setIsSubscription(e.target.checked)}
                className="h-5 w-5 accent-[#007CC3]"
              />
            </label>
          </div>

          {/* Gallons */}
          {!isSubscription && (
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-semibold text-brand-navy">
                Number of gallons
              </p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setGallons((g) => Math.max(1, g - 1))}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-brand/30 text-brand"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-4xl font-bold text-brand-navy">{gallons}</span>
                  <p className="text-xs text-slate-500">
                    Ghc{pricePerGallon} each
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGallons((g) => g + 1)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-brand/30 text-brand"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Delivery */}
          <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-brand-navy">Delivery details</p>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Hostel
              </label>
              <select
                required
                value={hostel}
                onChange={(e) => setHostel(e.target.value)}
                className="w-full rounded-xl border px-3 py-2.5 text-sm"
              >
                <option value="">Select hostel</option>
                {hostels.map((h) => (
                  <option key={h.id} value={h.name}>
                    {h.name}
                  </option>
                ))}
                <option value="Other">Other (specify)</option>
              </select>
            </div>
            {hostel === "Other" && (
              <input
                required
                placeholder="Hostel name"
                value={customHostel}
                onChange={(e) => setCustomHostel(e.target.value)}
                className="w-full rounded-xl border px-3 py-2.5 text-sm"
              />
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Room number
                </label>
                <input
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. 12B"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Block
                </label>
                <input
                  value={blockNumber}
                  onChange={(e) => setBlockNumber(e.target.value)}
                  placeholder="e.g. A"
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Delivery Notes (optional)
            </label>
            <input
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              placeholder="e.g. Room 12, Block B"
              className="w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          </div>

          {/* Promo */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="mb-2 flex items-center gap-1 text-sm font-semibold text-brand-navy">
              <BadgePercent className="h-4 w-4" /> Promo code
            </p>
            <div className="flex gap-2">
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME2"
                className="flex-1 rounded-xl border px-3 py-2.5 text-sm uppercase"
              />
              <button
                type="button"
                onClick={applyPromo}
                disabled={promoLoading}
                className="rounded-xl bg-slate-100 px-4 text-sm font-semibold hover:bg-slate-200"
              >
                {promoLoading ? "..." : "Apply"}
              </button>
            </div>
            {promoApplied && (
              <p className="mt-2 text-sm text-green-600">
                +{promoApplied.rewardValue} free gallon(s) applied (
                {promoApplied.code})
              </p>
            )}
          </div>

          {/* Payment */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-brand-navy">Payment method</p>
            <div className="grid grid-cols-2 gap-3">
              {cashEnabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cash_on_delivery")}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-sm font-medium ${
                    paymentMethod === "cash_on_delivery"
                      ? "border-brand bg-brand/5 text-brand"
                      : "border-slate-200"
                  }`}
                >
                  <Banknote className="h-5 w-5" />
                  Cash on Delivery
                </button>
              )}
              {momoEnabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod("momo")}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 py-3 text-sm font-medium ${
                    paymentMethod === "momo"
                      ? "border-brand bg-brand/5 text-brand"
                      : "border-slate-200"
                  }`}
                >
                  <Smartphone className="h-5 w-5" />
                  Mobile Money
                </button>
              )}
            </div>
            {paymentMethod === "momo" && (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-slate-50 p-3 text-sm">
                  <p className="font-medium text-brand-navy">Send payment to:</p>
                  <p className="text-lg font-bold text-brand">
                    {settings?.momoNumber || "0502748671"}
                  </p>
                  <p className="text-slate-600">
                    {settings?.momoName || "CAESAR WEYIPEH KUGORAMO"}
                  </p>
                </div>
                <input
                  required
                  placeholder="Your MoMo number"
                  value={momoNumber}
                  onChange={(e) => setMomoNumber(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                />
                <input
                  placeholder="Transaction reference / ID"
                  value={momoReference}
                  onChange={(e) => setMomoReference(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                />
              </div>
            )}
          </div>

          {/* Total + submit */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="mb-3 flex justify-between text-sm">
              <span className="text-slate-600">Gallons to deliver</span>
              <span className="font-semibold">{totalGallonsDelivered}</span>
            </div>
            {freeGallons > 0 && (
              <div className="mb-3 flex justify-between text-sm text-green-600">
                <span>Promo free gallons</span>
                <span>+{freeGallons}</span>
              </div>
            )}
            <div className="mb-4 flex justify-between border-t pt-3">
              <span className="font-semibold text-brand-navy">Total</span>
              <span className="text-xl font-bold text-brand">Ghc{total}</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-xl bg-brand py-3.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                `Place Order · Ghc${total}`
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
