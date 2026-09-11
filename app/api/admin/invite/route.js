import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { sendAdminInviteEmail, APP_URL, isSmtpConfigured } from "@/lib/email";
import { logActivity } from "@/lib/activityLogger";
import { clientIp, normalizeEmail } from "@/lib/security";

function appBase() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    APP_URL ||
    "https://buywater-tamale.onrender.com"
  ).replace(/\/$/, "");
}

export async function GET() {
  try {
    await requireAdmin();
    const invites = await prisma.adminInvite.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ invites });
  } catch (e) {
    console.error("[invite GET]", e);
    const status = e.status || 500;
    return NextResponse.json(
      { error: e.message || "Server error", invites: [] },
      { status }
    );
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
      return NextResponse.json(
        { error: "Enter a valid email address" },
        { status: 400 }
      );
    }

    // Block inviting the same pending invite spam (reuse existing pending)
    const existingPending = await prisma.adminInvite.findFirst({
      where: {
        email,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    let invite;
    let token;
    if (existingPending) {
      invite = existingPending;
      token = existingPending.token;
    } else {
      token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      invite = await prisma.adminInvite.create({
        data: {
          email,
          role,
          token,
          status: "pending",
          expiresAt,
          createdBy: admin.id,
        },
      });
    }

    const inviteUrl = `${appBase()}/admin/accept-invite?token=${token}`;

    // Send email with hard timeout so the request never hangs
    let emailSent = false;
    let emailError = null;
    try {
      const emailPromise = sendAdminInviteEmail(email, inviteUrl, role);
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(
          () => resolve({ ok: false, error: "Email timed out after 12s" }),
          12000
        )
      );
      const result = await Promise.race([emailPromise, timeoutPromise]);
      emailSent = !!result?.ok;
      if (!result?.ok) {
        emailError = result?.error || "Email failed";
        console.error("[invite] email not sent:", emailError);
      }
    } catch (err) {
      emailError = err?.message || "Email error";
      console.error("[invite] email exception:", emailError);
    }

    const ip = clientIp(request);
    await logActivity({
      userId: admin.id,
      email: admin.email,
      action: "INVITE",
      details: `Invited ${email} as ${role}${emailSent ? " (email sent)" : " (email failed – share link)"}`,
      ip,
    });

    return NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      },
      inviteUrl,
      emailSent,
      smtpConfigured: isSmtpConfigured(),
      emailError: emailSent ? null : emailError,
      message: emailSent
        ? `Invite email sent to ${email}`
        : `Invite created. Email did not send${emailError ? ` (${emailError})` : ""}. Copy the link and share it.`,
    });
  } catch (e) {
    console.error("[invite POST]", e);
    const msg = String(e?.message || e);
    // Helpful hint if table missing on Render
    if (msg.includes("AdminInvite") || msg.includes("does not exist") || msg.includes("P2021")) {
      return NextResponse.json(
        {
          error:
            "Database table missing. Redeploy so `prisma db push` runs (render:start).",
        },
        { status: 500 }
      );
    }
    const status = e.status || 500;
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status }
    );
  }
}
