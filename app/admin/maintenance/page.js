"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
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
      if (!me.user || me.user.role !== "ADMIN") {
        router.push("/admin-login");
        return;
      }
      setUser(me.user);
      const set = await fetch("/api/settings").then((r) => r.json());
      const s = set.settings || {};
      setMaintenanceMode(!!s.maintenanceMode);
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

  async function saveMaintenance() {
    setBusy(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceMode, maintenanceMessage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      showToast("Maintenance settings saved — Live now");
      router.refresh();
    } catch (e) {
      showToast(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function resetOrders() {
    if (confirmText !== "RESET") {
      showToast("Type RESET to confirm");
      return;
    }
    setResetting(true);
    try {
      const res = await fetch("/api/admin/orders/reset", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setShowReset(false);
      setConfirmText("");
      showToast(`Deleted ${data.deleted} orders — Live now`);
    } catch (e) {
      showToast(e.message || "Reset failed");
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500 dark:text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const isSuper = user?.email === SUPER;

  return (
    <div className="min-h-screen bg-[#EEF6FC] pb-16 transition-colors duration-300 dark:bg-zinc-950">
      <SiteHeader user={user} />
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-6 shadow-xl dark:border-red-900 dark:bg-zinc-900">
            <h3 className="text-lg font-bold text-[#0B2545] dark:text-zinc-50">
              Reset all orders?
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-zinc-300">
              Type <strong>RESET</strong> to permanently delete all orders.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type RESET"
              autoComplete="off"
              className="mt-3 w-full rounded-xl border border-red-200 px-3 py-2.5 text-sm font-mono uppercase dark:border-red-900 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={resetting || confirmText !== "RESET"}
                onClick={resetOrders}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {resetting ? "Deleting…" : "Delete all orders"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReset(false);
                  setConfirmText("");
                }}
                className="rounded-xl border px-4 py-2.5 text-sm font-semibold dark:border-zinc-700"
              >
                Cancel
              </button>
            </div>
          </div>
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
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0B2545] dark:text-zinc-50">
              Maintenance Mode
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Toggle system wide notice and disable ordering
            </p>
          </div>
        </div>

        <section className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Maintenance mode is {maintenanceMode ? "ACTIVE" : "OFF"}
                </p>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                  {maintenanceMode
                    ? "Ordering is disabled. Customers see the notice below."
                    : "Site is live. Customers can place orders."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMaintenanceMode((v) => !v)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                maintenanceMode ? "bg-[#0077C8] dark:bg-sky-500" : "bg-slate-300 dark:bg-zinc-600"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                  maintenanceMode ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-2 text-sm font-bold text-[#0B2545] dark:text-zinc-100">
            Maintenance Notice Message
          </h2>
          <textarea
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            rows={3}
            className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <button
            type="button"
            disabled={busy}
            onClick={saveMaintenance}
            className="mb-3 flex items-center gap-2 rounded-xl bg-[#0077C8] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 dark:bg-sky-500"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Message
          </button>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
            <strong>Preview:</strong>{" "}
            {maintenanceMessage || "Maintenance in progress. Ordering is temporarily unavailable."}
          </div>
        </section>

        <section className="rounded-2xl border border-red-100 bg-red-50 p-5 dark:border-red-900/40 dark:bg-red-950/20">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <h2 className="text-sm font-bold text-red-900 dark:text-red-300">Danger Zone</h2>
          </div>
          <p className="mb-4 text-xs text-red-700/80 dark:text-red-400/80">
            Super admin only. Permanently deletes every order.
          </p>
          {isSuper ? (
            <button
              type="button"
              onClick={() => setShowReset(true)}
              className="w-full rounded-xl border border-red-200 bg-white py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-zinc-950 dark:text-red-400"
            >
              Reset Orders (delete all)
            </button>
          ) : (
            <p className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
              <Shield className="h-3.5 w-3.5" /> Only super admin can reset orders
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
