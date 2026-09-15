"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";

/**
 * Shows the latest active admin announcement as a closable modal on the dashboard.
 * Dismissal is remembered in localStorage per announcement id.
 */
export default function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/announcements");
        const data = await res.json();
        const list = (data.announcements || []).filter((a) => a.active !== false);
        const latest = list[0] || null;
        if (!latest || cancelled) return;
        const key = `bw_ann_dismissed_${latest.id}`;
        if (typeof window !== "undefined" && localStorage.getItem(key)) return;
        setAnnouncement(latest);
        setOpen(true);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function dismiss() {
    if (announcement?.id && typeof window !== "undefined") {
      localStorage.setItem(`bw_ann_dismissed_${announcement.id}`, "1");
    }
    setOpen(false);
  }

  if (!open || !announcement) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-title"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close announcement"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-3 flex items-center gap-2 pr-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0077C8]/10">
            <Megaphone className="h-5 w-5 text-[#0077C8]" />
          </div>
          <h2 id="announcement-title" className="text-lg font-bold text-[#0B2545]">
            {announcement.title || "Announcement"}
          </h2>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {announcement.body || announcement.message || ""}
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="mt-5 w-full rounded-xl bg-[#0077C8] py-2.5 text-sm font-semibold text-white hover:bg-[#0066ad]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
