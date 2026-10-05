import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { authNotice, safeRedirect } from "@/utils/supabase/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <AuthShell title="Welcome back." eyebrow="Your farm, your space"><AuthForm mode="login" next={safeRedirect(params.next)} notice={authNotice(params.notice)} /></AuthShell>;
}