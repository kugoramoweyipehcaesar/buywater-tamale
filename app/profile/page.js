"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  LogOut,
  Loader2,
  Pencil,
  Camera,
  CheckCircle,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef(null);
  const [user, setUser] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);

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

  function toast(text, ok = true) {
    setMsg(text);
    setMsgOk(ok);
    setTimeout(() => setMsg(""), 3500);
  }

  async function save() {
    setSaving(true);
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
      toast("Profile saved — Live now");
    } catch (e) {
      toast(e.message, false);
    } finally {
      setSaving(false);
    }
  }

  async function onPhotoSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Please choose an image file", false);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast("Image must be under 2MB", false);
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await compressImage(file, 320, 0.75);
      const res = await fetch("/api/user/upload-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUser(data.user);
      toast("Photo updated — Live now");
    } catch (err) {
      toast(err.message, false);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removePhoto() {
    setUploading(true);
    try {
      const res = await fetch("/api/user/upload-photo", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Remove failed");
      setUser(data.user);
      toast("Photo removed");
    } catch (err) {
      toast(err.message, false);
    } finally {
      setUploading(false);
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
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0077C8]/10">
            <User className="h-5 w-5 text-[#0077C8]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#0B2545]">My Profile</h1>
            <p className="text-sm text-slate-500">Manage your account</p>
          </div>
        </div>

        {msg && (
          <div
            className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
              msgOk
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-600"
            }`}
          >
            {msgOk && <CheckCircle className="mr-1 inline h-4 w-4" />}
            {msg}
          </div>
        )}

        {user.role === "ADMIN" && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <Shield className="mr-1 inline h-4 w-4" />
            Admin account — you have full access to the admin office.
          </div>
        )}

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col items-center">
            <div className="relative">
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-[#0077C8]/20"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#0077C8]/10 ring-4 ring-[#0077C8]/10">
                  <User className="h-10 w-10 text-[#0077C8]" />
                </div>
              )}
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#0077C8] text-white shadow hover:bg-[#0066AD] disabled:opacity-60"
                title="Upload photo"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onPhotoSelected}
              />
            </div>
            <p className="mt-3 text-sm font-semibold text-[#0B2545]">
              {user.name || user.username || user.email}
            </p>
            <p className="text-xs text-slate-500">{user.email}</p>
            {user.profilePhoto && (
              <button
                type="button"
                onClick={removePhoto}
                disabled={uploading}
                className="mt-2 text-xs text-red-500 hover:underline"
              >
                Remove photo
              </button>
            )}
          </div>

          {!edit ? (
            <div className="space-y-3 text-sm">
              <Row icon={Mail} label="Email" value={user.email} />
              <Row icon={Phone} label="Phone" value={user.phone || "—"} />
              <Row icon={MapPin} label="Hostel" value={hostelDisplay} />
              <Row
                icon={Shield}
                label="Role"
                value={user.role === "ADMIN" ? "Admin" : "Customer"}
              />
              <button
                type="button"
                onClick={() => setEdit(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-[#0B2545] hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" /> Edit profile
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Field
                label="Name"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              />
              <Field
                label="Username"
                value={form.username}
                onChange={(v) => setForm((f) => ({ ...f, username: v }))}
              />
              <Field
                label="Phone"
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              />
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Hostel
                </label>
                <select
                  value={form.hostel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, hostel: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option value="">Select hostel</option>
                  {hostels.map((h) => (
                    <option key={h.id || h.name} value={h.name}>
                      {h.name}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>
              {form.hostel === "Other" && (
                <Field
                  label="Hostel name"
                  value={form.customHostel}
                  onChange={(v) => setForm((f) => ({ ...f, customHostel: v }))}
                />
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0077C8] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEdit(false)}
                  className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href="/dashboard"
            className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-center text-sm font-semibold text-[#0077C8]"
          >
            Orders
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </main>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="truncate font-medium text-[#0B2545]">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
      />
    </div>
  );
}

function compressImage(file, maxSide = 320, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(1, maxSide / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}
