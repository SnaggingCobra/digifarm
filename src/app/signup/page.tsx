import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <AuthShell title="Make room for growth." eyebrow="Create your farmer account">
      <AuthForm mode="register" />
    </AuthShell>
  );
}
