"use client";

import Link from "next/link";;
import { useCallback, useEffect, useMemo, useState } from "react";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/utils/supabase/client";
import { setFlagsFromString } from "v8";

const categories = [
    "Seeds",
    "Fertilizer",
    "Pesticides",
    "Labor",
    "Irrigation",
    "Equipment",
    "Transport",
    "Land Preparation",
    "Animal Feed",
    "Electicity",
    "Fuel",
    "Other",
] as const;
 
type ExpenseCategory = (typeof categories ) [number];
type CropOption = {
    id: string;
    name: string:
    variety: string | null;
    
};

type ExpenseRecord = {
    id: string;
    user_id: string;
    crop_id: string | null;
    category: ExpenseCategory;
    description: string | null;
    amount: number | string;
    expense_date: string;
    notes: string | null;
    created_at: string;
};

type ExpenseForm = {
    category: ExpenseCategory;
    description: string;
    amount: string;
    expense_date: string;
    crop_id: string;
    notes: string;
};

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function emptyForm(): ExpenseForm {
  return {
    category: "Other",
    description: "",
    amount: "",
    expense_date: getToday(),
    crop_id: "",
    notes: "",
  };
}

function formatMoney(amount: number) {
  return `Rs. ${new Intl.NumberFormat("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}


export default function ExpensesPage() {
    const supabase = useMemo(() => createClient(), []);
    const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
    const [form, setForm] = useState<ExpenseForm>(emptyForm);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(true);
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const {data: authData, error: authError }
                await supabase.auth.getUser();

            if (authError) throw authError;

            if (!authData.user) {
                window.location.replace("/login?notice=sessio");
                return;

            }

            const [expenseResult, cropResult] = await Promise.all([
                supabase
                .from("expenses")
                .select(
                    "id, user_id, crop_id, category, discription, amount, expense_date, notes, created_at",
                )
                .eq("user_id", authData.user.id)
                .order("expense_date", { ascending: false })
                .order("created_at", { ascending: false }),

                supabase
                .from("crops")
                .select("id, name, variety")
                .eq("user_id", authData.user.id)
                .order("name", { ascending: true }),
                
            ]);

          if (expenseResult.error) throw expenseResult.error;
          if (cropResult.error) throw cropResult.error;
          
          setExpenses((expenseResult.data ?? []) as ExpenseRecord[]);
          setCrops((cropResult.data ?? []) as CropOption[]);

        } 
        catch (loadError) {
            console.error("failed to load expenses", loadError);
            setError(
                loadError instanceof Error
                ? loadError.message
                : "could not load your expenses. Please try again",

            );
        } finally {
            setLoading(false);

        }
    }, [supabase]);
}

useEffect(() => {
    const timer = setTimeout(() => {
        void loadData();
    }, 0);

    return () => clearTimeout(timer);

}, [loadData]);

 const currentMonth = getToday().slice(0, 7);

  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0,
  );

  const monthlyExpenses = expenses.reduce(
    (total, expense) =>
      expense.expense_date.slice(0, 7) === currentMonth
        ? total + Number(expense.amount)
        : total,
    0,
  );

  const filteredExpenses = expenses.filter((expense) => {
    const matchesCategory =
      categoryFilter === "All" || expense.category === categoryFilter;

    const cropName =
      crops.find((crop) => crop.id === expense.crop_id)?.name ?? "";

    const searchableText = [
      expense.category,
      expense.description ?? "",
      expense.notes ?? "",
      cropName,
    ]
      .join(" ")
      .toLowerCase();

    return (
      matchesCategory &&
      searchableText.includes(search.trim().toLowerCase())
    );
  });

  function cancleEditing() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    if (!form.expense_date) {
      setError("Please select the expense date.");
      return;
    }

    setSaving(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user) throw new Error("Please sign in again.");

      const payload = {
        user_id: authData.user.id,
        category: form.category,
        description: form.description.trim() || null,
        amount,
        expense_date: form.expense_date,
        crop_id: form.crop_id || null,
        notes: form.notes.trim() || null,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("expenses")
          .update(payload)
          .eq("id", editingId)
          .eq("user_id", authData.user.id);

        if (updateError) throw updateError;

        setSuccess("Expense updated successfully.");
      } else {
        const { error: insertError } = await supabase
          .from("expenses")
          .insert(payload);

        if (insertError) throw insertError;

        setSuccess("Expense added successfully.");
      }

      setEditingId(null);
      setForm(emptyForm());
      await loadData();
    } catch (saveError) {
      console.error("Failed to save expense:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save the expense. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(expense: ExpenseRecord) {
    setEditingId(expense.id);
    setForm({
      category: expense.category,
      description: expense.description ?? "",
      amount: String(expense.amount),
      expense_date: expense.expense_date,
      crop_id: expense.crop_id ?? "",
      notes: expense.notes ?? "",
    });
    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteExpense(expense: ExpenseRecord) {
    const confirmed = window.confirm(
      `Delete this ${expense.category.toLowerCase()} expense of ${formatMoney(
        Number(expense.amount),
      )}? This cannot be undone.`,
    );

    if (!confirmed) return;




    setError("");
    setSuccess("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user) throw new Error("Please sign in again.");

      const { error: deleteError } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expense.id)
        .eq("user_id", authData.user.id);

      if (deleteError) throw deleteError;

      if (editingId === expense.id) {
        setEditingId(null);
        setForm(emptyForm());
      }


      setSuccess("Expense deleted successfully.");
      await loadData();
    } catch (deleteError) {
      console.error("Failed to delete expense:", deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the expense. Please try again.",
      );
    }
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav 
          aria-label="DashBoard Navigation"
          className="flex flex-wrap items-center gap-4"
          >
            <Link href="/dashboard" className="text-link text-sm">
            DashBoard</Link>
            <Link href="/dashboard/crops" className="text-link text-sm">
            Crops </Link>
            <Link href="/dashboard/settings" className="text-link text-sm">
            Settings</Link>
            <LogoutButton />
          </nav> 
        </div>
      </header>

      <main className="page-width dashboard-main">
        <div style={{ marginBottom: 24 }}>
          <Link href="/dashboard" className="text-link text-sm">
            ← Back to dashboard
          </Link>
          <p className="eyebrow" style={{ marginTop: 18, marginBottom: 8 }}>
            FARM FINANCES
          </p>
          <h1 className="dashboard-header" style={{ margin: 0 }}>
            Expenses Manager
          </h1>
          <p style={{ marginTop: 10, color: "rgba(28, 42, 35, 0.72)" }}>
            Record farm spending, connect costs to crops, and keep track of
            where your money goes.
          </p>
        </div>

        {error && (
          <p
            className="form-message error"
            role="alert"
            style={{ marginBottom: 16 }}
          >
            {error}
          </p>
        )}

        {success && (
          <p
            className="form-message"
            role="status"
            style={{ marginBottom: 16 }}
          >
            {success}
          </p>
        )}
         <section
          className="dashboard-stats"
          aria-label="Expense summary"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}
        >
        <article className="stat-card">
            <span className="eyebrow" style={{ marginBottom: 0 }}>
              Total recorded
            </span>
            <strong>{formatMoney(totalExpenses)}</strong>
            <span style={{ color: "rgba(28, 42, 35, 0.7)" }}>
              {expenses.length} expense{expenses.length === 1 ? "" : "s"}
            </span>
          </article>

          <article className="stat-card">
            <span className="eyebrow" style={{ marginBottom: 0 }}>
              This month
            </span>
            <strong>{formatMoney(monthlyExpenses)}</strong>
            <span style={{ color: "rgba(28, 42, 35, 0.7)" }}>
              {new Date().toLocaleDateString("en-NP", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </article>

          <article className="stat-card">
            <span className="eyebrow" style={{ marginBottom: 0 }}>
              Categories used
            </span>
            <strong>
              {new Set(expenses.map((expense) => expense.category)).size}
            </strong>
            <span style={{ color: "rgba(28, 42, 35, 0.7)" }}>
              Different expense categories
            </span>
          </article>
        </section>

        <section className="dashboard-card" style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <p className="eyebrow" style={{ marginBottom: 6 }}>
              {editingId ? "UPDATE RECORD" : "NEW RECORD"}
            </p>
            <h2 style={{ fontSize: "1.7rem", color: "var(--farm-green-deep)" }}>
              {editingId ? "Edit expense" : "Add an expense"}
            </h2>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="expense-category">Category *</label>
                <select
                  id="expense-category"
                  value={form.category}
                  onChange={(event) =>
                    updateField(
                      "category",
                      event.target.value as ExpenseCategory,
                    )
                  }
                  required
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="expense-amount">Amount (NPR) *</label>
                <input
                  id="expense-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 2500"
                  value={form.amount}
                  onChange={(event) =>
                    updateField("amount", event.target.value)
                  }
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="expense-date">Expense date *</label>
                <input
                  id="expense-date"
                  type="date"
                  value={form.expense_date}
                  onChange={(event) =>
                    updateField("expense_date", event.target.value)
                  }
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="expense-crop">Related crop (optional)</label>
                <select
                  id="expense-crop"
                  value={form.crop_id}
                  onChange={(event) =>
                    updateField("crop_id", event.target.value)
                  }
                >
                  <option value="">General farm expense</option>
                  {crops.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.name}
                      {crop.variety ? ` — ${crop.variety}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="expense-description">Description</label>
              <input
                id="expense-description"
                type="text"
                maxLength={200}
                placeholder="e.g. Urea fertilizer for rice field"
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
              />
            </div>

            <div className="field">
              <label htmlFor="expense-notes">Additional notes</label>
              <textarea
                id="expense-notes"
                rows={3}
                maxLength={2000}
                placeholder="Supplier, receipt details, or other notes..."
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid rgba(31, 56, 43, 0.18)",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.7)",
                  padding: 14,
                  color: "var(--farm-ink)",
                  resize: "vertical",
                }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="button button-primary"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Add expense"}
              </button>

              {editingId && (
                <button
                  className="button"
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  Cancel editing
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="dashboard-card" style={{ marginTop: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <div>
              <p className="eyebrow" style={{ marginBottom: 6 }}>
                EXPENSE HISTORY
              </p>
              <h2 style={{ fontSize: "1.7rem", color: "var(--farm-green-deep)" }}>
                Your expenses
              </h2>
            </div>
            <span className="tag">
              {filteredExpenses.length} record
              {filteredExpenses.length === 1 ? "" : "s"}
            </span>
          </div>

          <div
            className="form-grid"
            style={{ marginBottom: 20, alignItems: "end" }}
          >
            <div className="field">
              <label htmlFor="expense-search">Search expenses</label>
              <input
                id="expense-search"
                type="search"
                placeholder="Search description, crop, notes..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="expense-filter">Filter by category</label>
              <select
                id="expense-filter"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="All">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p role="status">Loading your expenses...</p>
          ) : filteredExpenses.length === 0 ? (
            <div className="empty-state">
              <h3>
                {expenses.length === 0
                  ? "No expenses recorded yet"
                  : "No matching expenses"}
              </h3>
              <p style={{ color: "rgba(28, 42, 35, 0.7)" }}>
                {expenses.length === 0
                  ? "Add your first farm expense using the form above."
                  : "Try another search term or category filter."}
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {filteredExpenses.map((expense) => {
                const crop = crops.find(
                  (item) => item.id === expense.crop_id,
                );

                return (
                  <article
                    key={expense.id}
                    className="task-item"
                    style={{
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      padding: 16,
                    }}
                  >
                    <div style={{ flex: "1 1 220px", minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <strong>{expense.category}</strong>
                        <span className="tag">
                          {new Date(
                            `${expense.expense_date}T12:00:00`,
                          ).toLocaleDateString("en-NP")}
                        </span>
                      </div>

                      {expense.description && (
                        <p style={{ marginTop: 6, overflowWrap: "anywhere" }}>
                          {expense.description}
                        </p>
                      )}

                      <p
                        style={{
                          marginTop: 5,
                          color: "rgba(28, 42, 35, 0.7)",
                          fontSize: "0.9rem",
                        }}
                      >
                        {crop ? `Crop: ${crop.name}` : "General farm expense"}
                      </p>

                      {expense.notes && (
                        <p
                          style={{
                            marginTop: 5,
                            color: "rgba(28, 42, 35, 0.7)",
                            fontSize: "0.9rem",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {expense.notes}
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        display: "grid",
                        justifyItems: "end",
                        gap: 10,
                      }}
                    >
                      <strong
                        style={{
                          color: "var(--farm-green-deep)",
                          fontSize: "1.15rem",
                        }}
                      >
                        {formatMoney(Number(expense.amount))}
                      </strong>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="button"
                          onClick={() => startEditing(expense)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="button"
                          onClick={() => void deleteExpense(expense)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}