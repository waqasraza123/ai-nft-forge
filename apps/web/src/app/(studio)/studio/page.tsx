import {
  ActionLink,
  ActionRow,
  LightOperatorPanel,
  PageShell,
  SurfaceCard
} from "@ai-nft-forge/ui";

import { StudioSceneCard } from "../../../components/collectible-visuals";
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
  const roleCopy = access?.role ?? "viewer";

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
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-[color:var(--color-line)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Workspace · {workspaceStatus}
        </span>
        <span className="rounded-full border border-[color:var(--color-line)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Role · {roleCopy}
        </span>
        <span className="rounded-full border border-[color:var(--color-line)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Scope · {workspaceSlug}
        </span>
      </div>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] xl:items-start">
        <LightOperatorPanel
          detail="Keep one selected workspace as the control boundary while source intake, curation, publication, commerce, and audit-safe follow-through stay readable in the same studio rhythm."
          eyebrow="Studio overview"
          title={workspaceName}
        >
          <ol className="grid gap-4 border-t border-[color:var(--color-line)]/75 pt-5 sm:grid-cols-2">
            <li className="border-l border-[color:var(--color-line)]/75 pl-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
                01 Intake
              </p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">
                Capture and process source material.
              </p>
            </li>
            <li className="border-l border-[color:var(--color-line)]/75 pl-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
                02 Curate
              </p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">
                Approve outputs into release-ready drafts.
              </p>
            </li>
            <li className="border-l border-[color:var(--color-line)]/75 pl-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
                03 Publish
              </p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">
                Push immutable targets without leaving the studio shell.
              </p>
            </li>
            <li className="border-l border-[color:var(--color-line)]/75 pl-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
                04 Operate
              </p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">
                Track checkout, fulfillment, and recovery inside the same scope.
              </p>
            </li>
          </ol>
          <dl className="mt-5 grid gap-4 border-t border-[color:var(--color-line)]/75 pt-5 sm:grid-cols-2">
            <div className="grid gap-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                Workspace slug
              </dt>
              <dd className="text-sm text-[color:var(--color-text)]">
                {workspaceSlug}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                Owner
              </dt>
              <dd className="text-sm text-[color:var(--color-text)]">
                {ownerAddress}
              </dd>
            </div>
          </dl>
        </LightOperatorPanel>

        <StudioSceneCard
          eyebrow="Creator-side depth"
          note="Studio should stay premium and product-like, with one visual support surface that reinforces launch preparation instead of breaking the overview into more dashboard cards."
          title="Preview-led launch preparation"
        />
      </section>

      <SurfaceCard
        body="Move between the major studio surfaces from one route list instead of scanning another field of equally loud cards."
        eyebrow="Studio surfaces"
        title="Where to operate next"
        className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,246,255,0.9))]"
      >
        <div className="mt-4 grid gap-4 border-t border-[color:var(--color-line)]/75 pt-5 md:grid-cols-2">
          {studioModules.map((module, index) => (
            <div
              className="grid gap-2 border-l border-[color:var(--color-line)]/75 pl-4"
              key={module.title}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
                0{index + 1}
              </p>
              <h3 className="text-lg font-semibold text-[color:var(--color-text)]">
                {module.title}
              </h3>
              <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                {module.description}
              </p>
              <div>
                <ActionLink href={module.href} tone="inline">
                  Open {module.title.toLowerCase()}
                </ActionLink>
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </PageShell>
  );
}
