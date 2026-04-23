import {
  ActionLink,
  ActionRow,
  PageShell,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";

import {
  CollectibleEditorialBand,
  StudioSceneCard
} from "../../../components/collectible-visuals";
import { getCurrentStudioAccess } from "../../../server/studio/access";

type StudioNavigationModule = {
  description: string;
  href: string;
  title: string;
};

const studioModules: StudioNavigationModule[] = [
  {
    description:
      "Ingest source assets, dispatch generation, and review output history before anything ships.",
    href: "/studio/assets",
    title: "Assets"
  },
  {
    description:
      "Build review-ready collections from approved outputs and prepare immutable publication targets.",
    href: "/studio/collections",
    title: "Collections"
  },
  {
    description:
      "Track checkout sessions, payment state, and fulfillment operations from one workspace view.",
    href: "/studio/commerce",
    title: "Commerce"
  },
  {
    description:
      "Control workspace identity, members, escalation flow, and offboarding policy.",
    href: "/studio/settings",
    title: "Settings"
  }
];

export default async function StudioPage() {
  const access = await getCurrentStudioAccess();
  const workspace = access?.workspace;
  const isOwner = access?.role === "owner";
  const workspaceName = workspace?.name ?? "No workspace selected";
  const workspaceStatus = workspace?.status ?? "active";
  const workspaceSlug = workspace?.slug ?? "pending";
  const ownerAddress = access?.owner.walletAddress ?? "not available";
  const primaryDestination = access?.workspace
    ? "/studio/assets"
    : "/studio/settings";
  const nextActionLabel = access?.workspace
    ? "Open asset intake"
    : "Select a workspace first";
  const roleCopy = isOwner ? "owner" : "operator";

  return (
    <PageShell
      eyebrow="Operational foundation"
      lead="Keep one workspace in focus while moving from source capture to collection release, then monitor commerce fulfillment from one operator-safe center."
      title="Creator launch operating room"
      tone="studio"
      actions={
        <ActionRow>
          <ActionLink href={primaryDestination} tone="action">
            {nextActionLabel}
          </ActionLink>
          <ActionLink href="/studio/collections" tone="inline">
            Review latest collections
          </ActionLink>
          <ActionLink href="/" tone="inline">
            Return to marketing
          </ActionLink>
        </ActionRow>
      }
      className="lg:px-1"
    >
      <SurfaceGrid>
        <SurfaceCard
          body={`${workspaceStatus} workspace · ${roleCopy}`}
          eyebrow="Workspace context"
          span={6}
          title={workspaceName}
        >
          <dl className="grid gap-2.5 text-sm text-[color:var(--color-muted)]">
            <div className="grid gap-0.5">
              <dt className="text-xs uppercase tracking-[0.15em] text-[color:var(--color-muted)]">
                Slug
              </dt>
              <dd>{workspaceSlug}</dd>
            </div>
            <div className="grid gap-0.5">
              <dt className="text-xs uppercase tracking-[0.15em] text-[color:var(--color-muted)]">
                Owner
              </dt>
              <dd>{ownerAddress}</dd>
            </div>
          </dl>
        </SurfaceCard>

        <SurfaceCard
          body="Run through source intake, curation, publication, then monitor checkout and fulfillment from one sequence."
          eyebrow="Operational rhythm"
          span={6}
          title="Creator sequence"
        >
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm leading-6 text-[color:var(--color-muted)]">
            <li>Capture and process source material.</li>
            <li>Approve and curate outputs into release drafts.</li>
            <li>Publish from review-ready drafts to immutable targets.</li>
            <li>Monitor checkout, fulfillment, and reconciliation together.</li>
          </ol>
        </SurfaceCard>

        <SurfaceCard
          body="Use this route as a visual index for where you are operating this launch cycle."
          eyebrow="Workspace scope"
          span={12}
          title="Single surface for a complete launch"
          className="min-h-60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,249,255,0.92))]"
        >
          <ul className="mt-2 grid gap-2 text-sm text-[color:var(--color-muted)] sm:grid-cols-2">
            <li>
              <span className="mr-2 rounded-full bg-[color:var(--color-accent-soft)] px-2 py-1 text-xs font-semibold text-[color:var(--color-accent)]">
                A
              </span>
              Keep current workspace as your immutable control anchor.
            </li>
            <li>
              <span className="mr-2 rounded-full bg-[color:var(--color-accent-soft)] px-2 py-1 text-xs font-semibold text-[color:var(--color-accent)]">
                B
              </span>
              Route from production assets to commerce with audit-backed state.
            </li>
            <li>
              <span className="mr-2 rounded-full bg-[color:var(--color-accent-soft)] px-2 py-1 text-xs font-semibold text-[color:var(--color-accent)]">
                C
              </span>
              Move quickly between public launch prep and operational controls.
            </li>
            <li>
              <span className="mr-2 rounded-full bg-[color:var(--color-accent-soft)] px-2 py-1 text-xs font-semibold text-[color:var(--color-accent)]">
                D
              </span>
              Maintain auth boundaries and workspace separation at each action.
            </li>
          </ul>
        </SurfaceCard>
      </SurfaceGrid>

      <CollectibleEditorialBand>
        <StudioSceneCard
          eyebrow="Creator-side depth"
          note="Studio should stay product-like, but preview cards, framed drop shells, and tasteful scene accents make setup feel premium rather than purely utilitarian."
          title="Preview-led launch preparation"
        />
      </CollectibleEditorialBand>

      <SurfaceGrid>
        {studioModules.map((module, index) => (
          <SurfaceCard
            body={module.description}
            eyebrow={`0${index + 1}`}
            key={module.title}
            span={4}
            title={module.title}
            className="h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,246,255,0.9))]"
            footer={
              <ActionLink href={module.href} tone="inline">
                Open {module.title.toLowerCase()}
              </ActionLink>
            }
          />
        ))}
      </SurfaceGrid>
    </PageShell>
  );
}
