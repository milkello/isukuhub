import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  AppRole,
  getDefaultRouteForRole,
  getRequiredRoleForPath,
} from "@/lib/constants";

const publicRoutes = [
  "/",
  "/home",
  "/auth",
  "/login",
  "/signup",
  "/about",
  "/api/auth",
  "/_next",
  "/favicon.ico",
];

function isPublicRoute(pathname: string) {
  return publicRoutes.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const url = new URL("/auth", request.url);
    url.searchParams.set("callbackUrl", pathname);

    const requiredRole = getRequiredRoleForPath(pathname);
    if (requiredRole) {
      url.searchParams.set("role", requiredRole);
    }

    return NextResponse.redirect(url);
  }

  if (token.isActive === false) {
    const url = new URL("/auth", request.url);
    url.searchParams.set("error", "account-disabled");
    return NextResponse.redirect(url);
  }

  const requiredRole = getRequiredRoleForPath(pathname);
  const userRole = String(token.role ?? "") as AppRole;

  if (requiredRole && userRole !== requiredRole) {
    const redirectUrl = new URL(getDefaultRouteForRole(userRole), request.url);
    redirectUrl.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
