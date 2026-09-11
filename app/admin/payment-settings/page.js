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
  Check,
  Percent,
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
    cardEnabled: false,
    momoNumber: "",
    momoName: "",
    momoNumber2: "",
    momoName2: "",
    commissionPercent: 0,
    minOrderAmount: 0,
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
        cardEnabled: !!extra.cardEnabled,
        momoNumber: s.momoNumber || "",
        momoName: s.momoName || "",
        momoNumber2: s.momoNumber2 || "",
        momoName2: s.momoName2 || "",
        commissionPercent: Number(extra.commissionPercent) || 0,
        minOrderAmount: Number(extra.minOrderAmount) || 0,
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
        cardEnabled: form.cardEnabled,
        commissionPercent: form.commissionPercent,
        minOrderAmount: form.minOrderAmount,
        paymentMethods: {
          cash: form.cashEnabled,
          momo: form.momoEnabled,
          card: form.cardEnabled,
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
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const methods = [
    {
      key: "cashEnabled",
      title: "Pay on Delivery",
      desc: "Customer pays cash when water arrives",
      icon: Banknote,
      color: "bg-emerald-500",
    },
    {
      key: "momoEnabled",
      title: "Mobile Money",
      desc: "MTN, Vodafone, AirtelTigo",
      icon: Smartphone,
      color: "bg-[#0077C8]",
    },
    {
      key: "cardEnabled",
      title: "Card Payment",
      desc: "Visa / Mastercard (optional)",
      icon: CreditCard,
      color: "bg-violet-500",
    },
  ];

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
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0077C8]/10">
            <CreditCard className="h-5 w-5 text-[#0077C8]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0B2545]">Payment Settings</h1>
            <p className="text-sm text-slate-500">Methods & MoMo details</p>
          </div>
        </div>

        <section className="mb-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-[#0B2545]">Payment methods</h2>
          <div className="space-y-3">
            {methods.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setForm((f) => ({ ...f, [m.key]: !f[m.key] }))}
                className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
                  form[m.key] ? "border-[#0077C8] bg-[#0077C8]/5" : "border-slate-100 bg-slate-50"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${m.color}`}>
                  <m.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#0B2545]">{m.title}</p>
                  <p className="text-xs text-slate-500">{m.desc}</p>
                </div>
                <span
                  className={`h-5 w-5 rounded-full border-2 ${
                    form[m.key] ? "border-[#0077C8] bg-[#0077C8]" : "border-slate-300"
                  }`}
                />
              </button>
            ))}
          </div>
        </section>

        <section className="mb-5 space-y-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-[#0B2545]">Mobile Money accounts</h2>
          <Field label="Primary MoMo number" value={form.momoNumber} onChange={(v) => setForm((f) => ({ ...f, momoNumber: v }))} />
          <Field label="Account name" value={form.momoName} onChange={(v) => setForm((f) => ({ ...f, momoName: v }))} />
          <Field label="Secondary MoMo number" value={form.momoNumber2} onChange={(v) => setForm((f) => ({ ...f, momoNumber2: v }))} />
          <Field label="Secondary name" value={form.momoName2} onChange={(v) => setForm((f) => ({ ...f, momoName2: v }))} />
        </section>

        <section className="mb-5 space-y-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-[#0B2545]">
            <Percent className="h-4 w-4" /> Commission & limits
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Commission %</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={form.commissionPercent}
                onChange={(e) => setForm((f) => ({ ...f, commissionPercent: Number(e.target.value) }))}
                className="w-full rounded-xl border px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Min order (Ghc)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.minOrderAmount}
                onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: Number(e.target.value) }))}
                className="w-full rounded-xl border px-3 py-2.5 text-sm"
              />
            </div>
          </div>
        </section>

        <button
          type="button"
          disabled={busy}
          onClick={save}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0077C8] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Save — Live now
        </button>
      </main>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-3 py-2.5 text-sm"
      />
    </div>
  );
}
