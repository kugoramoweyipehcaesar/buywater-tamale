import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getCurrentUser } from "@/lib/auth";

async function userAlreadyRedeemed(promoId, code, user) {
  if (!user?.id) return false;

  try {
    const row = await prisma.promoRedemption.findUnique({
      where: {
        promoId_userId: { promoId, userId: user.id },
      },
    });
    if (row) return true;
  } catch (_) {
    // Table may not exist until migrate
  }

  try {
    const prior = await prisma.order.findFirst({
      where: {
        AND: [
          {
            OR: [
              { userId: user.id },
              ...(user.email ? [{ email: user.email }] : []),
            ],
          },
          { notes: { contains: `Promo: ${code}` } },
        ],
      },
      select: { id: true },
    });
    if (prior) return true;
  } catch (_) {}

  return false;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    if (code) {
      const normalized = code.toUpperCase().trim();
      const promo = await prisma.promotionCode.findFirst({
        where: { code: normalized, active: true },
      });
      if (!promo) {
        return NextResponse.json({ error: "Invalid or inactive code" }, { status: 404 });
      }
      if (promo.maxUses && promo.timesUsed >= promo.maxUses) {
        return NextResponse.json({ error: "Promo code fully used" }, { status: 400 });
      }

      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json(
          { error: "Login required to apply a promo code" },
          { status: 401 }
        );
      }

      if (await userAlreadyRedeemed(promo.id, promo.code, user)) {
        return NextResponse.json(
          {
            error:
              "You have already used this promo code. Each user can claim it only once.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({ promo });
    }
    const promos = await prisma.promotionCode.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ promos });
  } catch (e) {
    console.error("promotions GET", e);
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
    const body = await request.json();

    if (body.redeem && body.id) {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const promo = await prisma.promotionCode.findUnique({ where: { id: body.id } });
      if (!promo || !promo.active) {
        return NextResponse.json({ error: "Invalid promo" }, { status: 404 });
      }
      if (promo.maxUses && promo.timesUsed >= promo.maxUses) {
        return NextResponse.json({ error: "Promo code fully used" }, { status: 400 });
      }

      if (await userAlreadyRedeemed(promo.id, promo.code, user)) {
        return NextResponse.json(
          { error: "You have already used this promo code" },
          { status: 400 }
        );
      }

      try {
        await prisma.promoRedemption.create({
          data: {
            promoId: promo.id,
            userId: user.id,
            orderId: body.orderId || null,
            code: promo.code,
          },
        });
      } catch (e) {
        if (String(e.code) === "P2002") {
          return NextResponse.json(
            { error: "You have already used this promo code" },
            { status: 400 }
          );
        }
        console.warn("promoRedemption create", e.message);
      }

      const updated = await prisma.promotionCode.update({
        where: { id: promo.id },
        data: { timesUsed: { increment: 1 } },
      });
      return NextResponse.json({ promo: updated, redeemed: true });
    }

    await requireAdmin();
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
