"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageSquareWarning,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export default function AdminComplaintsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState("");

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  const load = useCallback(async () => {
    try {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user || !["ADMIN", "SUPER_ADMIN"].includes(me.user.role)) {
        router.push("/admin-login");
        return;
      }
      const res = await fetch("/api/feedback").then((r) => r.json());
      if (res.error) throw new Error(res.error);
      setItems(res.complaints || []);
    } catch (e) {
      showToast(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id, status) {
    setBusyId(id);
    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setItems((list) =>
        list.map((c) => (c.id === id ? { ...c, status } : c))
      );
      showToast("Updated");
    } catch (e) {
      showToast(e.message || "Failed");
    } finally {
      setBusyId("");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-16">
      {toast && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-[#0077C8]">
          <ArrowLeft className="h-4 w-4" /> Admin Office
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100">
            <MessageSquareWarning className="h-5 w-5 text-orange-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black">User Complaints</h1>
            <p className="text-sm text-slate-500">
              {items.length} complaint{items.length === 1 ? "" : "s"} — admin only
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
            No complaints yet
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((c) => (
              <article
                key={c.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-black">
                      {c.userName || "User"}{" "}
                      <span className="font-normal text-slate-500">
                        {c.userEmail || ""}
                      </span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(c.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      c.status === "open"
                        ? "bg-amber-100 text-amber-800"
                        : c.status === "closed"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-green-100 text-green-700"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-700">{c.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {c.status !== "responded" && (
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => setStatus(c.id, "responded")}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#0077C8] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark responded
                    </button>
                  )}
                  {c.status !== "closed" && (
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => setStatus(c.id, "closed")}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-50"
                    >
                      Close
                    </button>
                  )}
                  {c.status !== "open" && (
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => setStatus(c.id, "open")}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-amber-700 disabled:opacity-50"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
