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
  return (
    <nav
      aria-label="Workspace administration sections"
      className="studio-settings-section-nav"
    >
      {items.map((item) => (
        <a
          className={`studio-settings-section-nav__link studio-settings-section-nav__link--${
            item.tone ?? "default"
          }`}
          href={item.href}
          key={item.href}
        >
          <span className="studio-settings-section-nav__label">
            {item.label}
          </span>
          <span className="studio-settings-section-nav__meta">{item.meta}</span>
        </a>
      ))}
    </nav>
  );
}
