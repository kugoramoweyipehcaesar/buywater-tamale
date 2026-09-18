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
    riders: 0,
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
          riders: 0,
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

  async function setUserRole(u, nextRole) {
    if (!u) return;
    if (isSuperProtected(u)) {
      showToast("Cannot change role of the super admin");
      return;
    }
    const labels = { USER: "User", ADMIN: "Admin", RIDER: "Rider" };
    if (!confirm(`Set ${u.email} to ${labels[nextRole] || nextRole}?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, role: nextRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      showToast(`${u.email} is now ${labels[nextRole] || nextRole}`);
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-black dark:text-zinc-100">User directory</h1>
            <p className="text-sm text-slate-500">Manage roles, riders, and bans</p>
          </div>
          <Link
            href="/admin/invite-admin"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0077C8] px-3 py-2 text-xs font-semibold text-white"
          >
            <UserPlus className="h-4 w-4" /> Invite Admin
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Admins" value={stats.admins} />
          <StatCard label="Riders" value={stats.riders || 0} />
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
          {["all", "customers", "admins", "riders"].map((r) => (
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
              <Users className="mb-3 h-7 w-7 text-slate-400" />
              <p className="text-sm font-medium text-slate-600 dark:text-zinc-300">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500 dark:border-zinc-800 dark:bg-zinc-950">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-950/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-black dark:text-zinc-100">{u.name || u.username || "—"}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-zinc-300">{u.phone || "—"}</td>
                      <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                      <td className="px-4 py-3"><StatusBadge banned={u.banned} /></td>
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
          <div className="mt-4 flex items-center justify-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border px-2 py-1 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-slate-500">Page {page} / {totalPages} ({total})</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-2 py-1 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>

      {selected && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="font-bold text-black dark:text-zinc-100">{selected.name || selected.username}</p>
                <p className="text-sm text-slate-500">{selected.email}</p>
                <div className="mt-1"><RoleBadge role={selected.role} /></div>
              </div>
              <button type="button" onClick={() => setSelected(null)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <div className="space-y-2">
              {!isSuperProtected(selected) && (
                <>
                  {selected.role !== "ADMIN" && selected.role !== "SUPER_ADMIN" && (
                    <button type="button" disabled={busy} onClick={() => setUserRole(selected, "ADMIN")} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white">
                      <ShieldCheck className="h-4 w-4" /> Make Admin
                    </button>
                  )}
                  {selected.role !== "RIDER" && (
                    <button type="button" disabled={busy} onClick={() => setUserRole(selected, "RIDER")} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white">
                      Make Rider
                    </button>
                  )}
                  {selected.role !== "USER" && (
                    <button type="button" disabled={busy} onClick={() => setUserRole(selected, "USER")} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-600 py-3 text-sm font-semibold text-white">
                      Demote to User
                    </button>
                  )}
                  <button type="button" disabled={busy} onClick={() => toggleBan(selected)} className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white ${selected.banned ? "bg-emerald-600" : "bg-red-600"}`}>
                    <Ban className="h-4 w-4" /> {selected.banned ? "Unban user" : "Ban user"}
                  </button>
                </>
              )}
              {isSuperProtected(selected) && (
                <p className="rounded-xl bg-violet-50 px-3 py-2 text-xs text-violet-800">Super admin is protected — cannot ban or change role.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }) {
  const r = String(role || "USER").toUpperCase();
  const isAdmin = isAdminRole(r);
  const isRider = r === "RIDER";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
      isAdmin ? "bg-violet-100 text-violet-800" : isRider ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-600"
    }`}>
      {isAdmin && <Shield className="h-3 w-3" />}
      {r === "SUPER_ADMIN" ? "Super Admin" : r === "RIDER" ? "Rider" : r === "ADMIN" ? "Admin" : "User"}
    </span>
  );
}

function StatusBadge({ banned }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
      banned ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
    }`}>
      {banned ? "Banned" : (<><CheckCircle2 className="h-3 w-3" /> Active</>)}
    </span>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <dt className="text-[11px] font-medium uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-xl font-bold text-black dark:text-zinc-100">{value}</dd>
    </div>
  );
}
