import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, TOKEN_NAME } from "@/lib/auth";
import { logActivity } from "@/lib/activityLogger";
import { clientIp } from "@/lib/security";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = (body.email || "").toLowerCase().trim();
    const password = body.password || "";
    const name = body.name || body.username || email.split("@")[0];
    const username = body.username || name;
    const phone = body.phone || "";
    const hostel = body.hostel || "";
    const customHostel = body.customHostel || "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        username,
        phone,
        hostel,
        customHostel,
        role: "USER",
      },
    });

    const ip = clientIp(request);
    await logActivity({
      userId: user.id,
      email: user.email,
      action: "REGISTER",
      details: `New account · ${name || email}`,
      ip,
    });

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
    };

    const res = NextResponse.json({ user: safeUser, token });
    res.cookies.set(TOKEN_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
