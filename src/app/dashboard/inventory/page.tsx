"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/utils/supabase/client";
import { getSupabaseErrorMessage } from "@/utils/supabase/errors";

type InventoryCategory =
  | "Seeds"
  | "Fertilizers"
  | "Pesticides"
  | "Tools"
  | "Equipment"
  | "Others";

const categories: InventoryCategory[] = [
  "Seeds",
  "Fertilizers",
  "Pesticides",
  "Tools",
  "Equipment",
  "Others",
];

type InventoryItem = {
  id: string;
  user_id: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  current_quantity: number | string;
  reorder_level: number | string;
  is_active: boolean;
  created_at: string;
};

function formatQuantity(value: number | string) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity)) return "0";

  return new Intl.NumberFormat("en-NP", {
    maximumFractionDigits: 2,
  }).format(quantity);
}

export default function InventoryPage() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<InventoryCategory>("Seeds");
  const [unit, setUnit] = useState("kg");
  const [reorderLevel, setReorderLevel] = useState("0");

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      if (!authData.user) {
        window.location.replace("/login?notice=session");
        return;
      }

      const { data, error: inventoryError } = await supabase
        .from("inventory_items")
        .select(
          "id, user_id, name, category, unit, current_quantity, reorder_level, is_active, created_at",
        )
        .eq("user_id", authData.user.id)
        .order("name", { ascending: true });

      if (inventoryError) throw inventoryError;

      setItems((data ?? []) as InventoryItem[]);
    } catch (loadError) {
      setLoadFailed(true);
      setError(
        `We couldn't load your inventory. ${
          getSupabaseErrorMessage(loadError) ?? "Please try again."
        }`,
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const handleAddItem = async () => {
    if (!name.trim() || !unit.trim()) {
      setError("Please enter an item name and unit.");
      return;
    }

    const parsedReorderLevel = Number(reorderLevel);

    if (!Number.isFinite(parsedReorderLevel) || parsedReorderLevel < 0) {
      setError("Reorder level must be a valid number greater than or equal to 0.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        window.location.href = "/login?notice=session";
        return;
      }

      const { error: saveError } = await supabase
        .from("inventory_items")
        .insert({
          user_id: authData.user.id,
          name: name.trim(),
          category,
          unit: unit.trim(),
          reorder_level: parsedReorderLevel,
        });

      if (saveError) {
        setError(
          getSupabaseErrorMessage(saveError) ?? "Could not save inventory item."
        );
        return;
      }

      setName("");
      setCategory("Seeds");
      setUnit("kg");
      setReorderLevel("0");
      setShowForm(false);

      await loadData();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadData]);

  const activeItems = items.filter((item) => item.is_active);
  const lowStockItems = activeItems.filter(
    (item) =>
      Number(item.current_quantity) <= Number(item.reorder_level),
  );
  const categoryCount = new Set(
    activeItems.map((item) => item.category),
  ).size;

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
            <Link href="/dashboard/inventory" className="text-link text-sm">
              Inventory
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
        <div style={{ marginBottom: 24 }}>
          <Link href="/dashboard" className="text-link text-sm">
            Back to Dashboard
          </Link>
          <p className="eyebrow" style={{ marginTop: 18, marginBottom: 8 }}>
            Farm Resources
          </p>
          <h1 className="dashboard-header" style={{ margin: 0 }}>
            Inventory Manager
          </h1>
          <p style={{ marginTop: 10, color: "rgba(28, 42, 35, 0.72)" }}>
            Keep track of your seeds, fertilizers, tools, pesticides, and
            other farm supplies.
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

        <section
          className="dashboard-stats"
          aria-label="Inventory summary"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          }}
        >
          <article className="stat-card">
            <span className="eyebrow" style={{ marginBottom: 0 }}>
              Total Items
            </span>
            <strong>{activeItems.length}</strong>
            <span style={{ color: "rgba(28, 42, 35, 0.7)" }}>
              Active inventory items
            </span>
          </article>
          <article className="stat-card">
            <span className="eyebrow" style={{ marginBottom: 0 }}>
              Categories
            </span>
            <strong>{categoryCount}</strong>
            <span style={{ color: "rgba(28, 42, 35, 0.7)" }}>
              Categories in use
            </span>
          </article>
          <article className="stat-card">
            <span className="eyebrow" style={{ marginBottom: 0 }}>
              Low Stock
            </span>
            <strong>{lowStockItems.length}</strong>
            <span style={{ color: "rgba(28, 42, 35, 0.7)" }}>
              Items at or below reorder level
            </span>
          </article>
        </section>

        <section className="dashboard-card">
          <div className="section-heading">
            <div>
              <h2>Add Inventory Item</h2>
              <p>Keep track of supplies used on your farm.</p>
            </div>

            <button
              type="button"
              className="button button-primary"
              onClick={() => {
                setShowForm(!showForm);
                setError("");
              }}
            >
              {showForm ? "Close Form" : "+ Add Item"}
            </button>
          </div>

          {showForm && (
            <form
              className="auth-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleAddItem();
              }}
            >
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="inventory-name">Item Name</label>
                  <input
                    id="inventory-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Urea Fertilizer"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="inventory-category">Category</label>
                  <select
                    id="inventory-category"
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value as InventoryCategory)
                    }
                  >
                    {categories.map((itemCategory) => (
                      <option key={itemCategory} value={itemCategory}>
                        {itemCategory}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="inventory-unit">Unit</label>
                  <input
                    id="inventory-unit"
                    type="text"
                    value={unit}
                    onChange={(event) => setUnit(event.target.value)}
                    placeholder="e.g. kg, litre, piece"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="inventory-reorder">
                    Low Stock Alert Level
                  </label>
                  <input
                    id="inventory-reorder"
                    type="number"
                    min="0"
                    step="0.01"
                    value={reorderLevel}
                    onChange={(event) => setReorderLevel(event.target.value)}
                    required
                  />
                </div>
              </div>

              {error && <p role="alert">{error}</p>}

              <div className="form-actions">
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Item"}
                </button>

                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
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
                Stock Overview
              </p>
              <h2
                style={{
                  fontSize: "1.7rem",
                  color: "var(--farm-green-deep)",
                }}
              >
                Your Inventory
              </h2>
            </div>
            <span className="tag">
              {activeItems.length} item{activeItems.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <p role="status">Loading your inventory...</p>
          ) : loadFailed ? (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => void loadData()}
            >
              Retry
            </button>
          ) : activeItems.length === 0 ? (
            <div className="empty-state">
              <h3>No inventory items yet</h3>
              <p style={{ color: "rgba(28, 42, 35, 0.7)" }}>
                Your farm supplies will appear here once inventory is added.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {activeItems.map((item) => {
                const isLowStock =
                  Number(item.current_quantity) <=
                  Number(item.reorder_level);

                return (
                  <article
                    key={item.id}
                    className="task-item"
                    style={{
                      alignItems: "center",
                      flexWrap: "wrap",
                      padding: 16,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <strong>{item.name}</strong>
                        <span className="tag">{item.category}</span>
                        {isLowStock && (
                          <span
                            className="tag"
                            style={{
                              background: "rgba(190, 90, 45, 0.12)",
                              color: "#9a4528",
                            }}
                          >
                            Low stock
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          color: "rgba(28, 42, 35, 0.7)",
                          fontSize: "0.9rem",
                        }}
                      >
                        Reorder level: {formatQuantity(item.reorder_level)}{" "}
                        {item.unit}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        justifyItems: "end",
                        gap: 4,
                      }}
                    >
                      <strong
                        style={{
                          color: "var(--farm-green-deep)",
                          fontSize: "1.2rem",
                        }}
                      >
                        {formatQuantity(item.current_quantity)} {item.unit}
                      </strong>
                      <span
                        style={{
                          color: "rgba(28, 42, 35, 0.65)",
                          fontSize: "0.85rem",
                        }}
                      >
                        Available stock
                      </span>
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
