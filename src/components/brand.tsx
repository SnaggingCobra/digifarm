import Link from "next/link";

export function Brand({ light = false, compact = false }: { light?: boolean; compact?: boolean } = {}) {
  const markClasses = light
    ? "bg-[#f7f5eb] text-[#1f382b]"
    : "bg-[#254e3c] text-[#f7f5eb]";

  return (
    <Link href="/" className="inline-flex items-center gap-3 text-left no-underline" aria-label="DigiFarm home">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-black shadow-sm ${markClasses} ${light ? "border-[#f7f5eb]/40" : "border-[#254e3c]/10"}`}
      >
        DF
      </span>
      {!compact && (
        <span className="flex flex-col leading-tight">
          <span className={`text-lg font-black tracking-tight ${light ? "text-[#f7f5eb]" : "text-[#1d352d]"}`}>
            DigiFarm
          </span>
          <span className={`text-[11px] uppercase tracking-[0.18em] ${light ? "text-[#ecf4dc]" : "text-[#586a5f]"}`}>
            Grow with certainty
          </span>
        </span>
      )}
    </Link>
  );
}
