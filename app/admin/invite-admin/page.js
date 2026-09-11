"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import {
  UserPlus,
  Loader2,
  Mail,
  CheckCircle,
  Clock,
  ArrowLeft,
  Copy,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function InviteAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [invites, setInvites] = useState([]);
  const [lastInviteUrl, setLastInviteUrl] = useState("");
  const [emailSent, setEmailSent] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  const load = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me", { credentials: "include" }).then(
        (r) => r.json()
      );
      if (!me.user || me.user.role !== "ADMIN") {
        router.push("/admin-login");
        return;
      }
      setUser(me.user);
      const res = await fetch("/api/admin/invite", {
        credentials: "include",
      }).then((r) => r.json());
      if (res.error && !res.invites) {
        console.warn("invite list:", res.error);
      }
      setInvites(res.invites || []);
    } catch {
      router.push("/admin-login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function sendInvite(e) {
    e.preventDefault();
    setError("");
    setLastInviteUrl("");
    setEmailSent(null);
    const clean = email.trim();
    if (!clean) {
      setError("Enter an email address");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      setEmailSent(!!data.emailSent);
      if (data.inviteUrl) setLastInviteUrl(data.inviteUrl);

      if (data.emailSent) {
        showToast(`Email sent to ${clean}`);
        setError("");
      } else {
        showToast("Invite created — share the link below");
        setError(
          data.message ||
            data.emailError ||
            "Email could not be sent. Copy the invite link and send it manually."
        );
      }
      setEmail("");
      await load();
    } catch (err) {
      console.error("sendInvite", err);
      setError(err.message || "Failed to send invite");
      showToast(err.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!lastInviteUrl) return;
    try {
      await navigator.clipboard.writeText(lastInviteUrl);
      showToast("Link copied");
    } catch {
      showToast("Could not copy — select the link manually");
    }
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
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-lg px-4 py-6">
        <Link
          href="/admin/users"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[#0077C8] dark:text-sky-400"
        >
          <ArrowLeft className="h-4 w-4" /> User Directory
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0077C8] text-white">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0B2545] dark:text-zinc-50">
              Invite Admin
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Send a 24h email invite to join as admin
            </p>
          </div>
        </div>

        <form
          onSubmit={sendInvite}
          className="mb-4 space-y-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#0077C8] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>

          {error && (
            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {emailSent === true && (
            <div className="flex gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Invite email sent successfully.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0077C8] py-3 text-sm font-semibold text-white disabled:opacity-60 dark:bg-sky-500"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Send Invite
              </>
            )}
          </button>
        </form>

        {lastInviteUrl && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-zinc-300">
              Invite link (valid 24h) — copy & share if email did not arrive
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={lastInviteUrl}
                className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#0B2545] px-3 py-2 text-xs font-semibold text-white"
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </button>
              <a
                href={lastInviteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open
              </a>
            </div>
          </div>
        )}

        <h2 className="mb-3 text-sm font-bold text-[#0B2545] dark:text-zinc-100">
          Recent invites
        </h2>
        <div className="space-y-2">
          {invites.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-zinc-800">
              No invites yet
            </p>
          )}
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#0B2545] dark:text-zinc-100">
                  {inv.email}
                </p>
                <p className="text-xs text-slate-500">
                  {inv.role} ·{" "}
                  {new Date(inv.createdAt).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  inv.status === "accepted"
                    ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300"
                    : inv.status === "pending"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-slate-100 text-slate-600"
                }`}
              >
                {inv.status === "accepted" ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <Clock className="h-3 w-3" />
                )}
                {inv.status}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
