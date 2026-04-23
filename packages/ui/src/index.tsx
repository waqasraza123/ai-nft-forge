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
        "rounded-[2rem] border border-[color:var(--color-line)] bg-white/86 px-5 py-6 text-[color:var(--color-text)] shadow-[var(--shadow-surface)] backdrop-blur-xl md:px-7 md:py-7",
      ops: "rounded-[2rem] border border-sky-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,250,255,0.96))] px-5 py-6 text-[color:var(--color-text)] shadow-[var(--shadow-surface)] backdrop-blur-xl md:px-7 md:py-7",
      studio:
        "rounded-[2rem] border border-violet-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(249,246,255,0.98))] px-5 py-6 text-[color:var(--color-text)] shadow-[var(--shadow-surface)] backdrop-blur-xl md:px-7 md:py-7"
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
  "rounded-[1.75rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(249,247,255,0.92))] p-4 shadow-[var(--shadow-surface)] backdrop-blur-xl",
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
          "border-transparent bg-[color:var(--color-accent)]/18 text-[color:var(--color-accent)]",
        danger: "border-transparent bg-red-100 text-red-700",
        neutral:
          "border-[color:var(--color-line)] bg-[color:var(--color-surface)] text-[color:var(--color-muted)]",
        success: "border-transparent bg-emerald-100 text-emerald-700",
        warning: "border-transparent bg-amber-100 text-amber-700"
      }
    },
    defaultVariants: {
      tone: "neutral"
    }
  }
);

const storefrontPanelVariants = cva(
  "rounded-[2rem] border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] backdrop-blur-xl",
  {
    variants: {
      tone: {
        default: "p-5 shadow-[0_22px_52px_rgba(188,194,226,0.18)]",
        soft: "bg-[color:var(--storefront-panel)]/92 p-6 shadow-[0_30px_70px_rgba(194,198,229,0.18)]",
        strong:
          "bg-[color:var(--storefront-panel)]/98 p-5 shadow-[0_18px_40px_rgba(191,198,228,0.18)]",
        elevated:
          "bg-[color:var(--storefront-panel)]/98 p-5 shadow-[0_34px_86px_rgba(187,194,224,0.22)]"
      }
    },
    defaultVariants: {
      tone: "default"
    }
  }
);

const storefrontTileVariants = cva(
  "rounded-[1.75rem] border border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel-strong)] p-4 backdrop-blur-xl",
  {
    variants: {
      tone: {
        default: "",
        muted: "bg-[color:var(--storefront-panel)]/72",
        gallery:
          "bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,244,255,0.9))] shadow-[0_18px_42px_rgba(188,194,226,0.18)]"
      },
      interactive: {
        false: "",
        true: "transition duration-250 hover:-translate-y-1 hover:border-[color:var(--storefront-accent)] hover:shadow-[0_20px_45px_rgba(155,140,255,0.16)]"
      }
    },
    defaultVariants: {
      tone: "default",
      interactive: false
    }
  }
);

const storefrontPillVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
  {
    variants: {
      tone: {
        accent:
          "border-[color:var(--storefront-accent)]/45 bg-[color:var(--storefront-accent)]/15 text-[color:var(--storefront-accent)]",
        muted:
          "border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] text-[color:var(--storefront-muted)]",
        subtle:
          "border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)]/70 text-[color:var(--storefront-text)]"
      }
    },
    defaultVariants: {
      tone: "muted"
    }
  }
);

const storefrontActionButtonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-semibold transition duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--storefront-accent)]/35 disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      tone: {
        ghost:
          "border-[color:var(--storefront-border)] bg-white/70 text-[color:var(--storefront-text)] hover:border-[color:var(--storefront-accent)] hover:bg-[color:var(--storefront-accent)]/10",
        primary:
          "border-[color:var(--storefront-accent)]/30 bg-[linear-gradient(135deg,var(--storefront-accent),#bfe5fb)] text-[color:var(--storefront-text)] shadow-[0_16px_36px_rgba(188,194,226,0.22)] hover:brightness-105",
        secondary:
          "border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] text-[color:var(--storefront-text)] hover:border-[color:var(--storefront-accent)] hover:bg-[color:var(--storefront-panel-strong)]"
      }
    },
    defaultVariants: {
      tone: "primary"
    }
  }
);

const storefrontActionLinkVariants = cva(
  "inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-semibold transition duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--storefront-accent)]/35",
  {
    variants: {
      tone: {
        inline:
          "border-transparent bg-transparent px-0 py-0 text-[color:var(--storefront-accent)] hover:text-[color:var(--storefront-text)] hover:underline hover:underline-offset-4",
        primary:
          "border-[color:var(--storefront-accent)]/35 bg-[color:var(--storefront-accent)]/12 text-[color:var(--storefront-accent)] hover:bg-[linear-gradient(135deg,var(--storefront-accent),#cbeaff)] hover:text-[color:var(--storefront-text)]",
        secondary:
          "border-[color:var(--storefront-border)] bg-[color:var(--storefront-panel)] text-[color:var(--storefront-text)] hover:border-[color:var(--storefront-accent)] hover:bg-[color:var(--storefront-panel-strong)]"
      }
    },
    defaultVariants: {
      tone: "primary"
    }
  }
);

type PillProps = PropsWithChildren<
  VariantProps<typeof pillVariants> & {
    className?: string;
  }
>;

const actionButtonVariants = cva(
  "inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-semibold transition duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/40 disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      tone: {
        accent:
          "border-[color:var(--color-accent)]/35 bg-[linear-gradient(135deg,var(--color-accent),#d9f0fd)] text-[color:var(--color-text)] shadow-[0_14px_32px_rgba(188,194,226,0.2)] hover:brightness-105",
        surface:
          "justify-start rounded-[1.5rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,246,255,0.92))] px-4 py-3 text-left text-[color:var(--color-text)] shadow-[0_18px_44px_rgba(188,194,226,0.16)] hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-soft)]",
        ghost:
          "border-[color:var(--color-line)] bg-transparent text-[color:var(--color-text)] hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-soft)]",
        secondary:
          "border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,248,255,0.94))] text-[color:var(--color-text)] hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-soft)]",
        primary:
          "border-[color:var(--color-accent)]/35 bg-[linear-gradient(135deg,var(--color-accent),#d9f0fd)] text-[color:var(--color-text)] shadow-[0_14px_36px_rgba(188,194,226,0.18)] hover:brightness-105"
      }
    },
    defaultVariants: {
      tone: "primary"
    }
  }
);

const actionLinkVariants = cva(
  "inline-flex items-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/40",
  {
    variants: {
      tone: {
        action:
          "border border-[color:var(--color-accent)]/35 bg-[color:var(--color-accent-soft)] text-[color:var(--color-text)] hover:bg-[linear-gradient(135deg,var(--color-accent),#d9f0fd)] hover:text-[color:var(--color-text)]",
        inline:
          "text-[color:var(--color-accent)] hover:text-[color:var(--color-text)] hover:underline hover:underline-offset-4",
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
  "rounded-2xl border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,247,255,0.92))] p-3.5 text-sm text-[color:var(--color-text)] shadow-[0_16px_32px_rgba(188,194,226,0.18)]",
  {
    variants: {
      tone: {
        error: "border-red-200 bg-red-50 text-red-700",
        info: "border-sky-200 bg-sky-50 text-sky-700",
        success: "border-emerald-200 bg-emerald-50 text-emerald-700",
        warning: "border-amber-200 bg-amber-50 text-amber-700"
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
      critical:
        "border-rose-200 bg-[linear-gradient(180deg,rgba(255,244,246,0.98),rgba(255,238,242,0.96))]",
      healthy:
        "border-emerald-200 bg-[linear-gradient(180deg,rgba(244,255,250,0.98),rgba(238,252,246,0.96))]",
      neutral:
        "border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,248,255,0.92))]",
      warning:
        "border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,243,0.98),rgba(255,246,228,0.96))]"
    }
  },
  defaultVariants: {
    tone: "neutral"
  }
});

const opsCommandModuleVariants = cva(
  "space-y-3 rounded-[1.75rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,249,255,0.94))] p-4 shadow-[var(--shadow-surface)] backdrop-blur-xl",
  {
    variants: {
      span: {
        full: "xl:col-span-6",
        standard: "xl:col-span-3",
        wide: "xl:col-span-2"
      },
      tone: {
        critical: "ring-1 ring-rose-200",
        warning: "ring-1 ring-amber-200",
        healthy: "ring-1 ring-emerald-200",
        neutral: "ring-1 ring-transparent"
      }
    },
    defaultVariants: {
      span: "standard",
      tone: "neutral"
    }
  }
);

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
  "w-full rounded-2xl border border-[color:var(--color-line)] bg-white px-3.5 py-2.5 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/25",
  {
    variants: {
      tone: {
        default: "",
        storefront:
          "border-[color:var(--storefront-border)] bg-white text-[color:var(--storefront-text)] placeholder:text-[color:var(--storefront-muted)] focus:border-[color:var(--storefront-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--storefront-accent)]/25",
        file: "file:mr-3 file:cursor-pointer file:rounded-2xl file:border file:border-[color:var(--color-line)] file:bg-[color:var(--color-surface-strong)] file:px-3.5 file:py-2.5 file:text-sm file:text-[color:var(--color-text)] file:shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
      }
    },
    defaultVariants: {
      tone: "default"
    }
  }
);

const selectFieldVariants = cva(
  "w-full rounded-2xl border border-[color:var(--color-line)] bg-white px-3.5 py-2.5 text-sm text-[color:var(--color-text)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/25"
);

const textAreaVariants = cva(
  `${inputFieldVariants({ tone: "default" })} min-h-[10rem] resize-y`
);

type ActionLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, never> & {
  href: string;
  tone?: "action" | "inline" | "muted";
};

type StorefrontActionLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  never
> & {
  href: string;
  tone?: "inline" | "primary" | "secondary";
};

type ActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "accent" | "secondary" | "ghost" | "surface";
};

type StorefrontActionButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    tone?: "ghost" | "primary" | "secondary";
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
  tone?: "default" | "file" | "storefront";
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
  className?: string | undefined;
  illustration?: ReactNode | undefined;
  title?: string | undefined;
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

type OpsCommandTone = "critical" | "healthy" | "neutral" | "warning";

type OpsCommandSectionProps = PropsWithChildren<{
  className?: string;
  description: string;
  eyebrow: string;
  title: string;
}>;

type OpsCommandSignalProps = {
  detail: string;
  label: string;
  meta: string;
  tone?: OpsCommandTone;
  value: string;
};

type OpsCommandModuleProps = PropsWithChildren<{
  actions?: ReactNode;
  className?: string;
  description: string;
  eyebrow: string;
  span?: "full" | "standard" | "wide";
  tone?: OpsCommandTone;
  title: string;
}>;

type OpsGridProps = PropsWithChildren<{
  className?: string;
}>;

type OpsSettingsGridProps = PropsWithChildren<{
  className?: string;
}>;

type OpsPillRowProps = PropsWithChildren<{
  className?: string;
}>;

type OpsSplitRowProps = PropsWithChildren<{
  className?: string;
}>;

type OpsActionRowProps = PropsWithChildren<{
  className?: string;
}>;

type OpsCommandSignalGridProps = PropsWithChildren<{
  className?: string;
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

type StorefrontPanelProps = PropsWithChildren<{
  as?: "article" | "div" | "section";
  className?: string;
  tone?: "default" | "soft" | "strong" | "elevated";
}>;

type StorefrontTileProps = PropsWithChildren<{
  className?: string;
  interactive?: boolean;
  tone?: "default" | "muted" | "gallery";
}>;

type StorefrontPillProps = PropsWithChildren<{
  className?: string;
  tone?: "accent" | "muted" | "subtle";
}>;

type StorefrontSectionHeadingProps = {
  className?: string;
  eyebrow: string;
  lead?: string;
  title: string;
};

type StorefrontMetaGridProps = PropsWithChildren<{
  className?: string;
}>;

type StorefrontMetaItemProps = {
  className?: string;
  label: string;
  value: ReactNode;
  valueClassName?: string;
};

type EditorialSectionProps = PropsWithChildren<{
  actions?: ReactNode | undefined;
  className?: string | undefined;
  eyebrow: string;
  lead?: string | undefined;
  title: string;
}>;

type CollectibleCardProps = PropsWithChildren<{
  badge?: string | undefined;
  className?: string | undefined;
  imageAlt: string;
  imageUrl?: string | null | undefined;
  meta?: string | undefined;
  subtitle?: string | undefined;
  title: string;
}>;

type MediaHeroFrameProps = PropsWithChildren<{
  badge?: string | undefined;
  className?: string | undefined;
  imageAlt: string;
  imageUrl?: string | null | undefined;
  meta?: string | undefined;
  title: string;
}>;

type StatChipProps = {
  className?: string | undefined;
  label: string;
  tone?: "accent" | "default" | "mint" | "sky" | undefined;
  value: string;
};

type ProofBadgeProps = PropsWithChildren<{
  className?: string | undefined;
  tone?: "accent" | "default" | "success" | "warning" | undefined;
}>;

type ThumbnailStripItem = {
  imageAlt: string;
  imageUrl?: string | null;
  label: string;
  meta?: string;
};

type ThumbnailStripProps = {
  accentColorVar?: string | undefined;
  className?: string | undefined;
  items: ThumbnailStripItem[];
};

type GalleryRailProps = PropsWithChildren<{
  className?: string | undefined;
  eyebrow: string;
  lead?: string | undefined;
  title: string;
}>;

type PremiumCtaCardProps = PropsWithChildren<{
  className?: string | undefined;
  detail?: string | undefined;
  eyebrow: string;
  title: string;
}>;

type WalletStatusSurfaceProps = PropsWithChildren<{
  className?: string | undefined;
  detail: string;
  status: string;
  tone?: "active" | "idle" | "warning" | undefined;
  title: string;
}>;

type LightOperatorPanelProps = PropsWithChildren<{
  className?: string | undefined;
  detail?: string | undefined;
  eyebrow: string;
  title: string;
}>;

type SurfacePanelProps = PropsWithChildren<{
  className?: string;
}>;

type ProgressTrackStatus =
  | "failed"
  | "preparing"
  | "succeeded"
  | "uploading"
  | "verifying";

type ProgressTrackProps = {
  className?: string;
  status?: ProgressTrackStatus;
  value: number;
};

export type { ActionButtonProps, OpsCommandTone, PageTone };

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

export function StorefrontPanel({
  as: As = "section",
  children,
  className,
  tone = "default"
}: StorefrontPanelProps) {
  return (
    <As className={cn(storefrontPanelVariants({ tone }), className)}>
      {children}
    </As>
  );
}

export function StorefrontTile({
  children,
  className,
  interactive = false,
  tone = "default"
}: StorefrontTileProps) {
  return (
    <div
      className={cn(storefrontTileVariants({ interactive, tone }), className)}
    >
      {children}
    </div>
  );
}

export function StorefrontPill({
  children,
  className,
  tone = "muted"
}: StorefrontPillProps) {
  return (
    <span className={cn(storefrontPillVariants({ tone }), className)}>
      {children}
    </span>
  );
}

export function StorefrontSectionHeading({
  className,
  eyebrow,
  lead,
  title
}: StorefrontSectionHeadingProps) {
  return (
    <header className={cn("space-y-2", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--storefront-accent)]">
        {eyebrow}
      </p>
      <h2 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight text-[color:var(--storefront-text)]">
        {title}
      </h2>
      {lead ? (
        <p className="max-w-3xl text-sm leading-7 text-[color:var(--storefront-muted)]">
          {lead}
        </p>
      ) : null}
    </header>
  );
}

export function StorefrontMetaGrid({
  children,
  className
}: StorefrontMetaGridProps) {
  return <div className={cn("space-y-3 text-sm", className)}>{children}</div>;
}

export function StorefrontMetaItem({
  className,
  label,
  value,
  valueClassName
}: StorefrontMetaItemProps) {
  return (
    <div className={cn("grid gap-1", className)}>
      <span className="text-xs text-[color:var(--storefront-muted)]">
        {label}
      </span>
      <strong
        className={cn("text-[color:var(--storefront-text)]", valueClassName)}
      >
        {value}
      </strong>
    </div>
  );
}

export function EditorialSection({
  actions,
  children,
  className,
  eyebrow,
  lead,
  title
}: EditorialSectionProps) {
  return (
    <section
      className={cn(
        "grid gap-5 rounded-[2rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,245,255,0.9))] p-6 shadow-[var(--shadow-surface)] backdrop-blur-xl md:p-8",
        className
      )}
    >
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
          {eyebrow}
        </p>
        <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight text-[color:var(--color-text)]">
          {title}
        </h2>
        {lead ? (
          <p className="max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
            {lead}
          </p>
        ) : null}
        {actions ? <ActionRow>{actions}</ActionRow> : null}
      </div>
      {children}
    </section>
  );
}

export function CollectibleCard({
  badge,
  children,
  className,
  imageAlt,
  imageUrl,
  meta,
  subtitle,
  title
}: CollectibleCardProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-[1.85rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,243,255,0.9))] p-3 shadow-[0_22px_48px_rgba(192,198,227,0.18)]",
        className
      )}
    >
      <div className="relative overflow-hidden rounded-[1.4rem] border border-white/70 bg-[linear-gradient(145deg,#fffaf2,#f0f6ff_58%,#f6efff)]">
        {imageUrl ? (
          <img
            alt={imageAlt}
            className="aspect-[4/5] w-full object-cover"
            src={imageUrl}
          />
        ) : (
          <div className="aspect-[4/5] bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.95),transparent_18%),radial-gradient(circle_at_74%_18%,rgba(165,143,255,0.18),transparent_22%),linear-gradient(155deg,rgba(255,251,240,0.95),rgba(233,244,255,0.96)_52%,rgba(245,236,255,0.92))]" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.92)_38%,rgba(255,255,255,0.98))] p-4 pt-12">
          {badge ? <ProofBadge tone="accent">{badge}</ProofBadge> : null}
          <p className="mt-3 text-lg font-semibold text-[color:var(--color-text)]">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {meta ? (
        <div className="mt-3 rounded-[1.2rem] border border-[color:var(--color-line)] bg-white/70 px-3 py-2 text-xs uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
          {meta}
        </div>
      ) : null}
      {children}
    </article>
  );
}

export function MediaHeroFrame({
  badge,
  children,
  className,
  imageAlt,
  imageUrl,
  meta,
  title
}: MediaHeroFrameProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-[color:var(--color-line)] bg-[linear-gradient(145deg,#fff9f2,#f6fbff_54%,#fbf2ff)] p-5 shadow-[0_28px_78px_rgba(190,197,227,0.2)]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(165,143,255,0.14),transparent_26%),radial-gradient(circle_at_86%_12%,rgba(124,204,247,0.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.18),transparent)]" />
      <div className="relative grid gap-4 md:grid-cols-[1.05fr_0.95fr] md:items-end">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/70">
          {imageUrl ? (
            <img
              alt={imageAlt}
              className="aspect-[4/5] w-full object-cover"
              src={imageUrl}
            />
          ) : (
            <div className="aspect-[4/5] bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.96),transparent_18%),radial-gradient(circle_at_74%_24%,rgba(165,143,255,0.2),transparent_22%),linear-gradient(150deg,rgba(255,248,236,0.95),rgba(235,244,255,0.95)_56%,rgba(244,235,255,0.94))]" />
          )}
        </div>
        <div className="grid gap-3">
          {badge ? <ProofBadge tone="accent">{badge}</ProofBadge> : null}
          <h3 className="font-[var(--font-display)] text-2xl font-semibold text-[color:var(--color-text)] md:text-3xl">
            {title}
          </h3>
          {meta ? (
            <p className="text-sm leading-7 text-[color:var(--color-muted)]">
              {meta}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  );
}

export function StatChip({
  className,
  label,
  tone = "default",
  value
}: StatChipProps) {
  const toneClass = {
    accent:
      "border-[color:var(--color-accent)]/25 bg-[color:var(--color-accent)]/10",
    default: "border-[color:var(--color-line)] bg-white/72",
    mint: "border-emerald-200 bg-emerald-50/80",
    sky: "border-sky-200 bg-sky-50/80"
  }[tone];

  return (
    <div
      className={cn(
        "rounded-[1.35rem] border px-3.5 py-3 shadow-[0_12px_26px_rgba(194,199,225,0.14)]",
        toneClass,
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[color:var(--color-text)]">
        {value}
      </p>
    </div>
  );
}

export function ProofBadge({
  children,
  className,
  tone = "default"
}: ProofBadgeProps) {
  const toneClass = {
    accent:
      "border-[color:var(--color-accent)]/35 bg-[color:var(--color-accent)]/12 text-[color:var(--color-accent)]",
    default:
      "border-[color:var(--color-line)] bg-white/78 text-[color:var(--color-text)]",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700"
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]",
        toneClass,
        className
      )}
    >
      {children}
    </span>
  );
}

export function ThumbnailStrip({
  accentColorVar = "--color-accent",
  className,
  items
}: ThumbnailStripProps) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {items.map((item) => (
        <div
          className="rounded-[1.45rem] border border-[color:var(--color-line)] bg-white/72 p-2.5 shadow-[0_14px_28px_rgba(193,199,225,0.14)]"
          key={`${item.label}-${item.meta ?? "thumb"}`}
        >
          <div className="overflow-hidden rounded-[1rem] border border-white/80 bg-[linear-gradient(145deg,#fffaf2,#eef6ff_58%,#f8efff)]">
            {item.imageUrl ? (
              <img
                alt={item.imageAlt}
                className="aspect-[4/5] w-full object-cover"
                src={item.imageUrl}
              />
            ) : (
              <div
                className="aspect-[4/5] bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.96),transparent_16%),linear-gradient(150deg,rgba(255,248,236,0.95),rgba(235,244,255,0.95)_56%,rgba(244,235,255,0.94))]"
                style={{
                  boxShadow: `inset 0 0 0 1px color-mix(in srgb, var(${accentColorVar}) 14%, white)`
                }}
              />
            )}
          </div>
          <p className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">
            {item.label}
          </p>
          {item.meta ? (
            <p className="mt-1 text-xs text-[color:var(--color-muted)]">
              {item.meta}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function GalleryRail({
  children,
  className,
  eyebrow,
  lead,
  title
}: GalleryRailProps) {
  return (
    <section
      className={cn(
        "rounded-[2rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,245,255,0.9))] p-6 shadow-[var(--shadow-surface)]",
        className
      )}
    >
      <div className="mb-5 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
          {eyebrow}
        </p>
        <h3 className="font-[var(--font-display)] text-2xl font-semibold text-[color:var(--color-text)]">
          {title}
        </h3>
        {lead ? (
          <p className="max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
            {lead}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function PremiumCtaCard({
  children,
  className,
  detail,
  eyebrow,
  title
}: PremiumCtaCardProps) {
  return (
    <article
      className={cn(
        "rounded-[1.85rem] border border-[color:var(--color-line)] bg-[linear-gradient(145deg,#fffaf0,#f5fbff_52%,#fbf2ff)] p-5 shadow-[0_22px_56px_rgba(189,196,227,0.2)]",
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
        {eyebrow}
      </p>
      <h3 className="mt-2 font-[var(--font-display)] text-2xl font-semibold text-[color:var(--color-text)]">
        {title}
      </h3>
      {detail ? (
        <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
          {detail}
        </p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  );
}

export function WalletStatusSurface({
  children,
  className,
  detail,
  status,
  tone = "idle",
  title
}: WalletStatusSurfaceProps) {
  const toneClass = {
    active:
      "border-emerald-200 bg-[linear-gradient(180deg,rgba(244,255,250,0.98),rgba(237,251,245,0.95))]",
    idle: "border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,248,255,0.94))]",
    warning:
      "border-amber-200 bg-[linear-gradient(180deg,rgba(255,252,244,0.98),rgba(255,247,232,0.96))]"
  }[tone];

  return (
    <section
      className={cn(
        "rounded-[1.75rem] border p-5 shadow-[var(--shadow-surface)]",
        toneClass,
        className
      )}
    >
      <ProofBadge
        tone={
          tone === "active"
            ? "success"
            : tone === "warning"
              ? "warning"
              : "default"
        }
      >
        {status}
      </ProofBadge>
      <h3 className="mt-3 text-xl font-semibold font-[var(--font-display)] text-[color:var(--color-text)]">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
        {detail}
      </p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

export function LightOperatorPanel({
  children,
  className,
  detail,
  eyebrow,
  title
}: LightOperatorPanelProps) {
  return (
    <section
      className={cn(
        "rounded-[1.9rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,249,255,0.94))] p-5 shadow-[var(--shadow-surface)]",
        className
      )}
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
          {eyebrow}
        </p>
        <h3 className="text-2xl font-semibold font-[var(--font-display)] text-[color:var(--color-text)]">
          {title}
        </h3>
        {detail ? (
          <p className="max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
            {detail}
          </p>
        ) : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}

export function Pill({ children, className, tone }: PillProps) {
  return (
    <span className={cn(pillVariants({ tone }), className)}>{children}</span>
  );
}

export function MetricTile({ label, value }: MetricTileProps) {
  return (
    <div className="rounded-[1.5rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,248,255,0.92))] px-4 py-3 shadow-[0_16px_32px_rgba(188,194,226,0.16)]">
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
    critical: "border-red-200 bg-red-50 text-red-700",
    default:
      "border-[color:var(--color-line)] bg-[color:var(--color-surface)] text-[color:var(--color-text)]",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700"
  }[tone];

  return (
    <article
      className={cn(
        "flex h-full flex-col gap-2 rounded-[1.5rem] border p-4 shadow-[var(--shadow-surface)] backdrop-blur-xl",
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
        "flex flex-col gap-3 rounded-[1.5rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,248,255,0.92))] p-4 shadow-[0_18px_34px_rgba(188,194,226,0.16)] md:flex-row md:items-start md:justify-between",
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

export function EmptyState({
  children,
  className,
  illustration,
  title
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border border-dashed border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(246,248,255,0.72))] p-4 text-sm text-[color:var(--color-muted)]",
        className
      )}
    >
      <div className="grid gap-3">
        {illustration ? <div>{illustration}</div> : null}
        {title ? (
          <p className="text-sm font-semibold text-[color:var(--color-text)]">
            {title}
          </p>
        ) : null}
        {children}
      </div>
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
        "rounded-[1.5rem] border border-dashed border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(246,248,255,0.72))] p-4 text-sm text-[color:var(--color-muted)]",
        centered ? "text-center" : null,
        className
      )}
    >
      {children}
    </div>
  );
}

export function OpsActionButton({ className, ...props }: ActionButtonProps) {
  return (
    <ActionButton
      className={cn(
        "border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,247,255,0.94))] text-[color:var(--color-text)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]",
        className
      )}
      tone="secondary"
      {...props}
    />
  );
}

export function OpsCommandSection({
  className,
  children,
  description,
  eyebrow,
  title
}: OpsCommandSectionProps) {
  return (
    <section
      className={cn(
        "space-y-3 rounded-[1.75rem] border border-sky-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,249,255,0.94))] p-4 shadow-[var(--shadow-surface)]",
        className
      )}
    >
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--color-accent)]">
          {eyebrow}
        </span>
        <h2 className="text-2xl font-semibold text-[color:var(--color-text)]">
          {title}
        </h2>
        <p className="text-sm leading-7 text-[color:var(--color-muted)]">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

export function OpsCommandModule({
  actions,
  children,
  className,
  description,
  eyebrow,
  span = "standard",
  tone = "neutral",
  title
}: OpsCommandModuleProps) {
  return (
    <article
      className={cn(opsCommandModuleVariants({ span, tone }), className)}
    >
      <div className="grid gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--color-muted)]">
          {eyebrow}
        </span>
        <h3 className="text-lg font-semibold text-[color:var(--color-text)]">
          {title}
        </h3>
        <p className="text-sm text-[color:var(--color-muted)]">{description}</p>
      </div>
      {actions ? (
        <div className="mt-2 flex flex-wrap gap-2">{actions}</div>
      ) : null}
      <div className="space-y-3">{children}</div>
    </article>
  );
}

export function OpsCommandSignal({
  detail,
  label,
  meta,
  tone = "neutral",
  value
}: OpsCommandSignalProps) {
  return (
    <OpsPanelCard tone={tone} className="space-y-1 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--color-muted)]">
        {label}
      </span>
      <strong className="text-2xl text-[color:var(--color-text)]">
        {value}
      </strong>
      <span className="text-sm text-[color:var(--color-muted)]">{detail}</span>
      <span className="text-xs text-[color:var(--color-muted)]">{meta}</span>
    </OpsPanelCard>
  );
}

export function OpsGrid({ children, className }: OpsGridProps) {
  return (
    <div className={cn("grid gap-4 xl:grid-cols-6", className)}>{children}</div>
  );
}

export function OpsSettingsGrid({ children, className }: OpsSettingsGridProps) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-2 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}

export function OpsPillRow({ children, className }: OpsPillRowProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>{children}</div>
  );
}

export function OpsSplitRow({ children, className }: OpsSplitRowProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3",
        className
      )}
    >
      {children}
    </div>
  );
}

export function OpsActionRow({ children, className }: OpsActionRowProps) {
  return (
    <div className={cn("mt-2 flex flex-wrap gap-2", className)}>{children}</div>
  );
}

export function OpsCommandSignalGrid({
  children,
  className
}: OpsCommandSignalGridProps) {
  return (
    <div className={cn("grid gap-4 xl:grid-cols-3", className)}>{children}</div>
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
        "space-y-4 rounded-[1.75rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,248,255,0.92))] p-5 shadow-[var(--shadow-surface)] backdrop-blur-xl",
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
        "rounded-[1.35rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,248,255,0.92))] p-4 shadow-[0_18px_30px_rgba(188,194,226,0.16)]",
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
        "grid gap-4 rounded-[1.75rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,247,255,0.92))] p-4 shadow-[var(--shadow-surface)]",
        className
      )}
    >
      {children}
    </section>
  );
}

export function SurfacePanel({ children, className }: SurfacePanelProps) {
  return (
    <section
      className={cn(
        "rounded-[1.75rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,247,255,0.92))] p-4 shadow-[var(--shadow-surface)] backdrop-blur-xl md:p-5",
        className
      )}
    >
      {children}
    </section>
  );
}

export function ProgressTrack({
  className,
  status = "uploading",
  value
}: ProgressTrackProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));
  const statusClass = {
    succeeded: "bg-emerald-500/80",
    failed: "bg-rose-500/80",
    preparing: "bg-indigo-400/80",
    uploading: "bg-[color:var(--color-accent)]/75",
    verifying: "bg-[color:var(--color-accent)]/75"
  }[status];

  return (
    <div
      className={cn(
        "h-2 overflow-hidden rounded-full bg-[color:var(--color-accent-soft)]/80",
        className
      )}
      aria-hidden="true"
    >
      <span
        className={cn(
          "block h-full rounded-full transition-[width]",
          statusClass
        )}
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
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
  className,
  ...props
}: ActionButtonProps) {
  return (
    <button
      className={cn(actionButtonVariants({ tone }), className)}
      {...props}
    />
  );
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

export function StorefrontActionButton({
  tone = "primary",
  className,
  ...props
}: StorefrontActionButtonProps) {
  return (
    <button
      className={cn(storefrontActionButtonVariants({ tone }), className)}
      {...props}
    />
  );
}

export function StorefrontActionLink({
  href,
  tone = "primary",
  className,
  children,
  ...props
}: StorefrontActionLinkProps): ReactElement {
  return (
    <a
      className={cn(storefrontActionLinkVariants({ tone }), className)}
      href={href}
      {...props}
    >
      {children}
    </a>
  );
}

export { cn } from "./lib/cn";
