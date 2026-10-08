"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/utils/supabase/client";
import { landUnits } from "@/utils/supabase/farm";

type ProfileForm = {
  full_name: string;
  farm_name: string;
  farm_location: string;
  farm_size: string;
  land_unit: string;
};

const defaultForm: ProfileForm = {
  full_name: "",
  farm_name: "",
  farm_location: "",
  farm_size: "",
  land_unit: "ropani",
};

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [form, setForm] = useState<ProfileForm>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) {
        setError("Your session is no longer active. Please sign in again.");
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, farm_name, farm_location, farm_size, land_unit")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;

      setForm({
        full_name: data?.full_name ?? authData.user?.user_metadata?.full_name ?? "",
        farm_name: data?.farm_name ?? "",
        farm_location: data?.farm_location ?? "",
        farm_size: data?.farm_size != null ? String(data.farm_size) : "",
        land_unit: landUnits.includes((data?.land_unit ?? "ropani") as typeof landUnits[number]) ? String(data?.land_unit ?? "ropani") : "ropani",
      });
    } catch (loadError) {
      console.error("Failed to load profile", loadError);
      setError("We couldn't load your farm details right now.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const handle = setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => clearTimeout(handle);
  }, [loadProfile]);

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSaving(true);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error("Your session has expired. Please sign in again.");

      const nextForm = { ...form, full_name: form.full_name.trim(), farm_name: form.farm_name.trim(), farm_location: form.farm_location.trim() };
      if (!nextForm.full_name) throw new Error("Full name is required.");
      if (nextForm.full_name.length > 100) throw new Error("Full name must be 100 characters or fewer.");
      if (nextForm.farm_name.length > 100) throw new Error("Farm name must be 100 characters or fewer.");
      if (nextForm.farm_location.length > 160) throw new Error("Farm location must be 160 characters or fewer.");

      if (nextForm.farm_size && Number.isNaN(Number(nextForm.farm_size))) {
        throw new Error("Farm size must be a number.");
      }

      const payload = {
        id: userId,
        full_name: nextForm.full_name,
        farm_name: nextForm.farm_name || null,
        farm_location: nextForm.farm_location || null,
        farm_size: nextForm.farm_size ? Number(nextForm.farm_size) : null,
        land_unit: nextForm.land_unit || "ropani",
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
      if (profileError) throw profileError;
      setSuccess("Your farm details saved successfully.");
    } catch (submitError) {
      console.error("Failed to save profile", submitError);
      setError(submitError instanceof Error ? submitError.message : "We couldn't save your details. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav aria-label="Farm settings navigation" className="flex flex-wrap items-center gap-4">
            <Link href="/dashboard" className="text-link text-sm">Dashboard</Link>
            <Link href="/dashboard/crops" className="text-link text-sm">Crops</Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="page-width dashboard-main">
        <Link href="/dashboard" className="text-link text-sm">← Back to dashboard</Link>
        <div className="dashboard-header" style={{ marginTop: 18 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 8 }}>Farm information</p>
            <h1 style={{ fontSize: "clamp(2.2rem, 4vw, 3rem)", color: "var(--farm-green-deep)" }}>Settings</h1>
          </div>
        </div>

        {error && <p className="form-message error" role="alert" style={{ marginTop: 8 }}>{error}</p>}
        {success && <p className="form-message success" role="status" style={{ marginTop: 8 }}>{success}</p>}

        <section className="dashboard-card" style={{ marginTop: 20, maxWidth: 760 }}>
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="full_name">Full name</label>
              <input id="full_name" value={form.full_name} onChange={(event) => updateField("full_name", event.target.value)} maxLength={100} required />
            </div>

            <div className="field">
              <label htmlFor="farm_name">Farm name</label>
              <input id="farm_name" value={form.farm_name} onChange={(event) => updateField("farm_name", event.target.value)} maxLength={100} />
            </div>

            <div className="field">
              <label htmlFor="farm_location">Farm location</label>
              <input id="farm_location" value={form.farm_location} onChange={(event) => updateField("farm_location", event.target.value)} maxLength={160} />
            </div>

            <div className="form-grid">
              <div className="field">
                <label htmlFor="farm_size">Farm size</label>
                <input id="farm_size" type="number" min="0" step="any" value={form.farm_size} onChange={(event) => updateField("farm_size", event.target.value)} />
              </div>

              <div className="field">
                <label htmlFor="land_unit">Land unit</label>
                <select id="land_unit" value={form.land_unit} onChange={(event) => updateField("land_unit", event.target.value)}>
                  {landUnits.map((unit) => (
                    <option key={unit} value={unit}>{unit[0].toUpperCase() + unit.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="button button-primary" disabled={saving || loading}>
              {saving ? "Saving changes..." : "Save changes"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
