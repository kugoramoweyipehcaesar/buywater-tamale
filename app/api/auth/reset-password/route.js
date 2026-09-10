import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  rateLimit,
  normalizeEmail,
  validatePassword,
  clientIp,
  sanitizeText,
} from "@/lib/security";

export async function POST(request) {
  try {
    const ip = clientIp(request);
    const limited = rateLimit(`reset:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!limited.ok) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${limited.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const token = sanitizeText(body.token, 128);
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    if (!token || !email) {
      return NextResponse.json(
        { error: "Invalid reset link. Request a new one." },
        { status: 400 }
      );
    }

    const pwErr = validatePassword(password);
    if (pwErr) {
      return NextResponse.json({ error: pwErr }, { status: 400 });
    }

    const record = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        email,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Request a new one." },
        { status: 400 }
      );
    }

    const hashed = await hashPassword(password);
    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { password: hashed },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { used: true },
      }),
      prisma.passwordResetToken.updateMany({
        where: { email, used: false },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Password updated. You can log in now.",
    });
  } catch (e) {
    console.error("reset-password error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
