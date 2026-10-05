import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { getVerifiedUser } from "@/utils/supabase/server";

export default async function UpdatePasswordPage() {
  const { user } = await getVerifiedUser();
  if (!user) redirect("/login?notice=session&next=/update-password");
  return <AuthShell title="Choose a new password." eyebrow="Account security"><AuthForm mode="update" /></AuthShell>;
}