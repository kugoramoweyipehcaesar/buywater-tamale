"use client";

import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * Fixed theme control available on every route so toggling
 * light/dark always works and persists site-wide via next-themes.
 * Hidden on routes that already put a toggle in the main header
 * is optional — we keep it always visible for consistency.
 */
export default function GlobalThemeToggle() {
  const path = usePathname();
  // Keep available everywhere, including admin
  const bottom = path?.startsWith("/admin") ? "bottom-5" : "bottom-24";

  return (
    <div
      className={`fixed left-4 z-[60] ${bottom}`}
      title="Toggle light / dark theme for the whole site"
    >
      <ThemeToggle
        compact
        className="!h-11 !w-11 shadow-lg ring-1 ring-black/5 dark:ring-white/10"
      />
    </div>
  );
}
