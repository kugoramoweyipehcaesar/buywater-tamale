"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import {
  Droplets,
  Truck,
  Shield,
  Clock,
  MessageCircle,
  Mail,
  Sparkles,
  MapPin,
  Smartphone,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  CreditCard,
} from "lucide-react";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => {});
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .catch(() => {});
  }, []);

  const price = settings?.pricePerGallon ?? 2.5;
  const hours = settings?.operatingHours || "7 AM - 8:30 PM DAILY";
  const deliveryMin = settings?.deliveryTimeMin ?? 45;
  const deliveryMax = settings?.deliveryTimeMax ?? 60;
  const subPrice = settings?.subscriptionPrice ?? 22;
  const subGallons = settings?.subscriptionGallons ?? 10;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const displayName =
    user?.name || user?.username || (user ? "there" : null);

  return (
    <div className="min-h-screen bg-[#F0F7FC]">
      <SiteHeader user={user} />

      {/* ========== HERO (blue gradient) ========== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0077C8] to-[#005A9E] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-12 text-center sm:pb-20 sm:pt-16">
          <img
            src="/logo.jpg"
            alt="BuyWater"
            className="mx-auto mb-5 h-20 w-20 rounded-full border-4 border-white/30 object-cover shadow-lg sm:h-24 sm:w-24"
          />
          {user && (
            <p className="mb-2 text-sm text-white/90">
              {greeting}, {displayName}! 👋
            </p>
          )}
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            {settings?.heroTitle || "Fresh Water Delivered"}
          </h1>
          <p className="mt-2 text-base text-white/90 sm:text-lg">
            To your door in {deliveryMin}–{deliveryMax} minutes
          </p>
          <p className="mt-1 text-sm text-white/70">
            Serving Tamale UDS and environs · Tamale, Northern Region, Ghana
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={user ? "/order" : "/register"}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0077C8] shadow hover:bg-slate-50"
            >
              <Droplets className="h-4 w-4" />
              Order Now — Ghc{price}/gallon
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-1 rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              How It Works <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mx-auto mt-10 grid max-w-lg grid-cols-3 gap-2 border-t border-white/20 pt-8 text-center">
            <div>
              <p className="text-xl font-bold sm:text-2xl">Ghc{price}</p>
              <p className="text-[11px] text-white/70 sm:text-xs">Per Gallon</p>
            </div>
            <div className="border-x border-white/20">
              <p className="text-xl font-bold sm:text-2xl">
                {deliveryMin}–{deliveryMax}
              </p>
              <p className="text-[11px] text-white/70 sm:text-xs">Min Delivery</p>
            </div>
            <div>
              <p className="text-sm font-bold leading-tight sm:text-base">
                {hours.includes("DAILY") ? hours : `${hours}`}
              </p>
              <p className="text-[11px] text-white/70 sm:text-xs">Daily Hours</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== PRODUCT STRIP ========== */}
      <section className="bg-[#F0F7FC] py-14 text-center">
        <h2 className="text-2xl font-bold text-[#0B2545]">
          Premium 20-Liter Water Gallons
        </h2>
        <p className="mx-auto mt-2 max-w-xl px-4 text-sm text-slate-500">
          {settings?.productDescription ||
            "Hygienically produced, affordably priced water gallons delivered fresh to your hostel door."}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-slate-600 shadow-sm">
            <Droplets className="h-3.5 w-3.5 text-[#0077C8]" /> 20L per gallon
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-semibold text-[#0077C8] shadow-sm">
            Ghc{price} each
          </span>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Truck className="h-4 w-4 text-[#0077C8]" /> Fast Delivery
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#0077C8]" /> Fresh & Clean
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-[#0077C8]" /> Trusted Service
          </span>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold text-[#0B2545]">
            How It Works
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                n: "1",
                icon: ClipboardList,
                title: "Pick Your Gallons",
                desc: `Choose how many gallons you need. 20L per gallon at Ghc${price} each. Select your hostel from the dropdown (Yaa Naa, Sagnarigu, Other Hostels — indicate name please).`,
              },
              {
                n: "2",
                icon: CreditCard,
                title: "Pay Your Way",
                desc: "Pay instantly with MoMo or choose Cash on Delivery. MTN, Vodafone, AirtelTigo supported.",
              },
              {
                n: "3",
                icon: Truck,
                title: "Get It Delivered",
                desc: `We deliver to your hostel in ${deliveryMin}–${deliveryMax} mins. Track your driver live until it reaches your door.`,
              },
            ].map((s) => (
              <div
                key={s.n}
                className="relative rounded-2xl border border-slate-100 bg-[#F8FBFE] p-6 text-center shadow-sm"
              >
                <div className="absolute -top-3 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-[#0077C8] text-xs font-bold text-white">
                  {s.n}
                </div>
                <div className="mx-auto mb-3 mt-2 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                  <s.icon className="h-6 w-6 text-[#0077C8]" />
                </div>
                <h3 className="font-semibold text-[#0B2545]">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== WHY CHOOSE ========== */}
      <section id="features" className="bg-[#F0F7FC] py-16">
        <div className="mx-auto max-w-4xl px-4">
          <div className="mb-2 text-center">
            <span className="rounded-full bg-[#0077C8]/10 px-3 py-1 text-xs font-semibold text-[#0077C8]">
              Built for Students
            </span>
          </div>
          <h2 className="mb-10 text-center text-2xl font-bold text-[#0B2545]">
            Why Choose BuyWater
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Truck,
                title: "Fast Delivery",
                desc: "Under 60 minutes to Yaa Naa Hall, Sagnarigu Hall, Kumbungu Hostel, Tech Hostel, Citadel Hostel, Northern Hostel and all other hostels.",
              },
              {
                icon: MapPin,
                title: "Live Order Tracking",
                desc: "Get your driver's number to call and track your delivery in real time until it reaches your door.",
              },
              {
                icon: Smartphone,
                title: "MoMo + Cash",
                desc: "Pay however is convenient. MTN, Vodafone, AirtelTigo supported — or pay cash on delivery.",
              },
              {
                icon: RefreshCw,
                title: "Subscribe & Save",
                desc: `Get ${subGallons} gallons for GH¢${subPrice} instead of GH¢${(
                  subGallons * price
                ).toFixed(0)}. Cancel wrong orders without any commitments.`,
              },
              {
                icon: Droplets,
                title: "Reliable Supply",
                desc: "Hygienic water, affordable, and always on time. We never leave you dry and unattended to.",
              },
              {
                icon: MessageCircle,
                title: "WhatsApp Support",
                desc: "Quick help if your water is late. Message us directly on WhatsApp for the fastest response.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0077C8]">
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-[#0B2545]">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SUPPORT ========== */}
      <section id="support" className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href="https://wa.me/233531448824"
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-3 rounded-2xl border border-green-100 bg-[#F0FDF4] p-5 transition hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500 text-white">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-[#0B2545]">WhatsApp</p>
                <p className="text-sm text-slate-600">
                  0531448824 — Fastest response
                </p>
              </div>
            </a>
            <a
              href="mailto:buywater.tamale@gmail.com"
              className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-[#EFF6FF] p-5 transition hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0077C8] text-white">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-[#0B2545]">Email</p>
                <p className="text-sm text-slate-600">
                  We&apos;ll reply within 24 hours
                </p>
              </div>
            </a>
            <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-[#0B2545]">Hours</p>
                <p className="text-sm text-slate-600">
                  7 AM - 8:30 PM, Including weekends
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-[#FFFBEB] p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-white">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-[#0B2545]">Issues?</p>
                <p className="text-sm text-slate-600">
                  Late delivery, Wrong Hostel selection. Any other concerns can
                  be reported to the support team now
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="bg-gradient-to-b from-[#F0F7FC] to-white py-16 text-center">
        <img
          src="/logo.jpg"
          alt="BuyWater"
          className="mx-auto mb-4 h-16 w-16 rounded-full object-cover shadow"
        />
        <h2 className="text-2xl font-bold text-[#0B2545] sm:text-3xl">
          Thirsty? Get Water Now.
        </h2>
        <p className="mx-auto mt-2 max-w-md px-4 text-sm text-slate-500">
          Order in seconds. Delivered in minutes. Serving all UDS hostels and
          environs in Tamale.
        </p>
        <Link
          href={user ? "/order" : "/register"}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0077C8] px-8 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-[#0066AD]"
        >
          Place Your Order <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="bg-[#0B2545] py-10 text-center text-white">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-2 px-4">
          <div className="mb-1 flex items-center gap-2">
            <img
              src="/logo.jpg"
              alt="BuyWater"
              className="h-10 w-10 rounded-full object-cover"
            />
            <span className="font-semibold">BuyWater</span>
          </div>
          <p className="text-sm text-white/70">
            Tamale UDS and environs · Tamale, Northern Region, Ghana
          </p>
          <p className="text-sm text-white/70">
            Call: 0531448824 / 0502748671
          </p>
          <p className="mt-3 text-xs text-white/40">
            © {new Date().getFullYear()} BuyWater. Fresh Water Delivered.
          </p>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a
        href="https://wa.me/233531448824"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600"
        aria-label="WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>
    </div>
  );
}
