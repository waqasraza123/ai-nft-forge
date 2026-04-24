export type BrowserEthereumProvider = {
  request(input: { method: string; params?: unknown[] }): Promise<unknown>;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
};

type WalletConnectorLike = {
  getProvider(): Promise<unknown>;
};

function isProviderNotFoundError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "ProviderNotFoundError" ||
      error.message === "Provider not found.")
  );
}

export async function canUseWalletConnector(
  connector: WalletConnectorLike | null | undefined
) {
  if (!connector) {
    return false;
  }

  try {
    return Boolean(await connector.getProvider());
  } catch (error) {
    if (isProviderNotFoundError(error)) {
      return false;
    }

    throw error;
  }
}

export async function getBrowserEthereumProvider(input: {
  connector: WalletConnectorLike;
  unavailableMessage: string;
}) {
  try {
    const provider =
      (await input.connector.getProvider()) as BrowserEthereumProvider | null;

    if (!provider) {
      throw new Error(input.unavailableMessage);
    }

    return provider;
  } catch (error) {
    if (isProviderNotFoundError(error)) {
      throw new Error(input.unavailableMessage);
    }

    throw error;
  }
}
