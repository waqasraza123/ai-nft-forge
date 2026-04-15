import Link from "next/link";
import type { ReactNode } from "react";

import { WorkspaceScopeSwitcher } from "../../../components/workspace-scope-switcher";
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
    <div className="studio-shell">
      <header className="studio-shell__top">
        <div className="studio-shell__identity">
          <p className="studio-shell__kicker">Workspace control plane</p>
          <h1 className="studio-shell__title">Studio operations</h1>
          <p className="studio-shell__lead">
            All protected studio routes inherit one workspace-scoped operator rhythm:
            intake, curation, publication controls, and commerce administration.
          </p>
          <div className="studio-shell__workspace">
            <span className="studio-shell__meta-label">Current workspace</span>
            <span className="studio-shell__workspace-name">
              {workspaceName}
            </span>
            <span className="studio-shell__workspace-meta">
              {workspaceRole} · {workspaceStatus} ·{" "}
              {shortenWalletAddress(access?.owner.walletAddress ?? null)}
            </span>
          </div>
        </div>
        <div className="studio-shell__scope">
          <h2 className="studio-shell__section-title">
            Accessible workspace
          </h2>
          <WorkspaceScopeSwitcher
            currentWorkspaceSlug={workspace?.slug ?? null}
            workspaces={access?.availableWorkspaces ?? []}
          />
        </div>
      </header>
      <nav className="studio-shell__nav" aria-label="Studio routes">
        {studioNavigationItems.map((item) => (
          <Link className="studio-shell__nav-link" href={item.href} key={item.href}>
            <span>{item.label}</span>
            <small>{item.description}</small>
          </Link>
        ))}
      </nav>
      <section className="studio-shell__content">{children}</section>
      <footer className="studio-shell__breadcrumb">
        <Link className="inline-link" href="/studio">
          Studio home
        </Link>
        <span>→</span>
        <Link className="inline-link" href="/">
          Platform root
        </Link>
      </footer>
    </div>
  );
}
