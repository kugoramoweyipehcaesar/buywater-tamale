import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function DELETE() {
  try {
    const user = await requireAdmin();
    // Only the primary super admin email can wipe orders
    if (user.email !== "kugoramoweyipehcaesar49@gmail.com") {
      return NextResponse.json(
        { error: "Only super admin can reset all orders" },
        { status: 403 }
      );
    }
    const result = await prisma.order.deleteMany({});
    return NextResponse.json({ deleted: result.count });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ error: e.message || "Server error" }, { status });
  }
}
