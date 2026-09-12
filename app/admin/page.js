"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Package, Settings, Home, Tag, Megaphone, Users,
  Loader2, RefreshCw, Trash2, Check, CreditCard, ClipboardCheck,
} from "lucide-react";

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
      const res = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      showToast("Saved — Live now");
      await loadAll();
    } catch (e) { showToast(e.message || "Save failed"); }
    finally { setBusy(false); }
  }

  async function updateOrder(id, status) {
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!res.ok) throw new Error((await res.json()).error || "Update failed");
      showToast("Order updated — Live now");
      await loadAll();
    } catch (e) { showToast(e.message); }
    finally { setBusy(false); }
  }

  async function deleteOrder(id) {
    if (!confirm("Delete this order?")) return;
    setBusy(true);
    try {
      await fetch(`/api/orders/${id}`, { method: "DELETE" });
      showToast("Order deleted — Live now");
      await loadAll();
    } finally { setBusy(false); }
  }

  async function addHostel() {
    if (!newHostel.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/hostels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newHostel.trim() }) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setNewHostel("");
      showToast("Hostel added — Live now");
      await loadAll();
    } catch (e) { showToast(e.message); }
    finally { setBusy(false); }
  }

  async function deleteHostel(id) {
    setBusy(true);
    try {
      await fetch(`/api/hostels?id=${id}`, { method: "DELETE" });
      showToast("Hostel removed — Live now");
      await loadAll();
    } finally { setBusy(false); }
  }

  async function addPromo() {
    setBusy(true);
    try {
      const res = await fetch("/api/promotions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newPromo) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setNewPromo({ code: "", rewardValue: 1, maxUses: 100 });
      showToast("Promo created — Live now");
      await loadAll();
    } catch (e) { showToast(e.message); }
    finally { setBusy(false); }
  }

  async function addAnnouncement() {
    setBusy(true);
    try {
      const res = await fetch("/api/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newAnn) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setNewAnn({ title: "", body: "" });
      showToast("Announcement posted — Live now");
      await loadAll();
    } catch (e) { showToast(e.message); }
    finally { setBusy(false); }
  }

  async function deleteAnn(id) {
    setBusy(true);
    try {
      await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
      showToast("Removed — Live now");
      await loadAll();
    } finally { setBusy(false); }
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
  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const recentQueue = live.slice(0, 6);

  function timeAgo(d) {
    if (!d) return "";
    const m = Math.max(1, Math.floor((Date.now() - new Date(d).getTime()) / 60000));
    if (m < 60) return `${m} min ago`;
    return `${Math.floor(m / 60)}h ago`;
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: Package },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "hostels", label: "Hostels", icon: Home },
    { id: "promos", label: "Promos", icon: Tag },
    { id: "announce", label: "Announce", icon: Megaphone },
    { id: "users", label: "Users", icon: Users },
  ];

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f1f5f9] dark:bg-zinc-950">
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white shadow-lg">{toast}</div>
      )}

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-zinc-50">Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">Ghana water delivery · Live control — BuyWater Tamale · Updated just now</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="search" placeholder="Search orders, users..." className="w-44 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-950 sm:w-56" />
          <button type="button" className="relative rounded-lg border border-slate-200 p-2 text-slate-600 dark:border-zinc-700" aria-label="Notifications">
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">1</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" /></svg>
          </button>
          <Link href="/order" className="inline-flex items-center gap-1 rounded-lg bg-[#0284c7] px-3 py-2 text-sm font-semibold text-white hover:bg-sky-600">+ New Order</Link>
          <button type="button" onClick={loadAll} className="rounded-lg border border-slate-200 p-2 text-slate-500 dark:border-zinc-700" title="Refresh"><RefreshCw className="h-4 w-4" /></button>
        </div>
      </header>

      <main className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Live orders</p>
                <p className="mt-1 text-3xl font-black text-slate-900 dark:text-zinc-50">{live.length}</p>
                <p className="mt-1 text-xs font-medium text-emerald-600">↑ Active pipeline</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600"><Package className="h-5 w-5" /></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">All orders</p>
                <p className="mt-1 text-3xl font-black text-slate-900 dark:text-zinc-50">{orders.length}</p>
                <p className="mt-1 text-xs text-slate-500">Today · {orders.length} total</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600"><ClipboardCheck className="h-5 w-5" /></div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">Revenue (GHC)</p>
                <p className="mt-1 text-3xl font-black text-slate-900 dark:text-zinc-50">GHC {revenue.toFixed(0)}</p>
                <p className="mt-1 text-xs text-slate-500">{revenue > 0 ? "This month · From delivered" : "This month · No payments yet"}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><CreditCard className="h-5 w-5" /></div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-zinc-800">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-zinc-50">Order Queue</h2>
                <p className="text-xs text-slate-500">Live incoming orders — {pendingOrders.length} pending</p>
              </div>
              <Link href="/admin/order-queue" className="text-xs font-semibold text-[#0284c7]">View all</Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {recentQueue.length === 0 && <p className="px-5 py-8 text-center text-sm text-slate-500">No live orders</p>}
              {recentQueue.map((o) => {
                const isPending = o.status === "PENDING";
                return (
                  <div key={o.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-zinc-50">#{o.orderNumber || o.id?.slice(0, 8)}</p>
                        <p className="mt-0.5 text-sm text-slate-600 dark:text-zinc-300">{o.gallons}L · {o.customerName || "Customer"} · {o.hostel || o.address || "Tamale"}</p>
                        <p className="mt-1 text-xs text-slate-500">Placed {timeAgo(o.createdAt)} · Payment: {o.paymentMethod || "MoMo"} — {isPending ? "Pending verification" : "In progress"}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${isPending ? "bg-orange-100 text-orange-700" : "bg-sky-100 text-sky-700"}`}>{isPending ? "Pending" : "Verifying"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-zinc-800">
              <h2 className="font-bold text-slate-900 dark:text-zinc-50">Quick Actions</h2>
              <p className="text-xs text-slate-500">Common tasks</p>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              <Link href="/admin/order-verification" className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-sky-300 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-50">Review Verifications</p>
                <p className="mt-1 text-xs text-orange-600">{pendingOrders.length} pending</p>
              </Link>
              <Link href="/admin/payment-settings" className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-sky-300 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-50">Review Payments</p>
                <p className="mt-1 text-xs text-sky-600">{pendingOrders.length} pending</p>
              </Link>
              <Link href="/admin/maintenance" className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-sky-300 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-50">Maintenance Requests</p>
                <p className="mt-1 text-xs text-slate-500">0 open</p>
              </Link>
              <Link href="/admin/users" className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-sky-300 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-50">Manage Users</p>
                <p className="mt-1 text-xs text-slate-500">{users.length} total users</p>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-100 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => { setPanel(t.id); if (t.id === "orders") router.push("/admin?panel=orders"); }} className={`flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold ${panel === t.id ? "bg-[#0284c7] text-white" : "text-slate-500 hover:bg-slate-50"}`}>
              <t.icon className="h-3.5 w-3.5" />{t.label}
            </button>
          ))}
        </div>

        {panel === "orders" && (
          <div>
            <div className="mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              {ORDER_TABS.map((t) => (
                <button key={t.id} type="button" onClick={() => setOrderTab(t.id)} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition ${orderStatus === t.id ? "bg-[#0284c7] text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}>
                  {t.label} ({counts[t.id] ?? 0})
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {filteredOrders.length === 0 && <Empty>No orders in this filter</Empty>}
              {filteredOrders.map((o) => (
                <div key={o.id} className="rounded-2xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-[#0B2545] dark:text-zinc-50">{o.orderNumber}</p>
                      <p className="text-sm text-slate-500">{o.customerName} · {o.phone} · {o.hostel || o.address}</p>
                      <p className="text-sm text-slate-500">{o.gallons} gal · Ghc{Number(o.totalAmount).toFixed(2)} · {o.paymentMethod}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold dark:bg-zinc-800">{o.status}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <select value={o.status} onChange={(e) => updateOrder(o.id, e.target.value)} className="rounded-lg border px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950">
                      {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button type="button" onClick={() => deleteOrder(o.id)} className="rounded-lg border border-red-100 px-2 py-1.5 text-xs text-red-600"><Trash2 className="inline h-3 w-3" /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {panel === "settings" && (
          <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
            <button type="button" disabled={busy} onClick={saveSettings} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0284c7] py-3 text-sm font-semibold text-white disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save — Live now
            </button>
          </div>
        )}

        {panel === "hostels" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input value={newHostel} onChange={(e) => setNewHostel(e.target.value)} placeholder="Hostel name" className="flex-1 rounded-xl border px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
              <button type="button" onClick={addHostel} className="rounded-xl bg-[#0284c7] px-4 text-sm font-semibold text-white">Add</button>
            </div>
            {hostels.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-xl border bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-sm font-medium">{h.name}</span>
                <button type="button" onClick={() => deleteHostel(h.id)} className="text-xs text-red-600">Delete</button>
              </div>
            ))}
          </div>
        )}

        {panel === "promos" && (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <input value={newPromo.code} onChange={(e) => setNewPromo((p) => ({ ...p, code: e.target.value }))} placeholder="CODE" className="rounded-xl border px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
              <input type="number" value={newPromo.rewardValue} onChange={(e) => setNewPromo((p) => ({ ...p, rewardValue: Number(e.target.value) }))} className="rounded-xl border px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
              <button type="button" onClick={addPromo} className="rounded-xl bg-[#0284c7] text-sm font-semibold text-white">Create</button>
            </div>
            {promos.map((p) => (
              <div key={p.id} className="rounded-xl border bg-white px-3 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"><strong>{p.code}</strong> · {p.rewardValue} free · used {p.timesUsed}/{p.maxUses}</div>
            ))}
          </div>
        )}

        {panel === "announce" && (
          <div className="space-y-3">
            <input value={newAnn.title} onChange={(e) => setNewAnn((a) => ({ ...a, title: e.target.value }))} placeholder="Title" className="w-full rounded-xl border px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
            <textarea value={newAnn.body} onChange={(e) => setNewAnn((a) => ({ ...a, body: e.target.value }))} placeholder="Message" className="w-full rounded-xl border px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950" rows={3} />
            <button type="button" onClick={addAnnouncement} className="rounded-xl bg-[#0284c7] px-4 py-2.5 text-sm font-semibold text-white">Post</button>
            {announcements.map((a) => (
              <div key={a.id} className="flex items-start justify-between rounded-xl border bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
                <div><p className="text-sm font-semibold">{a.title}</p><p className="text-xs text-slate-500">{a.body}</p></div>
                <button type="button" onClick={() => deleteAnn(a.id)} className="text-xs text-red-600">Delete</button>
              </div>
            ))}
          </div>
        )}

        {panel === "users" && (
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl border bg-white px-3 py-2.5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div><p className="font-semibold">{u.name || u.email}</p><p className="text-xs text-slate-500">{u.email} · {u.role}</p></div>
              </div>
            ))}
            {users.length === 0 && <Empty>No users</Empty>}
            <Link href="/admin/users" className="text-sm font-semibold text-[#0284c7]">Open full User Directory →</Link>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-3 text-center text-[11px] text-slate-500 dark:border-zinc-800 dark:bg-zinc-900">
        BuyWater Admin — Ghana Water Delivery · Tamale | Last sync:{" "}
        {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "GMT" })} GMT ·{" "}
        <Link href="/" className="font-semibold text-[#0284c7]">Back to site</Link>
      </footer>
    </div>
  );
}

function Empty({ children }) {
  return <div className="rounded-2xl border bg-white p-8 text-center text-slate-500 dark:border-zinc-800 dark:bg-zinc-900">{children}</div>;
}
function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
    </div>
  );
}
function Num({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input type="number" step="any" value={value ?? ""} onChange={(e) => onChange(Number(e.target.value))} className="w-full rounded-xl border px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
    </div>
  );
}
function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm dark:border-zinc-700">
      <span className="font-medium text-[#0B2545] dark:text-zinc-100">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
    </label>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <AdminInner />
    </Suspense>
  );
}
