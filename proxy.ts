import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export default async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const secret = process.env.ADMIN_ACCESS_KEY;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (token?.role === "ADMIN") {
    return NextResponse.next();
  }

  if (!secret) {
    return pathname === "/admin/login" ? NextResponse.next() : NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const gateCookie = request.cookies.get("admin_gate")?.value;
  const access = searchParams.get("access");

  if (access === secret) {
    const response = NextResponse.redirect(new URL("/admin/login", request.url));
    const isHttps = request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
    response.cookies.set("admin_gate", secret, {
      httpOnly: true,
      sameSite: "lax",
      secure: isHttps,
      maxAge: 60 * 20,
      path: "/admin"
    });
    return response;
  }

  if (gateCookie === secret) {
    return pathname === "/admin/login" ? NextResponse.next() : NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.rewrite(new URL("/not-found", request.url));
}

export const config = {
  matcher: ["/admin/:path*"]
};
