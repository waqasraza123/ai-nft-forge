import {
  resolveWorkspaceLifecycleWebhookProviders,
  type WorkerEnv,
  type WorkspaceLifecycleNotificationProviderKey
} from "@ai-nft-forge/shared";

type FetchLike = typeof fetch;

type DeliverWorkspaceLifecycleWebhookInput = {
  deliveryId: string;
  payload: unknown;
};

type WorkspaceLifecycleWebhookProviderRegistryDependencies = {
  env: Pick<
    WorkerEnv,
    | "WORKER_SERVICE_NAME"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_BEARER_TOKEN"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_TIMEOUT_MS"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_URL"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_BEARER_TOKEN"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_ENABLED"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_TIMEOUT_MS"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_URL"
  >;
  fetchFn?: FetchLike;
};

export type WorkspaceLifecycleWebhookProviderBoundary = {
  deliver(input: DeliverWorkspaceLifecycleWebhookInput): Promise<void>;
  enabled: boolean;
  key: WorkspaceLifecycleNotificationProviderKey;
  label: string;
};

export function createWorkspaceLifecycleWebhookProviderRegistry({
  env,
  fetchFn = fetch
}: WorkspaceLifecycleWebhookProviderRegistryDependencies) {
  const providers = resolveWorkspaceLifecycleWebhookProviders(env).map(
    (provider): WorkspaceLifecycleWebhookProviderBoundary => ({
      enabled: provider.enabled,
      key: provider.key,
      label: provider.label,

      async deliver(input: DeliverWorkspaceLifecycleWebhookInput) {
        if (!provider.enabled || !provider.url) {
          throw new Error(
            `${provider.label} workspace lifecycle delivery is not configured.`
          );
        }

        const response = await fetchFn(provider.url, {
          body: JSON.stringify({
            ...(typeof input.payload === "object" && input.payload !== null
              ? input.payload
              : {
                  payload: input.payload
                }),
            deliveryId: input.deliveryId,
            providerKey: provider.key,
            service: env.WORKER_SERVICE_NAME
          }),
          headers: {
            Accept: "application/json",
            ...(provider.bearerToken
              ? {
                  Authorization: `Bearer ${provider.bearerToken}`
                }
              : {}),
            "Content-Type": "application/json",
            "X-AI-NFT-Forge-Workspace-Lifecycle-Provider": provider.key
          },
          method: "POST",
          signal: AbortSignal.timeout(provider.timeoutMs)
        });

        if (response.ok) {
          return;
        }

        const responseText = (await response.text().catch(() => "")).trim();

        throw new Error(
          responseText
            ? `${provider.label} returned ${response.status}: ${responseText}`
            : `${provider.label} returned ${response.status}.`
        );
      }
    })
  );
  const providersByKey = new Map(
    providers.map((provider) => [provider.key, provider] as const)
  );

  return {
    enabledProviderKeys: providers
      .filter((provider) => provider.enabled)
      .map((provider) => provider.key),
    providers,
    resolveProvider(key: WorkspaceLifecycleNotificationProviderKey | null) {
      if (key) {
        return providersByKey.get(key) ?? null;
      }

      return providers.find((provider) => provider.enabled) ?? null;
    }
  };
}

export type WorkspaceLifecycleWebhookProviderRegistry = ReturnType<
  typeof createWorkspaceLifecycleWebhookProviderRegistry
>;
