"use client";

type StudioSettingsSectionNavItemTone =
  | "critical"
  | "default"
  | "success"
  | "warning";

export type StudioSettingsSectionNavItem = {
  href: string;
  label: string;
  meta: string;
  tone?: StudioSettingsSectionNavItemTone;
};

type StudioSettingsSectionNavProps = {
  items: StudioSettingsSectionNavItem[];
};

export function StudioSettingsSectionNav({
  items
}: StudioSettingsSectionNavProps) {
  const toneMap: Record<
    StudioSettingsSectionNavItemTone,
    string
  > = {
    critical:
      "border-red-400/55 bg-red-500/10 text-red-100 hover:bg-red-500/25 hover:text-white",
    default:
      "border-[color:var(--color-line)] bg-[color:var(--color-surface)] text-[color:var(--color-text)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]",
    success:
      "border-emerald-300/40 bg-emerald-500/8 text-emerald-50 hover:bg-emerald-500/20",
    warning:
      "border-amber-300/40 bg-amber-500/12 text-amber-50 hover:bg-amber-500/22"
  };

  return (
    <nav
      aria-label="Workspace administration sections"
      className="space-y-2"
    >
      {items.map((item) => (
        <a
          className={`block rounded-xl border px-4 py-3 text-sm font-semibold transition ${toneMap[item.tone ?? "default"]}`}
          href={item.href}
          key={item.href}
        >
          <span className="font-semibold">{item.label}</span>
          <span className="mt-1 block text-xs font-normal text-white/80">
            {item.meta}
          </span>
        </a>
      ))}
    </nav>
  );
}
