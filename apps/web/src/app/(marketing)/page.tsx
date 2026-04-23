import {
  ActionLink,
  ActionRow,
  CollectibleCard,
  EditorialSection,
  PremiumCtaCard,
  ProofBadge
} from "@ai-nft-forge/ui";

import {
  CollectibleEditorialBand,
  CollectibleHeroArtwork,
  CollectiblePreviewCard,
  CollectibleGalleryRail,
  resolveCollectibleArtworkUrl
} from "../../components/collectible-visuals";

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
    metrics: [
      "Ready for public drop",
      "Chain metadata generated",
      "Static media snapshot"
    ]
  },
  {
    cadence: "Collector program",
    focus: "Seasonal release",
    title: "Seasonal Capsule",
    trust: "Editioned · Checkout gated · Immutable view",
    metrics: [
      "Live availability controls",
      "Inventory reservation",
      "Static storefront publish"
    ]
  },
  {
    cadence: "Brand rollout",
    focus: "Multi-release floor",
    title: "Brand Pulse",
    trust: "Brand presets · Archive rails · Route-ready",
    metrics: [
      "Brand storefront route",
      "Release state controls",
      "Metadata endpoints"
    ]
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

const heroWorkflow = [
  {
    label: "01",
    title: "Intake",
    detail: "Signed upload flow"
  },
  {
    label: "02",
    title: "Curate",
    detail: "Editorial approval"
  },
  {
    label: "03",
    title: "Publish",
    detail: "Immutable snapshot"
  },
  {
    label: "04",
    title: "Verify",
    detail: "Mint-state checks"
  }
] as const;

const featuredProofPoints = proofPoints.slice(0, 2);
const supportingProofPoints = proofPoints.slice(2);
const leadReleasePreview = releasePreviews[0];
const supportingReleasePreviews = releasePreviews.slice(1);

export default function MarketingPage() {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-7 px-4 pb-12 pt-6 md:px-6">
      <EditorialSection
        actions={
          <ActionRow compact>
            <ActionLink href="/studio" tone="action">
              Enter Studio
            </ActionLink>
            <ActionLink href="/brands/demo-studio" tone="muted">
              Visit demo storefront
            </ActionLink>
          </ActionRow>
        }
        className="relative isolate overflow-hidden md:p-10"
        eyebrow="AI NFT Forge"
        lead="A self-hosted product platform for teams that need reliable creative pipelines, deterministic storefront publishing, and chain-aware release controls in one place."
        title="Build launch infrastructure for premium collectible campaigns."
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_14%_10%,_rgba(255,255,255,0.45),_transparent),radial-gradient(35%_35%_at_82%_18%,rgba(139,94,52,0.18),transparent),linear-gradient(180deg,rgba(255,255,255,0.12),transparent)]" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.14fr)_minmax(300px,0.86fr)] lg:items-start">
          <div className="grid gap-5">
            <div className="flex flex-wrap gap-2">
              <ProofBadge tone="default">Shell · Light-only</ProofBadge>
              <ProofBadge tone="default">Commerce · Reserve-ready</ProofBadge>
              <ProofBadge tone="default">Trust · Wallet verified</ProofBadge>
            </div>
            <div className="rounded-[1.85rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,244,255,0.82))] p-6 shadow-[0_20px_48px_rgba(190,197,227,0.14)]">
              <div className="flex flex-wrap items-center gap-3">
                <ProofBadge tone="accent">Release map</ProofBadge>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                  Control-plane workflow
                </p>
              </div>
              <h3 className="mt-4 max-w-3xl font-[var(--font-display)] text-2xl font-semibold tracking-tight text-[color:var(--color-text)] sm:text-[2rem]">
                Arrange launch work into one readable operating rhythm.
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--color-muted)]">
                Intake, curation, publication, and verification live in one
                surface so launch teams stop bouncing between disconnected
                media, commerce, and chain tooling.
              </p>
              <ol className="mt-6 grid gap-4 border-t border-[color:var(--color-line)]/80 pt-5 sm:grid-cols-2 xl:grid-cols-4">
                {heroWorkflow.map((step) => (
                  <li
                    className="border-l border-[color:var(--color-line)]/80 pl-4"
                    key={step.label}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
                      {step.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[color:var(--color-text)]">
                      {step.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--color-muted)]">
                      {step.detail}
                    </p>
                  </li>
                ))}
              </ol>
              <dl className="mt-6 grid gap-4 border-t border-[color:var(--color-line)]/80 pt-5 sm:grid-cols-2">
                <div className="grid gap-1">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                    Launch posture
                  </dt>
                  <dd className="text-sm leading-6 text-[color:var(--color-text)]">
                    Wallet-authenticated operators, deterministic storefront
                    publish, and reservation coverage stay in the same release
                    rhythm.
                  </dd>
                </div>
                <div className="grid gap-1">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                    Studio fit
                  </dt>
                  <dd className="text-sm leading-6 text-[color:var(--color-text)]">
                    Built for teams moving from campaign experiments to
                    enterprise launch operations without changing shells.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          <CollectibleHeroArtwork
            badge="Hero release"
            details={[
              { label: "Mood", value: "Editorial light" },
              { label: "Frame", value: "Gallery hero" },
              {
                label: "Collectible language",
                value:
                  "Artwork stays first while proof and launch facts sit in one quiet support rail."
              }
            ]}
            fallbackIndex={0}
            imageAlt="AI NFT Forge showcase artwork"
            mediaClassName="mx-auto aspect-[4/5] max-h-[28rem] sm:aspect-[3/4] sm:max-h-[32rem] xl:aspect-[5/6] xl:max-h-[36rem] xl:max-w-[30rem]"
            meta="Generation intake · Snapshot publish · Mint verification"
            note="The hero surface carries one release story instead of surrounding the artwork with competing sidecars."
            title="Launch plane"
          />
        </div>
      </EditorialSection>

      <CollectibleGalleryRail
        accentVar="--color-accent"
        headline="Capability proof"
        summary="Built for teams that ship collectible launches, not prototypes."
      >
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(300px,0.92fr)]">
          <div className="grid gap-4 md:grid-cols-2">
            {featuredProofPoints.map((point, index) => (
              <CollectibleCard
                badge="Capability"
                className="bg-[color:var(--color-surface)]"
                imageAlt={point.title}
                imageUrl={resolveCollectibleArtworkUrl(index + 2)}
                key={point.title}
                mediaClassName="aspect-[5/4] md:aspect-[4/3]"
                meta="Launch-ready module"
                title={point.title}
              >
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
                  {point.detail}
                </p>
              </CollectibleCard>
            ))}
          </div>
          <div className="rounded-[1.85rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,246,255,0.92))] p-5 shadow-[0_18px_42px_rgba(191,197,226,0.14)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
              Operational proof
            </p>
            <h3 className="mt-3 text-xl font-semibold text-[color:var(--color-text)]">
              Supporting capabilities stay compact and scannable.
            </h3>
            <div className="mt-5 grid gap-4 border-t border-[color:var(--color-line)]/80 pt-5">
              {supportingProofPoints.map((point) => (
                <div
                  className="grid gap-2 border-l border-[color:var(--color-line)]/80 pl-4"
                  key={point.title}
                >
                  <p className="text-sm font-semibold text-[color:var(--color-text)]">
                    {point.title}
                  </p>
                  <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                    {point.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollectibleGalleryRail>

      <CollectibleGalleryRail
        accentVar="--color-accent"
        headline="How it works"
        summary="A premium workflow from intake to fulfillment."
      >
        <ol className="grid gap-3 md:grid-cols-2">
          {processSteps.map((step, index) => (
            <li
              className="rounded-[1.6rem] border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] p-4 shadow-[0_16px_30px_rgba(191,197,226,0.14)]"
              key={step.action}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
                Step {(index + 1).toString().padStart(2, "0")}
              </p>
              <ProofBadge className="mt-2" tone="default">
                {step.action}
              </ProofBadge>
              <h3 className="mt-1 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--color-muted)]">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </CollectibleGalleryRail>

      <CollectibleEditorialBand>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.04fr)_minmax(300px,0.96fr)] xl:items-start">
          <div className="space-y-4">
            <ProofBadge tone="accent">Showcase preview</ProofBadge>
            <h2 className="mt-3 max-w-3xl text-2xl font-semibold">
              Launch modules that mirror real production drop workflows.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--color-muted)]">
              The storefront needs one dominant hero composition, then a
              supporting rhythm of collectible cards and editorial rails that
              keep media presentation in the foreground.
            </p>
            {leadReleasePreview ? (
              <div className="rounded-[1.85rem] border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)]/55 p-3 shadow-[0_20px_44px_rgba(191,197,226,0.14)]">
                <CollectiblePreviewCard
                  badge={leadReleasePreview.cadence}
                  className="bg-transparent p-0 shadow-none"
                  fallbackIndex={1}
                  imageAlt={`${leadReleasePreview.title} showcase artwork`}
                  key={leadReleasePreview.title}
                  mediaClassName="aspect-[3/4] max-h-[20rem] md:max-h-[22rem]"
                  meta={leadReleasePreview.focus}
                  subtitle={leadReleasePreview.trust}
                  title={leadReleasePreview.title}
                />
                <ul className="mt-4 grid gap-2 border-t border-[color:var(--color-line)]/80 pt-4 text-sm text-[color:var(--color-muted)] sm:grid-cols-3">
                  {leadReleasePreview.metrics.map((metric) => (
                    <li
                      className="border-l border-[color:var(--color-line)]/80 pl-3"
                      key={metric}
                    >
                      {metric}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            {supportingReleasePreviews.map((release, index) => (
              <div
                className="rounded-[1.7rem] border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)]/48 p-3 shadow-[0_16px_36px_rgba(191,197,226,0.12)]"
                key={release.title}
              >
                <CollectiblePreviewCard
                  badge={release.cadence}
                  className="bg-transparent p-0 shadow-none"
                  fallbackIndex={index + 2}
                  imageAlt={`${release.title} showcase artwork`}
                  mediaClassName="aspect-[4/5] md:aspect-[3/4] max-h-[18rem]"
                  meta={release.focus}
                  subtitle={release.trust}
                  title={release.title}
                />
                <ul className="mt-4 space-y-2 border-t border-[color:var(--color-line)]/80 pt-4 text-sm text-[color:var(--color-muted)]">
                  {release.metrics.map((metric) => (
                    <li
                      className="border-l border-[color:var(--color-line)]/80 pl-3"
                      key={metric}
                    >
                      {metric}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </CollectibleEditorialBand>

      <CollectibleGalleryRail
        accentVar="--color-accent"
        headline="Who it is for"
        summary="Crafted for teams operating collectible launches at scale."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {audienceProfiles.map((audience) => (
            <PremiumCtaCard
              className="bg-[linear-gradient(145deg,#fffaf0,#f7fbff_52%,#faf2ff)]"
              detail={audience.statement}
              eyebrow="Audience"
              key={audience.role}
              title={audience.role}
            >
              <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-muted)]">
                {audience.outcomes.map((outcome) => (
                  <li className="pl-2" key={outcome}>
                    {outcome}
                  </li>
                ))}
              </ul>
            </PremiumCtaCard>
          ))}
        </div>
      </CollectibleGalleryRail>

      <CollectibleGalleryRail
        accentVar="--color-accent"
        headline="Product direction"
        summary="Move from mockups to live drops with predictable boundaries and
            production-minded operational posture."
      >
        <PremiumCtaCard
          detail="Move from mockups to live drops with predictable boundaries and a production-minded operational posture."
          eyebrow="Product direction"
          title="AI NFT Forge is built for premium launches under real operational pressure."
        >
          <ActionRow compact>
            <ActionLink href="/studio" tone="action">
              Open studio
            </ActionLink>
            <ActionLink href="/brands/demo-studio" tone="muted">
              Explore public routes
            </ActionLink>
          </ActionRow>
        </PremiumCtaCard>
      </CollectibleGalleryRail>
    </div>
  );
}
