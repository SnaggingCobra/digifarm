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

type CropOption = {
  id: string;
  name: string;
  variety: string | null;
};

type InventoryTransaction = {
  id: string;
  item_id: string;
  crop_id: string | null;
  transaction_type: "purchase" | "usage" | "adjustment";
  quantity: number | string;
  unit_cost: number | string | null;
  transaction_date: string;
  notes: string | null;
  created_at: string;
};

type InventoryFormMode = "new" | "purchase" | "usage";

function formatQuantity(value: number | string) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity)) return "0";

  return new Intl.NumberFormat("en-NP", {
    maximumFractionDigits: 2,
  }).format(quantity);
}

function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function InventoryPage() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [crops, setCrops] = useState<CropOption[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [activeForm, setActiveForm] = useState<InventoryFormMode | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<InventoryCategory>("Seeds");
  const [unit, setUnit] = useState("kg");
  const [reorderLevel, setReorderLevel] = useState("0");

  const [initialStockQuantity, setInitialStockQuantity] = useState("0");
  const [initialStockCost, setInitialStockCost] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [purchaseQuantity, setPurchaseQuantity] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(getLocalDateInputValue);
  const [purchaseNotes, setPurchaseNotes] = useState("");

  const [usageItemId, setUsageItemId] = useState("");
  const [usageQuantity, setUsageQuantity] = useState("");
  const [usageCropId, setUsageCropId] = useState("");
  const [usageDate, setUsageDate] = useState(getLocalDateInputValue);
  const [usageNotes, setUsageNotes] = useState("");

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

      const [inventoryResult, cropResult, transactionResult] =
        await Promise.all([
          supabase
            .from("inventory_items")
            .select(
              "id, user_id, name, category, unit, current_quantity, reorder_level, is_active, created_at",
            )
            .eq("user_id", authData.user.id)
            .order("name", { ascending: true }),

          supabase
            .from("crops")
            .select("id, name, variety")
            .eq("user_id", authData.user.id)
            .order("name", { ascending: true }),

          supabase
            .from("inventory_transactions")
            .select(
              "id, item_id, crop_id, transaction_type, quantity, unit_cost, transaction_date, notes, created_at",
            )
            .eq("user_id", authData.user.id)
            .order("transaction_date", { ascending: false })
            .order("created_at", { ascending: false }),
        ]);

      if (inventoryResult.error) throw inventoryResult.error;
      if (cropResult.error) throw cropResult.error;
      if (transactionResult.error) throw transactionResult.error;

      setItems((inventoryResult.data ?? []) as InventoryItem[]);
      setCrops((cropResult.data ?? []) as CropOption[]);
      setTransactions(
        (transactionResult.data ?? []) as InventoryTransaction[],
      );
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

    const parsedInitialStock = Number(initialStockQuantity);
    const parsedInitialStockCost =
      initialStockCost.trim() === "" ? null : Number(initialStockCost);

    if (!Number.isFinite(parsedInitialStock) || parsedInitialStock < 0) {
      setError("Initial stock must be a valid number greater than or equal to 0.");
      return;
    }

    if (
      parsedInitialStockCost !== null &&
      (!Number.isFinite(parsedInitialStockCost) || parsedInitialStockCost < 0)
    ) {
      setError("Unit cost must be a valid amount greater than or equal to 0.");
      return;
    }

    if (parsedInitialStock === 0 && parsedInitialStockCost !== null) {
      setError("Enter an initial stock quantity to record its unit cost.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      if (!authData.user) {
        window.location.replace("/login?notice=session");
        return;
      }

      const { data: newItem, error: saveError } = await supabase
        .from("inventory_items")
        .insert({
          user_id: authData.user.id,
          name: name.trim(),
          category,
          unit: unit.trim(),
          reorder_level: parsedReorderLevel,
        })
        .select("id")
        .single();

      if (saveError) {
        setError(
          getSupabaseErrorMessage(saveError) ?? "Could not save inventory item."
        );
        return;
      }

      let initialPurchaseError: string | undefined;

      if (parsedInitialStock > 0) {
        try {
          const { error: purchaseError } = await supabase
            .from("inventory_transactions")
            .insert({
              user_id: authData.user.id,
              item_id: newItem.id,
              transaction_type: "purchase",
              quantity: parsedInitialStock,
              unit_cost: parsedInitialStockCost,
            });

          if (purchaseError) throw purchaseError;
        } catch (purchaseError) {
          initialPurchaseError =
            getSupabaseErrorMessage(purchaseError) ??
            "The initial stock could not be recorded.";
        }
      }

      setName("");
      setCategory("Seeds");
      setUnit("kg");
      setReorderLevel("0");
      setInitialStockQuantity("0");
      setInitialStockCost("");
      setActiveForm(null);

      await loadData();

      if (initialPurchaseError) {
        setError(
          `The item was created, but its initial stock purchase was not recorded. ${initialPurchaseError} You can record the purchase using the Purchase Stock action.`,
        );
      }
    } catch (saveError) {
      setError(
        getSupabaseErrorMessage(saveError) ??
          "Something went wrong. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePurchaseStock = async () => {
    const quantity = Number(purchaseQuantity);
    const cost =
      purchaseCost.trim() === "" ? null : Number(purchaseCost);

    if (!selectedItemId) {
      setError("Please select an inventory item.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Purchase quantity must be greater than 0.");
      return;
    }

    if (cost !== null && (!Number.isFinite(cost) || cost < 0)) {
      setError("Unit cost must be a valid amount greater than or equal to 0.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      if (!authData.user) {
        window.location.replace("/login?notice=session");
        return;
      }

      const { error: purchaseError } = await supabase
        .from("inventory_transactions")
        .insert({
          user_id: authData.user.id,
          item_id: selectedItemId,
          transaction_type: "purchase",
          quantity,
          unit_cost: cost,
          transaction_date: purchaseDate,
          notes: purchaseNotes.trim() || null,
        });

      if (purchaseError) {
        setError(
          getSupabaseErrorMessage(purchaseError) ??
            "Could not record the purchase.",
        );
        return;
      }

      setSelectedItemId("");
      setPurchaseQuantity("");
      setPurchaseCost("");
      setPurchaseDate(getLocalDateInputValue());
      setPurchaseNotes("");
      setActiveForm(null);

      await loadData();
    } catch (purchaseError) {
      setError(
        getSupabaseErrorMessage(purchaseError) ??
          "Something went wrong while recording the purchase.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRecordUsage = async () => {
    const quantity = Number(usageQuantity);

    if (!usageItemId) {
      setError("Please select an inventory item.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Usage quantity must be greater than 0.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      if (!authData.user) {
        window.location.replace("/login?notice=session");
        return;
      }

      const { error: usageError } = await supabase
        .from("inventory_transactions")
        .insert({
          user_id: authData.user.id,
          item_id: usageItemId,
          crop_id: usageCropId || null,
          transaction_type: "usage",
          quantity,
          transaction_date: usageDate,
          notes: usageNotes.trim() || null,
        });

      if (usageError) {
        setError(
          getSupabaseErrorMessage(usageError) ??
            "Could not record inventory usage.",
        );
        return;
      }

      setUsageItemId("");
      setUsageQuantity("");
      setUsageCropId("");
      setUsageDate(getLocalDateInputValue());
      setUsageNotes("");
      setActiveForm(null);

      await loadData();
    } catch (usageError) {
      setError(
        getSupabaseErrorMessage(usageError) ??
          "Something went wrong while recording usage.",
      );
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
              <h2>Manage Inventory</h2>
              <p>Add supplies and keep stock purchase records up to date.</p>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  setActiveForm(activeForm === "new" ? null : "new");
                  setError("");
                }}
                disabled={saving}
              >
                {activeForm === "new" ? "Close Add Form" : "+ Add Item"}
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setActiveForm(activeForm === "purchase" ? null : "purchase");
                  setError("");
                }}
                disabled={saving}
              >
                {activeForm === "purchase"
                  ? "Close Purchase Form"
                  : "Record Purchase"}
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setActiveForm(activeForm === "usage" ? null : "usage");
                  setError("");
                }}
                disabled={saving}
              >
                {activeForm === "usage"
                  ? "Close Usage Form"
                  : "Record Usage"}
              </button>
            </div>
          </div>

          {activeForm === "new" && (
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

                <div className="field">
                  <label htmlFor="inventory-initial-stock">
                    Initial Stock Quantity
                  </label>
                  <input
                    id="inventory-initial-stock"
                    type="number"
                    min="0"
                    step="0.01"
                    value={initialStockQuantity}
                    onChange={(event) =>
                      setInitialStockQuantity(event.target.value)
                    }
                    required
                  />
                  <span className="muted">
                    A quantity above zero is recorded as an initial purchase.
                  </span>
                </div>

                <div className="field">
                  <label htmlFor="inventory-initial-cost">
                    Initial Stock Unit Cost (Rs.)
                  </label>
                  <input
                    id="inventory-initial-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={initialStockCost}
                    onChange={(event) => setInitialStockCost(event.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

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
                    setActiveForm(null);
                    setError("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {activeForm === "purchase" && (
            <form
              className="auth-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handlePurchaseStock();
              }}
            >
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="purchase-item">Inventory Item</label>
                  <select
                    id="purchase-item"
                    value={selectedItemId}
                    onChange={(event) => setSelectedItemId(event.target.value)}
                    required
                  >
                    <option value="">Select an item</option>
                    {activeItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({formatQuantity(item.current_quantity)}{" "}
                        {item.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="purchase-quantity">
                    Quantity Purchased
                  </label>
                  <input
                    id="purchase-quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={purchaseQuantity}
                    onChange={(event) =>
                      setPurchaseQuantity(event.target.value)
                    }
                    placeholder="e.g. 50"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="purchase-cost">Unit Cost (Rs.)</label>
                  <input
                    id="purchase-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={purchaseCost}
                    onChange={(event) => setPurchaseCost(event.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div className="field">
                  <label htmlFor="purchase-date">Purchase Date</label>
                  <input
                    id="purchase-date"
                    type="date"
                    value={purchaseDate}
                    onChange={(event) => setPurchaseDate(event.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="purchase-notes">Notes</label>
                  <input
                    id="purchase-notes"
                    type="text"
                    value={purchaseNotes}
                    onChange={(event) => setPurchaseNotes(event.target.value)}
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={saving || activeItems.length === 0}
                >
                  {saving ? "Saving..." : "Record Purchase"}
                </button>

                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    setActiveForm(null);
                    setError("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>

              {activeItems.length === 0 && (
                <p className="empty-state">
                  Add an inventory item before recording a purchase.
                </p>
              )}
            </form>
          )}

          {activeForm === "usage" && (
            <form
              className="auth-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleRecordUsage();
              }}
            >
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="usage-item">Inventory Item</label>
                  <select
                    id="usage-item"
                    value={usageItemId}
                    onChange={(event) => setUsageItemId(event.target.value)}
                    required
                  >
                    <option value="">Select an item</option>
                    {activeItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({formatQuantity(item.current_quantity)}{" "}
                        {item.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="usage-quantity">Quantity Used</label>
                  <input
                    id="usage-quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={usageQuantity}
                    onChange={(event) => setUsageQuantity(event.target.value)}
                    placeholder="e.g. 5"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="usage-crop">Crop (Optional)</label>
                  <select
                    id="usage-crop"
                    value={usageCropId}
                    onChange={(event) => setUsageCropId(event.target.value)}
                  >
                    <option value="">No crop selected</option>
                    {crops.map((crop) => (
                      <option key={crop.id} value={crop.id}>
                        {crop.name}
                        {crop.variety ? ` (${crop.variety})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="usage-date">Usage Date</label>
                  <input
                    id="usage-date"
                    type="date"
                    value={usageDate}
                    onChange={(event) => setUsageDate(event.target.value)}
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="usage-notes">Notes</label>
                  <input
                    id="usage-notes"
                    type="text"
                    value={usageNotes}
                    onChange={(event) => setUsageNotes(event.target.value)}
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={saving || activeItems.length === 0}
                >
                  {saving ? "Saving..." : "Record Usage"}
                </button>

                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    setActiveForm(null);
                    setError("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>

              {activeItems.length === 0 && (
                <p className="empty-state">
                  Add an inventory item before recording usage.
                </p>
              )}
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

          <section className="dashboard-card" style={{ marginTop: 24 }}>
          <h2>Transaction History</h2>
          <p className="muted">Recent purchases and usage records.</p>

          {loading ? (
            <p role="status">Loading transaction history...</p>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <p>No inventory transactions recorded yet.</p>
            </div>
          ) : (
            <div className="task-list">
              {transactions.map((transaction) => {
                const item = items.find(
                  (entry) => entry.id === transaction.item_id,
                );
                const crop = crops.find(
                  (entry) => entry.id === transaction.crop_id,
                );
                const isPurchase =
                  transaction.transaction_type === "purchase";
                const isUsage = transaction.transaction_type === "usage";
                const quantity = Number(transaction.quantity);
                const quantityLabel = isPurchase
                  ? `+${formatQuantity(quantity)}`
                  : isUsage
                    ? `-${formatQuantity(quantity)}`
                    : `${quantity > 0 ? "+" : ""}${formatQuantity(quantity)}`;

                return (
                  <div className="task-item" key={transaction.id}>
                    <div>
                      <strong>{item?.name ?? "Unknown item"}</strong>
                      <p>
                        {transaction.transaction_type.charAt(0).toUpperCase() +
                          transaction.transaction_type.slice(1)}
                        {" · "}
                        {new Date(
                          `${transaction.transaction_date}T00:00:00`,
                        ).toLocaleDateString("en-NP")}
                      </p>
                      {crop && <p>Crop: {crop.name}</p>}
                      {transaction.notes && <p>{transaction.notes}</p>}
                      {isPurchase && transaction.unit_cost !== null && (
                        <p>
                          Unit cost: Rs.{" "}
                          {Number(transaction.unit_cost).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <strong>
                      {quantityLabel} {item?.unit ?? ""}
                    </strong>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        

      </main>
    </div>
  );
}
