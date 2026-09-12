"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTree,
  ShieldCheck,
  CreditCard,
  Wrench,
  Users,
  HelpCircle,
  Settings,
} from "lucide-react";

const MAIN_MENU = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/order-queue", label: "Order Queue", icon: ListTree },
  { href: "/admin/order-verification", label: "Verification", icon: ShieldCheck },
  { href: "/admin/payment-settings", label: "Payments", icon: CreditCard },
  { href: "/admin/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/admin/users", label: "User Directory", icon: Users },
];

const SUPPORT = [
  { href: "/admin/activity-log", label: "Help & Docs", icon: HelpCircle },
  { href: "/admin/invite-admin", label: "Settings", icon: Settings },
];

function NavItem({ href, label, icon: Icon, exact }) {
  const path = usePathname();
  const active = exact
    ? path === href
    : path === href || path.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-blue-600 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#f1f5f9] dark:bg-zinc-950">
      {/* Left sidebar — 260px dark */}
      <aside className="flex w-[260px] shrink-0 flex-col bg-[#0f172a] text-white">
        <div className="border-b border-slate-700/60 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0284c7] text-sm font-black">
              BW
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight">BuyWater</p>
              <p className="truncate text-[11px] text-slate-400">Fresh Water Delivered</p>
            </div>
          </div>
          <span className="mt-3 inline-flex rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-sky-300">
            GHANA · TAMALE
          </span>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          <div>
            <p className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Main Menu
            </p>
            <div className="space-y-0.5">
              {MAIN_MENU.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Support
            </p>
            <div className="space-y-0.5">
              {SUPPORT.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          </div>
        </nav>

        <div className="border-t border-slate-700/60 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold">
              SA
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold">Super Admin</p>
              <p className="truncate text-[10px] text-slate-400">
                kugoramoweyipehcaesar49@gmail.com
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Right content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
