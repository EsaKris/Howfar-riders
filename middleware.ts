import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Pages that require a logged-in user
const PROTECTED = ["/dashboard", "/ride", "/history", "/profile"];

// Pages only for guests (logged-in users shouldn't see these)
const GUEST_ONLY = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for access token in cookies
  // Note: We store tokens in localStorage on the client, but for middleware
  // (which runs on the server edge) we check a lightweight cookie we set
  // on login. See layout.tsx for where we set this cookie.
  const isLoggedIn = request.cookies.has("hfc_logged_in");

  // Redirect unauthenticated users away from protected pages
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (isProtected && !isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from login/register
  const isGuestOnly = GUEST_ONLY.some((p) => pathname.startsWith(p));
  if (isGuestOnly && isLoggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/ride/:path*",
    "/history/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};
