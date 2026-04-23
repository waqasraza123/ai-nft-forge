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
  fallbackIndex?: number | undefined;
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
  fallbackIndex?: number | undefined;
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

const fallbackCollectibleArtwork = [
  "/art/web3-collectible-hero.png",
  "/art/web3-collectible-builder.png",
  "/art/web3-collectible-shard.png",
  "/art/web3-collectible-visor.png",
  "/art/web3-collectible-amethyst.png",
  "/art/web3-collectible-frost.png",
  "/art/web3-collectible-cobalt.png",
  "/art/web3-collectible-mint.png"
] as const;

export function resolveCollectibleArtworkUrl(index: number) {
  return (
    fallbackCollectibleArtwork[
      ((index % fallbackCollectibleArtwork.length) +
        fallbackCollectibleArtwork.length) %
        fallbackCollectibleArtwork.length
    ] ?? fallbackCollectibleArtwork[0]
  );
}

function createTitleArtworkIndex(title: string) {
  return Array.from(title).reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0
  );
}

function DecorativeArtwork({
  accentVar = "--color-accent",
  artworkIndex = 1,
  className
}: {
  accentVar?: string;
  artworkIndex?: number | undefined;
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
      <img
        alt=""
        className="relative h-full w-full object-cover"
        src={resolveCollectibleArtworkUrl(artworkIndex)}
      />
    </div>
  );
}

export function CollectibleHeroArtwork({
  accentVar = "--color-accent",
  badge,
  className,
  fallbackIndex,
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
      imageUrl={imageUrl ?? resolveCollectibleArtworkUrl(fallbackIndex ?? 0)}
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
          <DecorativeArtwork
            accentVar={accentVar}
            artworkIndex={1}
            className="aspect-[4/5]"
          />
          <CollectibleCard
            badge="Proof card"
            className="bg-white/72"
            imageAlt={`${title} supporting artwork`}
            imageUrl={resolveCollectibleArtworkUrl(2)}
            meta="Gallery-ready companion artwork"
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
            imageUrl: resolveCollectibleArtworkUrl(index + 1),
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
  fallbackIndex,
  imageAlt,
  imageUrl,
  meta,
  subtitle,
  title
}: CollectiblePreviewCardProps) {
  const resolvedFallbackIndex = fallbackIndex ?? createTitleArtworkIndex(title);

  return (
    <CollectibleCard
      badge={badge}
      className={className}
      imageAlt={imageAlt}
      imageUrl={imageUrl ?? resolveCollectibleArtworkUrl(resolvedFallbackIndex)}
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
        <DecorativeArtwork
          accentVar={accentVar}
          artworkIndex={3}
          className="aspect-[4/5]"
        />
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
