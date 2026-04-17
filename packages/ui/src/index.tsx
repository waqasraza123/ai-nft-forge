import type {
  AnchorHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  PropsWithChildren,
  ReactElement,
  ReactNode
} from "react";
import { forwardRef } from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./lib/cn";

type PageTone = "default" | "studio" | "ops";

const pageShellVariants = cva("space-y-6", {
  variants: {
    tone: {
      default:
        "border border-[color:var(--color-line)] bg-[color:var(--color-surface)] text-[color:var(--color-text)] shadow-[var(--shadow-surface)]",
      ops: "border border-[color:var(--color-line)] bg-[color:var(--color-surface)] text-[color:var(--color-text)] shadow-[var(--shadow-surface)]",
      studio:
        "border border-[color:var(--color-line)] bg-[color:var(--color-surface)] text-[color:var(--color-text)] shadow-[var(--shadow-surface)]"
    }
  },
  defaultVariants: {
    tone: "default"
  }
});

type PageShellProps = PropsWithChildren<
  VariantProps<typeof pageShellVariants> & {
    actions?: ReactNode;
    eyebrow: string;
    lead: string;
    title: string;
  }
>;

const surfaceGridVariants = cva("grid gap-4 md:gap-5 lg:gap-6", {
  variants: {
    density: {
      dense: "grid-cols-1 md:grid-cols-6",
      normal: "grid-cols-1 md:grid-cols-6 xl:grid-cols-12"
    }
  },
  defaultVariants: {
    density: "normal"
  }
});

type SurfaceGridProps = PropsWithChildren<
  VariantProps<typeof surfaceGridVariants>
>;

const surfaceCardVariants = cva(
  "rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-surface)] backdrop-blur-sm",
  {
    variants: {
      span: {
        4: "md:col-span-4 xl:col-span-4",
        6: "md:col-span-6 xl:col-span-6",
        8: "md:col-span-6 xl:col-span-8",
        12: "md:col-span-6 xl:col-span-12"
      },
      density: {
        compact: "gap-2 px-4 py-3",
        normal: "gap-3 p-4 md:p-5"
      }
    },
    compoundVariants: [
      {
        span: 4,
        density: "compact",
        className: "xl:col-span-4"
      }
    ],
    defaultVariants: {
      span: 6,
      density: "normal"
    }
  }
);

type SurfaceCardProps = PropsWithChildren<
  {
    body: string;
    eyebrow: string;
    footer?: ReactNode;
    span?: 4 | 6 | 8 | 12;
    title: string;
  } & VariantProps<typeof surfaceCardVariants>
>;

const pillVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
  {
    variants: {
      tone: {
        accent:
          "border-transparent bg-[color:var(--color-accent)] text-[color:var(--color-surface-strong)]",
        danger: "border-transparent bg-red-500/85 text-white",
        neutral:
          "border-[color:var(--color-line)] bg-[color:var(--color-surface)] text-[color:var(--color-muted)]",
        success: "border-transparent bg-emerald-500/85 text-white",
        warning: "border-transparent bg-amber-500/85 text-black"
      }
    },
    defaultVariants: {
      tone: "neutral"
    }
  }
);

type PillProps = PropsWithChildren<
  VariantProps<typeof pillVariants> & {
    className?: string;
  }
>;

const actionButtonVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      tone: {
        accent:
          "border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-white hover:brightness-95",
        ghost:
          "border-[color:var(--color-line)] bg-transparent text-[color:var(--color-text)] hover:bg-[color:var(--color-accent-soft)]",
        secondary:
          "border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] text-[color:var(--color-text)] hover:border-[color:var(--color-accent)]",
        primary:
          "border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-white hover:brightness-95"
      }
    },
    defaultVariants: {
      tone: "primary"
    }
  }
);

const actionLinkVariants = cva(
  "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]",
  {
    variants: {
      tone: {
        action:
          "border border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-text)] hover:bg-[color:var(--color-accent)] hover:text-white",
        inline:
          "text-[color:var(--color-accent)] hover:underline hover:underline-offset-4",
        muted:
          "text-[color:var(--color-muted)] hover:text-[color:var(--color-text)]"
      }
    },
    defaultVariants: {
      tone: "action"
    }
  }
);

const statusBannerVariants = cva(
  "rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)]",
  {
    variants: {
      tone: {
        error: "border-red-500/45 bg-red-500/12 text-red-50",
        info: "border-blue-500/35 bg-blue-500/12 text-blue-50",
        success: "border-emerald-500/45 bg-emerald-500/12 text-emerald-50",
        warning: "border-amber-400/45 bg-amber-400/12 text-amber-100"
      }
    },
    defaultVariants: {
      tone: "info"
    }
  }
);

const opsPanelCardVariants = cva("rounded-2xl border p-4", {
  variants: {
    tone: {
      critical: "border-rose-400/30 bg-[color:var(--color-surface)]",
      healthy: "border-emerald-400/20 bg-[color:var(--color-surface)]/90",
      neutral:
        "border-[color:var(--color-line)] bg-[color:var(--color-surface)]",
      warning: "border-amber-400/30 bg-[color:var(--color-surface)]/85"
    }
  },
  defaultVariants: {
    tone: "neutral"
  }
});

const fieldStackVariants = cva("grid gap-1.5", {
  variants: {
    emphasis: {
      default: "",
      compact: "gap-1"
    }
  },
  defaultVariants: {
    emphasis: "default"
  }
});

const inputFieldVariants = cva(
  "w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30",
  {
    variants: {
      tone: {
        default: "",
        file: "file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[color:var(--color-surface-strong)] file:px-3 file:py-2 file:text-sm file:text-[color:var(--color-text)] file:shadow-sm"
      }
    },
    defaultVariants: {
      tone: "default"
    }
  }
);

const selectFieldVariants = cva(
  "w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
);

const textAreaVariants = cva(
  `${inputFieldVariants({ tone: "default" })} min-h-[10rem] resize-y`
);

type ActionLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, never> & {
  href: string;
  tone?: "action" | "inline" | "muted";
};

type ActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "accent" | "secondary" | "ghost";
};

type StatusBannerProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "error" | "info" | "success" | "warning";
};

type FieldStackProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  emphasis?: "default" | "compact";
};

type InputFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "prefix" | "suffix"
> & {
  tone?: "default" | "file";
};

type SelectFieldProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "prefix" | "suffix"
>;

type TextAreaFieldProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "prefix" | "suffix"
>;

type MetricTileProps = {
  label: string;
  value: string;
};

type SectionHeadingProps = {
  eyebrow: string;
  lead: string;
  title: string;
  className?: string;
};

type PanelHeadingProps = {
  lead: string;
  title: string;
  className?: string;
};

type SignalCardProps = {
  detail: string;
  label: string;
  tone?: "critical" | "default" | "success" | "warning";
  value: string;
  className?: string;
};

type RecordShellProps = PropsWithChildren<{
  className?: string;
}>;

type EmptyStateProps = PropsWithChildren<{
  className?: string;
}>;

type RailCardProps = PropsWithChildren<{
  body?: string;
  eyebrow: string;
  title: string;
  className?: string;
}>;

type InsetMetricProps = {
  detail?: string;
  label: string;
  value: string;
  className?: string;
};

type OpsEmptyStateProps = PropsWithChildren<{
  centered?: boolean;
  className?: string;
}>;

type OpsStatusNoticeProps = PropsWithChildren<{
  className?: string;
  tone?: "error" | "info" | "success" | "warning";
  title?: string;
}>;

type OpsPanelCardProps = PropsWithChildren<{
  className?: string;
  tone?: "critical" | "healthy" | "neutral" | "warning";
}>;

type OpsSummaryCardProps = PropsWithChildren<{
  className?: string;
  detail: string;
  label: string;
  meta: string;
  tone?: "critical" | "healthy" | "neutral" | "warning";
  value: string;
}>;

type ActionRowProps = PropsWithChildren<{
  className?: string;
  compact?: boolean;
  padTop?: boolean;
}>;

type OpsQuickAction = {
  href: string;
  label: string;
  tone?: "action" | "inline" | "muted";
  rel?: string;
  target?: string;
};

type OpsQuickActionsProps = {
  actions: OpsQuickAction[];
  compact?: boolean;
  className?: string;
  padTop?: boolean;
};

type FormPanelProps = PropsWithChildren<{
  className?: string;
}>;

export type { ActionButtonProps, PageTone };

export function PageShell({
  actions,
  title,
  children,
  eyebrow,
  lead,
  tone,
  className
}: PageShellProps & { className?: string }) {
  return (
    <section className={cn(pageShellVariants({ tone }), className)}>
      <div className="space-y-4">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
          {eyebrow}
        </span>
        <h1 className="text-3xl font-semibold font-[var(--font-display)] tracking-tight">
          {title}
        </h1>
        <p className="max-w-4xl text-sm leading-7 text-[color:var(--color-muted)]">
          {lead}
        </p>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function SurfaceGrid({ children, density }: SurfaceGridProps) {
  return <div className={surfaceGridVariants({ density })}>{children}</div>;
}

export function SurfaceCard({
  body,
  children,
  eyebrow,
  density,
  footer,
  span = 6,
  title,
  className
}: SurfaceCardProps & {
  className?: string;
}) {
  return (
    <article className={cn(surfaceCardVariants({ density, span }), className)}>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
          {eyebrow}
        </span>
        <h2 className="text-xl font-semibold font-[var(--font-display)]">
          {title}
        </h2>
        <p className="text-sm leading-6 text-[color:var(--color-muted)]">
          {body}
        </p>
      </div>
      <div className="pt-1">{children}</div>
      <div className="pt-2">{footer ? <>{footer}</> : null}</div>
    </article>
  );
}

export function Pill({ children, className, tone }: PillProps) {
  return (
    <span className={cn(pillVariants({ tone }), className)}>{children}</span>
  );
}

export function MetricTile({ label, value }: MetricTileProps) {
  return (
    <div className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-accent)]">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold text-[color:var(--color-text)]">
        {value}
      </p>
    </div>
  );
}

export function SectionHeading({
  className,
  eyebrow,
  lead,
  title
}: SectionHeadingProps) {
  return (
    <header className={cn("space-y-3", className)}>
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
          {eyebrow}
        </span>
        <h2 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight text-[color:var(--color-text)]">
          {title}
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
          {lead}
        </p>
      </div>
    </header>
  );
}

export function PanelHeading({ className, lead, title }: PanelHeadingProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <h3 className="text-base font-semibold text-[color:var(--color-text)]">
        {title}
      </h3>
      <p className="text-sm leading-6 text-[color:var(--color-muted)]">
        {lead}
      </p>
    </div>
  );
}

export function SignalCard({
  className,
  detail,
  label,
  tone = "default",
  value
}: SignalCardProps) {
  const toneClass = {
    critical: "border-red-400/55 bg-red-500/10 text-red-50",
    default:
      "border-[color:var(--color-line)] bg-[color:var(--color-surface)] text-[color:var(--color-text)]",
    success: "border-emerald-400/45 bg-emerald-500/10 text-emerald-50",
    warning: "border-amber-300/45 bg-amber-500/12 text-amber-100"
  }[tone];

  return (
    <article
      className={cn(
        "flex h-full flex-col gap-2 rounded-2xl border p-4 shadow-[var(--shadow-surface)]",
        toneClass,
        className
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-current/80">
        {label}
      </span>
      <strong className="text-lg font-semibold">{value}</strong>
      <span className="text-sm leading-6 text-current/80">{detail}</span>
    </article>
  );
}

export function RecordList({ children, className }: RecordShellProps) {
  return <div className={cn("grid gap-3", className)}>{children}</div>;
}

export function RecordCard({ children, className }: RecordShellProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-4 md:flex-row md:items-start md:justify-between",
        className
      )}
    >
      {children}
    </div>
  );
}

export function RecordCopy({ children, className }: RecordShellProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-1.5 text-sm leading-6 text-[color:var(--color-muted)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function RecordActions({ children, className }: RecordShellProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 md:justify-end",
        className
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({ children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)]/50 p-4 text-sm text-[color:var(--color-muted)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function OpsEmptyState({
  centered = false,
  children,
  className
}: OpsEmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-[color:var(--color-line)] bg-[color:var(--color-surface)]/40 p-4 text-sm text-[color:var(--color-muted)]",
        centered ? "text-center" : null,
        className
      )}
    >
      {children}
    </div>
  );
}

export function OpsStatusNotice({
  children,
  className,
  title,
  tone = "info"
}: OpsStatusNoticeProps) {
  return (
    <StatusBanner tone={tone} className={cn("mt-3", className)}>
      {title ? (
        <strong className="mb-1 block font-semibold">{title}</strong>
      ) : null}
      {children}
    </StatusBanner>
  );
}

export function OpsPanelCard({
  children,
  className,
  tone = "neutral"
}: OpsPanelCardProps) {
  return (
    <article className={cn(opsPanelCardVariants({ tone }), className)}>
      {children}
    </article>
  );
}

export function OpsSummaryCard({
  className,
  detail,
  label,
  meta,
  tone = "neutral",
  value
}: OpsSummaryCardProps) {
  return (
    <OpsPanelCard className={cn("space-y-1", className)} tone={tone}>
      <div className="space-y-1 text-xs font-semibold uppercase tracking-[0.15em]">
        <span>{label}</span>
      </div>
      <p className="mt-2 text-xl font-semibold text-[color:var(--color-text)]">
        {value}
      </p>
      <p className="mt-2 text-sm text-[color:var(--color-muted)]">{detail}</p>
      <p className="mt-3 text-xs text-[color:var(--color-muted)]">{meta}</p>
    </OpsPanelCard>
  );
}

export function RailCard({
  body,
  children,
  className,
  eyebrow,
  title
}: RailCardProps) {
  return (
    <article
      className={cn(
        "space-y-4 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-surface)]",
        className
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
        {eyebrow}
      </span>
      <h3 className="font-[var(--font-display)] text-xl font-semibold text-[color:var(--color-text)]">
        {title}
      </h3>
      {body ? (
        <p className="text-sm leading-7 text-[color:var(--color-muted)]">
          {body}
        </p>
      ) : null}
      {children}
    </article>
  );
}

export function InsetMetric({
  className,
  detail,
  label,
  value
}: InsetMetricProps) {
  return (
    <div
      className={cn(
        "rounded-[1.35rem] border border-[color:var(--color-line)] bg-[color:var(--color-surface)]/75 p-4 shadow-[0_14px_30px_rgba(15,23,42,0.08)]",
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-[color:var(--color-text)]">
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

export function ActionRow({
  children,
  className,
  compact = false,
  padTop = false
}: ActionRowProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center",
        compact ? "gap-2" : "gap-3",
        padTop ? "pt-2" : null,
        className
      )}
    >
      {children}
    </div>
  );
}

export function OpsQuickActions({
  actions,
  compact = false,
  className,
  padTop = false
}: OpsQuickActionsProps) {
  return (
    <ActionRow compact={compact} padTop={padTop} className={className ?? ""}>
      {actions.map((action) => (
        <ActionLink
          href={action.href}
          key={action.label}
          {...(action.rel ? { rel: action.rel } : null)}
          {...(action.target ? { target: action.target } : null)}
          {...(action.tone ? { tone: action.tone } : null)}
        >
          {action.label}
        </ActionLink>
      ))}
    </ActionRow>
  );
}

export function FormPanel({ children, className }: FormPanelProps) {
  return (
    <section
      className={cn(
        "grid gap-4 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)]/60 p-4",
        className
      )}
    >
      {children}
    </section>
  );
}

export function StatusBanner({
  className,
  tone = "info",
  children,
  ...props
}: StatusBannerProps) {
  return (
    <div className={cn(statusBannerVariants({ tone }), className)} {...props}>
      {children}
    </div>
  );
}

export function FieldStack({
  className,
  emphasis = "default",
  ...props
}: FieldStackProps) {
  return (
    <label
      className={cn(fieldStackVariants({ emphasis }), className)}
      {...props}
    />
  );
}

export function FieldLabel({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]",
        className
      )}
    >
      {children}
    </span>
  );
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, tone = "default", ...props }, ref) => {
    return (
      <input
        className={cn(inputFieldVariants({ tone }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

InputField.displayName = "InputField";

export function SelectField({ className, ...props }: SelectFieldProps) {
  return <select className={cn(selectFieldVariants(), className)} {...props} />;
}

export function TextAreaField({ className, ...props }: TextAreaFieldProps) {
  return <textarea className={cn(textAreaVariants(), className)} {...props} />;
}

export function ActionButton({
  tone = "primary",
  ...props
}: ActionButtonProps) {
  return <button className={actionButtonVariants({ tone })} {...props} />;
}

export function ActionLink({
  href,
  tone = "action",
  className,
  children,
  ...props
}: ActionLinkProps): ReactElement {
  return (
    <a
      className={cn(actionLinkVariants({ tone }), className)}
      href={href}
      {...props}
    >
      {children}
    </a>
  );
}

export { cn } from "./lib/cn";
