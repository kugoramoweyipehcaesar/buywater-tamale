"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";

export default function SiteHeader({ user }) {
  const path = usePathname();
  const onHome = path === "/";

  return (
    <header
      className={`sticky top-0 z-20 border-b ${
        onHome
          ? "border-white/10 bg-[#0077C8]/95 text-white backdrop-blur"
          : "border-slate-200 bg-white/95 text-slate-800 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <img
            src="/logo.jpg"
            alt="BuyWater"
            className="h-9 w-9 rounded-full object-cover ring-2 ring-white/40"
          />
          <div className="hidden leading-tight sm:block">
            <p className={`text-sm font-bold ${onHome ? "text-white" : "text-[#0077C8]"}`}>
              BuyWater
            </p>
            <p className={`text-[10px] ${onHome ? "text-white/70" : "text-slate-500"}`}>
              Fresh Water Delivered
            </p>
          </div>
        </Link>
        <nav className="hidden items-center gap-5 md:flex">
          <a
            href="/#how-it-works"
            className={`text-sm font-medium ${onHome ? "text-white/90 hover:text-white" : "text-slate-600 hover:text-[#0077C8]"}`}
          >
            How It Works
          </a>
          <a
            href="/#features"
            className={`text-sm font-medium ${onHome ? "text-white/90 hover:text-white" : "text-slate-600 hover:text-[#0077C8]"}`}
          >
            Features
          </a>
          <a
            href="/#support"
            className={`text-sm font-medium ${onHome ? "text-white/90 hover:text-white" : "text-slate-600 hover:text-[#0077C8]"}`}
          >
            Support
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                onHome
                  ? "border border-white/30 text-white hover:bg-white/10"
                  : "border text-[#0B2545] hover:bg-slate-50"
              }`}
            >
              ADMIN OFFICE
            </Link>
          )}
          {user ? (
            <>
              <Link
                href="/dashboard"
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                  onHome
                    ? "bg-white/15 text-white hover:bg-white/25"
                    : "bg-[#0077C8]/10 text-[#0077C8] hover:bg-[#0077C8]/20"
                }`}
              >
                Order
              </Link>
              <Link
                href="/profile"
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                  onHome
                    ? "text-white/90 hover:text-white"
                    : "text-slate-600 hover:text-[#0077C8]"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  onHome ? "text-white/90" : "text-slate-600"
                }`}
              >
                Login
              </Link>
              <Link
                href="/register"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  onHome
                    ? "bg-white text-[#0077C8]"
                    : "bg-[#0077C8] text-white"
                }`}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
