import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { auth, isAdminAuthConfigured } from "@auth";
import { runtimeEnv } from "@/lib/runtime-env";

const withAuth = auth((request, _event: NextFetchEvent) => {
  void _event;
  if (request.auth?.user?.isAdmin === true) return NextResponse.next();
  return NextResponse.redirect(new URL("/admin/sign-in", request.nextUrl));
});

export function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!isAdminAuthConfigured()) {
    const demoDatabase = !runtimeEnv("DATABASE_URL") && !runtimeEnv("NETLIFY_DB_URL");
    return demoDatabase
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/admin/sign-in?setup=required", request.nextUrl));
  }
  return withAuth(request, event);
}

export const config = {
  matcher: ["/((?!api/health|api/auth|admin/sign-in|admin/invite|_next/static|_next/image|favicon.ico).*)"],
};
