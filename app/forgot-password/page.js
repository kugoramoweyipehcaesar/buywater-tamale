"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [devLink, setDevLink] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setDevLink("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Request failed");
        return;
      }
      setSent(true);
      if (data.devResetUrl) setDevLink(data.devResetUrl);
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#D6EAF8] px-4 py-10">
      <div className="mb-6 flex flex-col items-center">
        <img
          src="/logo.jpg"
          alt="BuyWater"
          className="mb-3 h-[72px] w-[72px] rounded-full object-cover shadow-md ring-4 ring-white"
        />
        <p className="text-sm text-[#5B7A94]">Delivery in Tamale</p>
      </div>

      <h1 className="text-2xl font-bold text-[#0B2545]">Reset password</h1>
      <p className="mt-1 text-sm text-slate-500">
        We&apos;ll send you a link to reset it
      </p>

      <div className="mt-6 w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-lg sm:p-8">
        {sent ? (
          <div className="py-4 text-center">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
            <p className="font-semibold text-[#0B2545]">Check your email</p>
            <p className="mt-2 text-sm text-slate-500">
              If an account exists for <strong>{email}</strong>, a reset link
              has been sent. Check your inbox and spam folder.
            </p>
            {devLink && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-900">
                <p className="font-semibold">Dev mode (SMTP not configured)</p>
                <p className="mt-1 break-all">
                  Open:{" "}
                  <a href={devLink} className="text-[#0077C8] underline">
                    {devLink}
                  </a>
                </p>
                <p className="mt-1 text-amber-700">
                  Also printed in the terminal running npm run dev.
                </p>
              </div>
            )}
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[#0077C8]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to log in
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#0B2545]">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#0077C8] focus:ring-2 focus:ring-[#0077C8]/20"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-[#0077C8] py-3 text-sm font-semibold text-white hover:bg-[#0066AD] disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Send reset link"
                )}
              </button>
            </form>
          </>
        )}
      </div>

      {!sent && (
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[#0077C8] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to log in
        </Link>
      )}
    </div>
  );
}
