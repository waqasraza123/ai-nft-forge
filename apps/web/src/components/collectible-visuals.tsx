import type { ReactNode } from "react";

import {
  cn,
  CollectibleCard,
  GalleryRail,
  MediaHeroFrame,
  ProofBadge,
  StatChip,
  ThumbnailStrip
} from "@ai-nft-forge/ui";

type CollectibleHeroArtworkProps = {
  accentVar?: string;
  badge?: string | undefined;
  className?: string;
  imageAlt: string;
  imageUrl?: string | null | undefined;
  meta?: string | undefined;
  title: string;
};

type FloatingCollectibleClusterProps = {
  accentVar?: string;
  className?: string;
  headline: string;
  items: string[];
  label: string;
};

type CollectiblePreviewCardProps = {
  accentVar?: string;
  badge?: string | undefined;
  className?: string;
  imageAlt: string;
  imageUrl?: string | null | undefined;
  meta?: string | undefined;
  subtitle?: string | undefined;
  title: string;
};

type StudioSceneCardProps = {
  accentVar?: string;
  className?: string;
  eyebrow: string;
  note: string;
  title: string;
};

type CollectibleGalleryRailProps = {
  accentVar?: string;
  children: ReactNode;
  headline: string;
  className?: string;
  summary?: string;
};

function DecorativeArtwork({
  accentVar = "--color-accent",
  className
}: {
  accentVar?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-[1.7rem] border border-white/80 bg-[linear-gradient(145deg,#fff9ee,#eef7ff_56%,#fbf0ff)]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,255,255,0.98),transparent_18%),radial-gradient(circle_at_76%_22%,rgba(255,255,255,0.72),transparent_20%),linear-gradient(155deg,rgba(255,255,255,0.12),transparent_55%)]" />
      <div
        className="absolute left-[10%] top-[8%] h-32 w-32 rounded-full blur-3xl"
        style={{ backgroundColor: `var(${accentVar})`, opacity: 0.22 }}
      />
      <svg
        className="relative h-full w-full"
        fill="none"
        viewBox="0 0 520 520"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id="forge-light-panel"
            x1="86"
            x2="416"
            y1="62"
            y2="438"
          >
            <stop stopColor="#FFFDF7" />
            <stop offset="0.54" stopColor="#F3F8FF" />
            <stop
              offset="1"
              stopColor="var(--color-accent)"
              stopOpacity="0.2"
            />
          </linearGradient>
          <linearGradient
            id="forge-light-prism"
            x1="180"
            x2="370"
            y1="118"
            y2="398"
          >
            <stop stopColor="var(--color-accent)" stopOpacity="0.9" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.94" />
          </linearGradient>
        </defs>
        <rect
          fill="url(#forge-light-panel)"
          height="320"
          rx="38"
          stroke="rgba(214,219,236,0.88)"
          width="250"
          x="138"
          y="82"
        />
        <path
          d="M260 132L340 202L300 334L180 334L160 226L260 132Z"
          fill="url(#forge-light-prism)"
        />
        <path
          d="M340 202L388 176L382 304L300 334L340 202Z"
          fill="var(--color-accent)"
          opacity="0.32"
        />
        <path
          d="M160 226L118 198L148 356L180 334L160 226Z"
          fill="#FFFFFF"
          opacity="0.7"
        />
        <circle cx="114" cy="130" fill="#FFFFFF" fillOpacity="0.96" r="20" />
        <circle
          cx="404"
          cy="382"
          fill="var(--color-accent)"
          fillOpacity="0.46"
          r="28"
        />
        <rect
          fill="#FFFFFF"
          fillOpacity="0.72"
          height="72"
          rx="18"
          width="72"
          x="372"
          y="112"
        />
      </svg>
    </div>
  );
}

export function CollectibleHeroArtwork({
  accentVar = "--color-accent",
  badge,
  className,
  imageAlt,
  imageUrl,
  meta,
  title
}: CollectibleHeroArtworkProps) {
  return (
    <MediaHeroFrame
      badge={badge ?? "Featured release"}
      className={className}
      imageAlt={imageAlt}
      imageUrl={imageUrl}
      meta={meta}
      title={title}
    >
      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatChip label="Mood" tone="accent" value="Editorial light" />
          <StatChip label="Frame" tone="sky" value="Gallery hero" />
        </div>
        <div className="rounded-[1.45rem] border border-[color:var(--color-line)] bg-white/76 p-3 shadow-[0_14px_32px_rgba(189,197,226,0.15)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
            Collectible language
          </p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
            Framed media, proof chips, and soft-tinted elevation keep the hero
            artwork first without falling back to dark glass surfaces.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <DecorativeArtwork accentVar={accentVar} className="aspect-[4/5]" />
          <CollectibleCard
            badge="Proof card"
            className="bg-white/72"
            imageAlt={`${title} supporting artwork`}
            imageUrl={null}
            meta="Gallery-ready placeholder composition"
            subtitle="Secondary frame"
            title="Collector preview"
          />
        </div>
      </div>
    </MediaHeroFrame>
  );
}

export function FloatingCollectibleCluster({
  accentVar = "--color-accent",
  className,
  headline,
  items,
  label
}: FloatingCollectibleClusterProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,244,255,0.92))] p-6 shadow-[var(--shadow-surface)]",
        className
      )}
    >
      <div
        className="absolute -right-10 top-6 h-48 w-48 rounded-full blur-3xl"
        style={{ backgroundColor: `var(${accentVar})`, opacity: 0.14 }}
      />
      <div className="relative grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="space-y-3">
          <ProofBadge tone="accent">{label}</ProofBadge>
          <h3 className="font-[var(--font-display)] text-3xl font-semibold text-[color:var(--color-text)]">
            {headline}
          </h3>
          <p className="text-sm leading-7 text-[color:var(--color-muted)]">
            Use a shelf of framed collectibles and shorter editorial copy blocks
            to keep gallery routes premium, image-led, and easier to scan.
          </p>
        </div>
        <ThumbnailStrip
          accentColorVar={accentVar}
          items={items.map((item, index) => ({
            imageAlt: item,
            imageUrl: null,
            label: item,
            meta:
              index === 0
                ? "Feature shelf"
                : index === 1
                  ? "Curated rail"
                  : "Collector stack"
          }))}
        />
      </div>
    </section>
  );
}

export function CollectiblePreviewCard({
  badge,
  className,
  imageAlt,
  imageUrl,
  meta,
  subtitle,
  title
}: CollectiblePreviewCardProps) {
  return (
    <CollectibleCard
      badge={badge}
      className={className}
      imageAlt={imageAlt}
      imageUrl={imageUrl}
      meta={meta}
      subtitle={subtitle}
      title={title}
    />
  );
}

export function StudioSceneCard({
  accentVar = "--color-accent",
  className,
  eyebrow,
  note,
  title
}: StudioSceneCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,249,255,0.94))] p-5 shadow-[var(--shadow-surface)]",
        className
      )}
    >
      <div
        className="absolute -right-10 top-4 h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: `var(${accentVar})`, opacity: 0.16 }}
      />
      <div className="relative grid gap-5 md:grid-cols-[1fr_220px] md:items-center">
        <div>
          <ProofBadge tone="accent">{eyebrow}</ProofBadge>
          <h3 className="mt-3 text-2xl font-semibold font-[var(--font-display)] text-[color:var(--color-text)]">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">
            {note}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <StatChip label="Workspace mood" tone="default" value="Creative" />
            <StatChip label="Visual density" tone="mint" value="Tighter" />
          </div>
        </div>
        <DecorativeArtwork accentVar={accentVar} className="aspect-[4/5]" />
      </div>
    </div>
  );
}

export function CollectibleEditorialBand({
  accentVar = "--color-accent",
  children,
  className
}: {
  accentVar?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,244,255,0.92))] p-6 shadow-[var(--shadow-surface)]",
        className
      )}
    >
      <div
        className="absolute -left-10 top-0 h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: `var(${accentVar})`, opacity: 0.14 }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent)]" />
      <div className="relative">{children}</div>
    </section>
  );
}

export function CollectibleGalleryRail({
  children,
  className,
  headline,
  summary
}: CollectibleGalleryRailProps) {
  return (
    <GalleryRail
      className={className}
      eyebrow={headline}
      lead={summary}
      title={headline}
    >
      {children}
    </GalleryRail>
  );
}
