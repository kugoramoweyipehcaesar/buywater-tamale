import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    if (code) {
      const promo = await prisma.promotionCode.findFirst({
        where: { code: code.toUpperCase().trim(), active: true },
      });
      if (!promo) {
        return NextResponse.json({ error: "Invalid or inactive code" }, { status: 404 });
      }
      if (promo.maxUses && promo.timesUsed >= promo.maxUses) {
        return NextResponse.json({ error: "Promo code fully used" }, { status: 400 });
      }
      return NextResponse.json({ promo });
    }
    const promos = await prisma.promotionCode.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ promos });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const promo = await prisma.promotionCode.create({
      data: {
        code: (body.code || "").toUpperCase().trim(),
        active: body.active !== false,
        rewardValue: Number(body.rewardValue) || 1,
        maxUses: Number(body.maxUses) || 100,
        description: body.description || "",
      },
    });
    return NextResponse.json({ promo }, { status: 201 });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ error: e.message || "Server error" }, { status });
  }
}

export async function PATCH(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const promo = await prisma.promotionCode.update({
      where: { id: body.id },
      data: {
        ...(body.active != null && { active: body.active }),
        ...(body.timesUsed != null && { timesUsed: body.timesUsed }),
        ...(body.rewardValue != null && { rewardValue: body.rewardValue }),
      },
    });
    return NextResponse.json({ promo });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ error: e.message || "Server error" }, { status });
  }
}

export async function DELETE(request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    await prisma.promotionCode.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ error: e.message || "Server error" }, { status });
  }
}
