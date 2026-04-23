import Link from "next/link";
import {
  ActionLink,
  ActionRow,
  CollectibleCard,
  EditorialSection,
  PremiumCtaCard,
  ProofBadge,
  StatChip
} from "@ai-nft-forge/ui";

import {
  CollectibleEditorialBand,
  CollectibleHeroArtwork,
  CollectiblePreviewCard,
  CollectibleGalleryRail,
  FloatingCollectibleCluster
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
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatChip label="Shell" tone="accent" value="Light-only" />
              <StatChip label="Commerce" tone="sky" value="Reserve-ready" />
              <StatChip label="Trust" tone="mint" value="Wallet verified" />
            </div>
            <p className="text-sm leading-6 text-[color:var(--color-muted)]">
              Designed for teams that scale from campaign experiments to
              enterprise launch operations.
            </p>
          </div>
          <CollectibleHeroArtwork
            badge="Hero release"
            imageAlt="AI NFT Forge showcase artwork"
            meta="Generation intake · Snapshot publish · Mint verification"
            title="Launch plane"
          />
        </div>
      </EditorialSection>

      <CollectibleGalleryRail
        accentVar="--color-accent"
        headline="Capability proof"
        summary="Built for teams that ship collectible launches, not prototypes."
      >
        <div className="mt-1">
          <h2 className="max-w-3xl text-2xl font-semibold">
            Built for teams that ship collectible launches, not prototypes.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {proofPoints.map((point) => (
            <CollectibleCard
              badge="Capability"
              className="bg-[color:var(--color-surface)]"
              imageAlt={point.title}
              key={point.title}
              meta="Shared primitive surface"
              title={point.title}
            >
              <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
                {point.detail}
              </p>
            </CollectibleCard>
          ))}
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

      <FloatingCollectibleCluster
        headline="Showcase rails should feel like premium collectible shelves."
        items={["Framed editions", "Spotlight drops", "Launch capsules"]}
        label="Art-directed composition"
      />

      <CollectibleEditorialBand>
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
          <div>
            <ProofBadge tone="accent">Showcase preview</ProofBadge>
            <h2 className="mt-3 max-w-3xl text-2xl font-semibold">
              Launch modules that mirror real production drop workflows.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--color-muted)]">
              The storefront needs one dominant hero composition, then a
              supporting rhythm of collectible cards and editorial rails that
              keep media presentation in the foreground.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {releasePreviews.map((release) => (
              <CollectiblePreviewCard
                badge={release.cadence}
                className="bg-[color:var(--color-surface-strong)]/55"
                imageAlt={`${release.title} showcase artwork`}
                key={release.title}
                meta={release.focus}
                subtitle={release.trust}
                title={release.title}
              />
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
