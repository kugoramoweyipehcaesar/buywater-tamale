import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        phone: true,
        role: true,
        hostel: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ users });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ error: e.message || "Server error" }, { status });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const email = (body.email || "").toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const user = await prisma.user.update({
        where: { email },
        data: { role: body.role || "ADMIN" },
      });
      return NextResponse.json({ user, invited: true });
    }
    const password = await hashPassword(body.password || "admin123");
    const user = await prisma.user.create({
      data: {
        email,
        password,
        name: body.name || email.split("@")[0],
        username: body.username || email.split("@")[0],
        role: body.role || "ADMIN",
      },
    });
    return NextResponse.json({ user, created: true }, { status: 201 });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ error: e.message || "Server error" }, { status });
  }
}
