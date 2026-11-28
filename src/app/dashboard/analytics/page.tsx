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
    inventoryError,
    transactionsError,
  ];

  const dataError = errors.some((item) => item !== null);

  const expenseRecords = expenses ?? [];
  const salesRecords = sales ?? [];
  const inventoryRecords = inventory ?? [];
  const purchaseRecords = transactions ?? [];

  const totalExpenses = expenseRecords.reduce(
    (total, expense) => total + Number(expense.amount),
    0,
  );

  const totalRevenue = salesRecords.reduce(
    (total, sale) =>
      total + Number(sale.quantity) * Number(sale.unit_price),
    0,
  );

  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1,
  ).padStart(2, "0")}`;

  const monthlyExpenses = expenseRecords.reduce(
    (total, expense) =>
      expense.expense_date.slice(0, 7) === currentMonth
        ? total + Number(expense.amount)
        : total,
    0,
  );

  const monthlyRevenue = salesRecords.reduce(
    (total, sale) =>
      sale.sale_date.slice(0, 7) === currentMonth
        ? total + Number(sale.quantity) * Number(sale.unit_price)
        : total,
    0,
  );

  const latestPurchaseCosts = new Map<string, number>();

  for (const transaction of purchaseRecords) {
    if (!latestPurchaseCosts.has(transaction.item_id)) {
      latestPurchaseCosts.set(
        transaction.item_id,
        Number(transaction.unit_cost),
      );
    }
  }

  const inventoryValue = inventoryRecords.reduce((total, item) => {
    const unitCost = latestPurchaseCosts.get(item.id);
    if (unitCost === undefined) return total;

    return total + Number(item.current_quantity) * unitCost;
  }, 0);

  const netProfit = totalRevenue - totalExpenses;

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
            <p>Understand your farm&apos;s financial performance.</p>
          </div>
        </div>

        {dataError && (
          <p className="form-message error" role="alert">
            Some analytics data could not be loaded. Please check your
            database permissions and try again.
          </p>
        )}

        <section className="dashboard-stats" style={{ marginTop: 24 }}>
          <article className="stat-card">
            <span className="eyebrow">Total Revenue</span>
            <strong>{formatMoney(totalRevenue)}</strong>
            <span>All recorded sales</span>
          </article>

          <article className="stat-card">
            <span className="eyebrow">Total Expenses</span>
            <strong>{formatMoney(totalExpenses)}</strong>
            <span>All recorded expenses</span>
          </article>

          <article className="stat-card">
            <span className="eyebrow">Net Profit / Loss</span>
            <strong
              style={{
                color: netProfit >= 0 ? "#287A45" : "#B42318",
              }}
            >
              {formatMoney(netProfit)}
            </strong>
            <span>{netProfit >= 0 ? "Net profit" : "Net loss"}</span>
          </article>

          <article className="stat-card">
            <span className="eyebrow">Inventory Value</span>
            <strong>{formatMoney(inventoryValue)}</strong>
            <span>Estimated current stock value</span>
          </article>
        </section>

        <section className="dashboard-stats" style={{ marginTop: 18 }}>
          <article className="stat-card">
            <span className="eyebrow">This Month&apos;s Revenue</span>
            <strong>{formatMoney(monthlyRevenue)}</strong>
          </article>

          <article className="stat-card">
            <span className="eyebrow">This Month&apos;s Expenses</span>
            <strong>{formatMoney(monthlyExpenses)}</strong>
          </article>

          <article className="stat-card">
            <span className="eyebrow">This Month&apos;s Net</span>
            <strong
              style={{
                color:
                  monthlyRevenue - monthlyExpenses >= 0
                    ? "#287A45"
                    : "#B42318",
              }}
            >
              {formatMoney(monthlyRevenue - monthlyExpenses)}
            </strong>
          </article>
        </section>
      </main>
    </div>
  );
}