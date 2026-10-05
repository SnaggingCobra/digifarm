import { landUnits, metadataText } from "@/utils/supabase/farm";

export function FarmerFields({ metadata = {}, optional = false }: { metadata?: Record<string, unknown>; optional?: boolean }) {
  const farmFields = <>
    <div className="field"><label htmlFor="farm_name">Farm name</label><input id="farm_name" name="farm_name" autoComplete="organization" maxLength={100} defaultValue={metadataText(metadata.farm_name)} /></div>
    <div className="field"><label htmlFor="farm_location">Farm location</label><input id="farm_location" name="farm_location" maxLength={160} defaultValue={metadataText(metadata.farm_location)} /></div>
    <div className="form-grid">
      <div className="field"><label htmlFor="farm_size">Farm size</label><input id="farm_size" name="farm_size" type="number" min="0" step="any" defaultValue={typeof metadata.farm_size === "number" && Number.isFinite(metadata.farm_size) ? metadata.farm_size : ""} /></div>
      <div className="field"><label htmlFor="land_unit">Land unit</label><select id="land_unit" name="land_unit" defaultValue={landUnits.some((unit) => unit === metadata.land_unit) ? String(metadata.land_unit) : "ropani"}>{landUnits.map((unit) => <option key={unit} value={unit}>{unit[0].toUpperCase() + unit.slice(1)}</option>)}</select></div>
    </div>
  </>;
  return <>
    <div className="field"><label htmlFor="full_name">Full name</label><input id="full_name" name="full_name" autoComplete="name" maxLength={100} required defaultValue={metadataText(metadata.full_name)} /></div>
    <div className="field"><label htmlFor="phone">Phone <span className="muted">(optional)</span></label><input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={40} defaultValue={metadataText(metadata.phone)} /></div>
    {optional ? <details className="optional-fields"><summary>Farm details <span className="muted">(optional)</span></summary><div className="auth-form mt-4">{farmFields}</div></details> : farmFields}
  </>;
}