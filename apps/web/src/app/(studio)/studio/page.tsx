import { ActionLink } from "@ai-nft-forge/ui";

import {
  CollectibleEditorialBand,
  CollectiblePreviewCard,
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
    <section className="space-y-6">
      <header className="rounded-3xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)]/80 p-6 shadow-[var(--shadow-surface)]">
        <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
              Operational foundation
            </p>
            <h1 className="mt-2 text-3xl font-semibold font-[var(--font-display)]">
              Creator launch operating room
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-[color:var(--color-muted)]">
              Keep one workspace in focus while moving from source capture to
              collection release, and then to owner-side commerce supervision.
              This is the premium creator-side operating surface for the next
              safe action.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionLink href={primaryDestination} tone="action">
                {nextActionLabel}
              </ActionLink>
              <ActionLink href="/studio/collections" tone="inline">
                Review latest collections
              </ActionLink>
              <ActionLink href="/" tone="inline">
                Return to marketing
              </ActionLink>
            </div>
          </div>
          <CollectiblePreviewCard
            badge="Studio preview"
            className="bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.03))]"
            imageAlt="Studio collectible preview"
            meta={`${workspaceStatus} workspace · ${roleCopy}`}
            subtitle={workspaceSlug}
            title={workspaceName}
          />
        </div>
      </header>
      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-5">
          <h2 className="text-xl font-semibold font-[var(--font-display)]">
            Current workspace context
          </h2>
          <dl className="mt-4 grid gap-2 text-sm">
            <div className="grid gap-0.5">
              <dt className="text-xs uppercase tracking-[0.15em] text-[color:var(--color-muted)]">
                Workspace
              </dt>
              <dd>{workspaceName}</dd>
            </div>
            <div className="grid gap-0.5">
              <dt className="text-xs uppercase tracking-[0.15em] text-[color:var(--color-muted)]">
                Slug
              </dt>
              <dd>{workspaceSlug}</dd>
            </div>
            <div className="grid gap-0.5">
              <dt className="text-xs uppercase tracking-[0.15em] text-[color:var(--color-muted)]">
                Status
              </dt>
              <dd>{workspaceStatus}</dd>
            </div>
            <div className="grid gap-0.5">
              <dt className="text-xs uppercase tracking-[0.15em] text-[color:var(--color-muted)]">
                Role
              </dt>
              <dd>{roleCopy}</dd>
            </div>
            <div className="grid gap-0.5">
              <dt className="text-xs uppercase tracking-[0.15em] text-[color:var(--color-muted)]">
                Workspace owner
              </dt>
              <dd>{ownerAddress}</dd>
            </div>
          </dl>
        </article>
        <article className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-5">
          <h2 className="text-xl font-semibold font-[var(--font-display)]">
            Operational rhythm
          </h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
            Work with this sequence: capture source assets, curate collections,
            run storefront release preparation, then monitor fulfillment and
            delivery.
          </p>
          <ol className="mt-3 list-decimal space-y-1 pl-4 text-sm text-[color:var(--color-muted)]">
            <li>Capture and process source material.</li>
            <li>Approve and curate outputs into release drafts.</li>
            <li>Publish from draft once review constraints pass.</li>
            <li>Close the loop with checkout and fulfillment health.</li>
          </ol>
          <p className="mt-3 text-sm text-[color:var(--color-muted)]">
            All actions are scoped to the selected workspace and remain
            protected by auth boundaries.
          </p>
        </article>
      </section>
      <CollectibleEditorialBand>
        <StudioSceneCard
          eyebrow="Creator-side depth"
          note="Studio should stay product-like, but preview cards, framed drop shells, and tasteful scene accents make setup feel premium rather than purely utilitarian."
          title="Preview-led launch preparation"
        />
      </CollectibleEditorialBand>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {studioModules.map((module, index) => (
          <article
            className="rounded-2xl border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] p-4 shadow-[var(--shadow-surface)]"
            key={module.title}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
              0{index + 1}
            </span>
            <h2 className="mt-2 text-lg font-semibold">{module.title}</h2>
            <p className="mt-2 text-sm text-[color:var(--color-muted)]">
              {module.description}
            </p>
            <ActionLink href={module.href} tone="inline" className="mt-4">
              Open {module.title.toLowerCase()}
            </ActionLink>
          </article>
        ))}
      </section>
    </section>
  );
}
