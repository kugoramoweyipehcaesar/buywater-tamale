"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  Loader2, Trash2, Check, Search, Plus, UserPlus, Download,
} from "lucide-react";

const STATUS = ["PENDING", "PROCESSING", "CONFIRMED", "ON_THE_WAY", "DELIVERED", "CANCELLED"];
const ORDER_TABS = [
  { id: "all", label: "All", match: null },
  { id: "pending", label: "Pending", match: ["PENDING"] },
  { id: "processing", label: "Processing", match: ["PROCESSING", "CONFIRMED", "ON_THE_WAY"] },
  { id: "delivered", label: "Delivered", match: ["DELIVERED"] },
  { id: "cancelled", label: "Cancelled", match: ["CANCELLED"] },
];

function statusBadge(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PENDING") return "bg-orange-400 text-white";
  if (s === "CONFIRMED" || s === "DELIVERED") return "bg-emerald-500 text-white";
  if (s === "PROCESSING" || s === "ON_THE_WAY") return "bg-blue-500 text-white";
  if (s === "CANCELLED") return "bg-slate-400 text-white";
  return "bg-slate-200 text-slate-700";
}

function statusLabel(status) {
  const s = String(status || "").toUpperCase();
  if (s === "ON_THE_WAY" || s === "PROCESSING") return "Preparing";
  if (s === "PENDING") return "Pending";
  if (s === "CONFIRMED") return "Confirmed";
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function AdminInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderStatus = (searchParams.get("status") || "all").toLowerCase();
  const panelParam = searchParams.get("panel");
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState(panelParam || "overview");
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
  const [q, setQ] = useState("");

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
    if (panelParam) setPanel(panelParam);
    else setPanel("overview");
  }, [panelParam]);

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
    let list = !tab.match ? orders : orders.filter((o) => tab.match.includes(o.status));
    if (q.trim()) {
      const qq = q.toLowerCase();
      list = list.filter(
        (o) =>
          String(o.orderNumber || "").toLowerCase().includes(qq) ||
          String(o.customerName || "").toLowerCase().includes(qq) ||
          String(o.hostel || "").toLowerCase().includes(qq) ||
          String(o.address || "").toLowerCase().includes(qq)
      );
    }
    return list;
  }, [orders, orderStatus, q]);

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
    if (!newPromo.code.trim()) {
      showToast("Promo code required");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newPromo.code.trim(),
          rewardValue: Number(newPromo.rewardValue) || 1,
          maxUses: Number(newPromo.maxUses) || 100,
        }),
      });
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

  function exportCsv() {
    const rows = [["Order", "Customer", "Phone", "Location", "Gallons", "Amount", "Status", "Payment"]];
    for (const o of orders) {
      rows.push([
        o.orderNumber || "",
        o.customerName || "",
        o.phone || "",
        o.hostel || o.address || "",
        o.gallons || "",
        o.totalAmount || "",
        o.status || "",
        o.paymentMethod || "",
      ]);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "buywater-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
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
  const queueList = (live.length ? live : orders).slice(0, 8);
  const isDashboard = !panel || panel === "overview";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f1f5f9]">
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">{toast}</div>
      )}

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-black">Admin Office</h1>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <div className="relative min-w-[200px] max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search orders, users, hostels..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-black outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <Link
            href="/order"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> New Order
          </Link>
        </div>
      </header>

      <main className="flex-1 space-y-5 p-6">
        {/* ========== DASHBOARD ONLY ========== */}
        {isDashboard && (
          <>
            <p className="text-sm text-slate-500">Live control · BuyWater Tamale · Ghana water delivery</p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  Live orders
                </div>
                <p className="text-4xl font-black text-black">{live.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  All orders
                </div>
                <p className="text-4xl font-black text-black">{orders.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  Revenue
                </div>
                <p className="text-4xl font-black text-black">GHC {revenue.toFixed(0)}</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-black">Order Queue</h2>
                <p className="mb-4 text-sm text-slate-500">Live incoming queue — {live.length} active</p>
                <div className="space-y-3">
                  {queueList.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-400">No orders in queue</p>
                  )}
                  {queueList.map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-black">
                          <span className="text-slate-500">#{o.orderNumber || o.id?.slice(0, 6)}</span>{" "}
                          <span className="text-black">{o.hostel || o.address || o.customerName || "Order"}</span>
                        </p>
                        <p className="text-xs text-slate-500">
                          {o.gallons ? `${o.gallons}× unit` : "—"}{o.customerName ? ` · ${o.customerName}` : ""}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-bold ${statusBadge(o.status)}`}>
                        {statusLabel(o.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-black">Quick Actions</h2>
                <p className="mb-4 text-sm text-slate-500">Common tasks</p>
                <div className="space-y-2.5">
                  <Link href="/order" className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700">
                    <Plus className="h-4 w-4" /> Create New Order
                  </Link>
                  <Link href="/admin/users" className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-black hover:bg-slate-50">
                    <UserPlus className="h-4 w-4" /> Add New User
                  </Link>
                  <button type="button" onClick={exportCsv} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-black hover:bg-slate-50">
                    <Download className="h-4 w-4" /> Export Orders CSV
                  </button>
                  <Link href="/admin/payment-settings" className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-black hover:bg-slate-50">
                    <Settings className="h-4 w-4" /> Payment Settings
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========== ORDERS (full page) ========== */}
        {panel === "orders" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-black">Orders</h2>
            <div className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-1 shadow-sm">
              {ORDER_TABS.map((t) => (
                <button key={t.id} type="button" onClick={() => setOrderTab(t.id)} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition ${orderStatus === t.id ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-50"}`}>
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
                      <p className="font-bold text-black">{o.orderNumber}</p>
                      <p className="text-sm text-black">{o.customerName} · {o.phone}</p>
                      <p className="text-sm font-medium text-black">{o.hostel || o.address || "—"}</p>
                      <p className="text-sm text-slate-600">{o.gallons} gal · Ghc{Number(o.totalAmount).toFixed(2)} · {o.paymentMethod}</p>
                    </div>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${statusBadge(o.status)}`}>{statusLabel(o.status)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <select value={o.status} onChange={(e) => updateOrder(o.id, e.target.value)} className="rounded-lg border px-2 py-1.5 text-xs text-black">
                      {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button type="button" onClick={() => deleteOrder(o.id)} className="rounded-lg border border-red-100 px-2 py-1.5 text-xs text-red-600"><Trash2 className="inline h-3 w-3" /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== SETTINGS (full page) ========== */}
        {panel === "settings" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-black">Settings</h2>
            <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
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
              <button type="button" disabled={busy} onClick={saveSettings} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save — Live now
              </button>
            </div>
          </div>
        )}

        {/* ========== HOSTELS (full page, black names) ========== */}
        {panel === "hostels" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-black">Hostels</h2>
            <p className="text-sm text-slate-500">Manage delivery locations / hostel names</p>
            <div className="flex gap-2">
              <input
                value={newHostel}
                onChange={(e) => setNewHostel(e.target.value)}
                placeholder="Hostel name"
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-black placeholder:text-slate-400"
              />
              <button type="button" onClick={addHostel} disabled={busy} className="rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-60">
                Add
              </button>
            </div>
            <div className="space-y-2">
              {hostels.length === 0 && <Empty>No hostels yet</Empty>}
              {hostels.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <span className="text-sm font-semibold text-black">{h.name}</span>
                  <button type="button" onClick={() => deleteHostel(h.id)} className="text-xs font-medium text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== PROMOS (full page, gallons + max users) ========== */}
        {panel === "promos" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-black">Promos</h2>
            <p className="text-sm text-slate-500">Create promo codes with free gallons and user limit</p>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Promo code</label>
                  <input
                    value={newPromo.code}
                    onChange={(e) => setNewPromo((p) => ({ ...p, code: e.target.value }))}
                    placeholder="e.g. FREE2"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-black"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Free gallons</label>
                  <input
                    type="number"
                    min={1}
                    value={newPromo.rewardValue}
                    onChange={(e) => setNewPromo((p) => ({ ...p, rewardValue: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-black"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Max promo users</label>
                  <input
                    type="number"
                    min={1}
                    value={newPromo.maxUses}
                    onChange={(e) => setNewPromo((p) => ({ ...p, maxUses: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-black"
                  />
                </div>
              </div>
              <button type="button" onClick={addPromo} disabled={busy} className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                {busy ? <Loader2 className="inline h-4 w-4 animate-spin" /> : "Create promo"}
              </button>
            </div>
            <div className="space-y-2">
              {promos.length === 0 && <Empty>No promos yet</Empty>}
              {promos.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-sm font-bold text-black">{p.code}</p>
                  <p className="mt-1 text-sm text-black">
                    <span className="font-semibold">{p.rewardValue}</span> free gallon{Number(p.rewardValue) === 1 ? "" : "s"}
                    {" · "}
                    Used by <span className="font-semibold">{p.timesUsed ?? 0}</span>
                    {" / "}
                    <span className="font-semibold">{p.maxUses ?? "—"}</span> promo users
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========== ANNOUNCEMENTS (full page) ========== */}
        {panel === "announce" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-black">Announcements</h2>
            <p className="text-sm text-slate-500">Post messages visible on the public site</p>
            <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <input
                value={newAnn.title}
                onChange={(e) => setNewAnn((a) => ({ ...a, title: e.target.value }))}
                placeholder="Title"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-black"
              />
              <textarea
                value={newAnn.body}
                onChange={(e) => setNewAnn((a) => ({ ...a, body: e.target.value }))}
                placeholder="Message"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-black"
                rows={4}
              />
              <button type="button" onClick={addAnnouncement} disabled={busy} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                Post announcement
              </button>
            </div>
            <div className="space-y-2">
              {announcements.length === 0 && <Empty>No announcements yet</Empty>}
              {announcements.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div>
                    <p className="text-sm font-bold text-black">{a.title}</p>
                    <p className="mt-0.5 text-sm text-slate-700">{a.body}</p>
                  </div>
                  <button type="button" onClick={() => deleteAnn(a.id)} className="shrink-0 text-xs font-medium text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-3 text-center text-[11px] text-slate-500">
        BuyWater Ghana · Tamale · Water Delivery Management · Updated just now
      </footer>
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
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border px-3 py-2.5 text-sm text-black" />
    </div>
  );
}
function Num({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input type="number" step="any" value={value ?? ""} onChange={(e) => onChange(Number(e.target.value))} className="w-full rounded-xl border px-3 py-2.5 text-sm text-black" />
    </div>
  );
}
function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm">
      <span className="font-medium text-black">{label}</span>
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
