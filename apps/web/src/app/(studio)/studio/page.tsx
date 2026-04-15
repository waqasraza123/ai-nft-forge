import Link from "next/link";

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
    <section className="studio-dashboard">
      <header className="studio-dashboard__hero">
        <p className="studio-dashboard__eyebrow">Operational foundation</p>
        <h1 className="studio-dashboard__title">Creator launch operating room</h1>
        <p className="studio-dashboard__lead">
          Keep one workspace in focus while moving from source capture to collection
          release, and then to owner-side commerce supervision. This is your
          operator command surface for the next safe action.
        </p>
        <div className="studio-dashboard__actions">
          <Link className="button-action button-action--accent" href={primaryDestination}>
            {nextActionLabel}
          </Link>
          <Link className="action-link" href="/studio/collections">
            Review latest collections
          </Link>
          <Link className="inline-link" href="/">
            Return to marketing
          </Link>
        </div>
      </header>
      <section className="studio-dashboard__context">
        <article className="studio-dashboard__panel">
          <h2 className="studio-dashboard__panel-title">Current workspace context</h2>
          <dl className="studio-dashboard__meta">
            <div>
              <dt>Workspace</dt>
              <dd>{workspaceName}</dd>
            </div>
            <div>
              <dt>Slug</dt>
              <dd>{workspaceSlug}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{workspaceStatus}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{roleCopy}</dd>
            </div>
            <div>
              <dt>Workspace owner</dt>
              <dd>{ownerAddress}</dd>
            </div>
          </dl>
        </article>
        <article className="studio-dashboard__panel">
          <h2 className="studio-dashboard__panel-title">Operational rhythm</h2>
          <p>
            Work with this sequence: capture source assets, curate collections, run
            storefront release preparation, then monitor fulfillment and delivery.
          </p>
          <ol className="studio-dashboard__path">
            <li>Capture and process source material.</li>
            <li>Approve and curate outputs into release drafts.</li>
            <li>Publish from draft once review constraints pass.</li>
            <li>Close the loop with checkout and fulfillment health.</li>
          </ol>
          <p className="studio-dashboard__focus">
            All actions are scoped to the selected workspace and remain protected by
            auth boundaries.
          </p>
        </article>
      </section>
      <section className="studio-dashboard__modules" aria-label="Primary studio areas">
        {studioModules.map((module, index) => (
          <article className="studio-dashboard__module" key={module.title}>
            <span className="studio-dashboard__module-index">0{index + 1}</span>
            <h2 className="studio-dashboard__module-title">{module.title}</h2>
            <p>{module.description}</p>
            <Link className="studio-dashboard__module-link" href={module.href}>
              Open {module.title.toLowerCase()}
            </Link>
          </article>
        ))}
      </section>
    </section>
  );
}
