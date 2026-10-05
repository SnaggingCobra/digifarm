import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseConfig } from "./auth";

export function createClient() {
  const { url, key } = requireSupabaseConfig();
  return createBrowserClient(url, key);
}