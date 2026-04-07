import { describe, expect, it, vi } from "vitest";

import { createOpsAlertWebhookClient } from "./alert-webhook.js";

describe("createOpsAlertWebhookClient", () => {
  it("posts structured alert payloads to the configured webhook", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 202
      })
    );
    const client = createOpsAlertWebhookClient({
      env: {
        OPS_ALERT_WEBHOOK_BEARER_TOKEN: "token_123",
        OPS_ALERT_WEBHOOK_ENABLED: true,
        OPS_ALERT_WEBHOOK_TIMEOUT_MS: 5000,
        OPS_ALERT_WEBHOOK_URL: "https://alerts.example.com/hooks/ops",
        WORKER_SERVICE_NAME: "ai-nft-forge-worker"
      },
      fetchFn
    });

    await client.deliver({
      alert: {
        code: "QUEUE_STALLED",
        message: "3 generation jobs are waiting while no jobs are active.",
        severity: "critical",
        title: "The generation queue appears stalled."
      },
      captureId: "capture_1",
      deliveredAt: "2026-04-07T09:00:00.000Z",
      ownerUserId: "user_1"
    });

    expect(fetchFn).toHaveBeenCalledWith(
      "https://alerts.example.com/hooks/ops",
      expect.objectContaining({
        body: JSON.stringify({
          alert: {
            code: "QUEUE_STALLED",
            message: "3 generation jobs are waiting while no jobs are active.",
            severity: "critical",
            title: "The generation queue appears stalled."
          },
          captureId: "capture_1",
          deliveredAt: "2026-04-07T09:00:00.000Z",
          event: "ops.alert",
          ownerUserId: "user_1",
          service: "ai-nft-forge-worker"
        }),
        headers: {
          Accept: "application/json",
          Authorization: "Bearer token_123",
          "Content-Type": "application/json"
        },
        method: "POST"
      })
    );
    expect(client.enabled).toBe(true);
  });

  it("throws when the webhook responds with a failure status", async () => {
    const client = createOpsAlertWebhookClient({
      env: {
        OPS_ALERT_WEBHOOK_BEARER_TOKEN: undefined,
        OPS_ALERT_WEBHOOK_ENABLED: true,
        OPS_ALERT_WEBHOOK_TIMEOUT_MS: 5000,
        OPS_ALERT_WEBHOOK_URL: "https://alerts.example.com/hooks/ops",
        WORKER_SERVICE_NAME: "ai-nft-forge-worker"
      },
      fetchFn: vi.fn<typeof fetch>().mockResolvedValue(
        new Response("upstream rejected payload", {
          status: 500
        })
      )
    });

    await expect(
      client.deliver({
        alert: {
          code: "QUEUE_STALLED",
          message: "3 generation jobs are waiting while no jobs are active.",
          severity: "critical",
          title: "The generation queue appears stalled."
        },
        captureId: "capture_1",
        deliveredAt: "2026-04-07T09:00:00.000Z",
        ownerUserId: "user_1"
      })
    ).rejects.toThrow(
      "Ops alert webhook returned 500: upstream rejected payload"
    );
  });
});
