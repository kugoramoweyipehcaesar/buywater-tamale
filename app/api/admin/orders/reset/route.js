import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activityLogger";
import { clientIp } from "@/lib/security";

const SUPER = "kugoramoweyipehcaesar49@gmail.com";

export async function DELETE(request) {
  try {
    const secret =
      request.headers.get("x-setup-secret") ||
      request.headers.get("x-admin-secret");
    const expected =
      process.env.SETUP_SECRET || process.env.JWT_SECRET || "buywater-setup";

    let actor = null;
    if (secret && secret === expected) {
      actor = { email: SUPER, via: "secret", id: null };
    } else {
      const user = await requireAdmin();
      if (user.email !== SUPER) {
        return NextResponse.json(
          { error: "Only super admin can reset all orders" },
          { status: 403 }
        );
      }
      actor = { email: user.email, via: "session", id: user.id };
    }

    const result = await prisma.order.deleteMany({});
    console.log("[admin] orders reset by", actor.email, "deleted:", result.count);

    const ip = clientIp(request);
    await logActivity({
      userId: actor.id,
      email: actor.email,
      action: "ORDERS_RESET",
      details: `Deleted ${result.count} orders (${actor.via})`,
      ip,
    });

    try {
      revalidatePath("/admin");
      revalidatePath("/dashboard");
    } catch (_) {}

    return NextResponse.json({
      success: true,
      deleted: result.count,
      by: actor.email,
    });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status }
    );
  }
}
