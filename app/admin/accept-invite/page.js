"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Shield, CheckCircle } from "lucide-react";

function AcceptInviteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing invite token");
      setLoading(false);
      return;
    }
    fetch(`/api/admin/accept-invite?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setInvite(data);
          setNeedsPassword(true);
        }
      })
      .catch(() => setError("Could not validate invite"))
      .finally(() => setLoading(false));
  }, [token]);

  async function accept(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: name.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDone(true);
      setTimeout(() => router.push("/admin-login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#0077C8]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#D6EAF8] px-4 py-10 dark:bg-zinc-950">
      <div className="mb-6 flex flex-col items-center">
        <img
          src="/logo.jpg"
          alt="BuyWater"
          className="mb-3 h-16 w-16 rounded-full object-cover shadow ring-4 ring-white"
        />
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#0077C8]" />
          <h1 className="text-xl font-bold text-[#0B2545] dark:text-zinc-50">
            Admin Invite
          </h1>
        </div>
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg dark:bg-zinc-900">
        {done ? (
          <div className="py-6 text-center">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
            <p className="font-bold text-[#0B2545] dark:text-zinc-50">
              Invite accepted
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Redirecting to admin login…
            </p>
          </div>
        ) : error && !invite ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <Link
              href="/"
              className="inline-block text-sm font-semibold text-[#0077C8]"
            >
              Back to site
            </Link>
          </div>
        ) : (
          <form onSubmit={accept} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-zinc-300">
              You are invited as{" "}
              <strong>{invite?.role || "ADMIN"}</strong> for{" "}
              <strong>{invite?.email}</strong>
            </p>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                Display name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Your name"
              />
            </div>
            {needsPassword && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-zinc-400">
                  Password (required if new account)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  placeholder="Min 6 characters"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center rounded-xl bg-[#0077C8] py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Accept invite"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      }
    >
      <AcceptInviteInner />
    </Suspense>
  );
}
