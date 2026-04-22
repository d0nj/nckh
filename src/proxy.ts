import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth routes and IPN callback
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/payment/vnpay-ipn")
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies
      .getAll()
      .find((c) => c.name.endsWith(".session_token"));

  // Protect portal routes
  if (pathname.startsWith("/portal")) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protect API routes
  if (pathname.startsWith("/api")) {
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  return response;
}

export const config = {
  matcher: ["/portal/:path*", "/api/:path*"],
};
