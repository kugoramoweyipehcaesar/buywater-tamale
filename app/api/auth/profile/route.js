import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request) {
  try {
    const current = await getCurrentUser();
    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const user = await prisma.user.update({
      where: { id: current.id },
      data: {
        name: body.name ?? body.username,
        username: body.username,
        phone: body.phone,
        hostel: body.hostel,
        customHostel: body.customHostel,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        phone: true,
        role: true,
        hostel: true,
        customHostel: true,
      },
    });
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
