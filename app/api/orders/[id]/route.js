import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { notifyAdminOrderCancelled } from "@/lib/email";
import { logActivity } from "@/lib/activityLogger";
import { clientIp } from "@/lib/security";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = params;
    const body = await request.json();
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isAdmin = user.role === "ADMIN";
    const isOwner =
      existing.userId === user.id || existing.email === user.email;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = {};
    if (body.status != null) {
      if (!isAdmin && body.status !== "CANCELLED") {
        return NextResponse.json(
          { error: "Customers can only cancel orders" },
          { status: 403 }
        );
      }
      data.status = body.status;
    }
    if (body.cancelReason != null) data.cancelReason = body.cancelReason;
    if (body.notes != null) data.notes = body.notes;
    if (isAdmin) {
      if (body.driverName != null) data.driverName = body.driverName;
      if (body.driverPhone != null) data.driverPhone = body.driverPhone;
    }

    const order = await prisma.order.update({ where: { id }, data });

    const ip = clientIp(request);
    if (data.status === "CANCELLED") {
      await logActivity({
        userId: user.id,
        email: user.email,
        action: "ORDER_STATUS",
        details: `Cancelled ${order.orderNumber}${data.cancelReason ? ` · ${data.cancelReason}` : ""}`,
        ip,
      });
      notifyAdminOrderCancelled(order).catch((err) =>
        console.error("cancel notify failed", err)
      );
    } else if (data.status) {
      await logActivity({
        userId: user.id,
        email: user.email,
        action: "ORDER_STATUS",
        details: `${order.orderNumber} → ${data.status}`,
        ip,
      });
    }

    return NextResponse.json({ order });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin();
    const { id } = params;
    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ error: e.message || "Server error" }, { status });
  }
}
