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
      "Run the full stack inside your own infra with wallet-bound, workspace-aware control surfaces."
  },
  {
    title: "Wallet-authenticated operations",
    detail:
      "Operator actions, workspace access, and protected mutations stay aligned with server-issued sessions."
  },
  {
    title: "Chain-aware release control",
    detail:
      "Deploy and mint through signed wallet flows with server-side receipt and state verification."
  },
  {
    title: "Curated collections",
    detail:
      "Publish immutable collection snapshots from curated generated outputs and lock launch presentation."
  },
  {
    title: "Commerce ready",
    detail:
      "Support reservation, hosted checkout, and fulfillment automation without hardcoding sale logic."
  },
  {
    title: "Ops-aware guardrails",
    detail:
      "Clear status surfaces from launch readiness through reconciliation and lifecycle controls."
  }
];

const processSteps: MarketingProcessStep[] = [
  {
    action: "Upload",
    title: "Foundation intake",
    description:
      "Collect source assets through secure signed storage uploads and lock the production intent in durable rows."
  },
  {
    action: "Generate",
    title: "Variant synthesis",
    description:
      "Create AI-assisted collectible variants through worker-owned queue execution with durable request tracking."
  },
  {
    action: "Curate",
    title: "Editorial filtering",
    description:
      "Moderate, select, and sequence outputs into a release-ready editorial stream."
  },
  {
    action: "Publish",
    title: "Snapshot release",
    description:
      "Publish immutable storefront slices and merchandising settings behind brand and workspace context."
  },
  {
    action: "Reserve",
    title: "Checkout readiness",
    description:
      "Reserve specific editions for purchase, and enforce supply and availability states before intent."
  },
  {
    action: "Mint",
    title: "Verified fulfillment",
    description:
      "Create onchain mint intent, verify chain state, and trigger fulfillment recovery automation as needed."
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
      "Public media snapshot"
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
      "Multiple release states",
      "Metadata endpoints"
    ]
  }
];

const audienceProfiles: MarketingAudience[] = [
  {
    role: "Agencies",
    statement:
      "Deliver premium collectible drops with consistent brand packaging for every client campaign.",
    outcomes: [
      "White-label storefront appearance per brand",
      "One control plane for multiple launch programs",
      "Consistent governance across operators and clients"
    ]
  },
  {
    role: "Creator studios",
    statement:
      "Run generation-heavy programs without engineering noise while keeping launch control explicit.",
    outcomes: [
      "Repeatable upload-to-release flow",
      "Editorial curation before publication",
      "Chain launch and fulfillment workflows in one seam"
    ]
  },
  {
    role: "Collectible brands",
    statement:
      "Keep brand drops operationally disciplined while preserving artistic experimentation.",
    outcomes: [
      "Brand-native route shells and release messaging",
      "Immutable published snapshots",
      "Commerce state tied to official collection status"
    ]
  },
  {
    role: "Launch operators",
    statement:
      "Operate high-stakes drop windows with predictable observability and recovery paths.",
    outcomes: [
      "Workspace-aware route governance",
      "Operational state for reconciliation and deliveries",
      "Clear end-to-end progression from upload to mint"
    ]
  }
];

export default function MarketingPage() {
  return (
    <div className="marketing-page">
      <section className="marketing-section marketing-hero">
        <div className="marketing-hero__copy">
          <p className="marketing-kicker">AI NFT Forge</p>
          <h1 className="marketing-title">
            Build launch-ready collectible infrastructure for premium campaigns.
          </h1>
          <p className="marketing-lead">
            AI NFT Forge is a web3 product platform for teams that need reliable
            creative pipelines, deterministic storefront publishing, and
            chain-aware release controls in one self-hosted stack.
          </p>
          <div className="marketing-hero__actions">
            <Link
              className="marketing-cta marketing-cta--primary"
              href="/studio"
            >
              Enter Studio
            </Link>
            <Link
              className="marketing-cta marketing-cta--secondary"
              href="/brands/demo-studio"
            >
              Visit demo storefront
            </Link>
          </div>
          <p className="marketing-hero__note">
            Positioned between AI generation, branded storefront publishing, and
            onchain settlement, with product boundaries kept explicit.
          </p>
        </div>
        <div className="marketing-hero__visual" aria-hidden="true">
          <div className="marketing-visual-core">
            <span className="marketing-visual-core__grain" />
            <span className="marketing-visual-core__orbit" />
            <span className="marketing-visual-core__badge">Launch plane</span>
            <div className="marketing-visual-core__status">
              <h2>Live release surface</h2>
              <p>Route-aware publication shell</p>
            </div>
            <div className="marketing-visual-core__stack">
              <span>Generation intake</span>
              <span>Publish snapshots</span>
              <span>Mint verification</span>
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <p className="marketing-section-kicker">Capability proof</p>
        <h2 className="marketing-section-title">
          Built for teams that ship collectible launches, not prototypes.
        </h2>
        <div className="marketing-proof-grid">
          {proofPoints.map((point) => (
            <article className="marketing-proof-item" key={point.title}>
              <h3 className="marketing-proof-item__title">{point.title}</h3>
              <p className="marketing-proof-item__detail">{point.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section">
        <p className="marketing-section-kicker">How it works</p>
        <h2 className="marketing-section-title">
          A premium workflow from intake to fulfillment.
        </h2>
        <ol className="marketing-process-list">
          {processSteps.map((step, index) => (
            <li className="marketing-process-step" key={step.action}>
              <span className="marketing-process-step__index">
                {(index + 1).toString().padStart(2, "0")}
              </span>
              <div>
                <p className="marketing-process-step__action">{step.action}</p>
                <h3 className="marketing-process-step__title">{step.title}</h3>
                <p className="marketing-process-step__description">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="marketing-section">
        <p className="marketing-section-kicker">Showcase preview</p>
        <h2 className="marketing-section-title">
          Launch modules that mirror real production drop workflows.
        </h2>
        <div className="marketing-showcase-grid">
          {releasePreviews.map((release) => (
            <article className="marketing-showcase-card" key={release.title}>
              <div className="marketing-showcase-card__header">
                <span className="marketing-showcase-card__cadence">
                  {release.cadence}
                </span>
                <span className="marketing-showcase-card__focus">
                  {release.focus}
                </span>
              </div>
              <h3 className="marketing-showcase-card__title">
                {release.title}
              </h3>
              <p className="marketing-showcase-card__trust">{release.trust}</p>
              <ul className="marketing-showcase-card__metrics">
                {release.metrics.map((metric) => (
                  <li key={metric}>{metric}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section">
        <p className="marketing-section-kicker">Who it is for</p>
        <h2 className="marketing-section-title">
          Crafted for teams operating collectible launches at scale.
        </h2>
        <div className="marketing-audience-grid">
          {audienceProfiles.map((audience) => (
            <article className="marketing-audience-card" key={audience.role}>
              <h3 className="marketing-audience-card__role">{audience.role}</h3>
              <p className="marketing-audience-card__statement">
                {audience.statement}
              </p>
              <ul className="marketing-audience-card__outcomes">
                {audience.outcomes.map((outcome) => (
                  <li key={outcome}>{outcome}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section marketing-final-cta">
        <div className="marketing-final-cta__content">
          <p className="marketing-final-cta__kicker">Product direction</p>
          <h2 className="marketing-final-cta__title">
            AI NFT Forge: launch infrastructure that stays clean under pressure.
          </h2>
          <p className="marketing-final-cta__lead">
            Move from mockups to live drops with predictable boundaries and
            production-minded operational posture.
          </p>
        </div>
        <div className="marketing-final-cta__actions">
          <Link className="marketing-cta marketing-cta--primary" href="/studio">
            Open studio
          </Link>
          <Link
            className="marketing-cta marketing-cta--secondary"
            href="/brands/demo-studio"
          >
            Explore public release routes
          </Link>
        </div>
      </section>
    </div>
  );
}
