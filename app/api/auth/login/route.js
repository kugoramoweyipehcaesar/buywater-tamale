import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken, TOKEN_NAME } from "@/lib/auth";
import { notifyAdminLogin } from "@/lib/email";
import { rateLimit, normalizeEmail, clientIp } from "@/lib/security";
import { logActivity } from "@/lib/activityLogger";

export async function POST(request) {
  try {
    const ip = clientIp(request);
    const limited = rateLimit(`login:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 });
    if (!limited.ok) {
      return NextResponse.json(
        {
          error: `Too many login attempts. Try again in ${limited.retryAfterSec} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const dummyHash =
      "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";
    const ok = await comparePassword(
      password,
      user?.password || dummyHash
    );

    if (!user || !ok) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.banned) {
      await logActivity({
        userId: user.id,
        email: user.email,
        action: "LOGIN_BLOCKED",
        details: "Banned user attempted login",
        ip,
      });
      return NextResponse.json(
        { error: "This account has been suspended. Contact support." },
        { status: 403 }
      );
    }

    const token = signToken(user);
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      phone: user.phone,
      role: user.role,
      hostel: user.hostel,
      customHostel: user.customHostel,
      profilePhoto: user.profilePhoto,
    };

    await logActivity({
      userId: user.id,
      email: user.email,
      action: "LOGIN",
      details: `Logged in as ${user.role}`,
      ip,
    });

    notifyAdminLogin({
      email: user.email,
      name: user.name || user.username,
      role: user.role,
      when: new Date().toLocaleString("en-GB", { timeZone: "Africa/Accra" }),
      ip,
    }).catch((e) => console.error("login notify failed", e));

    const res = NextResponse.json({ user: safeUser });
    res.cookies.set(TOKEN_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
