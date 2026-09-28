import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const items = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ complaints: items });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ error: e.message || "Server error" }, { status });
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }
    const body = await request.json();
    const message = String(body.message || "").trim();
    if (!message || message.length < 5) {
      return NextResponse.json(
        { error: "Please write a complaint (at least 5 characters)" },
        { status: 400 }
      );
    }
    if (message.length > 4000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    const row = await prisma.feedback.create({
      data: {
        userEmail: user.email || null,
        userName: user.name || user.username || null,
        message,
        status: "open",
      },
    });

    return NextResponse.json({ success: true, complaint: row }, { status: 201 });
  } catch (e) {
    console.error("feedback POST", e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const data = {};
    if (body.status) data.status = String(body.status);
    if (body.adminResponse !== undefined)
      data.adminResponse = String(body.adminResponse || "");
    const row = await prisma.feedback.update({
      where: { id: body.id },
      data,
    });
    return NextResponse.json({ complaint: row });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ error: e.message || "Server error" }, { status });
  }
}
