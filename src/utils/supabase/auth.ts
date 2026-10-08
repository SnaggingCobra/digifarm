export const configurationMessage = "Sign-in is not configured. Set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then restart the app.";

function isValidSupabaseKey(key: string) {
  if (key.startsWith("sb_publishable_") || key.startsWith("sb_anon_")) {
    return !key.startsWith("sb_secret_");
  }

  const segments = key.split(".");
  if (segments.length < 2) return false;

  try {
    const payload = JSON.parse(
      atob(segments[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload && typeof payload === "object" && payload.role === "anon";
  } catch {
    return false;
  }
}

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || !isValidSupabaseKey(key)) return null;

  try {
    const parsed = new URL(url);
    const localProject = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    const hostedProject = parsed.hostname.endsWith(".supabase.co") || parsed.hostname.endsWith(".supabase.in");
    if ((parsed.protocol !== "https:" && !(localProject && parsed.protocol === "http:")) || parsed.username || parsed.password || (!localProject && !hostedProject)) return null;
    return { url, key };
  } catch {
    return null;
  }
}

export function requireSupabaseConfig() {
  const config = getSupabaseConfig();
  if (!config) throw new Error(configurationMessage);
  return config;
}

export function safeRedirect(value: unknown): "/dashboard" | "/update-password" {
  return value === "/update-password" ? "/update-password" : "/dashboard";
}

export function authErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === configurationMessage) return configurationMessage;
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  switch (code) {
    case "invalid_credentials": return "The email or password is incorrect.";
    case "email_not_confirmed": return "Confirm your email before signing in. Check your inbox for the confirmation link.";
    case "user_already_exists": case "email_exists": return "Unable to create this account. Try signing in or resetting your password.";
    case "weak_password": return "Choose a stronger password with at least 8 characters, including letters, numbers, and symbols.";
    case "same_password": return "Choose a password different from your current password.";
    case "over_email_send_rate_limit": case "over_request_rate_limit": return "Too many attempts. Please wait a few minutes before trying again.";
    case "otp_expired": case "flow_state_expired": case "flow_state_not_found": return "This link has expired or has already been used. Request a new link.";
    case "session_not_found": case "refresh_token_not_found": case "refresh_token_already_used": return "Your session has expired. Please sign in again.";
    case "reauthentication_needed": return "Please sign in again before changing your password.";
    case "signup_disabled": return "New account registration is currently unavailable.";
  }
  return "Unable to reach the account service or complete this request. Check your connection and try again.";
}

export function authNotice(value: unknown): string {
  if (value === "configuration") return configurationMessage;
  if (value === "unavailable") return "The account service is temporarily unavailable. Please try again.";
  if (value === "callback") return "This email link is invalid, expired, or was opened in a different browser. Request a new link and open it in the browser where you started.";
  if (value === "session") return "Please sign in to continue.";
  return "";
}
