"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Activity,
  ListOrdered,
  ClipboardCheck,
  CreditCard,
  Wrench,
} from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "User Directory", icon: Users },
  { href: "/admin/invite-admin", label: "Invite Admin", icon: UserPlus },
  { href: "/admin/activity-log", label: "Activity Log", icon: Activity },
  { href: "/admin/order-queue", label: "Order Queue", icon: ListOrdered },
  { href: "/admin/order-verification", label: "Verification", icon: ClipboardCheck },
  { href: "/admin/payment-settings", label: "Payments", icon: CreditCard },
  { href: "/admin/maintenance", label: "Maintenance", icon: Wrench },
];

export default function AdminLayout({ children }) {
  const path = usePathname();

  return (
    <div className="min-h-screen bg-[#EEF6FC] transition-colors duration-300 dark:bg-zinc-950">
      <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 py-2">
          {LINKS.map((l) => {
            const active = l.exact
              ? path === l.href
              : path === l.href || path.startsWith(l.href + "/");
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-[#0077C8] text-white dark:bg-sky-500"
                    : "text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
