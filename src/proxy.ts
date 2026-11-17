import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "trek_pb_auth";
const PUBLIC_APP_PATHS = ["/login", "/register", "/privacy"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/share/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  const hasAuthCookie = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const isPublicAppPath = PUBLIC_APP_PATHS.some((path) => pathname.startsWith(path));

  if (!hasAuthCookie && !isPublicAppPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (hasAuthCookie && (pathname.startsWith("/login") || pathname.startsWith("/register"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/feed";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
