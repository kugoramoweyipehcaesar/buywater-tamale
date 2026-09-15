import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "1";
    // Admins requesting all see inactive too; public/dashboard only active
    const where = all ? {} : { active: true };
    const list = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ announcements: list });
  } catch (e) {
    console.error("Announcements GET:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const title = String(body.title || "").trim();
    const message = String(body.message || body.body || "").trim();
    if (!title && !message) {
      return NextResponse.json({ error: "Title or message required" }, { status: 400 });
    }
    const item = await prisma.announcement.create({
      data: {
        title: title || "Announcement",
        body: message,
        type: body.type || "info",
        active: true,
      },
    });
    return NextResponse.json({ announcement: item }, { status: 201 });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ error: e.message || "Server error" }, { status });
  }
}

export async function DELETE(request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ error: e.message || "Server error" }, { status });
  }
}
