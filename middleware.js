import { NextResponse } from "next/server";

const TOKEN_NAME = "buywater_token";

function decodeJwtPayload(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Block common attack paths
  if (
    pathname.startsWith("/.env") ||
    pathname.includes("wp-admin") ||
    pathname.includes("phpmyadmin") ||
    pathname.endsWith(".php")
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Skip maintenance gate for these paths
  const skip =
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/admin-login") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/logo") ||
    pathname.startsWith("/product") ||
    pathname.startsWith("/uploads");

  if (!skip) {
    try {
      const origin = request.nextUrl.origin;
      const res = await fetch(`${origin}/api/settings`, {
        headers: { "x-middleware-check": "1" },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings?.maintenanceMode) {
          const token = request.cookies.get(TOKEN_NAME)?.value;
          const payload = token ? decodeJwtPayload(token) : null;
          const isAdmin = payload?.role === "ADMIN";
          if (!isAdmin) {
            return NextResponse.redirect(new URL("/maintenance", request.url));
          }
        }
      }
    } catch (e) {
      // Don't block site if settings fetch fails
      console.warn("middleware maintenance check failed", e?.message);
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
