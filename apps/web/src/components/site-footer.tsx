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
    <footer className="mx-auto mt-8 w-full max-w-7xl rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)]/70 p-4 backdrop-blur-sm">
      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <span className="text-sm font-semibold">AI NFT Forge</span>
          <p className="mt-2 max-w-2xl text-sm text-[color:var(--color-muted)]">
            Premium surfaces for creator studios, operators, and marketplace
            workflows with a single workspace-aware style language.
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
