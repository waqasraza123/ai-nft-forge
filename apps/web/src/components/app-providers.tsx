"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";

import { createWalletConfig } from "../lib/wallet/config";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [walletConfig] = useState(() => createWalletConfig());
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={walletConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
