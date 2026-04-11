import { describe, expect, it } from "vitest";

import { createStudioAccessService } from "./access";

describe("createStudioAccessService", () => {
  it("resolves owners against their own workspace when one exists", async () => {
    const service = createStudioAccessService({
      userRepository: {
        async findById() {
          return null;
        }
      },
      workspaceMembershipRepository: {
        async findFirstByUserId() {
          return null;
        }
      },
      workspaceRepository: {
        async findFirstByOwnerUserId() {
          return {
            id: "workspace_1",
            name: "Forge Ops",
            ownerUserId: "user_1",
            slug: "forge-ops",
            status: "active"
          };
        }
      }
    });

    const result = await service.resolveForSession({
      session: {
        expiresAt: "2026-04-20T00:00:00.000Z",
        user: {
          avatarUrl: null,
          displayName: "Owner",
          id: "user_1",
          walletAddress: "0x1111111111111111111111111111111111111111"
        }
      }
    });

    expect(result.role).toBe("owner");
    expect(result.ownerUserId).toBe("user_1");
    expect(result.workspace?.slug).toBe("forge-ops");
  });

  it("falls back to owner access without a workspace when the actor has no membership", async () => {
    const service = createStudioAccessService({
      userRepository: {
        async findById() {
          return null;
        }
      },
      workspaceMembershipRepository: {
        async findFirstByUserId() {
          return null;
        }
      },
      workspaceRepository: {
        async findFirstByOwnerUserId() {
          return null;
        }
      }
    });

    const result = await service.resolveForSession({
      session: {
        expiresAt: "2026-04-20T00:00:00.000Z",
        user: {
          avatarUrl: null,
          displayName: "Owner",
          id: "user_1",
          walletAddress: "0x1111111111111111111111111111111111111111"
        }
      }
    });

    expect(result.role).toBe("owner");
    expect(result.workspace).toBeNull();
    expect(result.owner.walletAddress).toBe(
      "0x1111111111111111111111111111111111111111"
    );
  });

  it("resolves operators to the owning workspace context", async () => {
    const service = createStudioAccessService({
      userRepository: {
        async findById() {
          return {
            id: "user_owner",
            walletAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
          };
        }
      },
      workspaceMembershipRepository: {
        async findFirstByUserId() {
          return {
            workspace: {
              id: "workspace_1",
              name: "Forge Ops",
              ownerUser: {
                walletAddress: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
              },
              ownerUserId: "user_owner",
              slug: "forge-ops",
              status: "active"
            }
          };
        }
      },
      workspaceRepository: {
        async findFirstByOwnerUserId() {
          return null;
        }
      }
    });

    const result = await service.resolveForSession({
      session: {
        expiresAt: "2026-04-20T00:00:00.000Z",
        user: {
          avatarUrl: null,
          displayName: "Operator",
          id: "user_operator",
          walletAddress: "0x1111111111111111111111111111111111111111"
        }
      }
    });

    expect(result.role).toBe("operator");
    expect(result.ownerUserId).toBe("user_owner");
    expect(result.owner.walletAddress).toBe(
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    );
    expect(result.workspace?.slug).toBe("forge-ops");
  });
});
