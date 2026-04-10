import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { baseAccount, injected } from "wagmi/connectors";

import { walletChains } from "./chains";

export function createWalletConfig() {
  return createConfig({
    chains: [walletChains.base, walletChains["base-sepolia"]],
    connectors: [
      baseAccount({
        appName: "AI NFT Forge"
      }),
      injected({
        shimDisconnect: true
      })
    ],
    multiInjectedProviderDiscovery: false,
    ssr: true,
    storage: createStorage({
      storage: cookieStorage
    }),
    transports: {
      [walletChains.base.id]: http(),
      [walletChains["base-sepolia"].id]: http()
    }
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof createWalletConfig>;
  }
}
