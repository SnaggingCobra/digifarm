import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/auth/logout-button";
import { FarmImage } from "@/components/farm-image";
import { createClient, getVerifiedUser } from "@/utils/supabase/server";
import { getSupabaseErrorMessage } from "@/utils/supabase/errors";

function getGreeting(fullName: string) {
  const hour = new Date().getHours();
  const name = fullName || "Farmer";

  if (hour < 12) return `Good Morning, ${name}`;
  if (hour < 18) return `Good Afternoon, ${name}`;
  return `Good Evening, ${name}`;
}

function formatMoney(amount: number) {
  return `Rs. ${new Intl.NumberFormat("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
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

  const [
    { data: expenses, error: expensesError },
    { data: harvests, error: harvestsError },
  ] = await Promise.all([
    supabase
      .from("expenses")
      .select(
        "id, user_id, crop_id, category, description, amount, expense_date, notes, created_at",
      )
      .eq("user_id", user.id)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("harvests")
      .select("crop_id")
      .eq("user_id", user.id),
  ]);

  if (harvestsError) {
    console.warn("Could not load harvests for dashboard crop status:", {
      code: harvestsError.code,
      message: harvestsError.message,
    });
  }

  const harvestedCropIds = new Set(
    (harvests ?? []).map((harvest) => harvest.crop_id),
  );

  const activeCrops = cropsError
    ? null
    : crops?.filter((crop) => ["planned", "growing", "ready"].includes(crop.status)).length ?? 0;
  const totalExpenses = expensesError
    ? null
    : expenses?.reduce((total, expense) => total + Number(expense.amount), 0) ?? 0;
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
  const monthlyExpenses = expensesError
    ? null
    : expenses?.reduce(
        (total, expense) => expense.expense_date.startsWith(currentMonth)
          ? total + Number(expense.amount)
          : total,
        0,
      ) ?? 0;

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
            <Link href="/dashboard/expenses" className="text-link text-sm">Expenses</Link>
            <Link href="/dashboard/harvests" className="text-link text-sm">Harvests</Link>
            <Link href="/dashboard/notebook" className="text-link text-sm">Notebook</Link>
            <Link href="/dashboard/settings" className="text-link text-sm">Settings</Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="page-width dashboard-main">
        <section className="dashboard-welcome">
          <div>
            <p className="eyebrow" style={{ marginBottom: 8 }}>{farmName}</p>
            <h1 className="dashboard-header" style={{ margin: 0 }}>
              {getGreeting(fullName)}
            </h1>
            <p style={{ marginTop: 10, color: "rgba(28, 42, 35, 0.68)" }}>
              Here&apos;s what&apos;s happening on your farm today.
            </p>
            {profile?.farm_location && <p style={{ marginTop: 6, color: "rgba(28, 42, 35, 0.68)" }}>{profile.farm_location}</p>}
          </div>
          <FarmImage
            src="/healthy-farm.jpg"
            alt="Young crops growing in a field"
            sizes="(max-width: 900px) 100vw, 38vw"
            className="dashboard-welcome-photo"
          />
        </section>

        {profileError && (
          <p className="form-message error" role="alert" style={{ marginTop: 18 }}>
            We couldn&apos;t load your farm information. Please try again.
          </p>
        )}

        <section className="dashboard-stats" style={{ marginTop: 24 }}>
          <article className="stat-card">
            <span className="eyebrow" style={{ marginBottom: 0, fontSize: "0.7rem" }}>Active Crops</span>
            <strong>{activeCrops ?? "—"}</strong>
            {cropsError && <span style={{ color: "rgba(28, 42, 35, 0.7)" }}>Unable to load crop total</span>}
          </article>

          <article className="stat-card">
            <span className="eyebrow" style={{ marginBottom: 0, fontSize: "0.7rem" }}>Farm Size</span>
            <strong>{farmSize ?? "—"}</strong>
            <span style={{ color: "rgba(28, 42, 35, 0.7)" }}>{landUnit}</span>
          </article>

          <article className="stat-card">
            <span className="eyebrow" style={{ marginBottom: 0, fontSize: "0.7rem" }}>Expenses</span>
            <strong>{totalExpenses === null ? "—" : formatMoney(totalExpenses)}</strong>
            <span style={{ color: "rgba(28, 42, 35, 0.7)" }}>
              {expensesError ? "Unable to load expenses" : `${expenses?.length ?? 0} recorded`}
            </span>
          </article>

          <article className="stat-card">
            <span className="eyebrow" style={{ marginBottom: 0, fontSize: "0.7rem" }}>Revenue</span>
            <strong>Track your sales</strong>
            <Link href="/dashboard/harvests" className="text-link text-sm">Open harvests →</Link>
          </article>
          <article className="stat-card">
            <span className="eyebrow" style={{ marginBottom: 0, fontSize: "0.7rem" }}>This month</span>
            <strong>{monthlyExpenses === null ? "—" : formatMoney(monthlyExpenses)}</strong>
            <span style={{ color: "rgba(28, 42, 35, 0.7)" }}>Farm expenses</span>
          </article>
        </section>

        <section className="dashboard-card" style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: 0 }}>Expense overview</p>
              <h2 style={{ fontSize: "1.7rem", color: "var(--farm-green-deep)" }}>Recent expenses</h2>
            </div>
            <Link href="/dashboard/expenses" className="text-link text-sm">View all</Link>
          </div>
          {expensesError ? (
            <p className="form-message error" role="alert" style={{ marginTop: 18 }}>
              We couldn&apos;t load your expenses.{" "}
              {getSupabaseErrorMessage(expensesError) ?? "Please try again."}
            </p>
          ) : expenses?.length ? (
            <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
              {expenses.slice(0, 5).map((expense) => (
                <div key={expense.id} className="task-item">
                  <div>
                    <strong>{expense.category}</strong>
                    {expense.description && <p style={{ color: "rgba(28, 42, 35, 0.7)" }}>{expense.description}</p>}
                    <span style={{ color: "rgba(28, 42, 35, 0.7)", fontSize: "0.9rem" }}>{expense.expense_date}</span>
                  </div>
                  <strong>{formatMoney(Number(expense.amount))}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ marginTop: 18 }}>
              <h3>No expenses recorded yet</h3>
              <p style={{ color: "rgba(28, 42, 35, 0.7)" }}>Record your first farm expense to see it here.</p>
              <Link href="/dashboard/expenses" className="button button-primary" style={{ marginTop: 8 }}>Add an expense</Link>
            </div>
          )}
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
                  <span className="tag" style={{ textTransform: "capitalize" }}>
                    {harvestedCropIds.has(crop.id) && crop.status !== "completed"
                      ? "harvested"
                      : crop.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ marginTop: 18 }}>
              <FarmImage
                src="/farm-empty.jpg"
                alt="An open field ready for the next crop"
                sizes="(max-width: 640px) 90vw, 340px"
                className="empty-state-photo"
              />
              <h3>No crops added yet</h3>
              <p style={{ color: "rgba(28, 42, 35, 0.7)" }}>Add your first crop to start managing your farm plan.</p>
              <Link href="/dashboard/crops" className="button button-primary" style={{ marginTop: 8 }}>
                Add your first crop
              </Link>
            </div>
          )}
        </section>

        <section className="dashboard-grid" style={{ marginTop: 24, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <Link href="/dashboard/crops" className="dashboard-card dashboard-action-card">
            <FarmImage
              src="/rice.jpg"
              alt="Rice growing in a green field"
              sizes="(max-width: 900px) 100vw, 33vw"
              className="dashboard-action-photo"
            />
            <div className="dashboard-action-copy">
              <h3 style={{ color: "var(--farm-green-deep)", fontSize: "1.5rem" }}>Manage Crops</h3>
              <p style={{ marginTop: 8, color: "rgba(28, 42, 35, 0.72)" }}>Update crop status, planting dates, and harvest plans.</p>
            </div>
          </Link>

          <Link href="/dashboard/expenses" className="dashboard-card dashboard-action-card">
            <FarmImage

            
            src="/farm-inventory.jpg"
              alt="Farm supplies and tools laid out for planning"
            
            sizes="(max-width: 900px) 100vw, 33vw"
              className="dashboard-action-photo"
            />
            <div className="dashboard-action-copy">
              <h3 style={{ color: "var(--farm-green-deep)", fontSize: "1.5rem" }}>Track Expenses</h3>
              <p style={{ marginTop: 8, color: "rgba(28, 42, 35, 0.72)" }}>Record spending and connect costs to your crops.</p>
            </div>
          </Link>

          <Link href="/dashboard/harvests" className="dashboard-card dashboard-action-card dashboard-action-card-plain">
            <div className="dashboard-action-copy">
              <div style={{ fontSize: "2.2rem" }}>🌾</div>
              <h3 style={{ marginTop: 12, color: "var(--farm-green-deep)", fontSize: "1.5rem" }}>Manage Harvests</h3>
              <p style={{ marginTop: 8, color: "rgba(28, 42, 35, 0.72)" }}>Record harvests, track remaining stock, and manage sales.</p>
            </div>
          </Link>

          <Link href="/dashboard/settings" className="dashboard-card dashboard-action-card dashboard-action-card-plain">
            <div className="dashboard-action-copy">
              <div style={{ fontSize: "2.2rem" }}>⚙️</div>
              <h3 style={{ marginTop: 12, color: "var(--farm-green-deep)", fontSize: "1.5rem" }}>Farm Settings</h3>
              <p style={{ marginTop: 8, color: "rgba(28, 42, 35, 0.72)" }}>Update farmer and farm information with ease.</p>
            </div>
          </Link>

          <Link href="/dashboard/notebook" className="dashboard-card dashboard-action-card dashboard-action-card-plain">
            <div className="dashboard-action-copy">
              <h3 style={{ color: "var(--farm-green-deep)", fontSize: "1.5rem" }}>Farm Notebook</h3>
              <p style={{ marginTop: 8, color: "rgba(28, 42, 35, 0.72)" }}>Keep a short list of tasks for your farm.</p>
            </div>
          </Link>
        </section>
      </main>
    </div>
  );
}
