"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import {
  Activity,
  Loader2,
  Search,
  Download,
  CheckCircle2,
} from "lucide-react";

const ACTIONS = [
  "",
  "LOGIN",
  "REGISTER",
  "ORDER_CREATED",
  "ORDER_STATUS",
  "PROFILE_UPDATE",
  "BAN",
  "INVITE",
  "DELETE_ACCOUNT",
];

export default function ActivityLogPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user || me.user.role !== "ADMIN") {
        router.push("/admin-login");
        return;
      }
      setUser(me.user);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "50",
      });
      if (action) params.set("action", action);
      if (q.trim()) params.set("q", q.trim());
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await fetch(`/api/admin/activity-log?${params}`).then((r) =>
        r.json()
      );
      setLogs(res.logs || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      router.push("/admin-login");
    } finally {
      setLoading(false);
    }
  }, [router, page, action, q, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  function exportCsv() {
    const header = "Time,Email,Action,Details,IP\n";
    const body = logs
      .map((l) =>
        [
          new Date(l.createdAt).toISOString(),
          csv(l.email),
          csv(l.action),
          csv(l.details),
          csv(l.ip),
        ].join(",")
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buywater-activity-${Date.now()}.csv`;
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

  return (
    <div className="pb-16">
      <SiteHeader user={user} />

      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0077C8] text-white">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0B2545] dark:text-zinc-50">
                User Activity Log
              </h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Historical feed of sign-ups, updates, and orders
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-[160px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="Search user / details"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">All actions</option>
            {ACTIONS.filter(Boolean).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div className="space-y-3">
          {logs.length === 0 && (
            <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              No activity yet
            </div>
          )}
          {logs.map((l) => (
            <div
              key={l.id}
              className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-green-600 dark:text-green-400">
                  {formatAction(l.action)}
                </p>
                <p className="text-sm font-semibold text-[#0B2545] dark:text-zinc-100">
                  {l.details || l.action}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {l.email || "system"}
                  {l.ip ? ` · IP ${l.ip}` : ""}
                </p>
                <p className="text-xs text-slate-400 dark:text-zinc-500">
                  {new Date(l.createdAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40 dark:border-zinc-700"
            >
              Prev
            </button>
            <span className="text-xs text-slate-500">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40 dark:border-zinc-700"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function formatAction(a) {
  if (!a) return "EVENT";
  return String(a).replace(/_/g, " ");
}

function csv(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
