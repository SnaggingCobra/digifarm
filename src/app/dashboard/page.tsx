import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/auth/logout-button";
import { createClient, getVerifiedUser } from "@/utils/supabase/server";
import { FarmNotebook } from "./farm-notebook";

export default async function DashboardPage() {
  const { user, error } = await getVerifiedUser();

  if (!user) {
    if (error) {
      return (
        <main className="page-width dashboard-main">
          <Brand />
          <h1 className="mt-10 font-serif text-3xl">
            Your farm is temporarily unavailable.
          </h1>
          <p className="form-message error" role="alert">
            {error}
          </p>
          <Link className="button button-primary" href="/login">
            Return to sign in
          </Link>
        </main>
      );
    }

    redirect("/login?notice=session");
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, phone, farm_name, farm_location, farm_size, land_unit, profile_picture_url"
    )
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="header-inner">
          <Brand />

          <nav
            aria-label="Account"
            className="flex flex-wrap items-center gap-4"
          >
            <Link
              className="text-link text-sm"
              href="/update-password"
            >
              Change password
            </Link>

            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="page-width dashboard-main">
        <FarmNotebook
          key={user.id}
          userId={user.id}
          email={user.email ?? ""}
          initialMetadata={user.user_metadata}
          initialProfile={profile}
        />
      </main>
    </div>
  );
}