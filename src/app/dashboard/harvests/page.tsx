"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/utils/supabase/client";
const units = [ 
    "kg",
    "quintal",
    "ton",
    "gram",
    "crate",
    "piece",
    "bag",

] as const;

type HarvestUnit = (typeof units)[number];

type CropOption = {
    id: string;
    name: string;
    variety: string | null;

};

type HarvestRecord = {
  id: string;
  user_id: string;
  crop_id: string;
  harvest_date: string;
  quantity: number | string;
  unit: HarvestUnit;
  notes: string | null;
  created_at: string;
};

type HarvestForm = {
    crop_id: string;
    harvest_date: string;
    quantity: string;
    unit: HarvestUnit;
    notes: string;

};

type SaleRecord = {
  id: string;
  user_id: string;
  harvest_id: string;
  sale_date: string;
  quantity: number | string;
  unit_price: number | string;
  buyer: string | null;
  notes: string | null;
  created_at: string;
};

type SaleForm = {
  harvest_id: string;
  sale_date: string;
  quantity: string;
  unit_price: string;
  buyer: string;
  notes: string;
};



function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}
function emptyHarvestForm(): HarvestForm {
    return {
        crop_id: "",
        harvest_date: getToday(),
        quantity: "",
        unit: "kg",
        notes: "",
    };
}

function emptySaleForm(): SaleForm {
    return {
        harvest_id: "",
        sale_date: getToday(),
        quantity: "",
        unit_price: "",
        buyer: "",
        notes: "",
    };

}

function formatMoney(amount: number) {
  return `Rs. ${new Intl.NumberFormat("en-NP", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

function formatDate(date: string) {
    return new Date(`${date}T12:00:00`).toLocaleDateString("en-NP", {
        year: "numeric",
        month: "short",
        day: "numeric",

    });
}

export default function HarvestsPage() {
  const supabase = useMemo(() => createClient(), []);

  // Database record
  const [harvests, setHarvests] = useState<HarvestRecord[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [crops, setCrops] = useState<CropOption[]>([]);

  // Form state
  const [harvestForm, setHarvestForm] =
    useState<HarvestForm>(emptyHarvestForm);

  const [saleForm, setSaleForm] =
    useState<SaleForm>(emptySaleForm);

  // Editing state
  const [editingHarvestId, setEditingHarvestId] =
    useState<string | null>(null);

  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  // Message
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search
  const [search, setSearch] = useState("");

    // Load harvests, sales, and crops
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

      // Fetch all three user-scoped lists together.
      const [harvestResult, salesResult, cropResult] =
        await Promise.all([
          supabase
            .from("harvests")
            .select(
              "id, user_id, crop_id, harvest_date, quantity, unit, notes, created_at",
            )
            .eq("user_id", authData.user.id)
            .order("harvest_date", { ascending: false }),

          supabase
            .from("sales")
            .select(
              "id, user_id, harvest_id, sale_date, quantity, unit_price, buyer, notes, created_at",
            )
            .eq("user_id", authData.user.id)
            .order("sale_date", { ascending: false }),

          supabase
            .from("crops")
            .select("id, name, variety")
            .eq("user_id", authData.user.id)
            .order("name", { ascending: true }),
        ]);

      if (harvestResult.error) throw harvestResult.error;
      if (salesResult.error) throw salesResult.error;
      if (cropResult.error) throw cropResult.error;

      setHarvests((harvestResult.data ?? []) as HarvestRecord[]);
      setSales((salesResult.data ?? []) as SaleRecord[]);
      setCrops((cropResult.data ?? []) as CropOption[]);
    } catch (loadError) {
      console.error("Failed to load harvest data:", loadError);
      setLoadFailed(true);
      setError("We couldn't load your harvest records. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadData]);

    // Calculate total revenue from all sales
  const totalRevenue = sales.reduce(
    (total, sale) =>
      total + Number(sale.quantity) * Number(sale.unit_price),
    0,
  );

  // Calculate revenue for the current month
  const currentMonth = getToday().slice(0, 7);

  const monthlyRevenue = sales.reduce(
    (total, sale) =>
      sale.sale_date.slice(0, 7) === currentMonth
        ? total + Number(sale.quantity) * Number(sale.unit_price)
        : total,
    0,
  );

  // Calculate sold and remaining quantities for one harvest
  function getHarvestTotals(harvest: HarvestRecord) {
    const harvestSales = sales.filter(
      (sale) => sale.harvest_id === harvest.id,
    );

    const soldQuantity = harvestSales.reduce(
      (total, sale) => total + Number(sale.quantity),
      0,
    );

    // Never show negative stock if recorded sales exceed the harvest.
    const remainingQuantity = Math.max(
      0,
      Number(harvest.quantity) - soldQuantity,
    );

    const revenue = harvestSales.reduce(
      (total, sale) =>
        total + Number(sale.quantity) * Number(sale.unit_price),
      0,
    );

    return {
      soldQuantity,
      remainingQuantity,
      revenue,
      salesCount: harvestSales.length,
    };
  }

  const filteredHarvests = harvests.filter((harvest) => {
    const crop = crops.find((item) => item.id === harvest.crop_id);

    const searchableText = [
      crop?.name ?? "",
      crop?.variety ?? "",
      harvest.notes ?? "",
      harvest.unit,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search.trim().toLowerCase());
  });

  // Update harvest form fields
  function updateHarvestField<Field extends keyof HarvestForm>(
    field: Field,
    value: HarvestForm[Field],
  ) {
    setHarvestForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // Reset harvest form
  function cancelHarvestEditing() {
    setEditingHarvestId(null);
    setHarvestForm(emptyHarvestForm());
    setError("");
    setSuccess("");
  }

  // Save a harvest record
  async function handleHarvestSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    const quantity = Number(harvestForm.quantity);

    if (!harvestForm.crop_id) {
      setError("Please select a crop.");
      return;
    }

    if (!crops.some((crop) => crop.id === harvestForm.crop_id)) {
      setError("Please select a valid crop.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Enter a harvest quantity greater than zero.");
      return;
    }

    if (editingHarvestId) {
      const currentHarvest = harvests.find(
        (harvest) => harvest.id === editingHarvestId,
      );
      if (currentHarvest) {
        const { soldQuantity } = getHarvestTotals(currentHarvest);
        if (quantity < soldQuantity) {
          setError(
            `Harvest quantity cannot be less than the ${soldQuantity} ${currentHarvest.unit} already sold.`,
          );
          return;
        }
      }
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(harvestForm.harvest_date) ||
      Number.isNaN(Date.parse(harvestForm.harvest_date))
    ) {
      setError("Please select a valid harvest date.");
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
        crop_id: harvestForm.crop_id,
        harvest_date: harvestForm.harvest_date,
        quantity,
        unit: harvestForm.unit,
        notes: harvestForm.notes.trim() || null,
      };

      if (editingHarvestId) {
        const { error: updateError } = await supabase
          .from("harvests")
          .update(payload)
          .eq("id", editingHarvestId)
          .eq("user_id", authData.user.id);

        if (updateError) throw updateError;

        setSuccess("Harvest updated successfully.");
      } else {
        const { error: insertError } = await supabase
          .from("harvests")
          .insert(payload);

        if (insertError) throw insertError;

        setSuccess("Harvest recorded successfully.");
      }

      setEditingHarvestId(null);
      setHarvestForm(emptyHarvestForm());

      await loadData();
    } catch (saveError) {
      console.error("Failed to save harvest:", saveError);
      setError(
        saveError instanceof Error
          ? `We couldn't save the harvest: ${saveError.message}`
          : "We couldn't save the harvest. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  // Update sales form fields
  function updateSaleField<Field extends keyof SaleForm>(
    field: Field,
    value: SaleForm[Field],
  ) {
    setSaleForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // Save an individual sale
  async function handleSaleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    const quantity = Number(saleForm.quantity);
    const unitPrice = Number(saleForm.unit_price);

    const selectedHarvest = harvests.find(
      (harvest) => harvest.id === saleForm.harvest_id,
    );

    if (!selectedHarvest) {
      setError("Please select a valid harvest.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Enter a sale quantity greater than zero.");
      return;
    }

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      setError("Enter a selling price greater than zero.");
      return;
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(saleForm.sale_date) ||
      Number.isNaN(Date.parse(saleForm.sale_date))
    ) {
      setError("Please select a valid sale date.");
      return;
    }

    const { remainingQuantity } = getHarvestTotals(selectedHarvest);

    if (quantity > remainingQuantity) {
      setError(
        `Only ${remainingQuantity} ${selectedHarvest.unit} remaining for this harvest.`,
      );
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
        harvest_id: selectedHarvest.id,
        sale_date: saleForm.sale_date,
        quantity,
        unit_price: unitPrice,
        buyer: saleForm.buyer.trim() || null,
        notes: saleForm.notes.trim() || null,
      };

      const { error: insertError } = await supabase
        .from("sales")
        .insert(payload);

      if (insertError) throw insertError;

      setSuccess("Sale recorded successfully.");
      setSaleForm(emptySaleForm());

      await loadData();
    } catch (saveError) {
      console.error("Failed to save sale:", saveError);
      setError(
        saveError instanceof Error &&
          saveError.message.includes("available harvest")
          ? saveError.message
          : "We couldn't save the sale. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditingHarvest(harvest: HarvestRecord) {
    setEditingHarvestId(harvest.id);

    setHarvestForm({
      crop_id: harvest.crop_id,
      harvest_date: harvest.harvest_date,
      quantity: String(harvest.quantity),
      unit: harvest.unit,
      notes: harvest.notes ?? "",
    
    });

    setError("");
    setSuccess("");

    window.scrollTo({ top: 0, behavior: "smooth"});
  }

  async function deleteHarvest(harvest: HarvestRecord) {
    const confirmed = window.confirm(
      `Delete this harvest of ${harvest.quantity} ${harvest.unit}? This cannot be undone.`,
    );

    if(!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const { data: authData, error: authError} =
      await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user) throw new Error("Please sign in again");

      const { error: deleteError } = await supabase
      .from("harvests")
      .delete()
      .eq("id", harvest.id)
      .eq("user_id", authData.user.id);


      if (deleteError) throw deleteError;

      if (editingHarvestId === harvest.id) {
        cancelHarvestEditing();

      }

      setSuccess("Harvest deleted successfully");
      await loadData();

    } catch (deleteError) {
      console.error("failed to delete harvest: ", deleteError );

      setError(
        "We couldn't delete this harvest. It may have existing sales linked to it.",
      );
    }
  }
  
  async function deleteSale(sale:SaleRecord) {
    const confirmed = window.confirm(
      "Delete this sale transaction? The quantity will be added back to the remaining harvest",

    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try{
      const { data: authData, error: authError} =
      await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authData.user) throw new Error("please Sign in ");

      const { error: deleteError } =await supabase
      .from("sales")
      .delete()
      .eq("id", sale.id)
      .eq("user_id", authData.user.id);

      if (deleteError) throw deleteError;

      setSuccess("sale transaction deleted successfully");
      await loadData();

    } catch (deleteError) {
      console.error("failed to delete sale", deleteError);
      setError("We couldn't delete this sale transaction.");
      
    }
    
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav className="header-nav">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/dashboard/crops">Crops</Link>
            <Link href="/dashboard/expenses">Expenses</Link>
            <Link href="/dashboard/harvests" className="active">
              Harvests
            </Link>
            <Link href="/dashboard/notebook">Notebook</Link>
            <Link href="/dashboard/settings">Settings</Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="dashboard-main page-width">
        <div className="page-heading">
          <div>
            <p className="eyebrow">FARM MANAGEMENT</p>
            <h1>Harvest &amp; Revenue Manager</h1>
            <p className="page-description">
              Track your harvests, record sales, and keep an eye on your farm&apos;s
              earnings.
            </p>
          </div>
        </div>

        {error && <div className="message message-error">{error}</div>}
        {success && <div className="message message-success">{success}</div>}

        {loading ? (
          <div className="empty-state">Loading your harvest records...</div>
        ) : loadFailed ? (
          <div className="empty-state">
            We couldn&apos;t load your harvest records. Please refresh the page.
          </div>
        ) : (
          <div>
            <section className="dashboard-stats">
              <article className="stat-card">
                <span className="stat-label">Total Harvest</span>
                <strong className="stat-value">{harvests.length}</strong>
                <span className="stat-discription">
                  Recorded Harvest Events
                </span>
              </article>

              <article className="stat-card">
                <span className="stat-label">Sales Transaction</span>
                <strong className="stat-value">{sales.length}</strong>
                <span className="stat-description">
                  Individual Sales Recorded
                </span>
              </article>

              <article className="stat-card">
                <span className="stat-label">Total Revenue</span>
                <strong className="stat-value">
                  {formatMoney(totalRevenue)}
                </strong>
                <span className="stat-description">
                  Revenue from all recorded sales
                </span>
              </article>

              <article className="stat-card">
                <span className="stat-label">This Month</span>
                <strong className="stat-value">
                  {formatMoney(monthlyRevenue)}
                </strong>
                <span className="stat-description">
                  Revenue Earned this Month
                </span>
              </article>
            </section>

            <section className="dashboard-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Harvest Record</p>
                  <h2>
                    {editingHarvestId ? "Edit Harvest" :  "Record a Harvest"}

                  </h2>
                  <p className="page-description">
                    Add details about the crops you have harvested
                  </p>
                </div>
              </div>

              <form className="auth-form" onSubmit={handleHarvestSubmit}>
                <div className="form-grid">
                  <label className="field">
                    <span>Crop</span>
                    <select 
                    value={harvestForm.crop_id}
                    onChange={(event) => 
                      updateHarvestField("crop_id", event.target.value)
                    }
                    required
                    >
                      <option value="">Select a Crop</option>
                      {crops.map((crop) => (
                        <option key={crop.id} value={crop.id} >
                          {crop.name}
                          {crop.variety ? ` - ${crop.variety}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Harvest Date</span>
                    <input type="date" value={harvestForm.harvest_date}
                    onChange={(event) => updateHarvestField("harvest_date", event.target.value)
                      
                    }
                    required
                    />
                  </label>

                    <label className="field">
                      <span>Quantity</span>
                      <input type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="eg. 100"
                      value={harvestForm.quantity}
                      onChange={(event) =>
                        updateHarvestField("quantity", event.target.value)
                      }
                      required
                      />
                    </label>

                    <label className="field">
                    <span>Unit</span>
                    <select
                      value={harvestForm.unit}
                      onChange={(event) =>
                        updateHarvestField(
                          "unit",
                          event.target.value as HarvestUnit,
                        )
                      }
                    >
                      {units.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit.charAt(0).toUpperCase() + unit.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Notes (Optional)</span>
                    <textarea
                      rows={3}
                      placeholder="Harvest quality, field details, etc."
                      value={harvestForm.notes}
                      onChange={(event) =>
                        updateHarvestField("notes", event.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={saving || crops.length === 0}
                  >
                    {saving
                      ? "Saving..."
                      : editingHarvestId
                        ? "Update Harvest"
                        : "Save Harvest"}
                  </button>

                  {editingHarvestId && (
                    <button
                      type="button"
                      className="button"
                      onClick={cancelHarvestEditing}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {crops.length === 0 && (
                  <p className="empty-state">
                    You need to add a crop before recording a harvest.{" "}
                    <Link href="/dashboard/crops">Add a crop</Link>
                  </p>
                )}
                  
              </form>
            </section>

                            <section className="dashboard-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">SALES RECORD</p>
                  <h2>Record a Sale</h2>
                  <p className="page-description">
                    Record how much you sold, the price, and who bought it.
                  </p>
                </div>
              </div>

              <form className="auth-form" onSubmit={handleSaleSubmit}>
                <div className="form-grid">
                  <label className="field">
                    <span>Harvest</span>
                    <select
                      value={saleForm.harvest_id}
                      onChange={(event) =>
                        updateSaleField("harvest_id", event.target.value)
                      }
                      required
                    >
                      <option value="">Select a harvest</option>
                      {harvests
                        .filter(
                          (harvest) =>
                            getHarvestTotals(harvest).remainingQuantity > 0,
                        )
                        .map((harvest) => {
                          const crop = crops.find(
                            (item) => item.id === harvest.crop_id,
                          );
                          const remaining =
                            getHarvestTotals(harvest).remainingQuantity;

                          return (
                            <option key={harvest.id} value={harvest.id}>
                              {crop?.name ?? "Unknown crop"} — {remaining}{" "}
                              {harvest.unit} remaining (
                              {formatDate(harvest.harvest_date)})
                            </option>
                          );
                        })}
                    </select>
                  </label>

                  <label className="field">
                    <span>Sale Date</span>
                    <input
                      type="date"
                      value={saleForm.sale_date}
                      onChange={(event) =>
                        updateSaleField("sale_date", event.target.value)
                      }
                      required
                    />
                  </label>

                  <label className="field">
                    <span>Quantity Sold</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="e.g. 30"
                      value={saleForm.quantity}
                      onChange={(event) =>
                        updateSaleField("quantity", event.target.value)
                      }
                      required
                    />
                  </label>

                  <label className="field">
                    <span>Price per Unit (Rs.)</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="e.g. 80"
                      value={saleForm.unit_price}
                      onChange={(event) =>
                        updateSaleField("unit_price", event.target.value)
                      }
                      required
                    />
                  </label>

                  <label className="field">
                    <span>Buyer (Optional)</span>
                    <input
                      type="text"
                      placeholder="e.g. Local market"
                      value={saleForm.buyer}
                      onChange={(event) =>
                        updateSaleField("buyer", event.target.value)
                      }
                    />
                  </label>

                  <label className="field">
                    <span>Notes (Optional)</span>
                    <textarea
                      rows={3}
                      placeholder="Payment details, quality, etc."
                      value={saleForm.notes}
                      onChange={(event) =>
                        updateSaleField("notes", event.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={saving || harvests.length === 0}
                  >
                    {saving ? "Saving..." : "Save Sale"}
                  </button>
                </div>

                {harvests.length === 0 && (
                  <p className="empty-state">
                    Record a harvest before adding a sale.
                  </p>
                )}
              </form>
            </section>

            <section className="dashboard-card">
              <div className="sectio-heading">
                <div>
                  <p className="eyebrow"> Your Farm Records</p>
                  <h2> Harvest History</h2>
                  <p className="page-description">
                    View and Manage all your recorded harvest
                  </p>
                </div>

                <span className="tag">{harvests.length} records</span>

              </div>

              <div className="field">
                <label htmlFor="harvest-search">Search Harvest</label>
                <input id="harvest-search" type="search" placeholder="Search by crop variety or notes"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                />
                {filteredHarvests.length === 0 ? (
                <div className="empty-state">
                  {harvests.length === 0
                    ? "No harvests recorded yet. Add your first harvest above."
                    : "No harvests match your search."}
                </div>
              ) : (
                <div className="task-list">
                  {filteredHarvests.map((harvest) => {
                    const crop = crops.find(
                      (item) => item.id === harvest.crop_id,
                    );
                    const totals = getHarvestTotals(harvest);

                    return (
                      <article className="task-item" key={harvest.id}>
                        <div className="task-content">
                          <div className="task-heading">
                            <h3>{crop?.name ?? "Unknown crop"}</h3>
                            <span className="tag">
                              {formatDate(harvest.harvest_date)}
                            </span>
                          </div>

                          {crop?.variety && (
                            <p className="stat-description">
                              Variety: {crop.variety}
                            </p>
                          )}

                          <div className="dashboard-stats">
                            <div className="stat-card">
                              <span className="stat-label">Harvested</span>
                              <strong className="stat-value">
                                {Number(harvest.quantity).toLocaleString(
                                  "en-NP",
                                )}{" "}
                                {harvest.unit}
                              </strong>
                            </div>

                            <div className="stat-card">
                              <span className="stat-label">Sold</span>
                              <strong className="stat-value">
                                {totals.soldQuantity.toLocaleString("en-NP")}{" "}
                                {harvest.unit}
                              </strong>
                            </div>

                            <div className="stat-card">
                              <span className="stat-label">Remaining</span>
                              <strong className="stat-value">
                                {totals.remainingQuantity.toLocaleString(
                                  "en-NP",
                                )}{" "}
                                {harvest.unit}
                              </strong>
                            </div>

                            <div className="stat-card">
                              <span className="stat-label">Revenue</span>
                              <strong className="stat-value">
                                {formatMoney(totals.revenue)}
                              </strong>
                            </div>
                          </div>

                          <p className="stat-description">
                            {totals.salesCount} sale transaction
                            {totals.salesCount === 1 ? "" : "s"}
                          </p>

                          {harvest.notes && (
                            <p className="page-description">
                              {harvest.notes}
                            </p>
                          )}

                          <div className="form-actions">
                            <button
                              type="button"
                              className="button button-primary"
                              onClick={() => {
                                setSaleForm((current) => ({
                                  ...current,
                                  harvest_id: harvest.id,
                                }));
                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });
                              }}
                              disabled={totals.remainingQuantity <= 0}
                            >
                              Record Sale
                            </button>

                            <button
                              type="button"
                              className="button"
                              onClick={() => startEditingHarvest(harvest)}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="button"
                              onClick={() => deleteHarvest(harvest)}
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
              </div>
            </section>

            <section className="dashboard-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Revenue Records</p>
                  <h2>Sales History</h2>
                  <p className="page-description">
                    Review every sale and the money earned
                  </p>
                </div>
                <span className="tag">{sales.length} transactions</span>
              </div>

              {sales.length === 0 ? (
                <div className="empty-state">
                  No sales recorded yet. Record your First sale above
                </div>
              ) : (
                <div  className="task-list">
                  {sales.map((sale) => {
                    const harvest = harvests.find(
                      (item) => item.id === sale.harvest_id,
                    );
                  const crop = crops.find(
                      (item) => item.id === harvest?.crop_id,
                    );

                    const saleRevenue =
                      Number(sale.quantity) * Number(sale.unit_price);

                    return (
                      <article className="task-item" key={sale.id}>
                        <div className="task-content">
                          <div className="task-heading">
                            <h3>{crop?.name ?? "Unknown crop"}</h3>
                            <span className="tag">
                              {formatDate(sale.sale_date)}
                            </span>
                          </div>

                          <p className="stat-description">
                            Harvest date:{" "}
                            {harvest
                              ? formatDate(harvest.harvest_date)
                              : "Unknown"}
                          </p>

                          <div className="dashboard-stats">
                            <div className="stat-card">
                              <span className="stat-label">Quantity Sold</span>
                              <strong className="stat-value">
                                {Number(sale.quantity).toLocaleString(
                                  "en-NP",
                                )}{" "}
                                {harvest?.unit ?? ""}
                              </strong>
                            </div>

                            <div className="stat-card">
                              <span className="stat-label">Price Per Unit</span>
                              <strong className="stat-value">
                                {formatMoney(Number(sale.unit_price))}
                              </strong>
                            </div>

                            <div className="stat-card">
                              <span className="stat-label">Total Revenue</span>
                              <strong className="stat-value">
                                {formatMoney(saleRevenue)}
                              </strong>
                            </div>
                          </div>

                          <p className="stat-description">
                            Buyer: {sale.buyer?.trim() || "Not specified"}
                          </p>

                          {sale.notes && (
                            <p className="page-description">{sale.notes}</p>
                          )}

                          <div className="form-actions">
                            <button
                              type="button"
                              className="button"
                              onClick={() => deleteSale(sale)}
                            >
                              Delete Sale
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

          </div>
        )}
      </main>
    </div>
  );
}
