import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { requireSupabaseConfig } from "./auth";

export function createResponseClient(request: NextRequest) {
  const { url, key } = requireSupabaseConfig();
  const pendingCookies = new Map<string, { name: string; value: string; options: CookieOptions }>();
  const cacheHeaders = new Headers({ "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach((cookie) => {
          request.cookies.set(cookie.name, cookie.value);
          pendingCookies.set(cookie.name, cookie);
        });
        Object.entries(headers).forEach(([name, value]) => cacheHeaders.set(name, value));
      },
    },
  });

  function applyCookies(response: NextResponse) {
    pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    cacheHeaders.forEach((value, name) => response.headers.set(name, value));
    return response;
  }
  return { supabase, applyCookies };
}

export function localRedirect(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: path, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
  });
}