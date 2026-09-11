import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activityLogger";
import { clientIp } from "@/lib/security";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") || "";
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }
    const invite = await prisma.adminInvite.findUnique({ where: { token } });
    if (!invite) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
    }
    if (invite.status !== "pending") {
      return NextResponse.json(
        { error: "Invite already used", status: invite.status },
        { status: 400 }
      );
    }
    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 400 });
    }
    return NextResponse.json({
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = body.token || "";
    const name = (body.name || "").trim();
    const password = String(body.password || "");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const invite = await prisma.adminInvite.findUnique({ where: { token } });
    if (!invite) {
      return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
    }
    if (invite.status !== "pending") {
      return NextResponse.json({ error: "Invite already used" }, { status: 400 });
    }
    if (new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Invite expired" }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { email: invite.email } });
    if (user) {
      user = await prisma.user.update({
        where: { email: invite.email },
        data: {
          role: invite.role === "SUPER_ADMIN" ? "ADMIN" : invite.role,
          banned: false,
          ...(name ? { name } : {}),
        },
      });
    } else {
      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: "Password required (min 6 chars) for new accounts" },
          { status: 400 }
        );
      }
      const hashed = await hashPassword(password);
      user = await prisma.user.create({
        data: {
          email: invite.email,
          password: hashed,
          name: name || invite.email.split("@")[0],
          username: invite.email.split("@")[0],
          role: invite.role === "SUPER_ADMIN" ? "ADMIN" : invite.role,
        },
      });
    }

    await prisma.adminInvite.update({
      where: { id: invite.id },
      data: { status: "accepted" },
    });

    const ip = clientIp(request);
    await logActivity({
      userId: user.id,
      email: user.email,
      action: "INVITE",
      details: `Accepted admin invite as ${user.role}`,
      ip,
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    });
  } catch (e) {
    console.error("accept-invite", e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
