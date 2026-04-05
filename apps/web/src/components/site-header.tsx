import Link from "next/link";

import { primaryNavigation } from "../lib/navigation";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="site-brand" href="/">
        <span className="site-brand-mark">AF</span>
        <span>AI NFT Forge</span>
      </Link>
      <nav className="site-nav">
        {primaryNavigation.map((item) => (
          <Link className="site-nav-link" href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
