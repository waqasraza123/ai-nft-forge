import type { ReactNode } from "react";

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

function accentValue(variableName: string) {
  return `var(${variableName})`;
}

function DecorativeArtwork({
  accentVar = "--color-accent",
  className
}: {
  accentVar?: string;
  className?: string;
}) {
  const accent = accentValue(accentVar);

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/80 ${className ?? ""}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.2),transparent_24%),radial-gradient(circle_at_74%_22%,rgba(255,255,255,0.12),transparent_20%),linear-gradient(145deg,rgba(255,255,255,0.06),transparent_50%)]" />
      <div
        className="absolute left-[12%] top-[10%] h-32 w-32 rounded-full blur-3xl"
        style={{ backgroundColor: accent, opacity: 0.35 }}
      />
      <div className="absolute inset-x-10 bottom-6 h-24 rounded-full bg-black/35 blur-2xl" />
      <svg
        className="relative h-full w-full"
        fill="none"
        viewBox="0 0 520 520"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="forge-panel" x1="88" x2="418" y1="56" y2="442">
            <stop stopColor="white" stopOpacity="0.96" />
            <stop offset="1" stopColor={accent} stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id="forge-prism" x1="182" x2="376" y1="118" y2="396">
            <stop stopColor={accent} stopOpacity="0.92" />
            <stop offset="1" stopColor="white" stopOpacity="0.86" />
          </linearGradient>
        </defs>
        <rect
          height="320"
          rx="36"
          stroke="rgba(255,255,255,0.18)"
          width="250"
          x="138"
          y="82"
        />
        <rect
          fill="url(#forge-panel)"
          height="320"
          rx="36"
          width="250"
          x="138"
          y="82"
        />
        <path
          d="M260 132L340 202L300 334L180 334L160 226L260 132Z"
          fill="url(#forge-prism)"
        />
        <path
          d="M340 202L388 176L382 304L300 334L340 202Z"
          fill={accent}
          opacity="0.5"
        />
        <path
          d="M160 226L118 198L148 356L180 334L160 226Z"
          fill="white"
          opacity="0.3"
        />
        <circle cx="114" cy="130" fill="white" fillOpacity="0.8" r="20" />
        <circle cx="404" cy="382" fill={accent} fillOpacity="0.7" r="28" />
        <rect
          fill="white"
          fillOpacity="0.18"
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
  const accent = accentValue(accentVar);

  return (
    <div
      className={`relative min-h-[26rem] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/75 p-5 shadow-[0_28px_90px_rgba(15,23,42,0.32)] ${className ?? ""}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(255,255,255,0.08),transparent_22%),linear-gradient(160deg,rgba(15,23,42,0.08),rgba(15,23,42,0.5))]" />
      <div
        className="absolute -left-10 top-8 h-44 w-44 rounded-full blur-3xl"
        style={{ backgroundColor: accent, opacity: 0.3 }}
      />
      <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute inset-x-10 bottom-3 h-16 rounded-full bg-black/45 blur-2xl" />
      <div className="relative grid gap-4 md:grid-cols-[1.08fr_0.92fr] md:items-end">
        <div className="relative min-h-[18rem]">
          <div className="absolute left-0 top-4 w-[72%] rotate-[-8deg]">
            <CollectiblePreviewCard
              accentVar={accentVar}
              badge={badge ?? "Featured drop"}
              imageAlt={imageAlt}
              imageUrl={imageUrl}
              meta={meta}
              subtitle="Primary edition"
              title={title}
            />
          </div>
          <div className="absolute bottom-0 right-2 w-[46%] rotate-[10deg]">
            <DecorativeArtwork accentVar={accentVar} className="aspect-[4/5]" />
          </div>
        </div>
        <div className="grid gap-3 self-start pt-4 md:pt-0">
          <div className="rounded-[1.6rem] border border-white/10 bg-white/8 p-4 backdrop-blur-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
              Collectible theater
            </p>
            <p className="mt-2 text-sm leading-6 text-white/78">
              Framed hero art, layered glow fields, and a premium release shell
              that keeps the page image-led instead of text-led.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.4rem] border border-white/10 bg-black/30 p-4 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">
                Depth
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                Layered cards
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-black/30 p-4 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">
                Surface
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                Gallery shell
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FloatingCollectibleCluster({
  accentVar = "--color-accent",
  className,
  headline,
  items,
  label
}: FloatingCollectibleClusterProps) {
  const accent = accentValue(accentVar);

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-[color:var(--color-line)] bg-[color:var(--color-surface)]/80 p-6 shadow-[var(--shadow-surface)] ${className ?? ""}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.65),transparent_22%),radial-gradient(circle_at_85%_18%,rgba(255,255,255,0.35),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.1),transparent)]" />
      <div
        className="absolute -right-10 top-8 h-44 w-44 rounded-full blur-3xl"
        style={{ backgroundColor: accent, opacity: 0.18 }}
      />
      <div className="relative grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
            {label}
          </p>
          <h3 className="text-2xl font-semibold font-[var(--font-display)] text-[color:var(--color-text)]">
            {headline}
          </h3>
          <p className="text-sm leading-7 text-[color:var(--color-muted)]">
            Collectible-focused modules with framed media, layered object forms,
            and a stronger image rhythm across the landing surface.
          </p>
        </div>
        <div className="relative min-h-[18rem]">
          {items.map((item, index) => {
            const positions = [
              "left-0 top-8 w-[40%] -rotate-[12deg]",
              "left-[24%] top-0 w-[46%] rotate-[2deg]",
              "right-0 top-10 w-[36%] rotate-[12deg]"
            ];

            return (
              <div
                className={`absolute ${positions[index] ?? positions[0]}`}
                key={item}
              >
                <div className="overflow-hidden rounded-[1.75rem] border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] p-3 shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
                  <DecorativeArtwork
                    accentVar={accentVar}
                    className="aspect-[4/5]"
                  />
                  <div className="mt-3 rounded-2xl border border-[color:var(--color-line)] bg-white/60 px-3 py-2 backdrop-blur">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                      Drop signal
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[color:var(--color-text)]">
                      {item}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function CollectiblePreviewCard({
  accentVar = "--color-accent",
  badge,
  className,
  imageAlt,
  imageUrl,
  meta,
  subtitle,
  title
}: CollectiblePreviewCardProps) {
  const accent = accentValue(accentVar);

  return (
    <article
      className={`relative overflow-hidden rounded-[1.75rem] border border-white/12 bg-white/10 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.28)] backdrop-blur-xl ${className ?? ""}`}
    >
      <div className="absolute inset-x-8 bottom-2 h-10 rounded-full bg-black/40 blur-xl" />
      <div className="relative overflow-hidden rounded-[1.3rem] border border-white/10 bg-black/25">
        {imageUrl ? (
          <img
            alt={imageAlt}
            className="aspect-[4/5] w-full object-cover"
            src={imageUrl}
          />
        ) : (
          <DecorativeArtwork accentVar={accentVar} className="aspect-[4/5]" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.72))] p-4 pt-10">
          {badge ? (
            <span
              className="inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white"
              style={{
                backgroundColor: accent,
                borderColor: `${accent}99`
              }}
            >
              {badge}
            </span>
          ) : null}
          <p className="mt-3 text-lg font-semibold text-white">{title}</p>
          {subtitle ? (
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/65">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {meta ? (
        <div className="relative mt-3 rounded-[1.2rem] border border-white/10 bg-black/25 px-3 py-2 text-xs uppercase tracking-[0.16em] text-white/72">
          {meta}
        </div>
      ) : null}
    </article>
  );
}

export function StudioSceneCard({
  accentVar = "--color-accent",
  className,
  eyebrow,
  note,
  title
}: StudioSceneCardProps) {
  const accent = accentValue(accentVar);

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] p-5 shadow-[var(--shadow-surface)] ${className ?? ""}`}
    >
      <div
        className="absolute -right-6 top-0 h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: accent, opacity: 0.18 }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,255,255,0.45),transparent_25%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent)]" />
      <div className="relative grid gap-5 md:grid-cols-[1fr_220px] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
            {eyebrow}
          </p>
          <h3 className="mt-2 text-2xl font-semibold font-[var(--font-display)] text-[color:var(--color-text)]">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">
            {note}
          </p>
        </div>
        <div className="relative min-h-[12rem]">
          <div className="absolute inset-x-4 bottom-2 h-8 rounded-full bg-[color:var(--color-bg)]/80 blur-xl" />
          <div className="absolute left-0 top-8 w-[58%] rotate-[-10deg]">
            <DecorativeArtwork accentVar={accentVar} className="aspect-[4/5]" />
          </div>
          <div className="absolute right-0 top-0 w-[54%] rotate-[8deg]">
            <div className="overflow-hidden rounded-[1.6rem] border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] p-3 shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
              <div className="aspect-[4/5] rounded-[1.2rem] bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.92),transparent_18%),linear-gradient(155deg,rgba(255,255,255,0.9),rgba(15,23,42,0.08))]" />
              <div className="mt-3 text-xs uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                Preview shell
              </div>
            </div>
          </div>
        </div>
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
  const accent = accentValue(accentVar);

  return (
    <section
      className={`relative overflow-hidden rounded-[2rem] border border-[color:var(--color-line)] bg-[color:var(--color-surface)]/85 p-6 shadow-[var(--shadow-surface)] ${className ?? ""}`}
    >
      <div
        className="absolute -left-8 top-0 h-40 w-40 rounded-full blur-3xl"
        style={{ backgroundColor: accent, opacity: 0.16 }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),transparent)]" />
      <div className="relative">{children}</div>
    </section>
  );
}

export function CollectibleGalleryRail({
  accentVar = "--color-accent",
  children,
  className,
  headline,
  summary
}: CollectibleGalleryRailProps) {
  const accent = accentValue(accentVar);

  return (
    <section
      className={`relative overflow-hidden rounded-[2rem] border border-[color:var(--color-line)] bg-[color:var(--color-surface)]/85 p-6 shadow-[var(--shadow-surface)] transition ${className ?? ""}`}
    >
      <div
        className="absolute -left-8 top-0 h-36 w-36 rounded-full blur-3xl"
        style={{ backgroundColor: accent, opacity: 0.16 }}
      />
      <div
        className="absolute -right-8 top-2 h-36 w-36 rounded-full blur-3xl"
        style={{ backgroundColor: accent, opacity: 0.1 }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),transparent)]" />
      <div className="relative grid gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-accent)]">
            {headline}
          </p>
          {summary ? (
            <p className="mt-1 text-sm text-[color:var(--color-muted)]">
              {summary}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}
