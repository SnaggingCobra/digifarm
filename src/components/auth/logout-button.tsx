"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { authErrorMessage } from "@/utils/supabase/auth";
import { Icon } from "@/components/icon";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const { error: authError } = await createClient().auth.signOut({ scope: "local" });
      if (authError) throw authError;
      router.replace("/login");
      router.refresh();
    } catch (authError) {
      setError(authErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  }
  return <div><button className="button button-secondary button-small" type="button" onClick={logout} disabled={loading}><Icon name="logout" />{loading ? "Signing out..." : "Sign out"}</button>{error && <p className="form-message error max-w-xs" role="alert">{error}</p>}</div>;
}