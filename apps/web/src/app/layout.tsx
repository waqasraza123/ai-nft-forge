import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Manrope } from "next/font/google";

import { AppProviders } from "../components/app-providers";
import { SiteShell } from "../components/site-shell";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";

import "./globals.css";

const fontUi = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

const fontDisplay = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700", "800"],
  display: "swap"
});

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
    <html lang="en" className={`${fontUi.variable} ${fontDisplay.variable}`}>
      <body className="antialiased">
        <AppProviders>
          <SiteShell>
            <SiteHeader />
            <main className="min-h-[75vh]">{children}</main>
            <SiteFooter />
          </SiteShell>
        </AppProviders>
      </body>
    </html>
  );
}
