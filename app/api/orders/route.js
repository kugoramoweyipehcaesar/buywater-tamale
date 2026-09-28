import { NextResponse } from "next/server";
import { notifyAdminOrderPlaced } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activityLogger";
import { clientIp } from "@/lib/security";

function genOrderNumber() {
  return "BW-" + Math.floor(10000 + Math.random() * 90000);
}

function isStaffRole(role) {
  const r = String(role || "").toUpperCase();
  return r === "ADMIN" || r === "SUPER_ADMIN" || r === "RIDER";
}

async function redeemPromoForUser(promoId, code, user, orderId) {
  if (!promoId || !user?.id) return null;
  const promo = await prisma.promotionCode.findUnique({ where: { id: promoId } });
  if (!promo || !promo.active) return null;
  if (promo.maxUses && promo.timesUsed >= promo.maxUses) return null;

  try {
    const existing = await prisma.promoRedemption.findUnique({
      where: { promoId_userId: { promoId: promo.id, userId: user.id } },
    });
    if (existing) return existing;
  } catch (_) {}

  try {
    await prisma.promoRedemption.create({
      data: {
        promoId: promo.id,
        userId: user.id,
        orderId: orderId || null,
        code: promo.code || code || "",
      },
    });
  } catch (e) {
    if (String(e.code) === "P2002") return null;
    console.warn("promoRedemption", e.message);
  }

  const updated = await prisma.promotionCode.update({
    where: { id: promo.id },
    data: { timesUsed: { increment: 1 } },
  });
  return updated;
}

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const live = searchParams.get("live");

    const where = {};
    if (!isStaffRole(user?.role)) {
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      where.OR = [{ userId: user.id }, { email: user.email }];
    }
    if (status) where.status = status;
    if (live === "1") {
      where.status = {
        in: ["PENDING", "PROCESSING", "CONFIRMED", "ON_THE_WAY"],
      };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ orders });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    if (body.paymentMethod === "momo") {
      const settings = await prisma.appSettings.findFirst({ orderBy: { id: "asc" } });
      if (settings && settings.momoEnabled === false) {
        return NextResponse.json(
          {
            error:
              "Mobile Money is not available. Choose another payment method.",
          },
          { status: 400 }
        );
      }
    }

    try {
      const settings = await prisma.appSettings.findFirst({ orderBy: { id: "asc" } });
      let extra = {};
      try {
        extra = settings?.contentJson ? JSON.parse(settings.contentJson) : {};
      } catch (_) {}
      if (extra.outOfStock) {
        return NextResponse.json(
          { error: "Out of stock today. Ordering is temporarily unavailable." },
          { status: 403 }
        );
      }
    } catch (stockErr) {
      console.warn("stock check", stockErr?.message);
    }

    const promoId = body.promoId || null;
    const promoCode = body.promoCode || "";
    let notes = body.notes || "";
    if (promoCode && !notes.includes("Promo:")) {
      notes = `Promo: ${String(promoCode).toUpperCase()}${notes ? " — " + notes : ""}`;
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: body.orderNumber || genOrderNumber(),
        customerName:
          body.customerName || user?.name || user?.username || "Customer",
        username: body.username || user?.username || "",
        phone: body.phone || user?.phone || "",
        email: body.email || user?.email || "",
        address: body.address || body.hostel || "",
        hostel: body.hostel || "",
        customHostel: body.customHostel || "",
        roomNumber: body.roomNumber || "",
        blockNumber: body.blockNumber || "",
        products:
          typeof body.products === "string"
            ? body.products
            : JSON.stringify(body.products || []),
        gallons: Number(body.gallons) || 1,
        totalAmount: Number(body.totalAmount) || 0,
        paymentMethod: body.paymentMethod || "cash_on_delivery",
        momoNumber: body.momoNumber || "",
        momoReference: body.momoReference || "",
        status: "PENDING",
        isSubscription: !!body.isSubscription,
        notes,
        deliveryNotes: body.deliveryNotes || "",
        userId: user?.id || null,
      },
    });

    // Always increment promo usage server-side when promo is applied
    let promoUpdated = null;
    if (promoId && user?.id) {
      try {
        promoUpdated = await redeemPromoForUser(
          promoId,
          promoCode,
          user,
          order.id
        );
      } catch (err) {
        console.error("[orders] promo redeem", err?.message || err);
      }
    }

    const ip = clientIp(request);
    await logActivity({
      userId: user?.id || null,
      email: order.email || user?.email || null,
      action: "ORDER_CREATED",
      details: `Order ${order.orderNumber} — ${order.gallons} gal · Ghc${Number(order.totalAmount).toFixed(2)}${order.hostel ? ` · ${order.hostel}` : ""}${promoUpdated ? ` · promo ${promoUpdated.code} ${promoUpdated.timesUsed}/${promoUpdated.maxUses}` : ""}`,
      ip,
    }).catch(() => {});

    let emailResult = null;
    try {
      emailResult = await notifyAdminOrderPlaced(order);
    } catch (err) {
      emailResult = { ok: false, error: err?.message || "email error" };
    }

    return NextResponse.json(
      {
        order,
        promo: promoUpdated
          ? {
              code: promoUpdated.code,
              timesUsed: promoUpdated.timesUsed,
              maxUses: promoUpdated.maxUses,
            }
          : null,
        adminEmailSent: !!emailResult?.ok,
        adminEmailError: emailResult?.ok
          ? undefined
          : emailResult?.error || null,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    );
  }
}
