"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Home,
  LogOut,
  Trash2,
  Loader2,
  Pencil,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/hostels").then((r) => r.json()),
    ]).then(([me, hos]) => {
      if (!me.user) {
        router.push("/login");
        return;
      }
      setUser(me.user);
      setForm({
        name: me.user.name || "",
        username: me.user.username || "",
        phone: me.user.phone || "",
        hostel: me.user.hostel || "",
        customHostel: me.user.customHostel || "",
      });
      setHostels(hos.hostels || []);
    });
  }, [router]);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setUser(data.user);
      setEdit(false);
      setMsg("Profile saved");
    } catch (e) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  const hostelDisplay =
    user.hostel === "Other"
      ? user.customHostel || "Other"
      : user.hostel || "—";

  return (
    <div className="min-h-screen bg-[#EEF6FC] pb-12">
      <SiteHeader user={user} />

      <main className="mx-auto max-w-md px-4 py-8">
        {/* Title */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0077C8]/10">
            <User className="h-5 w-5 text-[#0077C8]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#0B2545]">My Profile</h1>
            <p className="text-sm text-slate-500">Manage your account</p>
          </div>
        </div>

        {/* Admin banner */}
        {user.role === "ADMIN" && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-[#0077C8]/20 bg-[#0077C8]/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#0077C8]" />
              <div>
                <p className="text-sm font-semibold text-[#0B2545]">
                  Admin Account
                </p>
                <p className="text-xs text-slate-500">
                  You have access to the admin dashboard.
                </p>
              </div>
            </div>
            <Link
              href="/admin"
              className="shrink-0 rounded-xl bg-[#0077C8] px-3 py-2 text-xs font-semibold text-white"
            >
              Go to Admin
            </Link>
          </div>
        )}

        {/* Avatar */}
        <div className="mb-5 flex flex-col items-center">
          <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-slate-400">
            <User className="h-10 w-10" />
          </div>
          <button
            type="button"
            className="text-sm font-medium text-[#0077C8]"
            onClick={() => setMsg("Photo upload coming soon in local mode")}
          >
            Change Photo
          </button>
        </div>

        {msg && (
          <p className="mb-3 text-center text-sm text-[#0077C8]">{msg}</p>
        )}

        {/* Account details card */}
        <div className="mb-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[#0B2545]">Account Details</h2>
            {!edit ? (
              <button
                type="button"
                onClick={() => setEdit(true)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#0077C8]"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEdit(false)}
                className="text-sm text-slate-500"
              >
                Cancel
              </button>
            )}
          </div>

          {!edit ? (
            <div className="space-y-4">
              <Detail
                icon={User}
                label="Username"
                value={user.username || user.name || "—"}
              />
              <Detail icon={Mail} label="Email" value={user.email} />
              <Detail
                icon={Phone}
                label="Phone Number"
                value={user.phone || "—"}
              />
              <Detail icon={MapPin} label="Hostel" value={hostelDisplay} />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Username
                </label>
                <input
                  value={form.username}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      username: e.target.value,
                      name: e.target.value,
                    })
                  }
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Phone Number
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Hostel
                </label>
                <select
                  value={form.hostel}
                  onChange={(e) => setForm({ ...form, hostel: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm"
                >
                  <option value="">Select</option>
                  {hostels.map((h) => (
                    <option key={h.id} value={h.name}>
                      {h.name}
                    </option>
                  ))}
                  <option value="Other">Other (specify name)</option>
                </select>
              </div>
              {form.hostel === "Other" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Hostel Name
                  </label>
                  <input
                    value={form.customHostel}
                    onChange={(e) =>
                      setForm({ ...form, customHostel: e.target.value })
                    }
                    className="w-full rounded-xl border px-3 py-2.5 text-sm"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex w-full items-center justify-center rounded-xl bg-[#0077C8] py-2.5 text-sm font-semibold text-white"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 shadow-sm hover:border-[#0077C8]"
          >
            <Home className="h-4 w-4" /> Back to Home
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 shadow-sm hover:border-red-200 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
          <button
            type="button"
            onClick={() =>
              setMsg(
                "Account deletion is disabled in local mode. Contact support."
              )
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white py-3 text-sm font-medium text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Delete Account
          </button>
        </div>
      </main>
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0077C8]/10">
        <Icon className="h-4 w-4 text-[#0077C8]" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-[#0B2545]">{value}</p>
      </div>
    </div>
  );
}
