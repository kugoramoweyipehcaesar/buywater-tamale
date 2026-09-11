import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activityLogger";
import { clientIp } from "@/lib/security";

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const userId = body.userId;
    const banned = !!body.banned;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.email === "kugoramoweyipehcaesar49@gmail.com") {
      return NextResponse.json(
        { error: "Cannot ban the super admin account" },
        { status: 403 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { banned },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        banned: true,
      },
    });

    const ip = clientIp(request);
    await logActivity({
      userId: admin.id,
      email: admin.email,
      action: "BAN",
      details: `${banned ? "Banned" : "Unbanned"} user ${user.email}`,
      ip,
    });

    return NextResponse.json({ user, success: true });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ error: e.message || "Server error" }, { status });
  }
}
