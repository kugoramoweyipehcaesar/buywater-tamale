import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const SUPER = "kugoramoweyipehcaesar49@gmail.com";

export async function DELETE(request) {
  try {
    const user = await requireAdmin();
    if (user.email !== SUPER) {
      return NextResponse.json(
        { error: "Only super admin can reset all orders" },
        { status: 403 }
      );
    }
    const result = await prisma.order.deleteMany({});
    try {
      revalidatePath("/admin");
      revalidatePath("/dashboard");
    } catch (_) {}
    return NextResponse.json({ success: true, deleted: result.count });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status }
    );
  }
}
