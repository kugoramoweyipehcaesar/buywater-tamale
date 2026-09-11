import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import {
  sendPasswordResetEmail,
  APP_URL,
  isSmtpConfigured,
} from "@/lib/email";
import { rateLimit, normalizeEmail, clientIp } from "@/lib/security";

export async function POST(request) {
  try {
    const ip = clientIp(request);
    const limited = rateLimit(`forgot:${ip}`, { limit: 8, windowMs: 15 * 60 * 1000 });
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

    const emailLimit = rateLimit(`forgot-email:${email}`, {
      limit: 5,
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

    const generic = {
      success: true,
      message:
        "If that email is registered, a password reset link has been sent. Check your inbox and spam folder.",
    };

    if (!user) {
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
      return NextResponse.json(generic);
    }

    await prisma.passwordResetToken.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    const result = await sendPasswordResetEmail(email, resetUrl);
    if (!result.ok) {
      console.error("Password reset email failed:", result.error);
    } else {
      console.log("Password reset email sent to", email);
    }

    const payload = { ...generic, emailSent: !!result.ok };
    if (!isSmtpConfigured() || process.env.NODE_ENV !== "production") {
      payload.devResetUrl = resetUrl;
    }

    return NextResponse.json(payload);
  } catch (e) {
    console.error("forgot-password error:", e);
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    );
  }
}
