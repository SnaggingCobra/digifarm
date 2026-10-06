"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { authErrorMessage, configurationMessage, getSupabaseConfig, safeRedirect } from "@/utils/supabase/auth";
import { farmerDetails } from "@/utils/supabase/farm";
import { PasswordField } from "./password-field";
import { FarmerFields } from "./farm-fields";
import { Icon } from "../icon";

type Mode = "register" | "login" | "forgot" | "update";
const labels: Record<Mode, string> = { register: "Create account", login: "Sign in", forgot: "Send reset link", update: "Save new password" };

export function AuthForm({ mode, next, notice = "" }: { mode: Mode; next?: string; notice?: string }) {
  const router = useRouter();
  const configured = Boolean(getSupabaseConfig());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError("");
    setSuccess("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if ((mode === "register" || mode === "update") && password !== form.get("confirm_password")) {
      setError("Passwords do not match.");
      return;
    }
    let details;
    if (mode === "register") {
      try { details = farmerDetails(form); }
      catch (validationError) { setError(validationError instanceof Error ? validationError.message : "Check your farm details."); return; }
    }
    setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "register") {
        const callback = new URL("/auth/callback", window.location.origin);
        callback.searchParams.set("next", "/dashboard");
        const { data, error: authError } = await supabase.auth.signUp({ email, password, options: { data: details, emailRedirectTo: callback.toString() } });
        if (authError) throw authError;
        if (data.session) {
          router.replace("/dashboard");
          router.refresh();
        }
        else setSuccess("Check your email for a confirmation link before signing in. If you already have an account, sign in or reset your password.");
      } else if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.replace(safeRedirect(next));
        router.refresh();
      } else if (mode === "forgot") {
        const callback = new URL("/auth/callback", window.location.origin);
        callback.searchParams.set("next", "/update-password");
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callback.toString() });
        if (authError) throw authError;
        setSuccess("If an account exists for this email, a reset link is on its way. Open it in this browser and check your spam folder too.");
      } else {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!data.user) { setError("Your session has expired. Request a new password reset link."); return; }
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setSuccess("Your password has been updated.");
        formElement.reset();
      }
    } catch (authError) {
      setError(authErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  }

  return <>
    {!configured && <p className="form-message error" role="alert">{configurationMessage}</p>}
    {notice && configured && <p className="form-message error" role="alert">{notice}</p>}
    <form className="auth-form" onSubmit={submit} aria-busy={loading}>
      <fieldset disabled={loading || !configured} className="auth-form min-w-0 border-0 p-0">
        {mode === "register" && <FarmerFields optional />}
        {mode !== "update" && <div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="email" maxLength={254} required /></div>}
        {mode !== "forgot" && <PasswordField name="password" label={mode === "update" ? "New password" : "Password"} newPassword={mode !== "login"} />}
        {(mode === "register" || mode === "update") && <><p className="muted text-sm">At least 8 characters. Use a unique password.</p><PasswordField name="confirm_password" label="Confirm password" newPassword /></>}
        {mode === "login" && <div className="form-options"><Link className="text-link" href="/forgot-password">Forgot password?</Link></div>}
        {error && <p className="form-message error" role="alert">{error}</p>}
        {success && <p className="form-message success" role="status">{success}</p>}
        <button className="button button-primary w-full" type="submit" disabled={loading || !configured}>{loading ? "Please wait..." : labels[mode]}<Icon name="arrow-right" /></button>
      </fieldset>
      
    </form>
    <div className="auth-footer">
      {mode === "register" ? <p>Already have an account? <Link className="text-link" href="/login">Sign in</Link></p> : mode === "login" ? <><p>New to DigiFarm? <Link className="text-link" href="/signup">Create an account</Link></p>{notice && <p><Link className="text-link" href="/forgot-password">Request a fresh recovery link</Link></p>}</> : mode === "update" ? <><Link className="text-link" href="/dashboard">Back to your farm</Link><p><Link className="text-link" href="/forgot-password">Request a new reset link</Link></p></> : <Link className="text-link" href="/login">Back to sign in</Link>}
    </div>
  </>;
}