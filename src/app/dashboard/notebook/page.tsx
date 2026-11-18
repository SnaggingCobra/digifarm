import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/auth/logout-button";
import { FarmNotebook } from "@/app/dashboard/farm-notebook";
import { createClient, getVerifiedUser } from "@/utils/supabase/server";

export default async function FarmNotebookPage() {
  const { user, error } = await getVerifiedUser();
  if (!user) {
    redirect(error ? "/login?notice=unavailable" : "/login?notice=session");
  }

  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, phone, farm_name, farm_location, farm_size, land_unit")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav aria-label="Farm navigation" className="flex flex-wrap items-center gap-4">
            <Link href="/dashboard" className="text-link text-sm">Dashboard</Link>
            <Link href="/dashboard/crops" className="text-link text-sm">Crops</Link>
            <Link href="/dashboard/expenses" className="text-link text-sm">Expenses</Link>
            <Link href="/dashboard/notebook" className="text-link text-sm">Notebook</Link>
            <Link href="/dashboard/settings" className="text-link text-sm">Settings</Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="page-width dashboard-main">
        {profileError ? (
          <p className="form-message error" role="alert">We couldn&apos;t load your farm details. Please refresh and try again.</p>
        ) : (
          <FarmNotebook
            userId={user.id}
            email={user.email ?? ""}
            initialMetadata={user.user_metadata ?? {}}
            initialProfile={profile}
          />
        )}
      </main>
    </div>
  );
}
