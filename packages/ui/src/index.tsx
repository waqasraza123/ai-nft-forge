import type { PropsWithChildren, ReactNode } from "react";

type PageTone = "default" | "studio" | "ops";

type PageShellProps = PropsWithChildren<{
  actions?: ReactNode;
  eyebrow: string;
  lead: string;
  title: string;
  tone?: PageTone;
}>;

type SurfaceCardProps = PropsWithChildren<{
  body: string;
  eyebrow: string;
  footer?: ReactNode;
  span?: 4 | 6 | 8 | 12;
  title: string;
}>;

type MetricTileProps = {
  label: string;
  value: string;
};

type PillProps = PropsWithChildren;

export function PageShell({
  actions,
  children,
  eyebrow,
  lead,
  title,
  tone = "default"
}: PageShellProps) {
  return (
    <section className={`page-shell page-shell--${tone}`}>
      <div className="page-shell__hero">
        <span className="page-shell__eyebrow">{eyebrow}</span>
        <h1 className="page-shell__title">{title}</h1>
        <p className="page-shell__lead">{lead}</p>
        {actions ? <div className="page-shell__actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function SurfaceGrid({ children }: PropsWithChildren) {
  return <div className="surface-grid">{children}</div>;
}

export function SurfaceCard({
  body,
  children,
  eyebrow,
  footer,
  span = 4,
  title
}: SurfaceCardProps) {
  return (
    <article className={`surface-card surface-card--span-${span}`}>
      <span className="surface-card__eyebrow">{eyebrow}</span>
      <h2 className="surface-card__title">{title}</h2>
      <p className="surface-card__body">{body}</p>
      {children}
      {footer ? <div className="surface-card__footer">{footer}</div> : null}
    </article>
  );
}

export function Pill({ children }: PillProps) {
  return <span className="pill">{children}</span>;
}

export function MetricTile({ label, value }: MetricTileProps) {
  return (
    <div className="metric-tile">
      <span className="metric-tile__label">{label}</span>
      <span className="metric-tile__value">{value}</span>
    </div>
  );
}
