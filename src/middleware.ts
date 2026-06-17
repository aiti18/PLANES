import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const publicRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const isSecureRequest =
    nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: isSecureRequest,
  });
  const isLoggedIn = Boolean(token);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  console.info("[auth][middleware]", {
    path: nextUrl.pathname,
    hasToken: isLoggedIn,
    secureCookie: isSecureRequest,
  });

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
