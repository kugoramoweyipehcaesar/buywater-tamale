import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, TOKEN_NAME } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activityLogger";
import { clientIp } from "@/lib/security";

export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prevent deleting the primary super admin by accident from profile
    if (user.email === "kugoramoweyipehcaesar49@gmail.com") {
      return NextResponse.json(
        { error: "Super admin account cannot be deleted from profile" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (String(body.confirm || "") !== "DELETE") {
      return NextResponse.json(
        { error: "Type DELETE to confirm" },
        { status: 400 }
      );
    }

    const ip = clientIp(request);
    await logActivity({
      userId: user.id,
      email: user.email,
      action: "DELETE_ACCOUNT",
      details: `Account deleted · ${user.email}`,
      ip,
    });

    // Delete related data
    await prisma.order.deleteMany({
      where: {
        OR: [{ userId: user.id }, { email: user.email }],
      },
    });
    await prisma.passwordResetToken.deleteMany({
      where: { email: user.email },
    });
    await prisma.user.delete({ where: { id: user.id } });

    try {
      revalidatePath("/");
      revalidatePath("/admin");
    } catch (_) {}

    const res = NextResponse.json({ success: true });
    res.cookies.set(TOKEN_NAME, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (e) {
    console.error("delete-account", e);
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 }
    );
  }
}
