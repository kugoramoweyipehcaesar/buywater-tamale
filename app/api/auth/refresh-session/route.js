import { NextResponse } from "next/server";
import { getCurrentUser, refreshSessionCookie } from "@/lib/auth";

/**
 * Re-issue JWT cookie with the latest role from DB.
 * Call this once after a role change so middleware sees SUPER_ADMIN/ADMIN immediately.
 */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const updated = await refreshSessionCookie(user.id);
    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        name: updated.name,
      },
    });
  } catch (e) {
    console.error("refresh-session", e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
