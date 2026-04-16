import type {
  AnchorHTMLAttributes,
  InputHTMLAttributes,
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

type SurfaceCardProps = PropsWithChildren<{
  body: string;
  eyebrow: string;
  footer?: ReactNode;
  span?: 4 | 6 | 8 | 12;
  title: string;
} & VariantProps<typeof surfaceCardVariants>>;

const pillVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
  {
    variants: {
      tone: {
        accent:
          "border-transparent bg-[color:var(--color-accent)] text-[color:var(--color-surface-strong)]",
        danger:
          "border-transparent bg-red-500/85 text-white",
        neutral:
          "border-[color:var(--color-line)] bg-[color:var(--color-surface)] text-[color:var(--color-muted)]",
        success: "border-transparent bg-emerald-500/85 text-white",
        warning:
          "border-transparent bg-amber-500/85 text-black"
      }
    },
    defaultVariants: {
      tone: "neutral"
    }
  }
);

type PillProps = PropsWithChildren<VariantProps<typeof pillVariants>>;

const actionButtonVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      tone: {
        accent:
          "border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-white hover:brightness-95",
        ghost: "border-[color:var(--color-line)] bg-transparent text-[color:var(--color-text)] hover:bg-[color:var(--color-accent-soft)]",
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
        inline: "text-[color:var(--color-accent)] hover:underline hover:underline-offset-4",
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
        error:
          "border-red-500/45 bg-red-500/12 text-red-50",
        info: "border-blue-500/35 bg-blue-500/12 text-blue-50",
        success:
          "border-emerald-500/45 bg-emerald-500/12 text-emerald-50",
        warning:
          "border-amber-400/45 bg-amber-400/12 text-amber-100"
      }
    },
    defaultVariants: {
      tone: "info"
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

type TextAreaFieldProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "prefix" | "suffix"
>;

type MetricTileProps = {
  label: string;
  value: string;
};

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
        {actions ? (
          <div className="flex flex-wrap gap-3">{actions}</div>
        ) : null}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function SurfaceGrid({
  children,
  density
}: SurfaceGridProps) {
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
  className,
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

export function Pill({ children, tone }: PillProps) {
  return <span className={pillVariants({ tone })}>{children}</span>;
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
    <label className={cn(fieldStackVariants({ emphasis }), className)} {...props} />
  );
}

export function FieldLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]", className)}>
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

export function TextAreaField({
  className,
  ...props
}: TextAreaFieldProps) {
  return (
    <textarea
      className={cn(textAreaVariants(), className)}
      {...props}
    />
  );
}

export function ActionButton({ tone = "primary", ...props }: ActionButtonProps) {
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
