import { describe, expect, it, vi } from "vitest";

import { createWorkspaceLifecycleWebhookClient } from "./lifecycle-webhook.js";

describe("createWorkspaceLifecycleWebhookClient", () => {
  it("posts structured workspace lifecycle payloads to the configured webhook", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 202
      })
    );
    const client = createWorkspaceLifecycleWebhookClient({
      env: {
        WORKER_SERVICE_NAME: "ai-nft-forge-worker",
        WORKSPACE_LIFECYCLE_WEBHOOK_BEARER_TOKEN: "token_123",
        WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED: true,
        WORKSPACE_LIFECYCLE_WEBHOOK_TIMEOUT_MS: 5000,
        WORKSPACE_LIFECYCLE_WEBHOOK_URL:
          "https://alerts.example.com/hooks/workspace-lifecycle"
      },
      fetchFn
    });

    await client.deliver({
      deliveryId: "delivery_1",
      payload: {
        event: "workspace.lifecycle_notification",
        invitation: {
          id: "invitation_1",
          walletAddress: "0x1111111111111111111111111111111111111111"
        },
        kind: "invitation_reminder"
      }
    });

    expect(fetchFn).toHaveBeenCalledWith(
      "https://alerts.example.com/hooks/workspace-lifecycle",
      expect.objectContaining({
        headers: {
          Accept: "application/json",
          Authorization: "Bearer token_123",
          "Content-Type": "application/json"
        },
        method: "POST"
      })
    );
    const [, requestInit] = fetchFn.mock.calls[0] ?? [];
    expect(JSON.parse(String(requestInit?.body))).toEqual({
      deliveryId: "delivery_1",
      event: "workspace.lifecycle_notification",
      invitation: {
        id: "invitation_1",
        walletAddress: "0x1111111111111111111111111111111111111111"
      },
      kind: "invitation_reminder",
      service: "ai-nft-forge-worker"
    });
    expect(client.enabled).toBe(true);
  });

  it("throws when the webhook responds with a failure status", async () => {
    const client = createWorkspaceLifecycleWebhookClient({
      env: {
        WORKER_SERVICE_NAME: "ai-nft-forge-worker",
        WORKSPACE_LIFECYCLE_WEBHOOK_BEARER_TOKEN: undefined,
        WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED: true,
        WORKSPACE_LIFECYCLE_WEBHOOK_TIMEOUT_MS: 5000,
        WORKSPACE_LIFECYCLE_WEBHOOK_URL:
          "https://alerts.example.com/hooks/workspace-lifecycle"
      },
      fetchFn: vi.fn<typeof fetch>().mockResolvedValue(
        new Response("upstream rejected payload", {
          status: 500
        })
      )
    });

    await expect(
      client.deliver({
        deliveryId: "delivery_1",
        payload: {
          event: "workspace.lifecycle_notification",
          kind: "decommission_notice"
        }
      })
    ).rejects.toThrow(
      "Workspace lifecycle webhook returned 500: upstream rejected payload"
    );
  });
});
