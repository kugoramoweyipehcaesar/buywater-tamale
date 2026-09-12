"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

  async function savePayload(nextForm) {
    const contentJson = JSON.stringify({
      momoNumber3: nextForm.momoNumber3,
      momoName3: nextForm.momoName3,
      otherMethods: nextForm.otherMethods,
      secondaryPhone: nextForm.secondaryPhone,
      paymentMethods: {
        cash: nextForm.cashEnabled,
        momo: nextForm.momoEnabled,
      },
    });
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cashEnabled: nextForm.cashEnabled,
        momoEnabled: nextForm.momoEnabled,
        momoNumber: nextForm.momoNumber,
        momoName: nextForm.momoName,
        momoNumber2: nextForm.momoNumber2,
        momoName2: nextForm.momoName2,
        adminPhone: nextForm.primaryPhone,
        contentJson,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Save failed");
    return data;
  }

  async function toggleMode(key) {
    const next = { ...form, [key]: !form[key] };
    setForm(next);
    setBusy(true);
    try {
      await savePayload(next);
      showToast(
        `${key === "cashEnabled" ? "Cash" : "Mobile Money"} ${next[key] ? "enabled" : "disabled"} site-wide`
      );
      router.refresh();
    } catch (e) {
      setForm(form);
      showToast(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    try {
      await savePayload(form);
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
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

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
          <img src="/logo.jpg" alt="BuyWater" className="h-11 w-11 rounded-full object-cover ring-2 ring-sky-200" />
          <div>
            <h1 className="text-xl font-bold text-black">Payment Settings</h1>
            <p className="text-sm text-slate-500">
              Toggles apply live to the customer order form site-wide
            </p>
          </div>
        </div>

        <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-black">Payment Modes</h2>
          <ModeRow
            icon={Banknote}
            title="Cash on Delivery"
            desc="Show cash option on order page"
            on={form.cashEnabled}
            disabled={busy}
            onToggle={() => toggleMode("cashEnabled")}
          />
          <div className="my-2 border-t border-slate-100" />
          <ModeRow
            icon={Smartphone}
            title="Mobile Money"
            desc="Show MoMo option on order page"
            on={form.momoEnabled}
            disabled={busy}
            onToggle={() => toggleMode("momoEnabled")}
          />
        </section>

        <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-black">MoMo Merchant Details</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="MoMo Number" value={form.momoNumber} onChange={(v) => setForm((f) => ({ ...f, momoNumber: v }))} placeholder="0502748671" />
            <Field label="MoMo Account Name" value={form.momoName} onChange={(v) => setForm((f) => ({ ...f, momoName: v }))} placeholder="Account holder name" />
            <Field label="MoMo Number 2 (Optional)" value={form.momoNumber2} onChange={(v) => setForm((f) => ({ ...f, momoNumber2: v }))} placeholder="Additional MoMo number" />
            <Field label="MoMo Account Name 2" value={form.momoName2} onChange={(v) => setForm((f) => ({ ...f, momoName2: v }))} placeholder="Account holder name" />
            <Field label="MoMo Number 3 (Optional)" value={form.momoNumber3} onChange={(v) => setForm((f) => ({ ...f, momoNumber3: v }))} placeholder="Additional MoMo number" />
            <Field label="MoMo Account Name 3" value={form.momoName3} onChange={(v) => setForm((f) => ({ ...f, momoName3: v }))} placeholder="Account holder name" />
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-bold text-black">Other Payment Methods</h2>
          <p className="mb-2 text-xs text-slate-500">Additional Methods (e.g. Bank Transfer)</p>
          <textarea
            value={form.otherMethods}
            onChange={(e) => setForm((f) => ({ ...f, otherMethods: e.target.value }))}
            rows={3}
            placeholder="Enter details for any additional payment methods..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-black"
          />
        </section>

        <section className="mb-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-black">Contact Phone Numbers</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Primary Phone" value={form.primaryPhone} onChange={(v) => setForm((f) => ({ ...f, primaryPhone: v }))} />
            <Field label="Secondary Phone" value={form.secondaryPhone} onChange={(v) => setForm((f) => ({ ...f, secondaryPhone: v }))} />
          </div>
        </section>

        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0077C8] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Payment Settings
        </button>
      </main>
    </div>
  );
}

function ModeRow({ icon: Icon, title, desc, on, onToggle, disabled }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
        <Icon className="h-5 w-5 text-slate-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-black">{title}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className={`relative h-7 w-12 rounded-full transition-colors ${on ? "bg-[#0077C8]" : "bg-slate-200"}`}
        aria-pressed={on}
      >
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${on ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-black"
      />
    </div>
  );
}
