"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import {
  LayoutDashboard, Settings, Package, Users, Megaphone, Tag, Building2,
  RefreshCw, Loader2, CheckCircle2, X, Truck, DollarSign, Power,
  AlertTriangle, Plus, Trash2, Save,
} from "lucide-react";

const STATUS_OPTIONS = ["PENDING","PROCESSING","CONFIRMED","ON_THE_WAY","DELIVERED","CANCELLED"];
const STATUS_BADGE = {
  PENDING: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  ON_THE_WAY: "bg-cyan-100 text-cyan-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState("overview");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [promos, setPromos] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({});
  const [newHostel, setNewHostel] = useState("");
  const [newPromo, setNewPromo] = useState({ code: "", rewardValue: 1, maxUses: 100, description: "" });
  const [newAnn, setNewAnn] = useState({ title: "", body: "", type: "info" });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3200); };

  const loadAll = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user || me.user.role !== "ADMIN") { router.push("/login"); return; }
      setUser(me.user);
      const [ord, set, hos, pro, ann, usr] = await Promise.all([
        fetch("/api/orders").then((r) => r.json()),
        fetch("/api/settings").then((r) => r.json()),
        fetch("/api/hostels").then((r) => r.json()),
        fetch("/api/promotions").then((r) => r.json()),
        fetch("/api/announcements").then((r) => r.json()),
        fetch("/api/users").then((r) => r.json()),
      ]);
      setOrders(ord.orders || []);
      const s = set.settings || {};
      setSettings(s);
      setForm({
        serviceActive: s.serviceActive !== false,
        maintenanceMode: !!s.maintenanceMode,
        maintenanceMessage: s.maintenanceMessage || "",
        heroTitle: s.heroTitle || "Fresh Water Delivered",
        operatingHours: s.operatingHours || "7 AM - 8:30 PM DAILY",
        productDescription: s.productDescription || "",
        deliveryTimeMin: s.deliveryTimeMin ?? 45,
        deliveryTimeMax: s.deliveryTimeMax ?? 60,
        pricePerGallon: s.pricePerGallon ?? 2.5,
        subscriptionPrice: s.subscriptionPrice ?? 22,
        subscriptionGallons: s.subscriptionGallons ?? 10,
        gallonSize: s.gallonSize ?? 20,
        cashEnabled: s.cashEnabled !== false,
        momoEnabled: s.momoEnabled !== false,
        momoNumber: s.momoNumber || "",
        momoName: s.momoName || "",
        momoNumber2: s.momoNumber2 || "",
        momoName2: s.momoName2 || "",
        adminPhone: s.adminPhone || "",
        adminEmail: s.adminEmail || "",
        serviceArea: s.serviceArea || "Tamale UDS and environs",
      });
      setHostels(hos.hostels || []);
      setPromos(pro.promos || []);
      setAnnouncements(ann.announcements || []);
      setUsers(usr.users || []);
    } catch (e) {
      console.error(e);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function saveSettings(e) {
    e?.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Save failed"); return; }
      setSettings(data.settings);
      showToast("Saved — Live now");
      await loadAll();
      router.refresh();
    } catch { showToast("Network error"); }
    finally { setBusy(false); }
  }

  async function updateOrderStatus(id, status) {
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { const d = await res.json(); showToast(d.error || "Update failed"); return; }
      showToast(`Order → ${status}`);
      await loadAll();
    } finally { setBusy(false); }
  }

  async function deleteOrder(id) {
    if (!confirm("Delete this order permanently?")) return;
    setBusy(true);
    try {
      await fetch(`/api/orders/${id}`, { method: "DELETE" });
      showToast("Order deleted");
      await loadAll();
    } finally { setBusy(false); }
  }

  async function addHostel(e) {
    e.preventDefault();
    if (!newHostel.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/hostels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newHostel.trim() }),
      });
      if (!res.ok) { const d = await res.json(); showToast(d.error || "Failed"); return; }
      setNewHostel("");
      showToast("Hostel added — Live now");
      await loadAll();
    } finally { setBusy(false); }
  }

  async function removeHostel(id) {
    if (!confirm("Remove this hostel?")) return;
    setBusy(true);
    try {
      await fetch(`/api/hostels?id=${id}`, { method: "DELETE" });
      showToast("Hostel removed");
      await loadAll();
    } finally { setBusy(false); }
  }

  async function addPromo(e) {
    e.preventDefault();
    if (!newPromo.code.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPromo),
      });
      if (!res.ok) { const d = await res.json(); showToast(d.error || "Failed"); return; }
      setNewPromo({ code: "", rewardValue: 1, maxUses: 100, description: "" });
      showToast("Promo created — Live now");
      await loadAll();
    } finally { setBusy(false); }
  }

  async function togglePromo(id, active) {
    setBusy(true);
    try {
      await fetch("/api/promotions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active }),
      });
      showToast(active ? "Promo activated" : "Promo deactivated");
      await loadAll();
    } finally { setBusy(false); }
  }

  async function addAnnouncement(e) {
    e.preventDefault();
    if (!newAnn.title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAnn),
      });
      if (!res.ok) { const d = await res.json(); showToast(d.error || "Failed"); return; }
      setNewAnn({ title: "", body: "", type: "info" });
      showToast("Announcement posted — Live now");
      await loadAll();
    } finally { setBusy(false); }
  }

  async function removeAnnouncement(id) {
    setBusy(true);
    try {
      await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
      showToast("Announcement removed");
      await loadAll();
    } finally { setBusy(false); }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading admin…
      </div>
    );
  }

  const liveOrders = orders.filter((o) =>
    ["PENDING", "PROCESSING", "CONFIRMED", "ON_THE_WAY"].includes(o.status)
  );
  const revenue = orders.filter((o) => o.status === "DELIVERED").reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const totalGallons = orders.filter((o) => o.status !== "CANCELLED").reduce((s, o) => s + Number(o.gallons || 0), 0);

  const nav = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: Package },
    { id: "settings", label: "System Settings", icon: Settings },
    { id: "hostels", label: "Hostels", icon: Building2 },
    { id: "promos", label: "Promo Codes", icon: Tag },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "users", label: "Users", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#EEF6FC] pb-16">
      <SiteHeader user={user} />
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#0B2545] px-5 py-2.5 text-sm font-medium text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          {toast}
          <button type="button" onClick={() => setToast("")} className="ml-1"><X className="h-3.5 w-3.5 opacity-70" /></button>
        </div>
      )}
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#0B2545]">Admin Office</h1>
            <p className="text-sm text-slate-500">Super admin live control · changes apply site-wide immediately</p>
          </div>
          <button type="button" onClick={() => loadAll()} className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50">
            <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
        <div className="mb-6 flex flex-wrap gap-1.5">
          {nav.map((n) => (
            <button key={n.id} type="button" onClick={() => setPanel(n.id)} className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
              panel === n.id ? "bg-[#0077C8] text-white shadow" : "bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            }`}>
              <n.icon className="h-3.5 w-3.5" />{n.label}
            </button>
          ))}
        </div>

        {panel === "overview" && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Live orders", value: liveOrders.length, icon: Truck, color: "text-[#0077C8]" },
                { label: "Total orders", value: orders.length, icon: Package, color: "text-indigo-600" },
                { label: "Gallons sold", value: totalGallons, icon: DollarSign, color: "text-emerald-600" },
                { label: "Revenue (delivered)", value: `Ghc${revenue.toFixed(0)}`, icon: DollarSign, color: "text-amber-600" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-500">{s.label}</p>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-[#0B2545]">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-[#0B2545]">Live order queue</h2>
                <button type="button" onClick={() => setPanel("orders")} className="text-xs font-semibold text-[#0077C8]">View all</button>
              </div>
              {liveOrders.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-400">No active orders</p>
              ) : (
                <div className="space-y-2">
                  {liveOrders.slice(0, 8).map((o) => (
                    <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-[#0B2545]">{o.orderNumber} · {o.customerName}</p>
                        <p className="text-xs text-slate-500">{o.gallons} gal · {o.hostel || o.address} · Ghc{Number(o.totalAmount).toFixed(2)}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[o.status] || "bg-slate-100"}`}>{o.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <button type="button" onClick={() => setPanel("settings")} className="rounded-2xl border border-[#0077C8]/20 bg-[#0077C8]/5 p-4 text-left hover:bg-[#0077C8]/10">
                <Settings className="mb-2 h-5 w-5 text-[#0077C8]" />
                <p className="font-semibold text-[#0B2545]">System Settings</p>
                <p className="text-xs text-slate-500">Price, delivery time, hero, WhatsApp — live</p>
              </button>
              <button type="button" onClick={() => setPanel("hostels")} className="rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm hover:border-[#0077C8]/30">
                <Building2 className="mb-2 h-5 w-5 text-[#0077C8]" />
                <p className="font-semibold text-[#0B2545]">Hostel Manager</p>
                <p className="text-xs text-slate-500">{hostels.length} hostels</p>
              </button>
              <button type="button" onClick={() => setPanel("promos")} className="rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm hover:border-[#0077C8]/30">
                <Tag className="mb-2 h-5 w-5 text-[#0077C8]" />
                <p className="font-semibold text-[#0B2545]">Promo Codes</p>
                <p className="text-xs text-slate-500">{promos.length} codes</p>
              </button>
            </div>
          </div>
        )}

        {panel === "orders" && (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-[#0B2545]">Order queue ({orders.length})</h2>
            <div className="space-y-3">
              {orders.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No orders yet</p>}
              {orders.map((o) => (
                <div key={o.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#0B2545]">{o.orderNumber}{" "}
                        <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[o.status]}`}>{o.status}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{o.customerName} · {o.phone} · {o.email || "—"}</p>
                      <p className="text-xs text-slate-500">{o.hostel || o.address}{o.roomNumber ? ` · Rm ${o.roomNumber}` : ""}{o.blockNumber ? ` · Blk ${o.blockNumber}` : ""} · {o.gallons} gal · Ghc{Number(o.totalAmount).toFixed(2)} · {o.paymentMethod === "momo" ? "MoMo" : "Cash"}</p>
                      {o.cancelReason && <p className="mt-1 text-xs text-red-600">Cancel: {o.cancelReason}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <select value={o.status} disabled={busy} onChange={(e) => updateOrderStatus(o.id, e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
                        {STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{s}</option>))}
                      </select>
                      <button type="button" onClick={() => deleteOrder(o.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {panel === "settings" && (
          <form onSubmit={saveSettings} className="space-y-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-[#0B2545]">System Settings</h2>
                <p className="text-xs text-slate-500">All values stored in DB. Frontend reads from here — no hardcoding. Save applies immediately site-wide.</p>
              </div>
              <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-[#0077C8] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#0066AD] disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save — Live now
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.serviceActive} onChange={(e) => setForm((f) => ({ ...f, serviceActive: e.target.checked }))} /><Power className="h-4 w-4 text-[#0077C8]" /> Service active</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.maintenanceMode} onChange={(e) => setForm((f) => ({ ...f, maintenanceMode: e.target.checked }))} /><AlertTriangle className="h-4 w-4 text-amber-500" /> Maintenance mode</label>
            </div>
            {form.maintenanceMode && (
              <input value={form.maintenanceMessage || ""} onChange={(e) => setForm((f) => ({ ...f, maintenanceMessage: e.target.value }))} placeholder="Maintenance message" className="w-full rounded-xl border px-3 py-2.5 text-sm" />
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-medium text-slate-600">Hero title</label><input value={form.heroTitle || ""} onChange={(e) => setForm((f) => ({ ...f, heroTitle: e.target.value }))} className="w-full rounded-xl border px-3 py-2.5 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-600">Operating hours</label><input value={form.operatingHours || ""} onChange={(e) => setForm((f) => ({ ...f, operatingHours: e.target.value }))} className="w-full rounded-xl border px-3 py-2.5 text-sm" /></div>
              <div className="sm:col-span-2"><label className="mb-1 block text-xs font-medium text-slate-600">Product description</label><textarea value={form.productDescription || ""} onChange={(e) => setForm((f) => ({ ...f, productDescription: e.target.value }))} rows={2} className="w-full rounded-xl border px-3 py-2.5 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-600">Price per gallon (Ghc)</label><input type="number" step="0.1" value={form.pricePerGallon ?? ""} onChange={(e) => setForm((f) => ({ ...f, pricePerGallon: Number(e.target.value) }))} className="w-full rounded-xl border px-3 py-2.5 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-600">Gallon size (L)</label><input type="number" value={form.gallonSize ?? 20} onChange={(e) => setForm((f) => ({ ...f, gallonSize: Number(e.target.value) }))} className="w-full rounded-xl border px-3 py-2.5 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-600">Delivery min (mins)</label><input type="number" value={form.deliveryTimeMin ?? ""} onChange={(e) => setForm((f) => ({ ...f, deliveryTimeMin: Number(e.target.value) }))} className="w-full rounded-xl border px-3 py-2.5 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-600">Delivery max (mins)</label><input type="number" value={form.deliveryTimeMax ?? ""} onChange={(e) => setForm((f) => ({ ...f, deliveryTimeMax: Number(e.target.value) }))} className="w-full rounded-xl border px-3 py-2.5 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-600">Subscription price (Ghc)</label><input type="number" step="0.1" value={form.subscriptionPrice ?? ""} onChange={(e) => setForm((f) => ({ ...f, subscriptionPrice: Number(e.target.value) }))} className="w-full rounded-xl border px-3 py-2.5 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-600">Subscription gallons</label><input type="number" value={form.subscriptionGallons ?? ""} onChange={(e) => setForm((f) => ({ ...f, subscriptionGallons: Number(e.target.value) }))} className="w-full rounded-xl border px-3 py-2.5 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-600">Admin phone (WhatsApp support)</label><input value={form.adminPhone || ""} onChange={(e) => setForm((f) => ({ ...f, adminPhone: e.target.value }))} className="w-full rounded-xl border px-3 py-2.5 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-600">Admin email</label><input value={form.adminEmail || ""} onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))} className="w-full rounded-xl border px-3 py-2.5 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-600">Service area</label><input value={form.serviceArea || ""} onChange={(e) => setForm((f) => ({ ...f, serviceArea: e.target.value }))} className="w-full rounded-xl border px-3 py-2.5 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-600">MoMo number</label><input value={form.momoNumber || ""} onChange={(e) => setForm((f) => ({ ...f, momoNumber: e.target.value }))} className="w-full rounded-xl border px-3 py-2.5 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-600">MoMo name</label><input value={form.momoName || ""} onChange={(e) => setForm((f) => ({ ...f, momoName: e.target.value }))} className="w-full rounded-xl border px-3 py-2.5 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-600">MoMo number 2</label><input value={form.momoNumber2 || ""} onChange={(e) => setForm((f) => ({ ...f, momoNumber2: e.target.value }))} className="w-full rounded-xl border px-3 py-2.5 text-sm" /></div>
              <div><label className="mb-1 block text-xs font-medium text-slate-600">MoMo name 2</label><input value={form.momoName2 || ""} onChange={(e) => setForm((f) => ({ ...f, momoName2: e.target.value }))} className="w-full rounded-xl border px-3 py-2.5 text-sm" /></div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.cashEnabled} onChange={(e) => setForm((f) => ({ ...f, cashEnabled: e.target.checked }))} /> Cash on delivery enabled</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.momoEnabled} onChange={(e) => setForm((f) => ({ ...f, momoEnabled: e.target.checked }))} /> Mobile Money enabled</label>
            </div>
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-[#0077C8] py-3 text-sm font-semibold text-white shadow hover:bg-[#0066AD] disabled:opacity-60">{busy ? "Saving…" : "Save settings — Live now"}</button>
          </form>
        )}

        {panel === "hostels" && (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-[#0B2545]">Hostel Manager</h2>
            <form onSubmit={addHostel} className="mb-4 flex gap-2">
              <input value={newHostel} onChange={(e) => setNewHostel(e.target.value)} placeholder="New hostel name" className="flex-1 rounded-xl border px-3 py-2.5 text-sm" />
              <button type="submit" disabled={busy} className="inline-flex items-center gap-1 rounded-xl bg-[#0077C8] px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Add</button>
            </form>
            <div className="space-y-2">
              {hostels.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <span className="text-sm font-medium text-[#0B2545]">{h.name}</span>
                  <button type="button" onClick={() => removeHostel(h.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {panel === "promos" && (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-[#0B2545]">Promo Codes</h2>
            <form onSubmit={addPromo} className="mb-4 grid gap-2 sm:grid-cols-4">
              <input value={newPromo.code} onChange={(e) => setNewPromo((p) => ({ ...p, code: e.target.value }))} placeholder="CODE" className="rounded-xl border px-3 py-2.5 text-sm uppercase" />
              <input type="number" value={newPromo.rewardValue} onChange={(e) => setNewPromo((p) => ({ ...p, rewardValue: Number(e.target.value) }))} placeholder="Free gallons" className="rounded-xl border px-3 py-2.5 text-sm" />
              <input type="number" value={newPromo.maxUses} onChange={(e) => setNewPromo((p) => ({ ...p, maxUses: Number(e.target.value) }))} placeholder="Max uses" className="rounded-xl border px-3 py-2.5 text-sm" />
              <button type="submit" disabled={busy} className="rounded-xl bg-[#0077C8] px-4 py-2 text-sm font-semibold text-white">Create</button>
            </form>
            <div className="space-y-2">
              {promos.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <p className="text-sm font-semibold text-[#0B2545]">{p.code} <span className="font-normal text-slate-500">· +{p.rewardValue} gal · used {p.timesUsed}/{p.maxUses}</span></p>
                  <button type="button" onClick={() => togglePromo(p.id, !p.active)} className={`rounded-full px-3 py-1 text-xs font-semibold ${p.active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>{p.active ? "Active" : "Off"}</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {panel === "announcements" && (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-[#0B2545]">Announcements</h2>
            <form onSubmit={addAnnouncement} className="mb-4 space-y-2">
              <input value={newAnn.title} onChange={(e) => setNewAnn((a) => ({ ...a, title: e.target.value }))} placeholder="Title" className="w-full rounded-xl border px-3 py-2.5 text-sm" />
              <textarea value={newAnn.body} onChange={(e) => setNewAnn((a) => ({ ...a, body: e.target.value }))} placeholder="Message" rows={2} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
              <button type="submit" disabled={busy} className="rounded-xl bg-[#0077C8] px-4 py-2 text-sm font-semibold text-white">Post announcement</button>
            </form>
            <div className="space-y-2">
              {announcements.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <div><p className="text-sm font-semibold text-[#0B2545]">{a.title}</p><p className="text-xs text-slate-500">{a.body}</p></div>
                  <button type="button" onClick={() => removeAnnouncement(a.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {panel === "users" && (
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-[#0B2545]">Users ({users.length})</h2>
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-semibold text-[#0B2545]">{u.name || u.username || u.email}
                      {u.role === "ADMIN" && <span className="ml-2 rounded-full bg-[#0077C8]/10 px-2 py-0.5 text-[10px] font-bold text-[#0077C8]">ADMIN</span>}
                    </p>
                    <p className="text-xs text-slate-500">{u.email} · {u.phone || "—"} · {u.hostel || "—"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          <Link href="/" className="text-[#0077C8]">← Back to site</Link>
          {" · "}Super admin: {user?.email}
        </p>
      </div>
    </div>
  );
}
