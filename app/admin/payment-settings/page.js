"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import {
  CreditCard,
  Banknote,
  Smartphone,
  ArrowLeft,
  Loader2,
  Save,
} from "lucide-react";

export default function PaymentSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({
    cashEnabled: true,
    momoEnabled: true,
    momoNumber: "",
    momoName: "",
    momoNumber2: "",
    momoName2: "",
    momoNumber3: "",
    momoName3: "",
    otherMethods: "",
    primaryPhone: "",
    secondaryPhone: "",
  });

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
      let extra = {};
      try {
        extra = s.contentJson ? JSON.parse(s.contentJson) : {};
      } catch (_) {}
      setForm({
        cashEnabled: s.cashEnabled !== false,
        momoEnabled: s.momoEnabled !== false,
        momoNumber: s.momoNumber || "",
        momoName: s.momoName || "",
        momoNumber2: s.momoNumber2 || "",
        momoName2: s.momoName2 || "",
        momoNumber3: extra.momoNumber3 || "",
        momoName3: extra.momoName3 || "",
        otherMethods: extra.otherMethods || "",
        primaryPhone: s.adminPhone || s.momoNumber || "",
        secondaryPhone: extra.secondaryPhone || "",
      });
    } catch {
      router.push("/admin-login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setBusy(true);
    try {
      const contentJson = JSON.stringify({
        momoNumber3: form.momoNumber3,
        momoName3: form.momoName3,
        otherMethods: form.otherMethods,
        secondaryPhone: form.secondaryPhone,
        paymentMethods: {
          cash: form.cashEnabled,
          momo: form.momoEnabled,
        },
      });
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cashEnabled: form.cashEnabled,
          momoEnabled: form.momoEnabled,
          momoNumber: form.momoNumber,
          momoName: form.momoName,
          momoNumber2: form.momoNumber2,
          momoName2: form.momoName2,
          adminPhone: form.primaryPhone,
          contentJson,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      showToast("Payment settings saved — Live now");
      router.refresh();
    } catch (e) {
      showToast(e.message || "Save failed");
    } finally {
      setBusy(false);
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
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-2xl px-4 py-6">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[#0077C8] dark:text-sky-400"
        >
          <ArrowLeft className="h-4 w-4" /> Admin Office
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0077C8] text-white">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0B2545] dark:text-zinc-50">
              Payment Settings
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Manage MoMo details and payment modes
            </p>
          </div>
        </div>

        <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-bold text-[#0B2545] dark:text-zinc-100">
            Payment Modes
          </h2>
          <ModeRow
            icon={Banknote}
            title="Cash on Delivery"
            desc="Accept cash payments"
            on={form.cashEnabled}
            onToggle={() => setForm((f) => ({ ...f, cashEnabled: !f.cashEnabled }))}
          />
          <div className="my-2 border-t border-slate-100 dark:border-zinc-800" />
          <ModeRow
            icon={Smartphone}
            title="Mobile Money"
            desc="Accept MoMo payments"
            on={form.momoEnabled}
            onToggle={() => setForm((f) => ({ ...f, momoEnabled: !f.momoEnabled }))}
          />
        </section>

        <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-bold text-[#0B2545] dark:text-zinc-100">
            MoMo Merchant Details
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="MoMo Number" value={form.momoNumber} onChange={(v) => setForm((f) => ({ ...f, momoNumber: v }))} placeholder="0502748671" />
            <Field label="MoMo Account Name" value={form.momoName} onChange={(v) => setForm((f) => ({ ...f, momoName: v }))} placeholder="Account holder name" />
            <Field label="MoMo Number 2 (Optional)" value={form.momoNumber2} onChange={(v) => setForm((f) => ({ ...f, momoNumber2: v }))} placeholder="Additional MoMo number" />
            <Field label="MoMo Account Name 2" value={form.momoName2} onChange={(v) => setForm((f) => ({ ...f, momoName2: v }))} placeholder="Account holder name" />
            <Field label="MoMo Number 3 (Optional)" value={form.momoNumber3} onChange={(v) => setForm((f) => ({ ...f, momoNumber3: v }))} placeholder="Additional MoMo number" />
            <Field label="MoMo Account Name 3" value={form.momoName3} onChange={(v) => setForm((f) => ({ ...f, momoName3: v }))} placeholder="Account holder name" />
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-1 text-sm font-bold text-[#0B2545] dark:text-zinc-100">
            Other Payment Methods
          </h2>
          <p className="mb-2 text-xs text-slate-500 dark:text-zinc-400">
            Additional Methods (e.g. Bank Transfer, PayPal)
          </p>
          <textarea
            value={form.otherMethods}
            onChange={(e) => setForm((f) => ({ ...f, otherMethods: e.target.value }))}
            rows={3}
            placeholder="Enter details for any additional payment methods you accept..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </section>

        <section className="mb-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-bold text-[#0B2545] dark:text-zinc-100">
            Contact Phone Numbers
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Primary Phone" value={form.primaryPhone} onChange={(v) => setForm((f) => ({ ...f, primaryPhone: v }))} />
            <Field label="Secondary Phone" value={form.secondaryPhone} onChange={(v) => setForm((f) => ({ ...f, secondaryPhone: v }))} />
          </div>
        </section>

        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0077C8] py-3 text-sm font-semibold text-white disabled:opacity-60 dark:bg-sky-500"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Payment Settings
        </button>
      </main>
    </div>
  );
}

function ModeRow({ icon: Icon, title, desc, on, onToggle }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-zinc-800">
        <Icon className="h-5 w-5 text-slate-600 dark:text-zinc-300" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-[#0B2545] dark:text-zinc-100">{title}</p>
        <p className="text-xs text-slate-500 dark:text-zinc-400">{desc}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`relative h-7 w-12 rounded-full transition-colors ${
          on ? "bg-[#0077C8] dark:bg-sky-500" : "bg-slate-200 dark:bg-zinc-700"
        }`}
        aria-pressed={on}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            on ? "left-5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
        {label}
      </label>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
      />
    </div>
  );
}
