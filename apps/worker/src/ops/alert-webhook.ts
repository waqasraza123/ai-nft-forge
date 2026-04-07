import type { WorkerEnv } from "@ai-nft-forge/shared";

type FetchLike = typeof fetch;

type AlertPayload = {
  code: string;
  message: string;
  severity: "critical" | "warning";
  title: string;
};

type DeliverOpsAlertWebhookInput = {
  alert: AlertPayload;
  captureId: string;
  deliveredAt: string;
  ownerUserId: string;
};

type AlertWebhookClientDependencies = {
  env: Pick<
    WorkerEnv,
    | "OPS_ALERT_WEBHOOK_BEARER_TOKEN"
    | "OPS_ALERT_WEBHOOK_ENABLED"
    | "OPS_ALERT_WEBHOOK_TIMEOUT_MS"
    | "OPS_ALERT_WEBHOOK_URL"
    | "WORKER_SERVICE_NAME"
  >;
  fetchFn?: FetchLike;
};

export function createOpsAlertWebhookClient({
  env,
  fetchFn = fetch
}: AlertWebhookClientDependencies) {
  const webhookUrl = env.OPS_ALERT_WEBHOOK_URL ?? null;

  return {
    enabled: env.OPS_ALERT_WEBHOOK_ENABLED && webhookUrl !== null,

    async deliver(input: DeliverOpsAlertWebhookInput) {
      if (!env.OPS_ALERT_WEBHOOK_ENABLED || !webhookUrl) {
        throw new Error("Ops alert webhook delivery is not configured.");
      }

      const response = await fetchFn(webhookUrl, {
        body: JSON.stringify({
          alert: input.alert,
          captureId: input.captureId,
          deliveredAt: input.deliveredAt,
          event: "ops.alert",
          ownerUserId: input.ownerUserId,
          service: env.WORKER_SERVICE_NAME
        }),
        headers: {
          Accept: "application/json",
          ...(env.OPS_ALERT_WEBHOOK_BEARER_TOKEN
            ? {
                Authorization: `Bearer ${env.OPS_ALERT_WEBHOOK_BEARER_TOKEN}`
              }
            : {}),
          "Content-Type": "application/json"
        },
        method: "POST",
        signal: AbortSignal.timeout(env.OPS_ALERT_WEBHOOK_TIMEOUT_MS)
      });

      if (response.ok) {
        return;
      }

      const responseText = (await response.text().catch(() => "")).trim();

      throw new Error(
        responseText
          ? `Ops alert webhook returned ${response.status}: ${responseText}`
          : `Ops alert webhook returned ${response.status}.`
      );
    }
  };
}
