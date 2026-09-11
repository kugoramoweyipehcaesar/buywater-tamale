import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [admins, settings, orders] = await Promise.all([
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.appSettings.count(),
      prisma.order.count(),
    ]);
    return NextResponse.json({
      ok: true,
      admins,
      settings,
      orders,
      time: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}
