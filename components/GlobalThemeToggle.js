"use client";

import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * Fixed theme control for pages without SiteHeader.
 * Hidden on /order (uses SiteHeader) and all /admin routes.
 */
export default function GlobalThemeToggle() {
  const path = usePathname();

  const hide =
    path === "/order" ||
    path?.startsWith("/order/") ||
    path?.startsWith("/admin") ||
    path?.startsWith("/admin-login");

  if (hide) return null;

  return (
    <div
      className="fixed bottom-24 left-4 z-[60]"
      title="Toggle light / dark theme for the whole site"
    >
      <ThemeToggle
        compact
        className="!h-11 !w-11 shadow-lg ring-1 ring-black/5 dark:ring-white/10"
      />
    </div>
  );
}
