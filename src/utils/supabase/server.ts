import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authErrorMessage, requireSupabaseConfig } from "./auth";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = requireSupabaseConfig();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          return;
        }
      },
    },
  });
}

export async function getVerifiedUser() {
  try {
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    if (claimsError || !claimsData?.claims?.sub) {
      return { user: null, error: claimsError ? authErrorMessage(claimsError) : "" };
    }

    // Claims establish the authentication boundary. getUser then supplies the
    // current user metadata used by the dashboard and account forms.
    const { data, error } = await supabase.auth.getUser();
    return { user: error ? null : data.user, error: error ? authErrorMessage(error) : "" };
  } catch (error) {
    return { user: null, error: authErrorMessage(error) };
  }
}
