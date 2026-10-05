import type { NextRequest } from "next/server";
import { getSupabaseConfig, safeRedirect } from "@/utils/supabase/auth";
import { createResponseClient, localRedirect } from "@/utils/supabase/response";

export async function GET(request: NextRequest) {
  if (!getSupabaseConfig()) return localRedirect("/login?notice=configuration");
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = type === "recovery" ? "/update-password" : safeRedirect(searchParams.get("next"));
  const { supabase, applyCookies } = createResponseClient(request);
  try {
    if (!searchParams.has("error")) {
      const result = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : tokenHash && (type === "email" || type === "recovery")
          ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
          : null;
      if (result && !result.error && result.data.session) {
        return applyCookies(localRedirect(next));
      }
    }
    return applyCookies(localRedirect("/login?notice=callback"));
  } catch {
    return applyCookies(localRedirect("/login?notice=unavailable"));
  }
}