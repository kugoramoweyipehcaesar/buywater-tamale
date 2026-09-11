import { NextResponse } from "next/server";
import { notifyAdminOrderPlaced } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activityLogger";
import { clientIp } from "@/lib/security";

function genOrderNumber() {
  return "BW-" + Math.floor(10000 + Math.random() * 90000);
}

/** List orders – admin sees all, user sees own */
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const live = searchParams.get("live");

    const where = {};
    if (user?.role !== "ADMIN") {
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
    });

    // Instant email to super admin
    notifyAdminOrderPlaced(order).catch((err) =>
      console.error("order notify failed", err)
    );

    return NextResponse.json({ order }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
