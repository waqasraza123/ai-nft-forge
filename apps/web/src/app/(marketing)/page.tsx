import Link from "next/link";

type MarketingProofPoint = {
  title: string;
  detail: string;
};

type MarketingProcessStep = {
  action: string;
  description: string;
  title: string;
};

type MarketingShowcaseRelease = {
  cadence: string;
  focus: string;
  metrics: string[];
  title: string;
  trust: string;
};

type MarketingAudience = {
  role: string;
  outcomes: string[];
  statement: string;
};

const proofPoints: MarketingProofPoint[] = [
  {
    title: "Self-hosted platform",
    detail:
      "Run the full stack inside your infrastructure with workspace-aware control and no template-driven lock-in."
  },
  {
    title: "Wallet-authenticated operations",
    detail:
      "Operator actions, workspace access, and protected mutations stay aligned with session-owned authorization."
  },
  {
    title: "Chain-aware release control",
    detail:
      "Deploy and mint through wallet paths with server-side receipt verification and immutable publication boundaries."
  },
  {
    title: "Curated collections",
    detail:
      "Publish immutable storefront slices from curated generated outputs with explicit distribution and commerce state."
  },
  {
    title: "Commerce ready",
    detail:
      "Support reservation, hosted payment, and fulfillment automation without hardcoding business rules."
  },
  {
    title: "Ops-aware guardrails",
    detail:
      "Carry operational visibility from storefront launch readiness through reconciliation, policies, and alerts."
  }
];

const processSteps: MarketingProcessStep[] = [
  {
    action: "Upload",
    title: "Foundation intake",
    description:
      "Capture source assets through signed storage writes and lock immutable draft intent through durable records."
  },
  {
    action: "Generate",
    title: "Variant synthesis",
    description:
    "Create collectible variants through queue-backed workers with durable request tracking."
  },
  {
    action: "Curate",
    title: "Editorial filtering",
    description:
      "Approve and stage outputs into a release-ready sequence before publication."
  },
  {
    action: "Publish",
    title: "Snapshot release",
    description:
      "Publish immutable storefront snapshots and merchandising states behind workspace-brand configuration."
  },
  {
    action: "Reserve",
    title: "Checkout readiness",
    description:
      "Reserve edition windows with clear supply controls before external payment movement."
  },
  {
    action: "Mint",
    title: "Verified fulfillment",
    description:
      "Create intent, verify chain state, and maintain fulfillment safety signals during reconciliation."
  }
];

const releasePreviews: MarketingShowcaseRelease[] = [
  {
    cadence: "Creator campaign",
    focus: "Collection launch",
    title: "Series One",
    trust: "Curated · White-label · Wallet verified",
    metrics: ["Ready for public drop", "Chain metadata generated", "Static media snapshot"]
  },
  {
    cadence: "Collector program",
    focus: "Seasonal release",
    title: "Seasonal Capsule",
    trust: "Editioned · Checkout gated · Immutable view",
    metrics: ["Live availability controls", "Inventory reservation", "Static storefront publish"]
  },
  {
    cadence: "Brand rollout",
    focus: "Multi-release floor",
    title: "Brand Pulse",
    trust: "Brand presets · Archive rails · Route-ready",
    metrics: ["Brand storefront route", "Release state controls", "Metadata endpoints"]
  }
];

const audienceProfiles: MarketingAudience[] = [
  {
    role: "Agencies",
    statement:
      "Deliver premium collectible experiences with consistent brand packaging across every campaign.",
    outcomes: [
      "White-label storefront appearance per brand",
      "Single control plane for multiple launches",
      "Consistent governance across operators"
    ]
  },
  {
    role: "Creator studios",
    statement:
      "Run intensive generation loops while keeping launch controls explicit and auditable.",
    outcomes: [
      "Repeatable upload-to-release flow",
      "Editorial curation before publication",
      "Chain operations and commerce control in one surface"
    ]
  },
  {
    role: "Collectible brands",
    statement:
      "Keep launch operations disciplined while preserving creative iteration and iteration-safe workflows.",
    outcomes: [
      "Brand-specific storefront shells",
      "Immutable snapshot publication",
      "Workspace-scoped commerce state tracking"
    ]
  },
  {
    role: "Launch operators",
    statement:
      "Operate demand windows with predictable observability and recovery paths.",
    outcomes: [
      "Workspace-aware governance",
      "Reconciliation and delivery workflows",
      "Clear route from launch to recovery"
    ]
  }
];

export default function MarketingPage() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-7 px-4 pb-12 pt-6 md:px-6">
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-white/15 bg-[color:var(--color-surface-strong)]/75 p-6 shadow-[var(--shadow-surface)] backdrop-blur-sm md:p-10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_15%_10%,_rgba(255,255,255,0.28),_transparent),radial-gradient(40%_40%_at_85%_85%,rgba(139,94,52,0.24),transparent)]" />
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-text)]">
              AI NFT Forge
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold font-[var(--font-display)] leading-tight text-[color:var(--color-text)] md:text-5xl">
              Build launch infrastructure for premium collectible campaigns.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-[color:var(--color-muted)] md:text-base">
              A self-hosted product platform for teams that need reliable creative
              pipelines, deterministic storefront publishing, and chain-aware release
              controls in one place.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center rounded-full border border-[color:var(--color-accent)] bg-[color:var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
                href="/studio"
              >
                Enter Studio
              </Link>
              <Link
                className="inline-flex items-center rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-accent-soft)]"
                href="/brands/demo-studio"
              >
                Visit demo storefront
              </Link>
            </div>
            <p className="text-sm leading-6 text-[color:var(--color-muted)]">
              Designed for teams that scale from campaign experiments to enterprise
              launch operations.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)]/80 p-6">
            <div className="grid gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
                Cinematic Surface
              </p>
              <p className="text-lg font-semibold">Launch plane</p>
              <p className="text-sm text-[color:var(--color-muted)]">
                Route-aware publication shell with deterministic storefront snapshots,
                immutable campaign context, and premium operator controls.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-1 text-xs text-[color:var(--color-text)]">
                  Generation intake
                </span>
                <span className="rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-1 text-xs text-[color:var(--color-text)]">
                  Publish snapshots
                </span>
                <span className="rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-1 text-xs text-[color:var(--color-text)]">
                  Mint verification
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-surface)] md:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
          Capability proof
        </p>
        <h2 className="mb-5 max-w-3xl text-2xl font-semibold">
          Built for teams that ship collectible launches, not prototypes.
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {proofPoints.map((point) => (
            <article
              className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-5"
              key={point.title}
            >
              <h3 className="text-lg font-semibold">{point.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
                {point.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-surface)] md:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
          How it works
        </p>
        <h2 className="mb-5 max-w-3xl text-2xl font-semibold">
          A premium workflow from intake to fulfillment.
        </h2>
        <ol className="grid gap-3 md:grid-cols-2">
          {processSteps.map((step, index) => (
            <li
              className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] p-4"
              key={step.action}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
                Step {(index + 1).toString().padStart(2, "0")}
              </p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">
                {step.action}
              </p>
              <h3 className="mt-1 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--color-muted)]">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-[2rem] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-surface)] md:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
          Showcase preview
        </p>
        <h2 className="mb-5 max-w-3xl text-2xl font-semibold">
          Launch modules that mirror real production drop workflows.
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {releasePreviews.map((release) => (
            <article
              className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-5"
              key={release.title}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] px-2.5 py-1 text-xs">
                  {release.cadence}
                </span>
                <span className="text-xs text-[color:var(--color-accent)]">
                  {release.focus}
                </span>
              </div>
              <h3 className="text-xl font-semibold">{release.title}</h3>
              <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                {release.trust}
              </p>
              <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-muted)]">
                {release.metrics.map((metric) => (
                  <li className="pl-2" key={metric}>
                    {metric}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-surface)] md:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
          Who it is for
        </p>
        <h2 className="mb-5 max-w-3xl text-2xl font-semibold">
          Crafted for teams operating collectible launches at scale.
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {audienceProfiles.map((audience) => (
            <article
              className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] p-5"
              key={audience.role}
            >
              <h3 className="text-xl font-semibold">{audience.role}</h3>
              <p className="mt-2 text-sm text-[color:var(--color-muted)]">
                {audience.statement}
              </p>
              <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-muted)]">
                {audience.outcomes.map((outcome) => (
                  <li className="pl-2" key={outcome}>
                    {outcome}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-6 shadow-[var(--shadow-surface)] md:p-8">
        <div className="grid gap-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
            Product direction
          </p>
          <h2 className="max-w-3xl text-3xl font-semibold">
            AI NFT Forge: premium launch infrastructure under operational pressure.
          </h2>
          <p className="max-w-4xl text-sm text-[color:var(--color-muted)]">
            Move from mockups to live drops with predictable boundaries and
            production-minded operational posture.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center rounded-full border border-[color:var(--color-accent)] bg-[color:var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
              href="/studio"
            >
              Open studio
            </Link>
            <Link
              className="inline-flex items-center rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-5 py-2.5 text-sm font-semibold text-[color:var(--color-text)] transition hover:bg-[color:var(--color-accent-soft)]"
              href="/brands/demo-studio"
            >
              Explore public routes
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
