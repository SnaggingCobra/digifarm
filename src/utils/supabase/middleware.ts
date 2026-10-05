import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig, safeRedirect } from "./auth";
import { createResponseClient, localRedirect } from "./response";

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedRoute = pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname === "/update-password";
  const signInPath = `/login?next=${encodeURIComponent(safeRedirect(pathname))}`;
  if (!getSupabaseConfig()) {
    return protectedRoute ? localRedirect(`${signInPath}&notice=configuration`) : NextResponse.next({ request });
  }
  const { supabase, applyCookies } = createResponseClient(request);
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (protectedRoute && (error || !user)) {
      const unavailable = error && (error.status === 0 || (error.status ?? 0) >= 500);
      return applyCookies(localRedirect(`${signInPath}&notice=${unavailable ? "unavailable" : "session"}`));
    }
    return applyCookies(NextResponse.next({ request }));
  } catch {
    return applyCookies(protectedRoute ? localRedirect(`${signInPath}&notice=unavailable`) : NextResponse.next({ request }));
  }
}