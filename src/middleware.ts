import { NextResponse, type NextRequest } from "next/server";

/**
 * Cheap first gate for the admin area: no session cookie → login page.
 * Every admin page and API route still validates the session against the
 * database and checks the user's role.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get("cs_admin")?.value);

  if (pathname.startsWith("/api/admin")) {
    if (!hasSession && pathname !== "/api/admin/login") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } else if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !hasSession) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const res = NextResponse.next();
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
