import { NextResponse } from "next/server";
import { notifyAdminOrderPlaced } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activityLogger";
import { clientIp } from "@/lib/security";

function genOrderNumber() {
  return "BW-" + Math.floor(10000 + Math.random() * 90000);
}

function isAdminRole(role) {
  return ["ADMIN", "SUPER_ADMIN"].includes(String(role || "").toUpperCase());
}
function isStaffRole(role) {
  const r = String(role || "").toUpperCase();
  return r === "ADMIN" || r === "SUPER_ADMIN" || r === "RIDER";
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

    // Inventory / capacity gate
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
        notes: body.notes || "",
        deliveryNotes: body.deliveryNotes || "",
        userId: user?.id || null,
      },
    });

    const ip = clientIp(request);
    await logActivity({
      userId: user?.id || null,
      email: order.email || user?.email || null,
      action: "ORDER_CREATED",
      details: `Order ${order.orderNumber} — ${order.gallons} gal · Ghc${Number(order.totalAmount).toFixed(2)}${order.hostel ? ` · ${order.hostel}` : ""}`,
      ip,
    }).catch(() => {});

    let emailResult = null;
    try {
      emailResult = await notifyAdminOrderPlaced(order);
      console.log("[orders] admin notify (placed):", emailResult);
    } catch (err) {
      console.error("[orders] admin notify error:", err?.message || err);
      emailResult = { ok: false, error: err?.message || "email error" };
    }

    return NextResponse.json(
      {
        order,
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
