"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/utils/supabase/client";

type CropRecord = {
  id: string;
  user_id: string;
  name: string;
  variety: string | null;
  status: string;
  planting_date: string | null;
  expected_harvest_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const baseForm = {
  name: "",
  variety: "",
  status: "planned",
  planting_date: "",
  expected_harvest_date: "",
  notes: "",
};

export default function CropsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [crops, setCrops] = useState<CropRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(baseForm);

  const loadCrops = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data, error: cropsError } = await supabase
        .from("crops")
        .select("id, user_id, name, variety, status, planting_date, expected_harvest_date, notes, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (cropsError) throw cropsError;
      setCrops(data ?? []);
    } catch (loadError) {
      console.error("Failed to load crops", loadError);
      setError("We couldn't load your crops. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void loadCrops();
    }, 0);

    return () => clearTimeout(handle);
  }, [loadCrops]);

  function resetForm() {
    setForm(baseForm);
    setEditingId(null);
  }

  function updateField(field: keyof typeof baseForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validateForm() {
    if (!form.name.trim()) {
      throw new Error("Crop name is required.");
    }
    if (form.name.trim().length > 100) {
      throw new Error("Crop name must be 100 characters or fewer.");
    }
    if (form.variety.trim().length > 80) {
      throw new Error("Variety must be 80 characters or fewer.");
    }
    if (form.notes.trim().length > 500) {
      throw new Error("Notes must be 500 characters or fewer.");
    }

    const dateFields = [form.planting_date, form.expected_harvest_date].filter(Boolean);
    for (const value of dateFields) {
      if (value && Number.isNaN(Date.parse(value))) {
        throw new Error("Please use valid dates in YYYY-MM-DD format.");
      }
    }

    if (form.planting_date && form.expected_harvest_date) {
      const plantingDate = new Date(form.planting_date);
      const harvestDate = new Date(form.expected_harvest_date);
      if (harvestDate < plantingDate) {
        throw new Error("Expected harvest date cannot be before the planting date.");
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      validateForm();
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        variety: form.variety.trim() || null,
        status: form.status,
        planting_date: form.planting_date || null,
        expected_harvest_date: form.expected_harvest_date || null,
        notes: form.notes.trim() || null,
      };

      if (editingId) {
        const { error: updateError } = await supabase.from("crops").update(payload).eq("id", editingId);
        if (updateError) throw updateError;
        setSuccess("Crop updated successfully.");
      } else {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authData.user) throw new Error("Your session has expired. Please sign in again.");

        const { error: insertError } = await supabase.from("crops").insert({
          ...payload,
          user_id: authData.user.id,
        });
        if (insertError) throw insertError;
        setSuccess("Crop added successfully.");
      }

      resetForm();
      await loadCrops();
    } catch (submitError) {
      console.error("Failed to save crop", submitError);
      setError(submitError instanceof Error ? submitError.message : "We couldn't save your crop. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(crop: CropRecord) {
    const confirmed = window.confirm(`Delete ${crop.name}? This action cannot be undone.`);
    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const { error: deleteError } = await supabase.from("crops").delete().eq("id", crop.id);
      if (deleteError) throw deleteError;
      setSuccess("Crop deleted.");
      if (editingId === crop.id) resetForm();
      await loadCrops();
    } catch (deleteError) {
      console.error("Failed to delete crop", deleteError);
      setError("We couldn't delete that crop. Please try again.");
    }
  }

  function startEdit(crop: CropRecord) {
    setEditingId(crop.id);
    setForm({
      name: crop.name,
      variety: crop.variety ?? "",
      status: crop.status,
      planting_date: crop.planting_date ?? "",
      expected_harvest_date: crop.expected_harvest_date ?? "",
      notes: crop.notes ?? "",
    });
    setError("");
    setSuccess("");
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav aria-label="Farm navigation" className="flex flex-wrap items-center gap-4">
            <Link href="/dashboard" className="text-link text-sm">Dashboard</Link>
            <Link href="/dashboard/settings" className="text-link text-sm">Settings</Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="page-width dashboard-main">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <Link href="/dashboard" className="text-link text-sm">← Back to dashboard</Link>
            <p className="eyebrow" style={{ marginTop: 10 }}>Farm management</p>
            <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)", color: "var(--farm-green-deep)" }}>My Crops</h1>
          </div>
          <button type="button" className="button button-primary" onClick={() => { resetForm(); document.getElementById("crop-form")?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
            + Add Crop
          </button>
        </div>

        {error && <p className="form-message error" role="alert" style={{ marginTop: 16 }}>{error}</p>}
        {success && <p className="form-message success" role="status" style={{ marginTop: 16 }}>{success}</p>}

        <div className="dashboard-grid" style={{ marginTop: 22, gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)" }}>
          <section className="dashboard-card" id="crop-form">
            <h2 style={{ fontSize: "1.6rem", color: "var(--farm-green-deep)" }}>{editingId ? "Edit crop" : "Add a crop"}</h2>

            <form className="auth-form" onSubmit={handleSubmit} style={{ marginTop: 20 }}>
              <div className="field">
                <label htmlFor="crop-name">Crop name</label>
                <input id="crop-name" value={form.name} onChange={(event) => updateField("name", event.target.value)} required maxLength={100} />
              </div>

              <div className="field">
                <label htmlFor="crop-variety">Variety</label>
                <input id="crop-variety" value={form.variety} onChange={(event) => updateField("variety", event.target.value)} maxLength={80} />
              </div>

              <div className="field">
                <label htmlFor="crop-status">Status</label>
                <select id="crop-status" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
                  <option value="planned">Planned</option>
                  <option value="growing">Growing</option>
                  <option value="ready">Ready</option>
                  <option value="harvested">Harvested</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="planting-date">Planting date</label>
                  <input id="planting-date" type="date" value={form.planting_date} onChange={(event) => updateField("planting_date", event.target.value)} />
                </div>

                <div className="field">
                  <label htmlFor="harvest-date">Expected harvest</label>
                  <input id="harvest-date" type="date" value={form.expected_harvest_date} onChange={(event) => updateField("expected_harvest_date", event.target.value)} />
                </div>
              </div>

              <div className="field">
                <label htmlFor="crop-notes">Notes</label>
                <textarea id="crop-notes" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} rows={4} maxLength={500} style={{ width: "100%", borderRadius: 14, border: "1px solid rgba(31,56,43,0.18)", padding: "12px 14px", resize: "vertical" }} />
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button type="submit" className="button button-primary" disabled={saving}>
                  {saving ? (editingId ? "Saving crop..." : "Adding crop...") : editingId ? "Save changes" : "Add crop"}
                </button>
                {(editingId || form.name || form.variety || form.notes || form.planting_date || form.expected_harvest_date) && (
                  <button type="button" className="button button-secondary" onClick={resetForm} disabled={saving}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="dashboard-card">
            <h2 style={{ fontSize: "1.6rem", color: "var(--farm-green-deep)" }}>Crop list</h2>

            {loading ? (
              <p className="form-message success" style={{ marginTop: 18 }}>Loading your crop records...</p>
            ) : crops.length === 0 ? (
              <div className="empty-state" style={{ marginTop: 18 }}>
                <p style={{ fontSize: "2.2rem" }}>🌱</p>
                <h3>No crops yet</h3>
                <p style={{ color: "rgba(28, 42, 35, 0.7)" }}>Add your first crop to start tracking the season.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
                {crops.map((crop) => (
                  <article key={crop.id} className="task-item" style={{ alignItems: "flex-start", padding: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <strong>{crop.name}</strong>
                        <span className="tag" style={{ textTransform: "capitalize" }}>{crop.status}</span>
                      </div>

                      {crop.variety ? <p style={{ color: "rgba(28, 42, 35, 0.72)", marginTop: 4 }}>{crop.variety}</p> : null}

                      <div style={{ display: "grid", gap: 4, marginTop: 8, color: "rgba(28, 42, 35, 0.7)", fontSize: "0.92rem" }}>
                        {crop.planting_date ? <span>Planted: {crop.planting_date}</span> : null}
                        {crop.expected_harvest_date ? <span>Expected harvest: {crop.expected_harvest_date}</span> : null}
                        {crop.notes ? <span>Notes: {crop.notes}</span> : null}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginLeft: 12 }}>
                      <button type="button" className="button button-secondary button-small" onClick={() => startEdit(crop)}>
                        Edit
                      </button>
                      <button type="button" className="button button-small" style={{ background: "rgba(182,70,46,0.08)", color: "var(--farm-error)" }} onClick={() => void handleDelete(crop)}>
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
