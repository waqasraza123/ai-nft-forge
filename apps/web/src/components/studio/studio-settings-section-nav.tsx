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
  const toneMap: Record<StudioSettingsSectionNavItemTone, string> = {
    critical:
      "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800",
    default:
      "border-[color:var(--color-line)] bg-[color:var(--color-surface)] text-[color:var(--color-text)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    warning: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
  };

  return (
    <nav aria-label="Workspace administration sections" className="space-y-2">
      {items.map((item) => (
        <a
          className={`block rounded-xl border px-4 py-3 text-sm font-semibold transition ${toneMap[item.tone ?? "default"]}`}
          href={item.href}
          key={item.href}
        >
          <span className="font-semibold">{item.label}</span>
          <span className="mt-1 block text-xs font-normal text-current/75">
            {item.meta}
          </span>
        </a>
      ))}
    </nav>
  );
}
