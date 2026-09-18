"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wrench,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  Shield,
  Save,
} from "lucide-react";

const SUPER = "kugoramoweyipehcaesar49@gmail.com";

export default function AdminMaintenancePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [outOfStock, setOutOfStock] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  const load = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user || !["ADMIN", "SUPER_ADMIN"].includes(me.user.role)) {
        router.push("/admin-login");
        return;
      }
      setUser(me.user);
      const set = await fetch("/api/settings").then((r) => r.json());
      const s = set.settings || {};
      setMaintenanceMode(!!s.maintenanceMode);
      setOutOfStock(!!s.outOfStock);
      setMaintenanceMessage(
        s.maintenanceMessage ||
          "We're performing scheduled maintenance. Ordering will be back shortly."
      );
    } catch {
      router.push("/admin-login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function persist(mode, message, stock) {
    setBusy(true);
    try {
      const payload = {
        maintenanceMode: mode,
        maintenanceMessage: message,
      };
      if (stock !== undefined) payload.outOfStock = stock;
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      showToast(
        mode
          ? "Maintenance ON — public site shows notice"
          : "Maintenance OFF — site is live"
      );
      return data;
    } finally {
      setBusy(false);
    }
  }

  async function toggleMaintenance() {
    const next = !maintenanceMode;
    setMaintenanceMode(next);
    try {
      await persist(next, maintenanceMessage);
    } catch {
      setMaintenanceMode(!next);
    }
  }

  async function toggleOutOfStock() {
    const next = !outOfStock;
    setOutOfStock(next);
    try {
      await persist(maintenanceMode, maintenanceMessage, next);
      showToast(
        next
          ? "Out of stock ON — customers cannot place orders"
          : "Back in stock — ordering enabled"
      );
    } catch {
      setOutOfStock(!next);
      showToast("Failed to update stock status");
    }
  }

  async function saveMaintenance() {
    try {
      await persist(maintenanceMode, maintenanceMessage);
      showToast("Message saved");
    } catch (e) {
      showToast(e.message || "Save failed");
    }
  }

  async function resetOrders() {
    if (confirmText !== "RESET") {
      showToast('Type RESET to confirm');
      return;
    }
    setResetting(true);
    try {
      const res = await fetch("/api/admin/orders/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      showToast("Orders reset");
      setShowReset(false);
      setConfirmText("");
    } catch (e) {
      showToast(e.message || "Reset failed");
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const isSuper =
    user?.email === SUPER || user?.role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-16">
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[#0077C8]">
          <ArrowLeft className="h-4 w-4" /> Admin Office
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
            <Wrench className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black">Maintenance Mode</h1>
            <p className="text-sm text-slate-500">
              Toggle site-wide notice and disable ordering for all customers
            </p>
          </div>
        </div>

        <section className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-900">
                  Maintenance mode is {maintenanceMode ? "ACTIVE" : "OFF"}
                </p>
                <p className="text-xs text-amber-800/80">
                  {maintenanceMode
                    ? "Customers are redirected to /maintenance. Ordering is blocked."
                    : "Site is live. Customers can place orders."}
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={toggleMaintenance}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                maintenanceMode ? "bg-amber-500" : "bg-slate-200"
              }`}
              aria-pressed={maintenanceMode}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  maintenanceMode ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-red-900">
                Out of stock today is {outOfStock ? "ON" : "OFF"}
              </p>
              <p className="text-xs text-red-800/80">
                {outOfStock
                  ? "Order page shows out-of-stock and Place order is blocked."
                  : "Inventory available — customers can place orders."}
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={toggleOutOfStock}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                outOfStock ? "bg-red-600" : "bg-slate-200"
              }`}
              aria-pressed={outOfStock}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  outOfStock ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-bold text-black">Maintenance message</h2>
          <textarea
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            rows={3}
            className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-black"
          />
          <button
            type="button"
            disabled={busy}
            onClick={saveMaintenance}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0077C8] py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save message
          </button>
        </section>

        <section className="mb-4 rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-bold text-black">Danger zone</h2>
          <p className="mb-3 text-xs text-slate-500">
            Reset all orders (super admin only). This cannot be undone.
          </p>
          {!showReset ? (
            <button
              type="button"
              disabled={!isSuper}
              onClick={() => setShowReset(true)}
              className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 disabled:opacity-40"
            >
              Reset Orders…
            </button>
          ) : isSuper ? (
            <div className="space-y-2">
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder='Type RESET to confirm'
                className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={resetting}
                onClick={resetOrders}
                className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white"
              >
                {resetting ? "Resetting…" : "Confirm Reset Orders (delete all)"}
              </button>
            </div>
          ) : (
            <p className="flex items-center gap-1 text-xs text-red-600">
              <Shield className="h-3.5 w-3.5" /> Only super admin can reset orders
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
