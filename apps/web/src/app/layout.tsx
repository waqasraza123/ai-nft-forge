import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppProviders } from "../components/app-providers";
import { SiteShell } from "../components/site-shell";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: "AI NFT Forge",
  description:
    "Self-hosted white-label infrastructure for collectible art drops and premium storefronts."
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <SiteShell>
            <SiteHeader />
            <main className="site-main">{children}</main>
            <SiteFooter />
          </SiteShell>
        </AppProviders>
      </body>
    </html>
  );
}
