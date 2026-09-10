import { NextResponse } from "next/server";

export function middleware(request) {
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
