"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Activity,
  Wrench,
  ListOrdered,
  CreditCard,
  ShieldCheck,
  BarChart3,
  Package,
  Settings,
  Building2,
  Tag,
  Megaphone,
} from "lucide-react";

const MENU = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "User Directory", icon: Users },
  { href: "/admin/activity-log", label: "Activity Log", icon: Activity },
  { href: "/admin/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/admin/order-queue", label: "Order Queue", icon: ListOrdered },
  { href: "/admin/payment-settings", label: "Payment Settings", icon: CreditCard },
  { href: "/admin/order-verification", label: "Verification", icon: ShieldCheck },
  { href: "/admin?panel=overview", label: "Overview", icon: BarChart3, panel: "overview" },
  { href: "/admin?panel=orders", label: "Orders", icon: Package, panel: "orders" },
  { href: "/admin?panel=settings", label: "Settings", icon: Settings, panel: "settings" },
  { href: "/admin?panel=hostels", label: "Hostels", icon: Building2, panel: "hostels" },
  { href: "/admin?panel=promos", label: "Promos", icon: Tag, panel: "promos" },
  { href: "/admin?panel=announce", label: "Announcements", icon: Megaphone, panel: "announce" },
];

function NavItem({ href, label, icon: Icon, exact }) {
  const path = usePathname();
  let active = false;
  if (exact) {
    active = path === "/admin";
  } else if (href.startsWith("/admin?")) {
    active = false;
  } else {
    active = path === href || path.startsWith(href + "/");
  }
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition ${
        active
          ? "rounded-lg bg-blue-600 text-white"
          : "rounded-lg text-slate-300 hover:bg-slate-700/80 hover:text-white"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {label}
    </Link>
  );
}

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#f1f5f9]">
      <aside className="flex w-[250px] shrink-0 flex-col bg-[#1e293b] text-white">
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/20 ring-2 ring-sky-400/40">
            <span className="text-lg">💧</span>
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold leading-tight tracking-tight">BuyWater</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Ghana · Tamale
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
          {MENU.map((item) => (
            <NavItem key={item.href + item.label} {...item} />
          ))}
        </nav>

        <div className="border-t border-slate-600/50 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-600 text-sm">
              👤
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Admin</p>
              <p className="text-[11px] text-slate-400">Super admin</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
