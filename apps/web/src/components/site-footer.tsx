import Link from "next/link";

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
    <footer className="site-footer">
      <section className="site-footer-brand">
        <span className="site-footer-brand-title">AI NFT Forge</span>
        <span className="site-footer-brand-copy">
          Dark-mode public storefronts with premium workflow surfaces for
          creators, operators, and studio teams.
        </span>
      </section>
      <section className="site-footer-links">
        <div className="site-footer-column">
          <span className="site-footer-column-title">Product</span>
          {productLinks.map((link) => (
            <Link className="site-footer-link" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="site-footer-column">
          <span className="site-footer-column-title">Operations</span>
          {supportLinks.map((link) => (
            <Link className="site-footer-link" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </footer>
  );
}
