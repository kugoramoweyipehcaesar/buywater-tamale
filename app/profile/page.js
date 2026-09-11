"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import ThemeToggle from "@/components/ThemeToggle";
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
  Home,
  Trash2,
  Moon,
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
  const [showDelete, setShowDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

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

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function deleteAccount() {
    if (deleteText !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      toast("Account deleted");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 600);
    } catch (e) {
      toast(e.message, false);
    } finally {
      setDeleting(false);
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500 dark:text-zinc-400">
        Loading...
      </div>
    );
  }

  const hostelDisplay =
    user.hostel === "Other"
      ? user.customHostel || "Other"
      : user.hostel || "—";

  return (
    <div className="min-h-screen bg-[#F0F7FC] pb-12 transition-colors duration-300 dark:bg-zinc-950">
      <SiteHeader user={user} />

      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-6 shadow-xl dark:border-red-900 dark:bg-zinc-900">
            <h3 className="text-lg font-bold text-[#0B2545] dark:text-zinc-50">
              Delete Account?
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-zinc-300">
              This will permanently delete your account, orders, and profile photo.
              This cannot be undone.
            </p>
            <input
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="Type DELETE"
              autoComplete="off"
              className="mt-3 w-full rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm font-mono uppercase dark:border-red-900 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={deleting || deleteText !== "DELETE"}
                onClick={deleteAccount}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDelete(false);
                  setDeleteText("");
                }}
                className="rounded-xl border px-4 py-2.5 text-sm font-semibold dark:border-zinc-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-md px-4 py-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0077C8]/10 dark:bg-sky-500/15">
            <User className="h-5 w-5 text-[#0077C8] dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#0B2545] dark:text-zinc-50">
              My Profile
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Manage your account
            </p>
          </div>
        </div>

        {msg && (
          <div
            className={`mb-4 rounded-xl border px-3 py-2 text-sm ${
              msgOk
                ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
                : "border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            {msgOk && <CheckCircle className="mr-1 inline h-4 w-4" />}
            {msg}
          </div>
        )}

        {user.role === "ADMIN" && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>
                <strong>Admin Account</strong>
                <span className="block text-xs opacity-80">
                  You have access to the admin dashboard.
                </span>
              </span>
            </div>
            <Link
              href="/admin"
              className="shrink-0 rounded-lg bg-[#0077C8] px-3 py-1.5 text-xs font-semibold text-white dark:bg-sky-500"
            >
              Go to Admin
            </Link>
          </div>
        )}

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6 flex flex-col items-center">
            <div className="relative">
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-[#0077C8]/15"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 ring-4 ring-slate-100 dark:bg-zinc-800 dark:ring-zinc-800">
                  <User className="h-10 w-10 text-slate-400" />
                </div>
              )}
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#0077C8] text-white shadow hover:bg-[#0066AD] disabled:opacity-60 dark:bg-sky-500"
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
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-2 text-xs font-semibold text-[#0077C8] dark:text-sky-400"
            >
              Change Photo
            </button>
          </div>

          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0B2545] dark:text-zinc-100">
              Account Details
            </h2>
            {!edit && (
              <button
                type="button"
                onClick={() => setEdit(true)}
                className="text-xs font-semibold text-[#0077C8] dark:text-sky-400"
              >
                Edit
              </button>
            )}
          </div>

          {!edit ? (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              <Detail icon={User} label="Username" value={user.username || user.name || "—"} />
              <Detail icon={Mail} label="Email" value={user.email} />
              <Detail icon={Phone} label="Phone Number" value={user.phone || "—"} />
              <Detail icon={MapPin} label="Hostel" value={hostelDisplay} />
            </div>
          ) : (
            <div className="space-y-3">
              <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
              <Field label="Username" value={form.username} onChange={(v) => setForm((f) => ({ ...f, username: v }))} />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                  Hostel
                </label>
                <select
                  value={form.hostel}
                  onChange={(e) => setForm((f) => ({ ...f, hostel: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0077C8] py-2.5 text-sm font-semibold text-white disabled:opacity-60 dark:bg-sky-500"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEdit(false)}
                  className="rounded-xl border px-4 py-2.5 text-sm font-semibold dark:border-zinc-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
              <div>
                <p className="text-sm font-semibold text-[#0B2545] dark:text-zinc-100">
                  Appearance
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Light / Dark theme
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <Home className="h-4 w-4" /> Back to Home
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-red-200 bg-white p-4 dark:border-red-900 dark:bg-zinc-900">
          <p className="mb-2 text-sm font-bold text-red-700 dark:text-red-400">
            Danger Zone
          </p>
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <Trash2 className="h-4 w-4" /> Delete My Account
          </button>
        </div>
      </main>
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0077C8]/10 dark:bg-sky-500/15">
        <Icon className="h-4 w-4 text-[#0077C8] dark:text-sky-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400 dark:text-zinc-500">{label}</p>
        <p className="truncate text-sm font-semibold text-[#0B2545] dark:text-zinc-100">
          {value}
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
