import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const { pathname } = req.nextUrl;

  // Protect dashboard and API routes (except auth endpoints)
  const isProtected =
    pathname.startsWith("/dashboard") ||
    (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/"));

  if (isProtected && !isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/((?!auth).*)"],
};
