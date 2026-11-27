import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/auth/logout-button";
import {
  createClient,
  getVerifiedUser,
} from "@/utils/supabase/server";

function formatMoney(amount: number) {
  return `Rs. ${new Intl.NumberFormat("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

export default async function AnalyticsPage() {
  const { user, error } = await getVerifiedUser();

  if (!user) {
    if (error) {
      return (
        <main className="page-width dashboard-main">
          <Brand />
          <h1>Analytics temporarily unavailable</h1>
          <p className="form-message error">{error}</p>
          <Link href="/login" className="button button-primary">
            Return to sign in
          </Link>
        </main>
      );
    }

    redirect("/login?notice=session");
  }

  const supabase = await createClient();

  const [
    { data: expenses, error: expensesError },
    { data: sales, error: salesError },
    { data: harvests, error: harvestsError },
    { data: crops, error: cropsError },
    { data: inventory, error: inventoryError },
    { data: transactions, error: transactionsError },
  ] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, crop_id, category, amount, expense_date")
      .eq("user_id", user.id),

    supabase
      .from("sales")
      .select("id, harvest_id, quantity, unit_price, sale_date")
      .eq("user_id", user.id),

    supabase
      .from("harvests")
      .select("id, crop_id, quantity, unit")
      .eq("user_id", user.id),

    supabase
      .from("crops")
      .select("id, name, variety, status")
      .eq("user_id", user.id),

    supabase
      .from("inventory_items")
      .select("id, name, current_quantity")
      .eq("user_id", user.id)
      .eq("is_active", true),

    supabase
      .from("inventory_transactions")
      .select("item_id, transaction_type, quantity, unit_cost, transaction_date")
      .eq("user_id", user.id)
      .eq("transaction_type", "purchase")
      .not("unit_cost", "is", null)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const errors = [
    expensesError,
    salesError,
    harvestsError,
    cropsError,
    inventoryError,
    transactionsError,
  ];

  const dataError = errors.some((item) => item !== null);

  const expenseRecords = expenses ?? [];
  const salesRecords = sales ?? [];
  const harvestRecords = harvests ?? [];
  const cropRecords = crops ?? [];
  const inventoryRecords = inventory ?? [];
  const purchaseRecords = transactions ?? [];

  // Analytics calculations will be added in the next step.

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="header-inner">
          <Brand />

          <nav
            aria-label="Dashboard navigation"
            className="flex flex-wrap items-center gap-4"
          >
            <Link href="/dashboard" className="text-link text-sm">
              Dashboard
            </Link>
            <Link href="/dashboard/crops" className="text-link text-sm">
              Crops
            </Link>
            <Link href="/dashboard/expenses" className="text-link text-sm">
              Expenses
            </Link>
            <Link href="/dashboard/harvests" className="text-link text-sm">
              Harvests
            </Link>
            <Link href="/dashboard/analytics" className="text-link text-sm">
              Analytics
            </Link>
            <Link href="/dashboard/notebook" className="text-link text-sm">
              Notebook
            </Link>
            <Link href="/dashboard/settings" className="text-link text-sm">
              Settings
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="page-width dashboard-main">
        <div className="dashboard-welcome">
          <div>
            <p className="eyebrow">Farm performance</p>
            <h1 className="dashboard-header">Farm Analytics</h1>
            <p>Understand your farm's financial performance.</p>
          </div>
        </div>

        {dataError && (
          <p className="form-message error" role="alert">
            Some analytics data could not be loaded. Please check your
            database permissions and try again.
          </p>
        )}

        <section className="dashboard-card" style={{ marginTop: 24 }}>
          <h2>Analytics data loaded</h2>
          <p>
            Expenses: {expenseRecords.length}
          </p>
          <p>
            Sales: {salesRecords.length}
          </p>
          <p>
            Harvests: {harvestRecords.length}
          </p>
          <p>
            Crops: {cropRecords.length}
          </p>
          <p>
            Inventory items: {inventoryRecords.length}
          </p>
          <p>
            Purchase records: {purchaseRecords.length}
          </p>
        </section>
      </main>
    </div>
  );
}

redirect