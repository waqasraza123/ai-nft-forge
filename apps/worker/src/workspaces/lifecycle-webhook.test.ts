import { describe, expect, it, vi } from "vitest";

import { createWorkspaceLifecycleWebhookProviderRegistry } from "./lifecycle-webhook.js";

describe("createWorkspaceLifecycleWebhookProviderRegistry", () => {
  it("posts structured workspace lifecycle payloads to the configured provider", async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        status: 202
      })
    );
    const registry = createWorkspaceLifecycleWebhookProviderRegistry({
      env: {
        WORKER_SERVICE_NAME: "ai-nft-forge-worker",
        WORKSPACE_LIFECYCLE_WEBHOOK_BEARER_TOKEN: "token_123",
        WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED: true,
        WORKSPACE_LIFECYCLE_WEBHOOK_TIMEOUT_MS: 5000,
        WORKSPACE_LIFECYCLE_WEBHOOK_URL:
          "https://alerts.example.com/hooks/workspace-lifecycle",
        WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_BEARER_TOKEN: undefined,
        WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_ENABLED: false,
        WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_TIMEOUT_MS: 5000,
        WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_URL: undefined
      },
      fetchFn
    });
    const provider = registry.resolveProvider("primary");

    expect(provider).not.toBeNull();

    await provider!.deliver({
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
        headers: expect.objectContaining({
          Accept: "application/json",
          Authorization: "Bearer token_123",
          "Content-Type": "application/json",
          "X-AI-NFT-Forge-Workspace-Lifecycle-Provider": "primary"
        }),
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
      providerKey: "primary",
      service: "ai-nft-forge-worker"
    });
    expect(registry.enabledProviderKeys).toEqual(["primary"]);
  });

  it("throws when the provider responds with a failure status", async () => {
    const registry = createWorkspaceLifecycleWebhookProviderRegistry({
      env: {
        WORKER_SERVICE_NAME: "ai-nft-forge-worker",
        WORKSPACE_LIFECYCLE_WEBHOOK_BEARER_TOKEN: undefined,
        WORKSPACE_LIFECYCLE_WEBHOOK_ENABLED: true,
        WORKSPACE_LIFECYCLE_WEBHOOK_TIMEOUT_MS: 5000,
        WORKSPACE_LIFECYCLE_WEBHOOK_URL:
          "https://alerts.example.com/hooks/workspace-lifecycle",
        WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_BEARER_TOKEN: undefined,
        WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_ENABLED: false,
        WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_TIMEOUT_MS: 5000,
        WORKSPACE_LIFECYCLE_WEBHOOK_SECONDARY_URL: undefined
      },
      fetchFn: vi.fn<typeof fetch>().mockResolvedValue(
        new Response("upstream rejected payload", {
          status: 500
        })
      )
    });

    await expect(
      registry.resolveProvider("primary")!.deliver({
        deliveryId: "delivery_1",
        payload: {
          event: "workspace.lifecycle_notification",
          kind: "decommission_notice"
        }
      })
    ).rejects.toThrow(
      "Primary webhook returned 500: upstream rejected payload"
    );
  });
});
