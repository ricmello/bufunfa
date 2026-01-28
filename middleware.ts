import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "./lib/auth0";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Let Auth0 middleware handle /auth/* routes automatically
  if (pathname.startsWith('/auth/')) {
    return await auth0.middleware(request);
  }

  // Public routes (no auth required)
  if (pathname.startsWith('/split-bills/share') || pathname.startsWith('/s/')) {
    return NextResponse.next();
  }

  // Check for session on protected routes
  const session = await auth0.getSession(request);

  // Redirect to login if no session
  if (!session) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Static assets: .svg, .png, .jpg, .jpeg, .gif, .webp, .ico
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.ico).*)",
  ],
};
