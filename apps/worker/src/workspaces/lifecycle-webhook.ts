import type { WorkerEnv } from "@ai-nft-forge/shared";

type FetchLike = typeof fetch;

type DeliverWorkspaceLifecycleWebhookInput = {
  deliveryId: string;
  payload: unknown;
};

type WorkspaceLifecycleWebhookClientDependencies = {
  env: Pick<
    WorkerEnv,
    | "WORKER_SERVICE_NAME"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_BEARER_TOKEN"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_TIMEOUT_MS"
    | "WORKSPACE_LIFECYCLE_WEBHOOK_URL"
  >;
  fetchFn?: FetchLike;
};

export function createWorkspaceLifecycleWebhookClient({
  env,
  fetchFn = fetch
}: WorkspaceLifecycleWebhookClientDependencies) {
  const webhookUrl = env.WORKSPACE_LIFECYCLE_WEBHOOK_URL ?? null;

  return {
    enabled: env.WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED && webhookUrl !== null,

    async deliver(input: DeliverWorkspaceLifecycleWebhookInput) {
      if (!env.WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED || !webhookUrl) {
        throw new Error(
          "Workspace lifecycle webhook delivery is not configured."
        );
      }

      const response = await fetchFn(webhookUrl, {
        body: JSON.stringify({
          ...(typeof input.payload === "object" && input.payload !== null
            ? input.payload
            : {
                payload: input.payload
              }),
          deliveryId: input.deliveryId,
          service: env.WORKER_SERVICE_NAME
        }),
        headers: {
          Accept: "application/json",
          ...(env.WORKSPACE_LIFECYCLE_WEBHOOK_BEARER_TOKEN
            ? {
                Authorization: `Bearer ${env.WORKSPACE_LIFECYCLE_WEBHOOK_BEARER_TOKEN}`
              }
            : {}),
          "Content-Type": "application/json"
        },
        method: "POST",
        signal: AbortSignal.timeout(env.WORKSPACE_LIFECYCLE_WEBHOOK_TIMEOUT_MS)
      });

      if (response.ok) {
        return;
      }

      const responseText = (await response.text().catch(() => "")).trim();

      throw new Error(
        responseText
          ? `Workspace lifecycle webhook returned ${response.status}: ${responseText}`
          : `Workspace lifecycle webhook returned ${response.status}.`
      );
    }
  };
}

export type WorkspaceLifecycleWebhookBoundary = ReturnType<
  typeof createWorkspaceLifecycleWebhookClient
>;
