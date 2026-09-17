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

/** List orders – admin sees all, user sees own */
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const live = searchParams.get("live");

    const where = {};
    if (!isAdminRole(user?.role)) {
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      where.OR = [{ userId: user.id }, { email: user.email }];
    }
    if (status) {
      where.status = status;
    }
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

/** Create order */
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const settings = await prisma.appSettings.findFirst({ orderBy: { id: "asc" } });
    if (settings?.maintenanceMode) {
      return NextResponse.json(
        {
          error:
            settings.maintenanceMessage ||
            "Site is under maintenance. Ordering is temporarily unavailable.",
        },
        { status: 503 }
      );
    }
    if (settings && settings.serviceActive === false) {
      return NextResponse.json(
        { error: "Ordering is currently disabled." },
        { status: 503 }
      );
    }

    const method = String(body.paymentMethod || "cash_on_delivery").toLowerCase();
    const isMomo = method === "momo" || method.includes("momo");
    const isCash =
      method === "cash_on_delivery" || method === "cash" || method.includes("cash");

    if (settings) {
      if (isCash && settings.cashEnabled === false) {
        return NextResponse.json(
          { error: "Cash on delivery is not available. Choose another payment method." },
          { status: 400 }
        );
      }
      if (isMomo && settings.momoEnabled === false) {
        return NextResponse.json(
          { error: "Mobile Money is not available. Choose another payment method." },
          { status: 400 }
        );
      }
      if (!isCash && !isMomo) {
        if (settings.cashEnabled === false && settings.momoEnabled === false) {
          return NextResponse.json(
            { error: "No payment methods are enabled." },
            { status: 400 }
          );
        }
      }
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
        products: typeof body.products === "string"
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

    // Admin email — wait up to 25s so SMTP/Resend has time on free tier
    let emailResult = null;
    try {
      const emailPromise = notifyAdminOrderPlaced(order);
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve({ ok: false, error: "email timeout 25s" }), 25000)
      );
      emailResult = await Promise.race([emailPromise, timeoutPromise]);
      console.log("[orders] admin notify (placed):", emailResult);
    } catch (err) {
      console.error("[orders] admin notify error:", err?.message || err);
      emailResult = { ok: false, error: err?.message || "email error" };
    }

    return NextResponse.json(
      {
        order,
        adminEmailSent: !!emailResult?.ok,
        adminEmailError: emailResult?.ok ? undefined : emailResult?.error || null,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
