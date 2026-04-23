import { ActionLink } from "@ai-nft-forge/ui";

export function SiteFooter() {
  const supportLinks = [
    { href: "/studio", label: "Studio" },
    { href: "/ops", label: "Ops" },
    { href: "/brands/demo-studio", label: "Demo storefront" }
  ];

  const productLinks = [
    {
      href: "/brands/demo-studio/collections/foundation",
      label: "Demo release"
    },
    { href: "/studio/collections", label: "Collections" },
    { href: "/studio/commerce", label: "Commerce" }
  ];

  return (
    <footer className="mx-auto mt-8 w-full max-w-cinematic rounded-cinematic border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,244,255,0.88))] p-5 shadow-panel backdrop-blur-xl">
      <div className="grid gap-5 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
            AI NFT Forge
          </p>
          <span className="mt-1 block text-lg font-semibold font-[var(--font-display)] text-[color:var(--color-text)]">
            Premium collectible launch tooling
          </span>
          <p className="mt-2 max-w-2xl text-sm text-[color:var(--color-muted)]">
            Built for release teams that need image-first storefronts, calmer
            studio operations, and operator-safe launch controls in one shell.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
              Product
            </p>
            {productLinks.map((link) => (
              <ActionLink href={link.href} key={link.href} tone="inline">
                {link.label}
              </ActionLink>
            ))}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
              Operations
            </p>
            {supportLinks.map((link) => (
              <ActionLink href={link.href} key={link.href} tone="inline">
                {link.label}
              </ActionLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
