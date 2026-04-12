import { describe, expect, it } from "vitest";

import { createStudioAccessService } from "./access";

describe("createStudioAccessService", () => {
  it("resolves owners against their own workspace when one exists", async () => {
    const service = createStudioAccessService({
      workspaceMembershipRepository: {
        async listByUserId() {
          return [];
        },
        async findFirstByUserId() {
          return null;
        }
      },
      workspaceRepository: {
        async listByOwnerUserId() {
          return [
            {
              id: "workspace_1",
              name: "Forge Ops",
              ownerUserId: "user_1",
              slug: "forge-ops",
              status: "active" as const
            }
          ];
        },
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
    expect(result.availableWorkspaces).toHaveLength(1);
  });

  it("falls back to owner access without a workspace when the actor has no membership", async () => {
    const service = createStudioAccessService({
      workspaceMembershipRepository: {
        async listByUserId() {
          return [];
        },
        async findFirstByUserId() {
          return null;
        }
      },
      workspaceRepository: {
        async listByOwnerUserId() {
          return [];
        },
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
    expect(result.availableWorkspaces).toEqual([]);
    expect(result.owner.walletAddress).toBe(
      "0x1111111111111111111111111111111111111111"
    );
  });

  it("resolves operators to the owning workspace context", async () => {
    const service = createStudioAccessService({
      workspaceMembershipRepository: {
        async listByUserId() {
          return [
            {
              workspace: {
                id: "workspace_1",
                name: "Forge Ops",
                ownerUser: {
                  walletAddress: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
                },
                ownerUserId: "user_owner",
                slug: "forge-ops",
                status: "active" as const
              }
            }
          ];
        },
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
        async listByOwnerUserId() {
          return [];
        },
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
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    );
    expect(result.workspace?.slug).toBe("forge-ops");
    expect(result.availableWorkspaces).toHaveLength(1);
  });

  it("lets an owner switch into an operator workspace context when selected", async () => {
    const service = createStudioAccessService({
      workspaceMembershipRepository: {
        async listByUserId() {
          return [
            {
              workspace: {
                id: "workspace_2",
                name: "North Editions",
                ownerUser: {
                  walletAddress: "0x2222222222222222222222222222222222222222"
                },
                ownerUserId: "user_2",
                slug: "north-editions",
                status: "active" as const
              }
            }
          ];
        },
        async findFirstByUserId() {
          return null;
        }
      },
      workspaceRepository: {
        async listByOwnerUserId() {
          return [
            {
              id: "workspace_1",
              name: "Forge Ops",
              ownerUserId: "user_1",
              slug: "forge-ops",
              status: "active" as const
            }
          ];
        },
        async findFirstByOwnerUserId() {
          return {
            id: "workspace_1",
            name: "Forge Ops",
            ownerUserId: "user_1",
            slug: "forge-ops",
            status: "active" as const
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
      },
      workspaceSlug: "north-editions"
    });

    expect(result.role).toBe("operator");
    expect(result.ownerUserId).toBe("user_2");
    expect(result.workspace?.slug).toBe("north-editions");
    expect(
      result.availableWorkspaces.map((workspace) => workspace.slug)
    ).toEqual(["forge-ops", "north-editions"]);
  });

  it("falls back to the default workspace when a selected workspace is unavailable", async () => {
    const service = createStudioAccessService({
      workspaceMembershipRepository: {
        async listByUserId() {
          return [
            {
              workspace: {
                id: "workspace_2",
                name: "North Editions",
                ownerUser: {
                  walletAddress: "0x2222222222222222222222222222222222222222"
                },
                ownerUserId: "user_2",
                slug: "north-editions",
                status: "active" as const
              }
            }
          ];
        },
        async findFirstByUserId() {
          return null;
        }
      },
      workspaceRepository: {
        async listByOwnerUserId() {
          return [
            {
              id: "workspace_1",
              name: "Forge Ops",
              ownerUserId: "user_1",
              slug: "forge-ops",
              status: "active" as const
            }
          ];
        },
        async findFirstByOwnerUserId() {
          return {
            id: "workspace_1",
            name: "Forge Ops",
            ownerUserId: "user_1",
            slug: "forge-ops",
            status: "active" as const
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
      },
      workspaceSlug: "missing-workspace"
    });

    expect(result.role).toBe("owner");
    expect(result.workspace?.slug).toBe("forge-ops");
  });

  it("lists multiple owned workspaces for the same owner", async () => {
    const service = createStudioAccessService({
      workspaceMembershipRepository: {
        async listByUserId() {
          return [];
        },
        async findFirstByUserId() {
          return null;
        }
      },
      workspaceRepository: {
        async listByOwnerUserId() {
          return [
            {
              id: "workspace_1",
              name: "Forge Ops",
              ownerUserId: "user_1",
              slug: "forge-ops",
              status: "active" as const
            },
            {
              id: "workspace_2",
              name: "North Editions",
              ownerUserId: "user_1",
              slug: "north-editions",
              status: "active" as const
            }
          ];
        },
        async findFirstByOwnerUserId() {
          return {
            id: "workspace_1",
            name: "Forge Ops",
            ownerUserId: "user_1",
            slug: "forge-ops",
            status: "active" as const
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
    expect(
      result.availableWorkspaces.map((workspace) => workspace.slug)
    ).toEqual(["forge-ops", "north-editions"]);
  });

  it("prefers an active accessible workspace over archived defaults", async () => {
    const service = createStudioAccessService({
      workspaceMembershipRepository: {
        async listByUserId() {
          return [
            {
              workspace: {
                id: "workspace_2",
                name: "North Editions",
                ownerUser: {
                  walletAddress: "0x2222222222222222222222222222222222222222"
                },
                ownerUserId: "user_2",
                slug: "north-editions",
                status: "active" as const
              }
            }
          ];
        },
        async findFirstByUserId() {
          return null;
        }
      },
      workspaceRepository: {
        async listByOwnerUserId() {
          return [
            {
              id: "workspace_1",
              name: "Archive Forge",
              ownerUserId: "user_1",
              slug: "archive-forge",
              status: "archived" as const
            }
          ];
        },
        async findFirstByOwnerUserId() {
          return {
            id: "workspace_1",
            name: "Archive Forge",
            ownerUserId: "user_1",
            slug: "archive-forge",
            status: "archived" as const
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

    expect(result.role).toBe("operator");
    expect(result.workspace?.slug).toBe("north-editions");
    expect(result.workspace?.status).toBe("active");
  });
});
