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
    <footer className="mx-auto mt-8 w-full max-w-cinematic rounded-cinematic border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-panel backdrop-blur-xl">
      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <span className="text-sm font-semibold text-white">AI NFT Forge</span>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Premium launch control for agencies, creator teams, and operators
            running branded collectible releases with audit-grade clarity.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Product
            </p>
            {productLinks.map((link) => (
              <ActionLink href={link.href} key={link.href} tone="inline">
                {link.label}
              </ActionLink>
            ))}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
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
