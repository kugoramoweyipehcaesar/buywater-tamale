import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail, APP_URL } from "@/lib/email";
import { rateLimit, normalizeEmail, clientIp } from "@/lib/security";

export async function POST(request) {
  try {
    const ip = clientIp(request);
    const limited = rateLimit(`forgot:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
    if (!limited.ok) {
      return NextResponse.json(
        {
          error: `Too many reset requests. Try again in ${limited.retryAfterSec} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    if (!email) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // Per-email limit as well
    const emailLimit = rateLimit(`forgot-email:${email}`, {
      limit: 3,
      windowMs: 15 * 60 * 1000,
    });
    if (!emailLimit.ok) {
      return NextResponse.json(
        {
          error: `Too many requests for this email. Try again in ${emailLimit.retryAfterSec} seconds.`,
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always same response — do not reveal whether the account exists
    const generic = {
      success: true,
      message:
        "If that email is registered, a password reset link has been sent. Check your inbox and spam folder.",
    };

    if (!user) {
      // Fake delay so timing doesn't leak account existence
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
      return NextResponse.json(generic);
    }

    // Invalidate previous unused tokens for this email
    await prisma.passwordResetToken.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    // Send email immediately (await so failures are logged; still return generic success)
    const result = await sendPasswordResetEmail(email, resetUrl);
    if (!result.ok) {
      console.error("Password reset email failed:", result.error);
    } else {
      console.log("Password reset email sent to", email);
    }

    return NextResponse.json({
      ...generic,
      emailSent: !!result.ok,
    });
  } catch (e) {
    console.error("forgot-password error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
