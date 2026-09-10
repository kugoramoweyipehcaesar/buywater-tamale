"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, Loader2, Check } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      if (data.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError("Network error – is the server running?");
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

      <h1 className="text-2xl font-bold text-[#0B2545]">Welcome Back</h1>
      <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>

      <div className="mt-6 w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-lg sm:p-8">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0B2545]">
              Email
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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#0B2545]">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-[#0077C8] focus:ring-2 focus:ring-[#0077C8]/20"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-slate-600">
              <span
                role="checkbox"
                aria-checked={remember}
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  remember
                    ? "border-[#0077C8] bg-[#0077C8] text-white"
                    : "border-slate-300"
                }`}
                onClick={() => setRemember(!remember)}
              >
                {remember && <Check className="h-3 w-3" />}
              </span>
              Remember me
            </label>
            <Link
              href="/forgot-password"
              className="font-medium text-[#0077C8] hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-[#0077C8] py-3 text-sm font-semibold text-white hover:bg-[#0066AD] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Login"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">OR</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <p className="text-center text-sm text-slate-500">
          Need help?{" "}
          <a
            href="https://wa.me/233531448824"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-[#0077C8] hover:underline"
          >
            WhatsApp 0531448824
          </a>
        </p>
      </div>

      <p className="mt-6 text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-[#0077C8] hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
