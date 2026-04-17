import type { ReactNode } from "react";

import { WorkspaceScopeSwitcher } from "../../../components/workspace-scope-switcher";
import { SidebarThemeSwitcher } from "../../../components/sidebar-theme-switcher";
import { ActionLink } from "@ai-nft-forge/ui";
import { requireStudioSession } from "../../../server/auth/guard";
import { getCurrentStudioAccess } from "../../../server/studio/access";

type StudioLayoutProps = {
  children: ReactNode;
};

type StudioNavigationItem = {
  description: string;
  href: string;
  label: string;
};

const studioNavigationItems: StudioNavigationItem[] = [
  {
    description: "Upload source assets and dispatch generation.",
    href: "/studio/assets",
    label: "Assets"
  },
  {
    description: "Curate review-ready variants into collections.",
    href: "/studio/collections",
    label: "Collections"
  },
  {
    description: "Supervise checkout sessions and fulfillment.",
    href: "/studio/commerce",
    label: "Commerce"
  },
  {
    description: "Operate workspace settings and team profile.",
    href: "/studio/settings",
    label: "Settings"
  }
];

const studioRouteCardClasses =
  "block rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 no-underline transition hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-soft)]";

function shortenWalletAddress(input: string | null) {
  if (!input) {
    return "unknown";
  }

  if (input.length <= 14) {
    return input;
  }

  return `${input.slice(0, 10)}…${input.slice(-6)}`;
}

export default async function StudioLayout({ children }: StudioLayoutProps) {
  await requireStudioSession();
  const access = await getCurrentStudioAccess();
  const workspace = access?.workspace;
  const workspaceName = workspace?.name ?? "No workspace selected";
  const workspaceRole = access?.role ?? "operator";
  const workspaceStatus = workspace?.status ?? "active";

  return (
    <div className="rounded-3xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)]/80 p-4 sm:p-6 backdrop-blur-sm">
      <header className="grid gap-4 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-bg)]/60 p-4 sm:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-accent)]">
            Workspace control plane
          </p>
          <h1 className="text-3xl font-semibold font-[var(--font-display)]">
            Studio operations
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
            All protected studio routes inherit one workspace-scoped operator
            rhythm: intake, curation, publication controls, and commerce
            administration.
          </p>
          <div className="mt-3 grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              Current workspace
            </span>
            <span className="text-lg font-semibold text-[color:var(--app-sidebar-ink)]">
              {workspaceName}
            </span>
            <span className="text-sm text-[color:var(--color-muted)]">
              {workspaceRole} · {workspaceStatus} ·{" "}
              {shortenWalletAddress(access?.owner.walletAddress ?? null)}
            </span>
          </div>
        </div>
        <div className="rounded-2xl border border-[color:var(--app-sidebar-border)] bg-[color:var(--app-surface)] p-4 text-[color:var(--app-sidebar-ink)]">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--app-sidebar-muted)]">
            Accessible workspace
          </h2>
          <WorkspaceScopeSwitcher
            currentWorkspaceSlug={workspace?.slug ?? null}
            workspaces={access?.availableWorkspaces ?? []}
          />
          <SidebarThemeSwitcher className="mt-4" />
        </div>
      </header>
      <nav
        className="mt-4 grid gap-2 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)]/70 p-3 sm:grid-cols-4"
        aria-label="Studio routes"
      >
        {studioNavigationItems.map((item) => (
          <ActionLink
            className={studioRouteCardClasses}
            href={item.href}
            key={item.href}
            tone="muted"
          >
            <span className="font-semibold text-[color:var(--color-text)]">
              {item.label}
            </span>
            <small className="mt-2 block text-xs text-[color:var(--color-muted)]">
              {item.description}
            </small>
          </ActionLink>
        ))}
      </nav>
      <section className="mt-5">{children}</section>
      <footer className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <ActionLink href="/studio" tone="inline">
          Studio home
        </ActionLink>
        <span className="text-[color:var(--color-muted)]">→</span>
        <ActionLink href="/" tone="inline">
          Platform root
        </ActionLink>
      </footer>
    </div>
  );
}
