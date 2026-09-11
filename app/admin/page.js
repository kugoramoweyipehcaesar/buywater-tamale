"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import {
  LayoutDashboard, Package, Settings, Home, Tag, Megaphone, Users,
  Loader2, RefreshCw, Trash2, Check, CreditCard, ClipboardCheck, Wrench, ListOrdered,
} from "lucide-react";

const SUPER = "kugoramoweyipehcaesar49@gmail.com";
const STATUS = ["PENDING", "PROCESSING", "CONFIRMED", "ON_THE_WAY", "DELIVERED", "CANCELLED"];
const ORDER_TABS = [
  { id: "all", label: "All", match: null },
  { id: "pending", label: "Pending", match: ["PENDING"] },
  { id: "processing", label: "Processing", match: ["PROCESSING", "CONFIRMED", "ON_THE_WAY"] },
  { id: "delivered", label: "Delivered", match: ["DELIVERED"] },
  { id: "cancelled", label: "Cancelled", match: ["CANCELLED"] },
];

function AdminInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderStatus = (searchParams.get("status") || "all").toLowerCase();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState("overview");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({});
  const [hostels, setHostels] = useState([]);
  const [promos, setPromos] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState([]);
  const [newHostel, setNewHostel] = useState("");
  const [newPromo, setNewPromo] = useState({ code: "", rewardValue: 1, maxUses: 100 });
  const [newAnn, setNewAnn] = useState({ title: "", body: "" });

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }

  const loadAll = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user || me.user.role !== "ADMIN") { router.push("/admin-login"); return; }
      setUser(me.user);
      const [ord, set, hos, pro, ann, us] = await Promise.all([
        fetch("/api/orders").then((r) => r.json()),
        fetch("/api/settings").then((r) => r.json()),
        fetch("/api/hostels").then((r) => r.json()),
        fetch("/api/promotions").then((r) => r.json()),
        fetch("/api/announcements").then((r) => r.json()),
        fetch("/api/users").then((r) => r.json()),
      ]);
      setOrders(ord.orders || []);
      const s = set.settings || {};
      setForm({
        serviceActive: s.serviceActive !== false,
        heroTitle: s.heroTitle || "",
        operatingHours: s.operatingHours || "",
        pricePerGallon: s.pricePerGallon ?? 2.5,
        subscriptionPrice: s.subscriptionPrice ?? 22,
        subscriptionGallons: s.subscriptionGallons ?? 10,
        deliveryTimeMin: s.deliveryTimeMin ?? 45,
        deliveryTimeMax: s.deliveryTimeMax ?? 60,
        adminPhone: s.adminPhone || "",
        adminEmail: s.adminEmail || "",
        serviceArea: s.serviceArea || "",
      });
      setHostels(hos.hostels || []);
      setPromos(pro.promos || []);
      setAnnouncements(ann.announcements || []);
      setUsers(us.users || []);
    } catch (e) {
      console.error(e);
      router.push("/admin-login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    if (searchParams.get("panel") === "orders") setPanel("orders");
  }, [searchParams]);

  const counts = useMemo(() => {
    const c = { all: orders.length, pending: 0, processing: 0, delivered: 0, cancelled: 0 };
    for (const o of orders) {
      if (o.status === "PENDING") c.pending++;
      else if (["PROCESSING", "CONFIRMED", "ON_THE_WAY"].includes(o.status)) c.processing++;
      else if (o.status === "DELIVERED") c.delivered++;
      else if (o.status === "CANCELLED") c.cancelled++;
    }
    return c;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const tab = ORDER_TABS.find((t) => t.id === orderStatus) || ORDER_TABS[0];
    if (!tab.match) return orders;
    return orders.filter((o) => tab.match.includes(o.status));
  }, [orders, orderStatus]);

  function setOrderTab(id) {
    router.push(id === "all" ? "/admin?panel=orders" : `/admin?panel=orders&status=${id}`);
    setPanel("orders");
  }

  async function saveSettings() {
    setBusy(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      showToast("Saved — Live now");
      router.refresh();
      await loadAll();
    } catch (e) {
      showToast(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function updateOrder(id, status) {
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      showToast("Order updated — Live now");
      await loadAll();
    } catch (e) {
      showToast(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteOrder(id) {
    if (!confirm("Delete this order?")) return;
    setBusy(true);
    try {
      await fetch(`/api/orders/${id}`, { method: "DELETE" });
      showToast("Order deleted — Live now");
      await loadAll();
    } finally {
      setBusy(false);
    }
  }

  async function addHostel() {
    if (!newHostel.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/hostels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newHostel.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setNewHostel("");
      showToast("Hostel added — Live now");
      await loadAll();
    } catch (e) {
      showToast(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteHostel(id) {
    setBusy(true);
    try {
      await fetch(`/api/hostels?id=${id}`, { method: "DELETE" });
      showToast("Hostel removed — Live now");
      await loadAll();
    } finally {
      setBusy(false);
    }
  }

  async function addPromo() {
    setBusy(true);
    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPromo),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setNewPromo({ code: "", rewardValue: 1, maxUses: 100 });
      showToast("Promo created — Live now");
      await loadAll();
    } catch (e) {
      showToast(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function addAnnouncement() {
    setBusy(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAnn),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setNewAnn({ title: "", body: "" });
      showToast("Announcement posted — Live now");
      await loadAll();
    } catch (e) {
      showToast(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteAnn(id) {
    setBusy(true);
    try {
      await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
      showToast("Removed — Live now");
      await loadAll();
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

  const live = orders.filter((o) => ["PENDING", "PROCESSING", "CONFIRMED", "ON_THE_WAY"].includes(o.status));
  const revenue = orders.filter((o) => o.status === "DELIVERED").reduce((s, o) => s + Number(o.totalAmount || 0), 0);

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: Package },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "hostels", label: "Hostels", icon: Home },
    { id: "promos", label: "Promos", icon: Tag },
    { id: "announce", label: "Announce", icon: Megaphone },
    { id: "users", label: "Users", icon: Users },
  ];

  const tools = [
    { href: "/admin/order-queue", label: "Order Queue", icon: ListOrdered, desc: "Live incoming queue" },
    { href: "/admin/order-verification", label: "Verification", icon: ClipboardCheck, desc: "Approve / reject" },
    { href: "/admin/payment-settings", label: "Payments", icon: CreditCard, desc: "Methods & MoMo" },
    { href: "/admin/maintenance", label: "Maintenance", icon: Wrench, desc: "Mode & reset" },
  ];

  return (
    <div className="min-h-screen bg-[#EEF6FC] pb-16">
      <SiteHeader user={user} />
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white shadow-lg">{toast}</div>
      )}

      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0B2545]">Admin Office</h1>
            <p className="text-sm text-slate-500">Live control · BuyWater Tamale</p>
          </div>
          <button type="button" onClick={loadAll} className="rounded-lg p-2 text-slate-400 hover:bg-white">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tools.map((t) => (
            <Link key={t.href} href={t.href} className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:border-[#0077C8]/40">
              <t.icon className="mb-1.5 h-5 w-5 text-[#0077C8]" />
              <p className="text-xs font-bold text-[#0B2545]">{t.label}</p>
              <p className="text-[10px] text-slate-500">{t.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mb-5 flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-sm">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setPanel(t.id);
                if (t.id === "orders") router.push("/admin?panel=orders");
              }}
              className={`flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold ${
                panel === t.id ? "bg-[#0077C8] text-white" : "text-slate-500"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {panel === "overview" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Card label="Live orders" value={live.length} />
            <Card label="All orders" value={orders.length} />
            <Card label="Revenue" value={`Ghc${revenue.toFixed(0)}`} />
          </div>
        )}

        {panel === "orders" && (
          <div>
            <div className="mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
              {ORDER_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setOrderTab(t.id)}
                  className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    orderStatus === t.id ? "bg-[#0077C8] text-white shadow" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {t.label} ({counts[t.id] ?? 0})
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredOrders.length === 0 && <Empty>No orders in this filter</Empty>}
              {filteredOrders.map((o) => (
                <div key={o.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#0B2545]">{o.orderNumber}</p>
                      <p className="text-sm text-slate-500">{o.customerName} · {o.phone} · {o.hostel || o.address}</p>
                      <p className="text-sm text-slate-500">{o.gallons} gal · Ghc{Number(o.totalAmount).toFixed(2)} · {o.paymentMethod}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">{o.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <select value={o.status} onChange={(e) => updateOrder(o.id, e.target.value)} className="rounded-lg border px-2 py-1.5 text-xs">
                      {STATUS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => deleteOrder(o.id)} className="rounded-lg border border-red-100 px-2 py-1.5 text-xs text-red-600">
                      <Trash2 className="inline h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {panel === "settings" && (
          <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">
              Maintenance & order reset: <Link href="/admin/maintenance" className="font-semibold text-[#0077C8]">Maintenance</Link>.
              Payments: <Link href="/admin/payment-settings" className="font-semibold text-[#0077C8]">Payment Settings</Link>.
            </p>
            <Toggle label="Service active" checked={!!form.serviceActive} onChange={(v) => setForm((f) => ({ ...f, serviceActive: v }))} />
            <Field label="Hero title" value={form.heroTitle} onChange={(v) => setForm((f) => ({ ...f, heroTitle: v }))} />
            <Field label="Operating hours" value={form.operatingHours} onChange={(v) => setForm((f) => ({ ...f, operatingHours: v }))} />
            <Field label="Service area" value={form.serviceArea} onChange={(v) => setForm((f) => ({ ...f, serviceArea: v }))} />
            <div className="grid grid-cols-2 gap-3">
              <Num label="Price / gallon" value={form.pricePerGallon} onChange={(v) => setForm((f) => ({ ...f, pricePerGallon: v }))} />
              <Num label="Sub price" value={form.subscriptionPrice} onChange={(v) => setForm((f) => ({ ...f, subscriptionPrice: v }))} />
              <Num label="Sub gallons" value={form.subscriptionGallons} onChange={(v) => setForm((f) => ({ ...f, subscriptionGallons: v }))} />
              <Num label="Delivery min" value={form.deliveryTimeMin} onChange={(v) => setForm((f) => ({ ...f, deliveryTimeMin: v }))} />
              <Num label="Delivery max" value={form.deliveryTimeMax} onChange={(v) => setForm((f) => ({ ...f, deliveryTimeMax: v }))} />
            </div>
            <Field label="Admin phone" value={form.adminPhone} onChange={(v) => setForm((f) => ({ ...f, adminPhone: v }))} />
            <Field label="Admin email" value={form.adminEmail} onChange={(v) => setForm((f) => ({ ...f, adminEmail: v }))} />
            <button type="button" disabled={busy} onClick={saveSettings} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0077C8] py-3 text-sm font-semibold text-white disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save — Live now
            </button>
          </div>
        )}

        {panel === "hostels" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input value={newHostel} onChange={(e) => setNewHostel(e.target.value)} placeholder="Hostel name" className="flex-1 rounded-xl border px-3 py-2.5 text-sm" />
              <button type="button" onClick={addHostel} className="rounded-xl bg-[#0077C8] px-4 text-sm font-semibold text-white">Add</button>
            </div>
            {hostels.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-xl border bg-white px-3 py-2.5">
                <span className="text-sm font-medium">{h.name}</span>
                <button type="button" onClick={() => deleteHostel(h.id)} className="text-xs text-red-600">Delete</button>
              </div>
            ))}
          </div>
        )}

        {panel === "promos" && (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <input value={newPromo.code} onChange={(e) => setNewPromo((p) => ({ ...p, code: e.target.value }))} placeholder="CODE" className="rounded-xl border px-3 py-2.5 text-sm" />
              <input type="number" value={newPromo.rewardValue} onChange={(e) => setNewPromo((p) => ({ ...p, rewardValue: Number(e.target.value) }))} placeholder="Free gallons" className="rounded-xl border px-3 py-2.5 text-sm" />
              <button type="button" onClick={addPromo} className="rounded-xl bg-[#0077C8] text-sm font-semibold text-white">Create</button>
            </div>
            {promos.map((p) => (
              <div key={p.id} className="rounded-xl border bg-white px-3 py-2.5 text-sm">
                <strong>{p.code}</strong> · {p.rewardValue} free · used {p.timesUsed}/{p.maxUses}
              </div>
            ))}
          </div>
        )}

        {panel === "announce" && (
          <div className="space-y-3">
            <input value={newAnn.title} onChange={(e) => setNewAnn((a) => ({ ...a, title: e.target.value }))} placeholder="Title" className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            <textarea value={newAnn.body} onChange={(e) => setNewAnn((a) => ({ ...a, body: e.target.value }))} placeholder="Message" className="w-full rounded-xl border px-3 py-2.5 text-sm" rows={3} />
            <button type="button" onClick={addAnnouncement} className="rounded-xl bg-[#0077C8] px-4 py-2.5 text-sm font-semibold text-white">Post</button>
            {announcements.map((a) => (
              <div key={a.id} className="rounded-xl border bg-white p-3 text-sm">
                <div className="flex justify-between">
                  <strong>{a.title}</strong>
                  <button type="button" onClick={() => deleteAnn(a.id)} className="text-xs text-red-600">Delete</button>
                </div>
                <p className="mt-1 text-slate-500">{a.body}</p>
              </div>
            ))}
          </div>
        )}

        {panel === "users" && (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5">
                {u.profilePhoto ? (
                  <img src={u.profilePhoto} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0077C8]/10 text-sm font-bold text-[#0077C8]">
                    {(u.name || u.email || "?").charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#0B2545]">
                    {u.name || u.username || u.email}
                    {u.role === "ADMIN" && (
                      <span className="ml-2 rounded-full bg-[#0077C8]/10 px-2 py-0.5 text-[10px] font-bold text-[#0077C8]">ADMIN</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">{u.email} · {u.phone || "—"} · {u.hostel || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link href="/" className="text-[#0077C8]">← Back to site</Link>
          {" · "}Super admin: {user?.email}
        </p>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-slate-500">Loading...</div>}>
      <AdminInner />
    </Suspense>
  );
}

function Card({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#0B2545]">{value}</p>
    </div>
  );
}
function Empty({ children }) {
  return <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">{children}</div>;
}
function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
    </div>
  );
}
function Num({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input type="number" step="any" value={value ?? ""} onChange={(e) => onChange(Number(e.target.value))} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
    </div>
  );
}
function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm">
      <span className="font-medium text-[#0B2545]">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
    </label>
  );
}
