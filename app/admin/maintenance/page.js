"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { Wrench, AlertTriangle, Loader2, ArrowLeft, Shield } from "lucide-react";

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
      setMaintenanceMessage(s.maintenanceMessage || "");
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
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const isSuper = user?.email === SUPER;

  return (
    <div className="min-h-screen bg-[#EEF6FC] pb-16">
      <SiteHeader user={user} />
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-[#0B2545]">Reset all orders?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This permanently deletes <strong>all orders</strong>. Users, admins, hostels and settings are kept. Type <strong>RESET</strong> to confirm.
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type RESET"
              className="mt-3 w-full rounded-xl border border-red-200 px-3 py-2.5 text-sm font-mono uppercase"
              autoComplete="off"
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
                className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-lg px-4 py-6">
        <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[#0077C8]">
          <ArrowLeft className="h-4 w-4" /> Admin Office
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
            <Wrench className="h-5 w-5 text-amber-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0B2545]">Maintenance</h1>
            <p className="text-sm text-slate-500">Site mode & danger zone</p>
          </div>
        </div>

        <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-bold text-[#0B2545]">Maintenance Mode</h2>
          <p className="mb-4 text-xs text-slate-500">
            When ON, all visitors except admins see the maintenance page.
          </p>
          <label className="mb-3 flex items-center justify-between gap-3 rounded-xl border px-3 py-3 text-sm">
            <span className="font-medium text-[#0B2545]">
              Maintenance {maintenanceMode ? "ON" : "OFF"}
            </span>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="h-4 w-4"
            />
          </label>
          {maintenanceMode && (
            <textarea
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder="Message shown to customers…"
              rows={3}
              className="mb-3 w-full rounded-xl border px-3 py-2.5 text-sm"
            />
          )}
          <button
            type="button"
            disabled={busy}
            onClick={saveMaintenance}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0077C8] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save — Live now
          </button>
        </section>

        <section className="rounded-2xl border border-red-100 bg-red-50 p-5">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-sm font-bold text-red-900">Danger Zone</h2>
          </div>
          <p className="mb-4 text-xs text-red-700/80">
            Super admin only. Permanently deletes every order. Cannot be undone.
          </p>
          {isSuper ? (
            <button
              type="button"
              onClick={() => setShowReset(true)}
              className="w-full rounded-xl border border-red-200 bg-white py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Reset Orders (delete all)
            </button>
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
