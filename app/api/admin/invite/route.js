import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { sendAdminInviteEmail, APP_URL } from "@/lib/email";
import { logActivity } from "@/lib/activityLogger";
import { clientIp, normalizeEmail } from "@/lib/security";

export async function GET() {
  try {
    await requireAdmin();
    const invites = await prisma.adminInvite.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ invites });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ error: e.message || "Server error" }, { status });
  }
}

export async function POST(request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    const role = ["ADMIN", "SUPER_ADMIN"].includes(
      String(body.role || "").toUpperCase()
    )
      ? String(body.role).toUpperCase()
      : "ADMIN";

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const invite = await prisma.adminInvite.create({
      data: {
        email,
        role,
        token,
        status: "pending",
        expiresAt,
        createdBy: admin.id,
      },
    });

    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      APP_URL ||
      "https://buywater-tamale.onrender.com";
    const inviteUrl = `${base.replace(/\/$/, "")}/admin/accept-invite?token=${token}`;

    await sendAdminInviteEmail(email, inviteUrl, role);

    const ip = clientIp(request);
    await logActivity({
      userId: admin.id,
      email: admin.email,
      action: "INVITE",
      details: `Invited ${email} as ${role}`,
      ip,
    });

    return NextResponse.json({ invite, inviteUrl, success: true });
  } catch (e) {
    console.error("invite", e);
    const status = e.status || 500;
    return NextResponse.json({ error: e.message || "Server error" }, { status });
  }
}
