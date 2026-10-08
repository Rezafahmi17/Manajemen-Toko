import { NextResponse } from "next/server";
export function middleware(req) {
  const token = req.cookies.get("token");
  if (req.nextUrl.pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ["/dashboard/:path*"] };
