import Link from "next/link";

import { primaryNavigation } from "../lib/navigation";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="site-brand" href="/">
        <span className="site-brand-mark">✦</span>
        <span className="site-brand-stack">
          <span className="site-brand-title">AI NFT Forge</span>
          <span className="site-brand-tagline">
            Launch-ready collectibles platform
          </span>
        </span>
      </Link>
      <div className="site-nav-wrap">
        <nav aria-label="Primary navigation" className="site-nav">
          {primaryNavigation.map((item) => (
            <Link className="site-nav-link" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="site-nav-cta" href="/studio">
          Open Studio
        </Link>
      </div>
    </header>
  );
}
