import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/auth/logout-button";
import { createClient, getVerifiedUser } from "@/utils/supabase/server";

function getGreeting(fullName: string) {
  const hour = new Date().getHours();
  const name = fullName || "Farmer";

  if (hour < 12) return `Good Morning, ${name}`;
  if (hour < 18) return `Good Afternoon, ${name}`;
  return `Good Evening, ${name}`;
}

export default async function DashboardPage() {
  const { user, error } = await getVerifiedUser();

  if (!user) {
    if (error) {
      return (
        <main className="page-width dashboard-main">
          <Brand />
          <h1 className="mt-10 font-serif text-3xl">Your farm is temporarily unavailable.</h1>
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, farm_name, farm_location, farm_size, land_unit")
    .eq("id", user.id)
    .maybeSingle();

  const { data: crops, error: cropsError } = await supabase
    .from("crops")
    .select("id, name, variety, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const activeCrops =
    crops?.filter((crop) => ["planned", "growing", "ready"].includes(crop.status)).length ?? 0;

  const fullName = profile?.full_name?.trim() || user.user_metadata?.full_name || "Farmer";
  const farmName = profile?.farm_name?.trim() || "My Farm";
  const farmSize = profile?.farm_size ?? null;
  const landUnit = profile?.land_unit || "Not added";

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav aria-label="Dashboard navigation" className="flex flex-wrap items-center gap-4">
            <Link href="/dashboard" className="text-link text-sm">Dashboard</Link>
            <Link href="/dashboard/crops" className="text-link text-sm">Crops</Link>
            <Link href="/dashboard/settings" className="text-link text-sm">Settings</Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="page-width dashboard-main">
        <section>
          <p className="eyebrow" style={{ marginBottom: 8 }}>{farmName}</p>
          <h1 className="dashboard-header" style={{ margin: 0 }}>
            {getGreeting(fullName)}
          </h1>
          <p style={{ marginTop: 10, color: "rgba(28, 42, 35, 0.68)" }}>
            Here&apos;s what&apos;s happening on your farm today.
          </p>
        </section>

        {profileError && (
          <p className="form-message error" role="alert" style={{ marginTop: 18 }}>
            We couldn&apos;t load your farm information. Please try again.
          </p>
        )}

        <section className="dashboard-stats" style={{ marginTop: 24 }}>
          <article className="stat-card">
            <span className="eyebrow" style={{ marginBottom: 0, fontSize: "0.7rem" }}>Active Crops</span>
            <strong>{activeCrops}</strong>
          </article>

          <article className="stat-card">
            <span className="eyebrow" style={{ marginBottom: 0, fontSize: "0.7rem" }}>Farm Size</span>
            <strong>{farmSize ?? "—"}</strong>
            <span style={{ color: "rgba(28, 42, 35, 0.7)" }}>{landUnit}</span>
          </article>

          <article className="stat-card">
            <span className="eyebrow" style={{ marginBottom: 0, fontSize: "0.7rem" }}>Expenses</span>
            <strong>Rs. 0</strong>
            <span style={{ color: "rgba(28, 42, 35, 0.7)" }}>Coming next</span>
          </article>

          <article className="stat-card">
            <span className="eyebrow" style={{ marginBottom: 0, fontSize: "0.7rem" }}>Revenue</span>
            <strong>Rs. 0</strong>
            <span style={{ color: "rgba(28, 42, 35, 0.7)" }}>Coming next</span>
          </article>
        </section>

        <section className="dashboard-card" style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: 0 }}>Crop overview</p>
              <h2 style={{ fontSize: "2rem", color: "var(--farm-green-deep)" }}>Your crops</h2>
            </div>
            <Link href="/dashboard/crops" className="text-link text-sm">View all →</Link>
          </div>

          {cropsError ? (
            <p className="form-message error" role="alert" style={{ marginTop: 18 }}>
              We couldn&apos;t load your crops right now.
            </p>
          ) : crops && crops.length > 0 ? (
            <div style={{ marginTop: 20, display: "grid", gap: 14 }}>
              {crops.slice(0, 5).map((crop) => (
                <div key={crop.id} className="task-item">
                  <div>
                    <div style={{ fontWeight: 700 }}>{crop.name}</div>
                    {crop.variety ? <div style={{ color: "rgba(28, 42, 35, 0.7)" }}>{crop.variety}</div> : null}
                  </div>
                  <span className="tag" style={{ textTransform: "capitalize" }}>{crop.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ marginTop: 18 }}>
              <p style={{ fontSize: "2.5rem" }}>🌱</p>
              <h3>No crops added yet</h3>
              <p style={{ color: "rgba(28, 42, 35, 0.7)" }}>Add your first crop to start managing your farm plan.</p>
              <Link href="/dashboard/crops" className="button button-primary" style={{ marginTop: 8 }}>
                Add your first crop
              </Link>
            </div>
          )}
        </section>

        <section className="dashboard-grid" style={{ marginTop: 24, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <Link href="/dashboard/crops" className="dashboard-card" style={{ padding: 22 }}>
            <div style={{ fontSize: "2.2rem" }}>🌱</div>
            <h3 style={{ marginTop: 12, color: "var(--farm-green-deep)", fontSize: "1.5rem" }}>Manage Crops</h3>
            <p style={{ marginTop: 8, color: "rgba(28, 42, 35, 0.72)" }}>Update crop status, planting dates, and harvest plans.</p>
          </Link>

          <div className="dashboard-card" style={{ padding: 22 }}>
            <div style={{ fontSize: "2.2rem" }}>💰</div>
            <h3 style={{ marginTop: 12, color: "var(--farm-green-deep)", fontSize: "1.5rem" }}>Track Expenses</h3>
            <p style={{ marginTop: 8, color: "rgba(28, 42, 35, 0.72)" }}>Supporting expense tracking is coming soon.</p>
          </div>

          <Link href="/dashboard/settings" className="dashboard-card" style={{ padding: 22 }}>
            <div style={{ fontSize: "2.2rem" }}>⚙️</div>
            <h3 style={{ marginTop: 12, color: "var(--farm-green-deep)", fontSize: "1.5rem" }}>Farm Settings</h3>
            <p style={{ marginTop: 8, color: "rgba(28, 42, 35, 0.72)" }}>Update farmer and farm information with ease.</p>
          </Link>
        </section>
      </main>
    </div>
  );
}