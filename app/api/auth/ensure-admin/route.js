import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

/**
 * Bootstrap / recovery: ensure super admin exists.
 * POST with header x-setup-secret matching SETUP_SECRET (or JWT_SECRET fallback).
 * Safe to call multiple times (upsert).
 */
export async function POST(request) {
  try {
    const secret =
      request.headers.get("x-setup-secret") ||
      (await request.json().catch(() => ({}))).setupSecret;
    const expected =
      process.env.SETUP_SECRET || process.env.JWT_SECRET || "buywater-setup";
    if (!secret || secret !== expected) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const email = "kugoramoweyipehcaesar49@gmail.com";
    const password = await hashPassword("Dominion4244");

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password,
        role: "ADMIN",
        name: "BuyWater Admin",
        username: "admin",
        phone: "0531448824",
      },
      create: {
        email,
        password,
        role: "ADMIN",
        name: "BuyWater Admin",
        username: "admin",
        phone: "0531448824",
      },
    });

    // Ensure settings row exists
    let settings = await prisma.appSettings.findFirst();
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          serviceActive: true,
          pricePerGallon: 2.5,
          subscriptionPrice: 22,
          subscriptionGallons: 10,
          gallonSize: 20,
          deliveryTimeMin: 45,
          deliveryTimeMax: 60,
          operatingHours: "7 AM - 8:30 PM DAILY",
          heroTitle: "Fresh Water Delivered",
          serviceArea: "Tamale UDS and environs",
          adminPhone: "0531448824",
          momoNumber: "0502748671",
          adminEmail: email,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      admin: { id: user.id, email: user.email, role: user.role },
      settingsId: settings.id,
    });
  } catch (e) {
    console.error("ensure-admin", e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
