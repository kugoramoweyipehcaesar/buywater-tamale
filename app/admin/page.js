"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import {
  Shield,
  RefreshCw,
  MapPin,
  Settings,
  UserPlus,
  CreditCard,
  Users,
  Megaphone,
  BarChart3,
  Building2,
  ClipboardCheck,
  Activity,
  Wallet,
  ListOrdered,
  Pencil,
  Ticket,
  Wrench,
  Package,
  Clock,
  Truck,
  CheckCircle,
  TrendingUp,
  Droplets,
  Phone,
  X,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  User,
} from "lucide-react";

const STATUSES = [
  "PENDING",
  "PROCESSING",
  "CONFIRMED",
  "ON_THE_WAY",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_LABELS = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  CONFIRMED: "Confirmed",
  ON_THE_WAY: "On the Way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_BADGE = {
  PENDING: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-indigo-100 text-indigo-700",
  ON_THE_WAY: "bg-cyan-100 text-cyan-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
};

const TOOLS = [
  { id: "payment", label: "Payment Settings", icon: CreditCard },
  { id: "users", label: "User Directory", icon: Users },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "reports", label: "Delivery Reports", icon: BarChart3 },
  { id: "system", label: "System Settings", icon: Settings },
  { id: "hostels", label: "Hostel Manager", icon: Building2 },
  { id: "verify", label: "Order Verification", icon: ClipboardCheck },
  { id: "activity", label: "User Activity", icon: Activity },
  { id: "finance", label: "Financial Summary", icon: Wallet },
  { id: "queue", label: "Order Queue", icon: ListOrdered },
  { id: "content", label: "Content Settings", icon: Pencil },
  { id: "promos", label: "Promo Codes", icon: Ticket },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
];

const DEFAULT_CONTENT = {
  whyBadge: "Built for Students",
  whyTitle: "Why Choose BuyWater",
  whyCards: [
    { title: "Fast Delivery", desc: "Under 60 minutes to Yaa Naa Hall, Sagnarigu Hall, Kumbungu Hostel, Tech Hostel, Citadel Hostel, Northern Hostel and all other hostels." },
    { title: "Live Order Tracking", desc: "Get your driver's number to call and track your delivery in real time until it reaches your door." },
    { title: "MoMo + Cash", desc: "Pay however is convenient. MTN, Vodafone, AirtelTigo supported — or pay cash on delivery." },
    { title: "Subscribe & Save", desc: "Get 10 gallons for GH¢22 instead of GH¢25. Cancel wrong orders without any commitments." },
    { title: "Reliable Supply", desc: "Hygienic water, Affordable, and always on time. We never leave you dry and unattended to." },
    { title: "WhatsApp Support", desc: "Quick help if your water is late. Message us directly on WhatsApp for the fastest response." },
  ],
  supportBadge: "We're Here for You",
  supportTitle: "Support",
  supportIntro: "We've got you covered.",
  supportCards: [
    { title: "WhatsApp", desc: "Fastest response" },
    { title: "Email", desc: "We'll reply within 24 hours" },
    { title: "Hours", desc: "7 AM - 8:30 PM, Including weekends" },
    { title: "Issues?", desc: "Late delivery, Wrong Hostel selection. Any other concerns can be reported to the support team now" },
  ],
};

function parseContent(json) {
  try {
    return { ...DEFAULT_CONTENT, ...JSON.parse(json || "{}") };
  } catch {
    return DEFAULT_CONTENT;
  }
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [promos, setPromos] = useState([]);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [panel, setPanel] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [newHostel, setNewHostel] = useState("");
  const [newPromo, setNewPromo] = useState({ code: "", rewardValue: 1, maxUses: 100 });
  const [annForm, setAnnForm] = useState({ title: "", type: "Notice", message: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const isSuper =
    user?.email === "kugoramoweyipehcaesar49@gmail.com";

  const load = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user || me.user.role !== "ADMIN") {
        router.push("/admin-login");
        return;
      }
      setUser(me.user);
      const [ord, set, hos, pro, usr, ann] = await Promise.all([
        fetch("/api/orders").then((r) => r.json()),
        fetch("/api/settings").then((r) => r.json()),
        fetch("/api/hostels").then((r) => r.json()),
        fetch("/api/promotions").then((r) => r.json()),
        fetch("/api/users").then((r) => r.json()).catch(() => ({ users: [] })),
        fetch("/api/announcements").then((r) => r.json()).catch(() => ({ announcements: [] })),
      ]);
      setOrders(ord.orders || []);
      setSettings(set.settings);
      setContent(parseContent(set.settings?.contentJson));
      setHostels(hos.hostels || []);
      setPromos(pro.promos || []);
      setUsers(usr.users || []);
      setAnnouncements(ann.announcements || []);
    } catch {
      router.push("/admin-login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateOrder(id, data) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    load();
  }

  async function saveSettings(extra = {}) {
    setSaving(true);
    setMsg("");
    try {
      // Only send editable fields — strip id/timestamps so Prisma update never fails
      const base = { ...(settings || {}), ...extra };
      const payload = {
        serviceActive: !!base.serviceActive,
        maintenanceMode: !!base.maintenanceMode,
        maintenanceMessage: base.maintenanceMessage ?? "",
        heroTitle: base.heroTitle ?? "",
        operatingHours: base.operatingHours ?? "",
        productImageUrl: base.productImageUrl ?? "",
        productDescription: base.productDescription ?? "",
        deliveryTimeMin: Number(base.deliveryTimeMin) || 45,
        deliveryTimeMax: Number(base.deliveryTimeMax) || 60,
        pricePerGallon: Number(base.pricePerGallon) || 2.5,
        subscriptionPrice: Number(base.subscriptionPrice) || 22,
        subscriptionGallons: Number(base.subscriptionGallons) || 10,
        gallonSize: Number(base.gallonSize) || 20,
        cashEnabled: base.cashEnabled !== false,
        momoEnabled: base.momoEnabled !== false,
        momoNumber: base.momoNumber ?? "",
        momoName: base.momoName ?? "",
        momoNumber2: base.momoNumber2 ?? "",
        momoName2: base.momoName2 ?? "",
        adminPhone: base.adminPhone ?? "",
        adminEmail: base.adminEmail ?? "",
        serviceArea: base.serviceArea ?? "",
        contentJson: base.contentJson ?? settings?.contentJson ?? null,
      };
      if (extra.contentJson != null) payload.contentJson = extra.contentJson;

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed");
      if (data.settings) setSettings(data.settings);
      setMsg("Settings saved successfully");
      await load();
    } catch (e) {
      setMsg(e.message || "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  async function saveContent() {
    await saveSettings({ contentJson: JSON.stringify(content) });
  }

  async function addHostel() {
    if (!newHostel.trim()) return;
    await fetch("/api/hostels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newHostel.trim() }),
    });
    setNewHostel("");
    load();
  }

  async function deleteHostel(id) {
    await fetch(`/api/hostels?id=${id}`, { method: "DELETE" });
    load();
  }

  async function inviteAdmin() {
    if (!inviteEmail.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: "ADMIN" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg(`Admin invited: ${inviteEmail} (password: admin123)`);
      setInviteEmail("");
      load();
    } catch (e) {
      setMsg(e.message || "Invite failed");
    } finally {
      setSaving(false);
    }
  }

  async function addPromo() {
    if (!newPromo.code.trim()) return;
    await fetch("/api/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPromo),
    });
    setNewPromo({ code: "", rewardValue: 1, maxUses: 100 });
    load();
  }

  async function togglePromo(p) {
    await fetch("/api/promotions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id, active: !p.active }),
    });
    load();
  }

  async function postAnnouncement() {
    if (!annForm.title.trim() || !annForm.message.trim()) {
      setMsg("Title and message required");
      return;
    }
    await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(annForm),
    });
    setAnnForm({ title: "", type: "Notice", message: "" });
    load();
  }

  async function deleteAnnouncement(id) {
    await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
    load();
  }

  async function resetAllOrders() {
    if (!isSuper) {
      setMsg("Only super admin can reset all orders");
      return;
    }
    if (!confirm("Permanently delete ALL orders? This cannot be undone.")) return;
    const res = await fetch("/api/orders/reset", { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed");
      return;
    }
    setMsg(`Deleted ${data.deleted} orders`);
    load();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading admin...
      </div>
    );
  }

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "PENDING").length,
    processing: orders.filter((o) =>
      ["PROCESSING", "CONFIRMED", "ON_THE_WAY"].includes(o.status)
    ).length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    revenue: orders
      .filter((o) => o.status === "DELIVERED")
      .reduce((s, o) => s + (o.totalAmount || 0), 0),
    gallonsDelivered: orders
      .filter((o) => o.status === "DELIVERED")
      .reduce((s, o) => s + (o.gallons || 0), 0),
  };

  const counts = {
    ALL: orders.length,
    PENDING: orders.filter((o) => o.status === "PENDING").length,
    PROCESSING: orders.filter((o) => o.status === "PROCESSING").length,
    CONFIRMED: orders.filter((o) => o.status === "CONFIRMED").length,
    ON_THE_WAY: orders.filter((o) => o.status === "ON_THE_WAY").length,
    DELIVERED: orders.filter((o) => o.status === "DELIVERED").length,
    CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
  };

  const filtered =
    filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  const pendingVerify = orders.filter((o) => o.status === "PENDING");

  // Reports: revenue per hostel
  const hostelStats = {};
  orders.forEach((o) => {
    const h = o.hostel || o.address || "Other";
    if (!hostelStats[h]) hostelStats[h] = { orders: 0, gallons: 0, revenue: 0 };
    hostelStats[h].orders += 1;
    hostelStats[h].gallons += o.gallons || 0;
    if (o.status === "DELIVERED") hostelStats[h].revenue += o.totalAmount || 0;
  });
  const hostelRows = Object.entries(hostelStats).sort(
    (a, b) => b[1].revenue - a[1].revenue
  );
  const maxRev = Math.max(1, ...hostelRows.map(([, v]) => v.revenue));

  return (
    <div className="min-h-screen bg-[#EEF6FC] pb-16">
      <SiteHeader user={user} />

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0077C8] text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#0B2545]">Admin Dashboard</h1>
              <p className="text-sm text-slate-500">
                Monitor and manage all orders
                {isSuper && (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">
                    Super Admin
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn onClick={load} icon={RefreshCw} label="Refresh" />
            <Btn onClick={() => setPanel("invite")} icon={UserPlus} label="Invite Admin" primary />
          </div>
        </div>

        {msg && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-[#0077C8]/20 bg-[#0077C8]/5 px-4 py-2.5 text-sm">
            <span>{msg}</span>
            <button type="button" onClick={() => setMsg("")}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Tool grid — only remaining tools */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPanel(t.id === "queue" ? null : t.id)}
              className={`flex flex-col items-start gap-2 rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-[#0077C8]/40 ${
                panel === t.id ? "border-[#0077C8] ring-1 ring-[#0077C8]/30" : "border-slate-100"
              }`}
            >
              <t.icon className="h-5 w-5 text-[#0077C8]" />
              <span className="text-sm font-medium text-[#0B2545]">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ===== PANELS ===== */}

        {panel === "announcements" && (
          <Panel title="Announcements" subtitle="Post notices on user dashboards" icon={Megaphone} onClose={() => setPanel(null)}>
            <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <p className="mb-3 font-semibold text-[#0B2545]">New Announcement</p>
              <label className="mb-1 block text-xs font-medium text-slate-600">Title</label>
              <input
                value={annForm.title}
                onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                placeholder="e.g. Delivery delay due to rain"
                className="mb-3 w-full rounded-xl border px-3 py-2.5 text-sm"
              />
              <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
              <select
                value={annForm.type}
                onChange={(e) => setAnnForm({ ...annForm, type: e.target.value })}
                className="mb-3 w-full rounded-xl border px-3 py-2.5 text-sm"
              >
                <option>Notice</option>
                <option>Alert</option>
                <option>Info</option>
              </select>
              <label className="mb-1 block text-xs font-medium text-slate-600">Message</label>
              <textarea
                value={annForm.message}
                onChange={(e) => setAnnForm({ ...annForm, message: e.target.value })}
                placeholder="Write your announcement..."
                rows={3}
                className="mb-3 w-full rounded-xl border px-3 py-2.5 text-sm"
              />
              <button
                type="button"
                onClick={postAnnouncement}
                className="flex w-full items-center justify-center gap-1 rounded-xl bg-[#7BA3C4] py-3 text-sm font-semibold text-white hover:bg-[#6A93B4]"
              >
                <Plus className="h-4 w-4" /> Post Announcement
              </button>
            </div>
            {announcements.length === 0 ? (
              <div className="rounded-2xl border border-dashed py-12 text-center text-slate-400">
                <Megaphone className="mx-auto mb-2 h-8 w-8 opacity-40" />
                No announcements yet
              </div>
            ) : (
              <ul className="space-y-2">
                {announcements.map((a) => (
                  <li key={a.id} className="flex items-start justify-between rounded-xl border bg-white p-3 text-sm">
                    <div>
                      <p className="font-semibold text-[#0B2545]">{a.title}</p>
                      <p className="text-xs text-slate-400">{a.type}</p>
                      <p className="mt-1 text-slate-600">{a.body}</p>
                    </div>
                    <button type="button" onClick={() => deleteAnnouncement(a.id)} className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}

        {panel === "system" && settings && (
          <Panel title="System Settings" subtitle="Global app configuration" icon={Settings} onClose={() => setPanel(null)}>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["pricePerGallon", "Price per Gallon (Ghc)", "number"],
                ["subscriptionPrice", "Subscription Price (Ghc)", "number"],
                ["subscriptionGallons", "Subscription Gallons", "number"],
                ["gallonSize", "Gallon Size (Liters)", "number"],
                ["deliveryTimeMin", "Delivery Min (mins)", "number"],
                ["deliveryTimeMax", "Delivery Max (mins)", "number"],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
                  <input
                    type={type}
                    value={settings[key] ?? (key === "gallonSize" ? 20 : "")}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        [key]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value,
                      })
                    }
                    className="w-full rounded-xl border px-3 py-2.5 text-sm"
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Operating Hours</label>
                <input
                  value={settings.operatingHours || ""}
                  onChange={(e) => setSettings({ ...settings, operatingHours: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Hero Title</label>
                <input
                  value={settings.heroTitle || ""}
                  onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Product Image URL</label>
                <input
                  value={settings.productImageUrl || ""}
                  onChange={(e) => setSettings({ ...settings, productImageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Product Description</label>
                <input
                  value={settings.productDescription || ""}
                  onChange={(e) => setSettings({ ...settings, productDescription: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Service Area</label>
                <input
                  value={settings.serviceArea || ""}
                  onChange={(e) => setSettings({ ...settings, serviceArea: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => saveSettings()}
              disabled={saving}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0077C8] py-3 text-sm font-semibold text-white"
            >
              <Save className="h-4 w-4" /> Save System Settings
            </button>
          </Panel>
        )}

        {panel === "payment" && settings && (
          <Panel title="Payment Settings" subtitle="Manage MoMo details and payment modes" icon={CreditCard} onClose={() => setPanel(null)}>
            <label className="mb-3 flex items-center justify-between rounded-xl border p-4">
              <span className="font-medium">Cash on Delivery</span>
              <input type="checkbox" checked={!!settings.cashEnabled} onChange={(e) => setSettings({ ...settings, cashEnabled: e.target.checked })} className="h-5 w-5" />
            </label>
            <label className="mb-4 flex items-center justify-between rounded-xl border p-4">
              <span className="font-medium">Mobile Money</span>
              <input type="checkbox" checked={!!settings.momoEnabled} onChange={(e) => setSettings({ ...settings, momoEnabled: e.target.checked })} className="h-5 w-5" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">MoMo Number</label>
                <input value={settings.momoNumber || ""} onChange={(e) => setSettings({ ...settings, momoNumber: e.target.value })} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">MoMo Account Name</label>
                <input value={settings.momoName || ""} onChange={(e) => setSettings({ ...settings, momoName: e.target.value })} className="w-full rounded-xl border px-3 py-2.5 text-sm" />
              </div>
            </div>
            <button type="button" onClick={() => saveSettings()} className="mt-4 rounded-xl bg-[#0077C8] px-5 py-2.5 text-sm font-semibold text-white">
              Save Payment Settings
            </button>
          </Panel>
        )}

        {panel === "hostels" && (
          <Panel title="Hostel Management" subtitle={`${hostels.length} delivery locations`} icon={Building2} onClose={() => setPanel(null)}>
            <div className="mb-4 flex gap-2 rounded-2xl border bg-slate-50/50 p-3">
              <input
                value={newHostel}
                onChange={(e) => setNewHostel(e.target.value)}
                placeholder="Hostel name (e.g. New Hostel)"
                className="flex-1 rounded-xl border bg-white px-3 py-2.5 text-sm"
              />
              <button type="button" onClick={addHostel} className="inline-flex items-center gap-1 rounded-xl bg-[#0077C8] px-4 py-2 text-sm font-semibold text-white">
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
            <ul className="space-y-2">
              {hostels.map((h) => (
                <li key={h.id} className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm">
                  <span className="inline-flex items-center gap-2 font-medium text-[#0B2545]">
                    <MapPin className="h-4 w-4 text-[#0077C8]" /> {h.name}
                  </span>
                  <button type="button" onClick={() => deleteHostel(h.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {panel === "promos" && (
          <Panel title="Promo Code Manager" subtitle="Create codes, set limits, and track redemptions" icon={Ticket} onClose={() => setPanel(null)}
            action={
              <button type="button" onClick={addPromo} className="inline-flex items-center gap-1 rounded-xl bg-[#0077C8] px-3 py-1.5 text-sm font-semibold text-white">
                <Plus className="h-4 w-4" /> New Code
              </button>
            }
          >
            <div className="mb-4 flex flex-wrap gap-2">
              <input value={newPromo.code} onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })} placeholder="CODE" className="rounded-xl border px-3 py-2 text-sm uppercase" />
              <input type="number" min={1} value={newPromo.rewardValue} onChange={(e) => setNewPromo({ ...newPromo, rewardValue: parseInt(e.target.value) || 1 })} className="w-24 rounded-xl border px-3 py-2 text-sm" title="Free gallons" />
              <input type="number" min={1} value={newPromo.maxUses} onChange={(e) => setNewPromo({ ...newPromo, maxUses: parseInt(e.target.value) || 100 })} className="w-24 rounded-xl border px-3 py-2 text-sm" title="Max uses" />
            </div>
            {promos.length === 0 ? (
              <div className="rounded-2xl border border-dashed py-12 text-center text-slate-400">
                <Ticket className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p className="font-medium text-slate-500">No promo codes yet</p>
                <p className="text-sm">Create your first code to reward students</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {promos.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm">
                    <span>
                      <strong>{p.code}</strong> · +{p.rewardValue} gal · {p.timesUsed}/{p.maxUses} used
                      {!p.active && <span className="ml-1 text-red-500">(off)</span>}
                    </span>
                    <button type="button" onClick={() => togglePromo(p)} className="text-xs font-semibold text-[#0077C8]">
                      {p.active ? "Disable" : "Enable"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}

        {panel === "users" && (
          <Panel title="User Directory" subtitle={`${users.length} registered users`} icon={Users} onClose={() => setPanel(null)}
            action={
              <button type="button" onClick={() => setPanel("invite")} className="inline-flex items-center gap-1 rounded-xl bg-[#0077C8] px-3 py-1.5 text-sm font-semibold text-white">
                <UserPlus className="h-4 w-4" /> Invite Admin
              </button>
            }
          >
            {users.length === 0 ? (
              <div className="rounded-2xl border border-dashed py-12 text-center text-slate-400">
                <User className="mx-auto mb-2 h-8 w-8 opacity-40" />
                No users found
              </div>
            ) : (
              <ul className="space-y-2">
                {users.map((u) => (
                  <li key={u.id} className="flex items-center justify-between rounded-xl border bg-white px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-[#0B2545]">
                        {u.name || u.username || u.email}
                        {u.role === "ADMIN" && (
                          <span className="ml-2 rounded bg-[#0077C8]/10 px-1.5 py-0.5 text-xs text-[#0077C8]">
                            {u.email === "kugoramoweyipehcaesar49@gmail.com" ? "Super Admin" : "Admin"}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}

        {panel === "invite" && (
          <Panel title="Invite Admin" onClose={() => setPanel(null)}>
            <p className="mb-3 text-sm text-slate-500">
              New admins get password <code className="rounded bg-slate-100 px-1">admin123</code>. Super admin is{" "}
              <strong>kugoramoweyipehcaesar49@gmail.com</strong>.
            </p>
            <div className="flex gap-2">
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@example.com" className="flex-1 rounded-xl border px-3 py-2.5 text-sm" />
              <button type="button" onClick={inviteAdmin} disabled={saving} className="rounded-xl bg-[#0077C8] px-4 py-2 text-sm font-semibold text-white">
                Invite
              </button>
            </div>
          </Panel>
        )}

        {panel === "maintenance" && settings && (
          <Panel title="Maintenance Mode" subtitle="Toggle system-wide notice and disable ordering" icon={Wrench} onClose={() => setPanel(null)}>
            <div className={`mb-4 flex items-center justify-between rounded-xl border px-4 py-3 ${settings.maintenanceMode ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${settings.maintenanceMode ? "text-amber-600" : "text-slate-400"}`} />
                <div>
                  <p className="text-sm font-semibold text-[#0B2545]">
                    Maintenance mode is {settings.maintenanceMode ? "ACTIVE" : "OFF"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {settings.maintenanceMode
                      ? "Ordering is disabled. Customers see the notice below."
                      : "All ordering features are fully operational."}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={!!settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="h-5 w-5"
              />
            </div>
            <label className="mb-1 block text-sm font-semibold text-[#0B2545]">Maintenance Notice Message</label>
            <textarea
              value={settings.maintenanceMessage || ""}
              onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
              rows={2}
              className="mb-2 w-full rounded-xl border px-3 py-2.5 text-sm"
              placeholder="We're performing scheduled maintenance. Ordering will be back shortly."
            />
            <button type="button" onClick={() => saveSettings()} className="mb-4 inline-flex items-center gap-1 rounded-xl bg-[#0077C8] px-4 py-2 text-sm font-semibold text-white">
              <Save className="h-4 w-4" /> Save Message
            </button>
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <strong>Preview:</strong>{" "}
              {settings.maintenanceMessage || "Maintenance in progress. Ordering is temporarily unavailable."}
            </div>
            {isSuper && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-700">Danger Zone</p>
                <p className="mb-3 text-xs text-red-600">
                  Permanently delete ALL orders from the system. This action cannot be undone. Super admin only.
                </p>
                <button type="button" onClick={resetAllOrders} className="inline-flex items-center gap-1 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600">
                  <Trash2 className="h-4 w-4" /> Reset All Orders
                </button>
              </div>
            )}
          </Panel>
        )}

        {panel === "verify" && (
          <Panel title="Verification Queue" subtitle={`${pendingVerify.length} pending orders awaiting confirmation`} icon={ClipboardCheck} onClose={() => setPanel(null)}>
            {pendingVerify.length === 0 ? (
              <div className="py-10 text-center text-slate-400">No pending orders</div>
            ) : (
              <div className="space-y-3">
                {pendingVerify.map((o) => (
                  <div key={o.id} className="rounded-2xl border bg-white p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[#0B2545]">{o.orderNumber}</span>
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Pending</span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {o.gallons} gal · Ghc{Number(o.totalAmount).toFixed(2)} ·{" "}
                      {o.paymentMethod === "momo" ? "Mobile Money" : "Cash On Delivery"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {o.customerName || o.username} · {o.phone} · {o.hostel} ·{" "}
                      {new Date(o.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateOrder(o.id, { status: "CONFIRMED" })}
                        className="flex-1 rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white"
                      >
                        ✓ Confirm Order
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOrder(o.id, { status: "CANCELLED", cancelReason: "Rejected by admin" })}
                        className="flex-1 rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-500"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        )}

        {panel === "activity" && (
          <Panel title="User Activity Log" subtitle="Historical feed of sign-ups, updates, and orders" icon={Activity} onClose={() => setPanel(null)}>
            <ul className="space-y-2">
              {orders.slice(0, 30).map((o) => (
                <li key={o.id} className="rounded-xl border border-green-100 bg-white px-4 py-3 text-sm">
                  <p className="text-xs font-semibold uppercase text-green-600">Order Placed</p>
                  <p className="font-medium text-[#0B2545]">
                    Order {o.orderNumber} — {o.gallons} gallons to {o.hostel || o.address}
                  </p>
                  <p className="text-xs text-slate-400">
                    {o.email || o.customerName} ·{" "}
                    {new Date(o.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              ))}
              {orders.length === 0 && (
                <li className="py-8 text-center text-slate-400">No activity yet</li>
              )}
            </ul>
          </Panel>
        )}

        {panel === "reports" && (
          <Panel title="Delivery Reports" subtitle="Analytics for deliveries and revenue" icon={BarChart3} onClose={() => setPanel(null)}>
            <div className="mb-4 grid grid-cols-3 gap-3">
              <StatMini icon={Package} label="Total Orders" value={stats.total} />
              <StatMini icon={Droplets} label="Gallons Delivered" value={stats.gallonsDelivered} />
              <StatMini icon={TrendingUp} label="Revenue (Delivered)" value={`Ghc${stats.revenue}`} />
            </div>
            <div className="mb-4 rounded-2xl border bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-[#0B2545]">Revenue per Hostel</p>
              <div className="flex h-40 items-end gap-2">
                {hostelRows.slice(0, 6).map(([name, v]) => (
                  <div key={name} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-[#0077C8]"
                      style={{ height: `${Math.max(8, (v.revenue / maxRev) * 100)}%` }}
                      title={`Ghc${v.revenue}`}
                    />
                    <span className="max-w-full truncate text-[10px] text-slate-500">{name.split(" ")[0]}</span>
                  </div>
                ))}
                {hostelRows.length === 0 && (
                  <p className="w-full text-center text-sm text-slate-400">No data yet</p>
                )}
              </div>
            </div>
            <div className="mb-4 rounded-2xl border bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-[#0B2545]">Order Status Distribution</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="text-amber-600">pending: {counts.PENDING}</span>
                <span className="text-red-500">cancelled: {counts.CANCELLED}</span>
                <span className="text-green-600">delivered: {counts.DELIVERED}</span>
                <span className="text-blue-600">processing: {counts.PROCESSING}</span>
              </div>
            </div>
            <div className="overflow-x-auto rounded-2xl border bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Hostel</th>
                    <th className="px-4 py-2">Orders</th>
                    <th className="px-4 py-2">Gallons</th>
                    <th className="px-4 py-2">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {hostelRows.map(([name, v]) => (
                    <tr key={name} className="border-b last:border-0">
                      <td className="px-4 py-2 font-medium">{name}</td>
                      <td className="px-4 py-2">{v.orders}</td>
                      <td className="px-4 py-2">{v.gallons}</td>
                      <td className="px-4 py-2 text-[#0077C8]">Ghc{v.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {panel === "finance" && (
          <Panel title="Financial Summary" icon={Wallet} onClose={() => setPanel(null)}>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatMini icon={TrendingUp} label="Delivered Revenue" value={`Ghc${stats.revenue}`} />
              <StatMini icon={Package} label="Total Orders" value={stats.total} />
              <StatMini icon={Droplets} label="Gallons Delivered" value={stats.gallonsDelivered} />
            </div>
          </Panel>
        )}

{panel === "content" && (
          <Panel title="Content Settings" subtitle="Edit all text on the homepage sections" icon={Pencil} onClose={() => setPanel(null)}>
            <p className="mb-3 text-sm font-semibold text-[#0B2545]">Why Choose BuyWater Section</p>
            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              <input value={content.whyTitle} onChange={(e) => setContent({ ...content, whyTitle: e.target.value })} placeholder="Section Title" className="rounded-xl border px-3 py-2 text-sm" />
              <input value={content.whyBadge} onChange={(e) => setContent({ ...content, whyBadge: e.target.value })} placeholder="Section Badge" className="rounded-xl border px-3 py-2 text-sm" />
            </div>
            {(content.whyCards || []).map((c, i) => (
              <div key={i} className="mb-2 grid gap-2 sm:grid-cols-2">
                <input
                  value={c.title}
                  onChange={(e) => {
                    const cards = [...content.whyCards];
                    cards[i] = { ...cards[i], title: e.target.value };
                    setContent({ ...content, whyCards: cards });
                  }}
                  placeholder={`Card ${i + 1} — Title`}
                  className="rounded-xl border px-3 py-2 text-sm"
                />
                <textarea
                  value={c.desc}
                  onChange={(e) => {
                    const cards = [...content.whyCards];
                    cards[i] = { ...cards[i], desc: e.target.value };
                    setContent({ ...content, whyCards: cards });
                  }}
                  placeholder={`Card ${i + 1} — Description`}
                  rows={2}
                  className="rounded-xl border px-3 py-2 text-sm"
                />
              </div>
            ))}

            <p className="mb-3 mt-6 text-sm font-semibold text-[#0B2545]">Support Section</p>
            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              <input value={content.supportTitle} onChange={(e) => setContent({ ...content, supportTitle: e.target.value })} className="rounded-xl border px-3 py-2 text-sm" />
              <input value={content.supportBadge} onChange={(e) => setContent({ ...content, supportBadge: e.target.value })} className="rounded-xl border px-3 py-2 text-sm" />
            </div>
            <textarea
              value={content.supportIntro}
              onChange={(e) => setContent({ ...content, supportIntro: e.target.value })}
              className="mb-3 w-full rounded-xl border px-3 py-2 text-sm"
              rows={2}
            />
            {(content.supportCards || []).map((c, i) => (
              <div key={i} className="mb-2 grid gap-2 sm:grid-cols-2">
                <input
                  value={c.title}
                  onChange={(e) => {
                    const cards = [...content.supportCards];
                    cards[i] = { ...cards[i], title: e.target.value };
                    setContent({ ...content, supportCards: cards });
                  }}
                  className="rounded-xl border px-3 py-2 text-sm"
                />
                <textarea
                  value={c.desc}
                  onChange={(e) => {
                    const cards = [...content.supportCards];
                    cards[i] = { ...cards[i], desc: e.target.value };
                    setContent({ ...content, supportCards: cards });
                  }}
                  rows={2}
                  className="rounded-xl border px-3 py-2 text-sm"
                />
              </div>
            ))}
            <button type="button" onClick={saveContent} disabled={saving} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0077C8] py-3 text-sm font-semibold text-white">
              <Save className="h-4 w-4" /> Save Content
            </button>
          </Panel>
        )}

        {/* Stats */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Total Orders", value: stats.total, icon: Package, color: "text-[#0077C8]" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-500" },
            { label: "Processing", value: stats.processing, icon: Truck, color: "text-blue-500" },
            { label: "Delivered", value: stats.delivered, icon: CheckCircle, color: "text-green-500" },
            { label: "Revenue", value: `Ghc${stats.revenue}`, icon: TrendingUp, color: "text-emerald-500" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <s.icon className={`mb-2 h-5 w-5 ${s.color}`} />
              <p className="text-xl font-bold text-[#0B2545]">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters + orders (Order Queue) */}
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            ["ALL", `All (${counts.ALL})`],
            ["PENDING", `Pending (${counts.PENDING})`],
            ["PROCESSING", `Processing (${counts.PROCESSING})`],
            ["CONFIRMED", `Confirmed (${counts.CONFIRMED})`],
            ["ON_THE_WAY", `On the Way (${counts.ON_THE_WAY})`],
            ["DELIVERED", `Delivered (${counts.DELIVERED})`],
            ["CANCELLED", `Cancelled (${counts.CANCELLED})`],
          ].map(([f, label]) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                filter === f ? "bg-[#0077C8] text-white" : "border bg-white text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">No orders in this filter.</div>
          ) : (
            filtered.map((o) => (
              <div key={o.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[#0B2545]">{o.orderNumber}</span>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[o.status] || ""}`}>
                        {STATUS_LABELS[o.status]}
                      </span>
                      {o.isSubscription && (
                        <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                          Subscription
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(o.createdAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      {o.username || o.customerName || o.email}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Droplets className="h-3.5 w-3.5" /> {o.gallons} gallons
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" /> {o.phone || "—"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {o.hostel || o.address}
                      </span>
                      <span>
                        {o.paymentMethod === "momo" ? "Mobile Money" : "Cash on Delivery"}
                      </span>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-[#0077C8]">
                    Ghc{Number(o.totalAmount).toFixed(2)}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Update Status</label>
                    <select
                      value={o.status}
                      onChange={(e) => updateOrder(o.id, { status: e.target.value })}
                      className="w-full rounded-xl border px-2 py-2 text-sm"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Driver Name</label>
                    <input
                      placeholder="Assign driver"
                      defaultValue={o.driverName || ""}
                      onBlur={(e) => {
                        if (e.target.value !== (o.driverName || "")) {
                          updateOrder(o.id, { driverName: e.target.value });
                        }
                      }}
                      className="w-full rounded-xl border px-2 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Driver Phone</label>
                    <input
                      placeholder="Driver phone"
                      defaultValue={o.driverPhone || ""}
                      onBlur={(e) => {
                        if (e.target.value !== (o.driverPhone || "")) {
                          updateOrder(o.id, { driverPhone: e.target.value });
                        }
                      }}
                      className="w-full rounded-xl border px-2 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function Panel({ title, subtitle, icon: Icon, onClose, action, children }) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0077C8] text-white">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <h2 className="font-bold text-[#0B2545]">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {action}
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function Btn({ onClick, icon: Icon, label, primary }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
        primary
          ? "bg-[#0077C8] text-white"
          : "border bg-white text-slate-600 hover:border-[#0077C8]"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function StatMini({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <Icon className="mb-1 h-5 w-5 text-[#0077C8]" />
      <p className="text-lg font-bold text-[#0B2545]">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
