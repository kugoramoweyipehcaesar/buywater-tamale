import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activityLogger";
import { clientIp } from "@/lib/security";

const SUPER = "kugoramoweyipehcaesar49@gmail.com";

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const userId = body.userId;
    const role = body.role === "ADMIN" ? "ADMIN" : "USER";

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Protect super admin from demotion
    if (
      target.email === SUPER &&
      role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Cannot demote the super admin" },
        { status: 403 }
      );
    }

    // Only super admin can promote/demote others (optional soft rule)
    // All admins can promote for convenience as requested

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        phone: true,
        role: true,
        banned: true,
        createdAt: true,
      },
    });

    await logActivity({
      userId: admin.id,
      email: admin.email,
      action: role === "ADMIN" ? "USER_PROMOTED_ADMIN" : "USER_DEMOTED",
      details: `${target.email} → ${role}`,
      ip: clientIp(request),
    }).catch(() => {});

    return NextResponse.json({ user, success: true });
  } catch (e) {
    console.error("promote", e);
    const status = e.status || 500;
    return NextResponse.json({ error: e.message || "Server error" }, { status });
  }
}
