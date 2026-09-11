"use client";

import { useEffect, useState } from "react";
import { Wrench, MessageCircle, Clock } from "lucide-react";

export default function MaintenancePage() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .catch(() => {});
  }, []);

  const msg =
    settings?.maintenanceMessage ||
    "We are under maintenance — back shortly. Thank you for your patience.";
  const phone = settings?.adminPhone || "0531448824";
  const digits = String(phone).replace(/\D/g, "").replace(/^0/, "233");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#0077C8] to-[#005A9E] px-4 text-white">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center text-[#0B2545] shadow-2xl">
        <img
          src="/logo.jpg"
          alt="BuyWater"
          className="mx-auto mb-4 h-16 w-16 rounded-full object-cover shadow"
        />
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
          <Wrench className="h-7 w-7 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold">Under Maintenance</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{msg}</p>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Clock className="h-4 w-4" />
          <span>{settings?.operatingHours || "7 AM – 8:30 PM DAILY"}</span>
        </div>
        <a
          href={`https://wa.me/${digits}`}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#1ebe57]"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp support · {phone}
        </a>
      </div>
      <p className="mt-8 text-sm text-white/70">BuyWater · Tamale</p>
    </div>
  );
}
