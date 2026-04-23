import type { ReactNode } from "react";

import {
  cn,
  CollectibleCard,
  GalleryRail,
  ProofBadge,
  ThumbnailStrip
} from "@ai-nft-forge/ui";

type CollectibleHeroArtworkProps = {
  accentVar?: string;
  badge?: string | undefined;
  className?: string;
  details?:
    | Array<{
        label: string;
        value: string;
      }>
    | undefined;
  fallbackIndex?: number | undefined;
  imageAlt: string;
  imageUrl?: string | null | undefined;
  meta?: string | undefined;
  note?: string | undefined;
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
  details,
  fallbackIndex,
  imageAlt,
  imageUrl,
  meta,
  note,
  title
}: CollectibleHeroArtworkProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[2rem] border border-[color:var(--color-line)] bg-[linear-gradient(145deg,#fff9f2,#f6fbff_54%,#fbf2ff)] p-5 shadow-[0_28px_78px_rgba(190,197,227,0.2)]",
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(165,143,255,0.14),transparent_26%),radial-gradient(circle_at_86%_12%,rgba(124,204,247,0.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.18),transparent)]" />
      <div
        className="absolute -left-8 top-20 h-32 w-32 rounded-full blur-3xl"
        style={{ backgroundColor: `var(${accentVar})`, opacity: 0.14 }}
      />
      <div className="relative grid gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ProofBadge tone="accent">{badge ?? "Featured release"}</ProofBadge>
          {meta ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
              {meta}
            </p>
          ) : null}
        </div>
        <h3 className="font-[var(--font-display)] text-2xl font-semibold text-[color:var(--color-text)] md:text-3xl">
          {title}
        </h3>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(220px,0.92fr)] xl:items-start">
          <div className="overflow-hidden rounded-[1.7rem] border border-white/80 bg-white/76 shadow-[0_18px_46px_rgba(190,197,227,0.18)]">
            {imageUrl ? (
              <img
                alt={imageAlt}
                className="aspect-[4/5] w-full object-cover"
                src={imageUrl}
              />
            ) : (
              <img
                alt={imageAlt}
                className="aspect-[4/5] w-full object-cover"
                src={resolveCollectibleArtworkUrl(fallbackIndex ?? 0)}
              />
            )}
          </div>
          <div className="rounded-[1.55rem] border border-white/80 bg-white/72 p-4 shadow-[0_18px_40px_rgba(190,197,227,0.14)]">
            {details && details.length > 0 ? (
              <dl className="grid gap-4">
                {details.map((detail, index) => (
                  <div
                    className={cn(
                      "grid gap-1",
                      index > 0
                        ? "border-t border-[color:var(--color-line)]/75 pt-4"
                        : undefined
                    )}
                    key={`${detail.label}-${detail.value}`}
                  >
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                      {detail.label}
                    </dt>
                    <dd className="text-sm leading-6 text-[color:var(--color-text)]">
                      {detail.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {note ? (
              <p
                className={cn(
                  "text-sm leading-6 text-[color:var(--color-muted)]",
                  details && details.length > 0
                    ? "mt-4 border-t border-[color:var(--color-line)]/75 pt-4"
                    : undefined
                )}
              >
                {note}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
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
          <dl className="mt-4 grid gap-3 border-t border-[color:var(--color-line)]/75 pt-4 sm:grid-cols-2">
            <div className="grid gap-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Workspace mood
              </dt>
              <dd className="text-sm text-[color:var(--color-text)]">
                Creative
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Visual density
              </dt>
              <dd className="text-sm text-[color:var(--color-text)]">
                Focused
              </dd>
            </div>
          </dl>
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
