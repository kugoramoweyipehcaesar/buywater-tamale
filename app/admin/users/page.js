"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import {
  Users,
  UserPlus,
  Loader2,
  Search,
  X,
  Shield,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

const SUPER = "kugoramoweyipehcaesar49@gmail.com";
const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

function isAdminRole(role) {
  return ADMIN_ROLES.includes(String(role || "").toUpperCase());
}

function isSuperProtected(u) {
  if (!u) return false;
  return u.email === SUPER || u.role === "SUPER_ADMIN";
}

export default function UserDirectoryPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    admins: 0,
    activeToday: 0,
    newUsers7d: 0,
  });
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const load = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user || !isAdminRole(me.user.role)) {
        router.push("/admin-login");
        return;
      }
      setUser(me.user);

      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
        role,
      });
      if (q.trim()) params.set("q", q.trim());

      const res = await fetch(`/api/admin/users/list?${params}`).then((r) =>
        r.json()
      );
      if (res.error) throw new Error(res.error);

      setUsers(res.users || []);
      setStats(
        res.stats || {
          totalUsers: 0,
          admins: 0,
          activeToday: 0,
          newUsers7d: 0,
        }
      );
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch {
      router.push("/admin-login");
    } finally {
      setLoading(false);
    }
  }, [router, page, role, q]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleBan(u) {
    if (!u) return;
    if (isSuperProtected(u)) {
      showToast("Cannot ban the super admin");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, banned: !u.banned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast(data.user.banned ? "User banned" : "User unbanned");
      setSelected((prev) =>
        prev && prev.id === u.id ? { ...prev, banned: data.user.banned } : prev
      );
      await load();
    } catch (err) {
      showToast(err.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  async function promoteUser(u) {
    if (!u) return;
    if (isSuperProtected(u)) {
      showToast("Cannot demote super admin");
      return;
    }
    const nextRole =
      u.role === "ADMIN" || u.role === "SUPER_ADMIN" ? "USER" : "ADMIN";
    if (nextRole === "ADMIN" && !confirm(`Promote ${u.email} to Admin?`))
      return;
    if (nextRole === "USER" && !confirm(`Demote ${u.email} to regular user?`))
      return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, role: nextRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast(
        nextRole === "ADMIN"
          ? `${u.email} is now an Admin`
          : `${u.email} demoted to user`
      );
      setSelected((prev) =>
        prev && prev.id === u.id ? { ...prev, role: nextRole } : prev
      );
      await load();
    } catch (err) {
      showToast(err.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500 dark:text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-16">
      <SiteHeader user={user} />
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0077C8] text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-black dark:text-zinc-50">
                User Directory
              </h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                {stats.totalUsers} registered users
              </p>
            </div>
          </div>
          <Link
            href="/admin/invite-admin"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#0077C8] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0066ad] dark:bg-sky-500"
          >
            <UserPlus className="h-4 w-4" /> Invite Admin
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Admins" value={stats.admins} />
          <StatCard label="Active Today" value={stats.activeToday} />
          <StatCard label="New (7 days)" value={stats.newUsers7d} />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="Search name or email"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          {["all", "customers", "admins"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r);
                setPage(1);
              }}
              className={`rounded-full px-3.5 py-2 text-xs font-semibold capitalize transition ${
                role === r
                  ? "bg-[#0077C8] text-white dark:bg-sky-500"
                  : "border border-slate-200 bg-white text-slate-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              }`}
            >
              {r === "all" ? "All" : r}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-zinc-800">
                <Users className="h-7 w-7" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">
                No users found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-slate-50 transition hover:bg-slate-50/80 dark:border-zinc-800/60 dark:hover:bg-zinc-800/40"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-black dark:text-zinc-100">
                          {u.name || u.username || "—"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">
                          {u.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-zinc-300">
                        {u.phone || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge banned={u.banned} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setSelected(u)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-300"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelected(null)}
          />
          <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-black dark:text-zinc-50">
                User details
              </h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">
              <p className="text-lg font-bold text-black dark:text-zinc-50">
                {selected.name || selected.username || "—"}
              </p>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                {selected.email}
              </p>
              <div className="mt-2 flex gap-2">
                <RoleBadge role={selected.role} />
                <StatusBadge banned={selected.banned} />
              </div>
              <dl className="mt-6 space-y-3 text-sm">
                <Row label="Phone" value={selected.phone || "—"} />
                <Row label="Orders" value={String(selected.orderCount ?? 0)} />
              </dl>
            </div>
            <div className="space-y-2 border-t border-slate-100 p-4 dark:border-zinc-800">
              {isSuperProtected(selected) ? (
                <p className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-3 text-center text-sm font-medium text-violet-800 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200">
                  Super admin is protected — cannot ban, demote, or delete.
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => promoteUser(selected)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        {isAdminRole(selected.role)
                          ? "Demote to user"
                          : "Promote to Admin"}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggleBan(selected)}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60 ${
                      selected.banned
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : selected.banned ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Unban user
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4" /> Ban user
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-black dark:text-zinc-50">{value}</p>
    </div>
  );
}

function RoleBadge({ role }) {
  const isAdmin = isAdminRole(role);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        isAdmin
          ? "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300"
          : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {isAdmin && <Shield className="h-3 w-3" />}
      {role || "USER"}
    </span>
  );
}

function StatusBadge({ banned }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        banned
          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
      }`}
    >
      {banned ? "Banned" : "Active"}
    </span>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-50 py-2 dark:border-zinc-800">
      <dt className="text-slate-500 dark:text-zinc-400">{label}</dt>
      <dd className="text-right font-medium text-black dark:text-zinc-100">{value}</dd>
    </div>
  );
}
