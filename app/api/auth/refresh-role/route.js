import { NextResponse } from "next/server";
import { refreshSessionCookie, clearAuthCookie } from "@/lib/auth";

/**
 * POST — re-read role from DB and re-issue JWT cookie (fixes stale SUPER_ADMIN).
 * POST ?logout=1 — clear cookie (force full re-login).
 */
export async function POST(request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("logout") === "1") {
      await clearAuthCookie();
      return NextResponse.json({ ok: true, loggedOut: true });
    }
    const user = await refreshSessionCookie();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        phone: user.phone,
        role: user.role,
        hostel: user.hostel,
        customHostel: user.customHostel,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
