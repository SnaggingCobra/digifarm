import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export default function ForgotPasswordPage() {
  return <AuthShell title="A fresh start." eyebrow="Reset your password"><p className="muted mb-6">Enter the email address associated with your account.</p><AuthForm mode="forgot" /></AuthShell>;
}