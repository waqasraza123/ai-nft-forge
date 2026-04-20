import type { ReactNode } from "react";

import { WorkspaceScopeSwitcher } from "../../../components/workspace-scope-switcher";
import {
  ActionLink,
  ActionRow,
  PageShell,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";
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
    <PageShell
      eyebrow="Workspace control plane"
      lead="All protected studio routes inherit one workspace-scoped operator rhythm: intake, curation, publication controls, and commerce administration."
      title="Studio operations"
      tone="studio"
      actions={
        <ActionRow>
          <ActionLink href="/studio" tone="inline">
            Studio home
          </ActionLink>
          <ActionLink href="/" tone="inline">
            Platform root
          </ActionLink>
        </ActionRow>
      }
    >
      <SurfaceGrid density="dense">
        <SurfaceCard
          body={`${workspaceRole} · ${workspaceStatus} · ${shortenWalletAddress(
            access?.owner.walletAddress ?? null
          )}`}
          eyebrow="Current workspace"
          span={8}
          title={workspaceName}
        >
          <p className="text-sm leading-6 text-[color:var(--color-muted)]">
            Keep one workspace in focus while you move from source intake to
            collection release and commerce operations.
          </p>
        </SurfaceCard>

        <SurfaceCard
          body="Switch the workspace context that powers studio actions and keep the active launch environment explicit before you publish, fulfill, or mutate settings."
          eyebrow="Workspace controls"
          span={4}
          title="Accessible workspace"
        >
          <WorkspaceScopeSwitcher
            currentWorkspaceSlug={workspace?.slug ?? null}
            workspaces={access?.availableWorkspaces ?? []}
          />
        </SurfaceCard>

        <SurfaceCard
          body="Use these modules for lane-level operations while you review intake,
          collection state, commerce fulfillment, and policy controls."
          eyebrow="Studio routes"
          span={12}
          title="Navigation"
          density="compact"
        >
          <div className="mt-4">
            <SurfaceGrid density="dense">
              {studioNavigationItems.map((item, index) => (
                <SurfaceCard
                  body={item.description}
                  eyebrow={`0${index + 1}`}
                  density="compact"
                  key={item.href}
                  span={4}
                  title={item.label}
                >
                  <ActionLink href={item.href} tone="inline">
                    Open {item.label.toLowerCase()}
                  </ActionLink>
                </SurfaceCard>
              ))}
            </SurfaceGrid>
          </div>
        </SurfaceCard>
      </SurfaceGrid>

      <section className="mt-5">{children}</section>
    </PageShell>
  );
}
