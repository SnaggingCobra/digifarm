export const landUnits = ["ropani", "aana", "bigha", "kattha", "dhur", "hectare", "acre"] as const;

export function metadataText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function farmerDetails(form: FormData) {
  const text = (name: string) => String(form.get(name) ?? "").trim();
  const fullName = text("full_name");
  const size = text("farm_size");
  const unit = text("land_unit");
  if (!fullName || fullName.length > 100) throw new Error("Enter your name using 1 to 100 characters.");
  if (size && (!Number.isFinite(Number(size)) || Number(size) < 0)) throw new Error("Enter a valid, non-negative farm size.");
  if (!landUnits.some((value) => value === unit)) throw new Error("Choose a valid land unit.");
  if (text("phone").length > 40 || text("farm_name").length > 100 || text("farm_location").length > 160) throw new Error("Please shorten your farm details to fit the field limits.");
  return { full_name: fullName, phone: text("phone"), farm_name: text("farm_name"), farm_location: text("farm_location"), farm_size: size ? Number(size) : null, land_unit: unit };
}

export type NotebookTask = { id: string; title: string; done: boolean };
export const taskLimit = 12;

export function readTasks(value: unknown): NotebookTask[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value.filter((task): task is NotebookTask => {
    if (!task || typeof task !== "object" || typeof task.id !== "string" || typeof task.title !== "string" || typeof task.done !== "boolean" || task.id.length > 80 || !task.title.trim() || task.title.length > 120 || ids.has(task.id)) return false;
    ids.add(task.id);
    return true;
  }).slice(0, taskLimit).map(({ id, title, done }) => ({ id, title, done }));
}