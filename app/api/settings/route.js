import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const ALLOWED = [
  "serviceActive",
  "maintenanceMode",
  "maintenanceMessage",
  "heroTitle",
  "operatingHours",
  "productImageUrl",
  "productDescription",
  "deliveryTimeMin",
  "deliveryTimeMax",
  "pricePerGallon",
  "subscriptionPrice",
  "subscriptionGallons",
  "cashEnabled",
  "momoEnabled",
  "momoNumber",
  "momoName",
  "momoNumber2",
  "momoName2",
  "adminPhone",
  "adminEmail",
  "serviceArea",
  "contentJson",
  "gallonSize",
];

const BOOL = new Set([
  "serviceActive",
  "maintenanceMode",
  "cashEnabled",
  "momoEnabled",
]);
const NUM = new Set([
  "deliveryTimeMin",
  "deliveryTimeMax",
  "pricePerGallon",
  "subscriptionPrice",
  "subscriptionGallons",
  "gallonSize",
]);

function parseExtra(contentJson) {
  try {
    return contentJson ? JSON.parse(contentJson) : {};
  } catch {
    return {};
  }
}

function withOutOfStock(settings) {
  if (!settings) return settings;
  const extra = parseExtra(settings.contentJson);
  return { ...settings, outOfStock: !!extra.outOfStock };
}

function pick(body) {
  const data = {};
  for (const k of ALLOWED) {
    if (body[k] === undefined) continue;
    let v = body[k];
    if (BOOL.has(k)) v = v === true || v === "true" || v === 1 || v === "1";
    if (NUM.has(k)) {
      const n = Number(v);
      if (Number.isFinite(n)) v = n;
      else continue;
    }
    if (typeof v === "string") v = v.slice(0, 5000);
    data[k] = v;
  }
  return data;
}

export async function GET() {
  try {
    let settings = await prisma.appSettings.findFirst({
      orderBy: { id: "asc" },
    });
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
        },
      });
    }
    return NextResponse.json({ settings: withOutOfStock(settings) });
  } catch (e) {
    console.error("settings GET", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await requireAdmin();
    const raw = await request.json();
    const body = pick(raw);

    // outOfStock stored in contentJson (no schema migration required)
    if (raw.outOfStock !== undefined) {
      let settingsRow = await prisma.appSettings.findFirst({ orderBy: { id: "asc" } });
      const extra = parseExtra(settingsRow?.contentJson);
      extra.outOfStock =
        raw.outOfStock === true ||
        raw.outOfStock === "true" ||
        raw.outOfStock === 1 ||
        raw.outOfStock === "1";
      body.contentJson = JSON.stringify(extra);
    }

    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    let settings = await prisma.appSettings.findFirst({ orderBy: { id: "asc" } });
    if (!settings) {
      settings = await prisma.appSettings.create({ data: body });
    } else {
      if (body.contentJson && settings.contentJson && raw.outOfStock === undefined) {
        try {
          const incoming = JSON.parse(body.contentJson);
          const existing = JSON.parse(settings.contentJson);
          if (incoming.outOfStock === undefined && existing.outOfStock !== undefined) {
            incoming.outOfStock = existing.outOfStock;
            body.contentJson = JSON.stringify(incoming);
          }
        } catch (_) {}
      }
      settings = await prisma.appSettings.update({
        where: { id: settings.id },
        data: body,
      });
    }

    try {
      revalidatePath("/");
      revalidatePath("/order");
      revalidatePath("/dashboard");
      revalidatePath("/admin");
    } catch (e) {
      console.warn("revalidatePath", e.message);
    }

    return NextResponse.json({ settings: withOutOfStock(settings), success: true, live: true });
  } catch (e) {
    console.error("settings PATCH", e);
    const status = e.status || 500;
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status }
    );
  }
}
