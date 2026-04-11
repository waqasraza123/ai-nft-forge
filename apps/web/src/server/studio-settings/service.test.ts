import { describe, expect, it } from "vitest";

import { StudioSettingsServiceError } from "./error";
import { createStudioSettingsService } from "./service";

function createStudioSettingsHarness() {
  let workspaceIndex = 0;
  let brandIndex = 0;
  let membershipIndex = 0;
  let invitationIndex = 0;
  let auditLogIndex = 0;
  const users = new Map<
    string,
    {
      avatarUrl: string | null;
      displayName: string | null;
      id: string;
      walletAddress: string;
    }
  >();
  const workspaces = new Map<
    string,
    {
      id: string;
      name: string;
      ownerUserId: string;
      slug: string;
      status: "active" | "archived" | "suspended";
    }
  >();
  const brands = new Map<
    string,
    {
      customDomain: string | null;
      id: string;
      name: string;
      slug: string;
      themeJson: unknown;
      workspaceId: string;
    }
  >();
  const publications = new Map<
    string,
    {
      brandName: string;
      brandSlug: string;
      description: string | null;
      id: string;
      ownerUserId: string;
      publishedAt: Date;
      slug: string;
      title: string;
      updatedAt: Date;
    }
  >();
  const memberships = new Map<
    string,
    {
      createdAt: Date;
      id: string;
      role: "operator";
      userId: string;
      workspaceId: string;
    }
  >();
  const workspaceInvitations = new Map<
    string,
    {
      createdAt: Date;
      expiresAt: Date;
      id: string;
      invitedByUserId: string;
      role: "operator";
      walletAddress: string;
      workspaceId: string;
    }
  >();
  const auditLogs: Array<{
    action: string;
    actorId: string;
    actorType: string;
    createdAt: Date;
    entityId: string;
    entityType: string;
    id: string;
    metadataJson: unknown;
  }> = [];

  function ensureUser(input: {
    avatarUrl?: string | null;
    displayName?: string | null;
    id: string;
    walletAddress?: string;
  }) {
    const existingUser = users.get(input.id);

    if (existingUser) {
      return existingUser;
    }

    const user = {
      avatarUrl: input.avatarUrl ?? null,
      displayName: input.displayName ?? null,
      id: input.id,
      walletAddress:
        input.walletAddress ??
        `0x${String(users.size + 1).padStart(40, "1").slice(-40)}`
    };

    users.set(user.id, user);

    return user;
  }

  const repositories = {
    auditLogRepository: {
      async create(input: {
        action: string;
        actorId: string;
        actorType: string;
        entityId: string;
        entityType: string;
        metadataJson: unknown;
      }) {
        auditLogIndex += 1;
        const auditLog = {
          action: input.action,
          actorId: input.actorId,
          actorType: input.actorType,
          createdAt: new Date(
            `2026-04-09T02:00:${String(auditLogIndex).padStart(2, "0")}.000Z`
          ),
          entityId: input.entityId,
          entityType: input.entityType,
          id: `audit_${auditLogIndex}`,
          metadataJson: input.metadataJson
        };

        auditLogs.push(auditLog);

        return auditLog;
      },

      async listByEntity(input: {
        entityId: string;
        entityType: string;
        limit?: number;
      }) {
        return auditLogs
          .filter(
            (auditLog) =>
              auditLog.entityId === input.entityId &&
              auditLog.entityType === input.entityType
          )
          .sort((left, right) => {
            const createdAtDifference =
              right.createdAt.getTime() - left.createdAt.getTime();

            if (createdAtDifference !== 0) {
              return createdAtDifference;
            }

            return right.id.localeCompare(left.id);
          })
          .slice(0, input.limit ?? 50);
      }
    },
    brandRepository: {
      async create(input: {
        customDomain?: string | null;
        name: string;
        slug: string;
        themeJson: unknown;
        workspaceId: string;
      }) {
        brandIndex += 1;
        const brand = {
          customDomain: input.customDomain ?? null,
          id: `brand_${brandIndex}`,
          name: input.name,
          slug: input.slug,
          themeJson: input.themeJson,
          workspaceId: input.workspaceId
        };

        brands.set(brand.id, brand);

        return brand;
      },

      async findFirstByOwnerUserId(ownerUserId: string) {
        const workspaceIds = new Set(
          [...workspaces.values()]
            .filter((workspace) => workspace.ownerUserId === ownerUserId)
            .map((workspace) => workspace.id)
        );

        return (
          [...brands.values()].find((brand) =>
            workspaceIds.has(brand.workspaceId)
          ) ?? null
        );
      },

      async findByIdForOwner(input: { id: string; ownerUserId: string }) {
        const workspaceIds = new Set(
          [...workspaces.values()]
            .filter((workspace) => workspace.ownerUserId === input.ownerUserId)
            .map((workspace) => workspace.id)
        );

        const brand = brands.get(input.id);

        if (!brand || !workspaceIds.has(brand.workspaceId)) {
          return null;
        }

        return brand;
      },

      async findFirstBySlug(slug: string) {
        return (
          [...brands.values()].find((brand) => brand.slug === slug) ?? null
        );
      },

      async listByOwnerUserId(ownerUserId: string) {
        const workspaceIds = new Set(
          [...workspaces.values()]
            .filter((workspace) => workspace.ownerUserId === ownerUserId)
            .map((workspace) => workspace.id)
        );

        return [...brands.values()].filter((brand) =>
          workspaceIds.has(brand.workspaceId)
        );
      },

      async updateByIdForOwner(input: {
        customDomain?: string | null;
        id: string;
        name: string;
        ownerUserId: string;
        slug: string;
        themeJson: unknown;
        workspaceId: string;
      }) {
        const workspace = workspaces.get(input.workspaceId);
        const brand = brands.get(input.id);

        if (
          !workspace ||
          !brand ||
          workspace.ownerUserId !== input.ownerUserId
        ) {
          throw new Error("Unexpected owner mismatch.");
        }

        const updatedBrand = {
          ...brand,
          customDomain: input.customDomain ?? null,
          name: input.name,
          slug: input.slug,
          themeJson: input.themeJson,
          workspaceId: input.workspaceId
        };

        brands.set(updatedBrand.id, updatedBrand);

        return updatedBrand;
      }
    },
    publishedCollectionRepository: {
      async findByBrandSlugAndCollectionSlug(input: {
        brandSlug: string;
        slug: string;
      }) {
        return (
          [...publications.values()].find(
            (publication) =>
              publication.brandSlug === input.brandSlug &&
              publication.slug === input.slug
          ) ?? null
        );
      },

      async listByOwnerUserId(ownerUserId: string) {
        return [...publications.values()].filter(
          (publication) => publication.ownerUserId === ownerUserId
        );
      },

      async updateByIdForOwner(input: {
        brandName: string;
        brandSlug: string;
        description: string | null;
        id: string;
        ownerUserId: string;
        slug: string;
        title: string;
      }) {
        const publication = publications.get(input.id);

        if (!publication || publication.ownerUserId !== input.ownerUserId) {
          throw new Error("Unexpected publication owner mismatch.");
        }

        const updatedPublication = {
          ...publication,
          brandName: input.brandName,
          brandSlug: input.brandSlug,
          description: input.description,
          slug: input.slug,
          title: input.title
        };

        publications.set(updatedPublication.id, updatedPublication);

        return {
          id: updatedPublication.id
        };
      }
    },
    userRepository: {
      async findById(id: string) {
        return users.get(id) ?? null;
      },

      async findByWalletAddress(walletAddress: string) {
        return (
          [...users.values()].find(
            (user) =>
              user.walletAddress.toLowerCase() === walletAddress.toLowerCase()
          ) ?? null
        );
      },

      async upsertWalletUser(input: {
        avatarUrl?: string | null;
        displayName?: string | null;
        walletAddress: string;
      }) {
        const existingUser =
          [...users.values()].find(
            (user) =>
              user.walletAddress.toLowerCase() ===
              input.walletAddress.toLowerCase()
          ) ?? null;

        if (existingUser) {
          const updatedUser = {
            ...existingUser,
            avatarUrl:
              input.avatarUrl === undefined
                ? existingUser.avatarUrl
                : input.avatarUrl,
            displayName:
              input.displayName === undefined
                ? existingUser.displayName
                : input.displayName
          };

          users.set(updatedUser.id, updatedUser);

          return updatedUser;
        }

        const user = ensureUser({
          id: `user_wallet_${users.size + 1}`,
          ...(input.avatarUrl !== undefined
            ? {
                avatarUrl: input.avatarUrl
              }
            : {}),
          ...(input.displayName !== undefined
            ? {
                displayName: input.displayName
              }
            : {}),
          walletAddress: input.walletAddress
        });

        return user;
      }
    },
    workspaceMembershipRepository: {
      async create(input: {
        role?: "operator" | "owner";
        userId: string;
        workspaceId: string;
      }) {
        membershipIndex += 1;
        const membership = {
          createdAt: new Date(`2026-04-09T00:00:${String(membershipIndex).padStart(2, "0")}.000Z`),
          id: `membership_${membershipIndex}`,
          role: (input.role ?? "operator") as "operator",
          userId: input.userId,
          workspaceId: input.workspaceId
        };

        memberships.set(membership.id, membership);

        return membership;
      },

      async deleteByIdForWorkspace(input: { id: string; workspaceId: string }) {
        const membership = memberships.get(input.id);

        if (!membership || membership.workspaceId !== input.workspaceId) {
          return {
            count: 0
          };
        }

        memberships.delete(input.id);

        return {
          count: 1
        };
      },

      async findByIdWithUserAndWorkspace(input: { id: string }) {
        const membership = memberships.get(input.id);

        if (!membership) {
          return null;
        }

        const user = users.get(membership.userId);
        const workspace = workspaces.get(membership.workspaceId);

        if (!user || !workspace) {
          return null;
        }

        return {
          ...membership,
          user,
          workspace: {
            id: workspace.id,
            ownerUserId: workspace.ownerUserId
          }
        };
      },

      async findByWorkspaceAndUserId(input: {
        userId: string;
        workspaceId: string;
      }) {
        return (
          [...memberships.values()].find(
            (membership) =>
              membership.userId === input.userId &&
              membership.workspaceId === input.workspaceId
          ) ?? null
        );
      },

      async findFirstByUserId(userId: string) {
        const membership =
          [...memberships.values()].find(
            (currentMembership) => currentMembership.userId === userId
          ) ?? null;

        if (!membership) {
          return null;
        }

        const workspace = workspaces.get(membership.workspaceId);

        return workspace
          ? {
              workspace: {
                id: workspace.id
              }
            }
          : null;
      },

      async listByWorkspaceId(workspaceId: string) {
        return [...memberships.values()]
          .filter((membership) => membership.workspaceId === workspaceId)
          .map((membership) => ({
            createdAt: membership.createdAt,
            id: membership.id,
            role: membership.role,
            user: users.get(membership.userId)!,
            userId: membership.userId
          }));
      }
    },
    workspaceInvitationRepository: {
      async create(input: {
        expiresAt: Date;
        invitedByUserId: string;
        role?: "operator" | "owner";
        walletAddress: string;
        workspaceId: string;
      }) {
        invitationIndex += 1;
        const invitation = {
          createdAt: new Date(
            `2026-04-09T01:00:${String(invitationIndex).padStart(2, "0")}.000Z`
          ),
          expiresAt: input.expiresAt,
          id: `invitation_${invitationIndex}`,
          invitedByUserId: input.invitedByUserId,
          role: (input.role ?? "operator") as "operator",
          walletAddress: input.walletAddress,
          workspaceId: input.workspaceId
        };

        workspaceInvitations.set(invitation.id, invitation);

        return invitation;
      },

      async deleteByIdForWorkspace(input: { id: string; workspaceId: string }) {
        const invitation = workspaceInvitations.get(input.id);

        if (!invitation || invitation.workspaceId !== input.workspaceId) {
          return {
            count: 0
          };
        }

        workspaceInvitations.delete(input.id);

        return {
          count: 1
        };
      },

      async findActiveByWorkspaceAndWalletAddress(input: {
        now: Date;
        walletAddress: string;
        workspaceId: string;
      }) {
        return (
          [...workspaceInvitations.values()]
            .filter(
              (invitation) =>
                invitation.workspaceId === input.workspaceId &&
                invitation.walletAddress.toLowerCase() ===
                  input.walletAddress.toLowerCase() &&
                invitation.expiresAt.getTime() > input.now.getTime()
            )
            .sort((left, right) => left.id.localeCompare(right.id))[0] ?? null
        );
      },

      async findByIdWithWorkspace(input: { id: string }) {
        const invitation = workspaceInvitations.get(input.id);

        if (!invitation) {
          return null;
        }

        const workspace = workspaces.get(invitation.workspaceId);
        const invitedByUser = users.get(invitation.invitedByUserId);

        if (!workspace || !invitedByUser) {
          return null;
        }

        return {
          ...invitation,
          invitedByUser,
          workspace: {
            id: workspace.id,
            ownerUserId: workspace.ownerUserId
          }
        };
      },

      async listActiveByWalletAddress(input: {
        now: Date;
        walletAddress: string;
      }) {
        return [...workspaceInvitations.values()]
          .filter(
            (invitation) =>
              invitation.walletAddress.toLowerCase() ===
                input.walletAddress.toLowerCase() &&
              invitation.expiresAt.getTime() > input.now.getTime()
          )
          .sort((left, right) => left.id.localeCompare(right.id))
          .map((invitation) => ({
            ...invitation,
            invitedByUser: users.get(invitation.invitedByUserId)!,
            workspace: {
              id: invitation.workspaceId,
              ownerUserId: workspaces.get(invitation.workspaceId)!.ownerUserId
            }
          }));
      },

      async listActiveByWorkspaceId(input: { now: Date; workspaceId: string }) {
        return [...workspaceInvitations.values()]
          .filter(
            (invitation) =>
              invitation.workspaceId === input.workspaceId &&
              invitation.expiresAt.getTime() > input.now.getTime()
          )
          .sort((left, right) => left.id.localeCompare(right.id))
          .map((invitation) => ({
            ...invitation,
            invitedByUser: users.get(invitation.invitedByUserId)!,
            workspace: {
              id: invitation.workspaceId,
              ownerUserId: workspaces.get(invitation.workspaceId)!.ownerUserId
            }
          }));
      }
    },
    workspaceRepository: {
      async create(input: {
        name: string;
        ownerUserId: string;
        slug: string;
        status?: "active" | "archived" | "suspended";
      }) {
        ensureUser({
          id: input.ownerUserId
        });
        workspaceIndex += 1;
        const workspace = {
          id: `workspace_${workspaceIndex}`,
          name: input.name,
          ownerUserId: input.ownerUserId,
          slug: input.slug,
          status: input.status ?? "active"
        };

        workspaces.set(workspace.id, workspace);

        return workspace;
      },

      async findBySlug(slug: string) {
        return (
          [...workspaces.values()].find(
            (workspace) => workspace.slug === slug
          ) ?? null
        );
      },

      async findFirstByOwnerUserId(ownerUserId: string) {
        return (
          [...workspaces.values()].find(
            (workspace) => workspace.ownerUserId === ownerUserId
          ) ?? null
        );
      },

      async updateByIdForOwner(input: {
        id: string;
        name: string;
        ownerUserId: string;
        slug: string;
        status: "active" | "archived" | "suspended";
      }) {
        const workspace = workspaces.get(input.id);

        if (!workspace || workspace.ownerUserId !== input.ownerUserId) {
          throw new Error("Unexpected workspace owner mismatch.");
        }

        const updatedWorkspace = {
          ...workspace,
          name: input.name,
          slug: input.slug,
          status: input.status
        };

        workspaces.set(updatedWorkspace.id, updatedWorkspace);

        return updatedWorkspace;
      }
    }
  };

  const service = createStudioSettingsService({
    repositories,
    async runTransaction<T>(
      operation: (repositorySet: typeof repositories) => Promise<T>
    ) {
      return operation(repositories);
    }
  });

  return {
    auditLogs,
    brands,
    memberships,
    publications,
    service,
    users,
    workspaceInvitations,
    workspaces
  };
}

describe("createStudioSettingsService", () => {
  it("returns null settings when the owner has not configured a studio profile", async () => {
    const harness = createStudioSettingsHarness();

    const result = await harness.service.getStudioSettings({
      ownerUserId: "user_1"
    });

    expect(result.settings).toBeNull();
  });

  it("creates an owner-scoped workspace and brand profile", async () => {
    const harness = createStudioSettingsHarness();

    const result = await harness.service.updateStudioSettings({
      accentColor: "#8b5e34",
      brandName: "Forge Editions",
      brandSlug: "forge-editions",
      customDomain: "collections.example.com",
      featuredReleaseLabel: "Hero drop",
      landingDescription:
        "A release-led storefront for collectible portraits and premium client launches.",
      landingHeadline: "Curated collectible releases",
      ownerUserId: "user_1",
      themePreset: "editorial_warm",
      workspaceName: "Forge Operations",
      workspaceSlug: "forge-operations"
    });

    expect(result.settings?.workspace.slug).toBe("forge-operations");
    expect(result.settings?.brand.publicBrandPath).toBe(
      "/brands/forge-editions"
    );
    expect(result.settings?.brand.customDomain).toBe("collections.example.com");
    expect(result.settings?.brand.landingHeadline).toBe(
      "Curated collectible releases"
    );
    expect(result.settings?.brand.featuredReleaseLabel).toBe("Hero drop");
    expect(result.settings?.brands).toHaveLength(1);
  });

  it("creates additional brands under the existing owner workspace", async () => {
    const harness = createStudioSettingsHarness();

    await harness.service.updateStudioSettings({
      accentColor: "#8b5e34",
      brandName: "Forge Editions",
      brandSlug: "forge-editions",
      featuredReleaseLabel: "Hero drop",
      landingDescription:
        "A release-led storefront for collectible portraits and premium client launches.",
      landingHeadline: "Curated collectible releases",
      ownerUserId: "user_1",
      themePreset: "editorial_warm",
      workspaceName: "Forge Operations",
      workspaceSlug: "forge-operations"
    });

    const result = await harness.service.createStudioBrand({
      accentColor: "#244f3c",
      brandName: "North Editions",
      brandSlug: "north-editions",
      featuredReleaseLabel: "North release",
      landingDescription: "North-facing storefront copy.",
      landingHeadline: "North collection releases",
      ownerUserId: "user_1",
      themePreset: "gallery_mono"
    });
    const settings = await harness.service.getStudioSettings({
      ownerUserId: "user_1"
    });

    expect(result.brand.slug).toBe("north-editions");
    expect(settings.settings?.brands).toHaveLength(2);
    expect(settings.settings?.brands[1]?.slug).toBe("north-editions");
  });

  it("propagates brand identity updates across the owner's published collections", async () => {
    const harness = createStudioSettingsHarness();
    const initialSettings = await harness.service.updateStudioSettings({
      accentColor: "#8b5e34",
      brandName: "Forge Editions",
      brandSlug: "forge-editions",
      featuredReleaseLabel: "Hero drop",
      landingDescription:
        "A release-led storefront for collectible portraits and premium client launches.",
      landingHeadline: "Curated collectible releases",
      ownerUserId: "user_1",
      themePreset: "editorial_warm",
      workspaceName: "Forge Operations",
      workspaceSlug: "forge-operations"
    });

    harness.publications.set("publication_1", {
      brandName: initialSettings.settings!.brand.name,
      brandSlug: initialSettings.settings!.brand.slug,
      description: "Release set",
      id: "publication_1",
      ownerUserId: "user_1",
      publishedAt: new Date("2026-04-08T00:00:00.000Z"),
      slug: "genesis-portraits",
      title: "Genesis Portraits",
      updatedAt: new Date("2026-04-08T00:05:00.000Z")
    });

    const result = await harness.service.updateStudioSettings({
      accentColor: "#244f3c",
      brandName: "Premium Forge",
      brandSlug: "premium-forge",
      featuredReleaseLabel: "Flagship release",
      landingDescription:
        "Updated public landing copy for premium collectible drops.",
      landingHeadline: "Premium release directory",
      ownerUserId: "user_1",
      themePreset: "gallery_mono",
      workspaceName: "Forge Operations",
      workspaceSlug: "forge-operations"
    });

    expect(result.settings?.brand.slug).toBe("premium-forge");
    expect(harness.publications.get("publication_1")?.brandSlug).toBe(
      "premium-forge"
    );
    expect(harness.publications.get("publication_1")?.brandName).toBe(
      "Premium Forge"
    );
  });

  it("updates only the selected brand when a brand id is supplied", async () => {
    const harness = createStudioSettingsHarness();
    const initialSettings = await harness.service.updateStudioSettings({
      accentColor: "#8b5e34",
      brandName: "Forge Editions",
      brandSlug: "forge-editions",
      featuredReleaseLabel: "Hero drop",
      landingDescription:
        "A release-led storefront for collectible portraits and premium client launches.",
      landingHeadline: "Curated collectible releases",
      ownerUserId: "user_1",
      themePreset: "editorial_warm",
      workspaceName: "Forge Operations",
      workspaceSlug: "forge-operations"
    });
    const secondBrand = await harness.service.createStudioBrand({
      accentColor: "#244f3c",
      brandName: "North Editions",
      brandSlug: "north-editions",
      featuredReleaseLabel: "North release",
      landingDescription: "North-facing storefront copy.",
      landingHeadline: "North collection releases",
      ownerUserId: "user_1",
      themePreset: "gallery_mono"
    });

    harness.publications.set("publication_1", {
      brandName: secondBrand.brand.name,
      brandSlug: secondBrand.brand.slug,
      description: "North release",
      id: "publication_1",
      ownerUserId: "user_1",
      publishedAt: new Date("2026-04-08T00:00:00.000Z"),
      slug: "genesis-portraits",
      title: "Genesis Portraits",
      updatedAt: new Date("2026-04-08T00:05:00.000Z")
    });

    const result = await harness.service.updateStudioSettings({
      accentColor: "#21465c",
      brandId: secondBrand.brand.id,
      brandName: "North Atelier",
      brandSlug: "north-atelier",
      featuredReleaseLabel: "North feature",
      landingDescription: "Updated north storefront copy.",
      landingHeadline: "North releases",
      ownerUserId: "user_1",
      themePreset: "midnight_launch",
      workspaceName: initialSettings.settings!.workspace.name,
      workspaceSlug: initialSettings.settings!.workspace.slug
    });

    expect(result.settings?.brands[0]?.slug).toBe("forge-editions");
    expect(result.settings?.brands[1]?.slug).toBe("north-atelier");
    expect(harness.publications.get("publication_1")?.brandSlug).toBe(
      "north-atelier"
    );
    expect(harness.publications.get("publication_1")?.brandName).toBe(
      "North Atelier"
    );
  });

  it("rejects a brand slug change that would collide with an existing public route", async () => {
    const harness = createStudioSettingsHarness();

    await harness.service.updateStudioSettings({
      accentColor: "#8b5e34",
      brandName: "Forge Editions",
      brandSlug: "forge-editions",
      featuredReleaseLabel: "Hero drop",
      landingDescription:
        "A release-led storefront for collectible portraits and premium client launches.",
      landingHeadline: "Curated collectible releases",
      ownerUserId: "user_1",
      themePreset: "editorial_warm",
      workspaceName: "Forge Operations",
      workspaceSlug: "forge-operations"
    });
    await harness.service.updateStudioSettings({
      accentColor: "#8b5e34",
      brandName: "North Editions",
      brandSlug: "north-editions",
      featuredReleaseLabel: "North feature",
      landingDescription: "North storefront copy.",
      landingHeadline: "North releases",
      ownerUserId: "user_2",
      themePreset: "editorial_warm",
      workspaceName: "North Operations",
      workspaceSlug: "north-operations"
    });
    harness.publications.set("publication_2", {
      brandName: "North Editions",
      brandSlug: "north-editions",
      description: "North release",
      id: "publication_2",
      ownerUserId: "user_2",
      publishedAt: new Date("2026-04-08T00:00:00.000Z"),
      slug: "genesis-portraits",
      title: "Genesis Portraits",
      updatedAt: new Date("2026-04-08T00:05:00.000Z")
    });
    harness.publications.set("publication_1", {
      brandName: "Forge Editions",
      brandSlug: "forge-editions",
      description: "Forge release",
      id: "publication_1",
      ownerUserId: "user_1",
      publishedAt: new Date("2026-04-08T00:00:00.000Z"),
      slug: "genesis-portraits",
      title: "Genesis Portraits",
      updatedAt: new Date("2026-04-08T00:05:00.000Z")
    });

    await expect(
      harness.service.updateStudioSettings({
        accentColor: "#8b5e34",
        brandName: "Forge Editions",
        brandSlug: "north-editions",
        featuredReleaseLabel: "Hero drop",
        landingDescription:
          "A release-led storefront for collectible portraits and premium client launches.",
        landingHeadline: "Curated collectible releases",
        ownerUserId: "user_1",
        themePreset: "editorial_warm",
        workspaceName: "Forge Operations",
        workspaceSlug: "forge-operations"
      })
    ).rejects.toEqual(
      new StudioSettingsServiceError(
        "BRAND_SLUG_CONFLICT",
        "Brand slug is already in use.",
        409
      )
    );
  });

  it("returns default storefront copy for older brand themes that only stored an accent color", async () => {
    const harness = createStudioSettingsHarness();

    harness.users.set("user_legacy", {
      avatarUrl: null,
      displayName: "Legacy Owner",
      id: "user_legacy",
      walletAddress: "0x1111111111111111111111111111111111111119"
    });
    harness.workspaces.set("workspace_legacy", {
      id: "workspace_legacy",
      name: "Legacy Operations",
      ownerUserId: "user_legacy",
      slug: "legacy-operations",
      status: "active"
    });
    harness.brands.set("brand_legacy", {
      customDomain: null,
      id: "brand_legacy",
      name: "Legacy Studio",
      slug: "legacy-studio",
      themeJson: {
        accentColor: "#21465c"
      },
      workspaceId: "workspace_legacy"
    });

    const result = await harness.service.getStudioSettings({
      ownerUserId: "user_legacy"
    });

    expect(result.settings?.brand.accentColor).toBe("#21465c");
    expect(result.settings?.brand.landingHeadline).toBe(
      "Published collection releases"
    );
    expect(result.settings?.brand.featuredReleaseLabel).toBe(
      "Featured release"
    );
    expect(result.settings?.brand.themePreset).toBe("editorial_warm");
    expect(result.settings?.brand.wordmark).toBeNull();
  });

  it("adds operator members to the owner workspace and includes access metadata", async () => {
    const harness = createStudioSettingsHarness();

    await harness.service.updateStudioSettings({
      accentColor: "#8b5e34",
      brandName: "Forge Editions",
      brandSlug: "forge-editions",
      featuredReleaseLabel: "Hero drop",
      landingDescription: "Owner storefront copy.",
      landingHeadline: "Curated collectible releases",
      ownerUserId: "user_1",
      themePreset: "editorial_warm",
      workspaceName: "Forge Operations",
      workspaceSlug: "forge-operations"
    });

    const addedMember = await harness.service.addWorkspaceMember({
      ownerUserId: "user_1",
      walletAddress: "0x2222222222222222222222222222222222222222"
    });
    const settings = await harness.service.getStudioSettings({
      ownerUserId: "user_1",
      role: "operator"
    });

    expect(addedMember.member.role).toBe("operator");
    expect(settings.settings?.access.role).toBe("operator");
    expect(settings.settings?.access.canManageWorkspace).toBe(false);
    expect(settings.settings?.members).toHaveLength(2);
    expect(harness.auditLogs[0]?.action).toBe("workspace_member_added");
  });

  it("creates workspace invitations and exposes them in settings audit history", async () => {
    const harness = createStudioSettingsHarness();

    await harness.service.updateStudioSettings({
      accentColor: "#8b5e34",
      brandName: "Forge Editions",
      brandSlug: "forge-editions",
      featuredReleaseLabel: "Hero drop",
      landingDescription: "Owner storefront copy.",
      landingHeadline: "Curated collectible releases",
      ownerUserId: "user_1",
      themePreset: "editorial_warm",
      workspaceName: "Forge Operations",
      workspaceSlug: "forge-operations"
    });

    const invitation = await harness.service.createWorkspaceInvitation({
      ownerUserId: "user_1",
      walletAddress: "0x4444444444444444444444444444444444444444"
    });
    const settings = await harness.service.getStudioSettings({
      ownerUserId: "user_1"
    });

    expect(invitation.invitation.walletAddress).toBe(
      "0x4444444444444444444444444444444444444444"
    );
    expect(settings.settings?.invitations).toHaveLength(1);
    expect(settings.settings?.invitations[0]?.id).toBe(invitation.invitation.id);
    expect(settings.settings?.auditEntries[0]).toMatchObject({
      action: "workspace_invitation_created",
      targetWalletAddress: "0x4444444444444444444444444444444444444444"
    });
  });

  it("cancels workspace invitations and records the lifecycle in audit history", async () => {
    const harness = createStudioSettingsHarness();

    await harness.service.updateStudioSettings({
      accentColor: "#8b5e34",
      brandName: "Forge Editions",
      brandSlug: "forge-editions",
      featuredReleaseLabel: "Hero drop",
      landingDescription: "Owner storefront copy.",
      landingHeadline: "Curated collectible releases",
      ownerUserId: "user_1",
      themePreset: "editorial_warm",
      workspaceName: "Forge Operations",
      workspaceSlug: "forge-operations"
    });

    const invitation = await harness.service.createWorkspaceInvitation({
      ownerUserId: "user_1",
      walletAddress: "0x5555555555555555555555555555555555555555"
    });

    const result = await harness.service.cancelWorkspaceInvitation({
      invitationId: invitation.invitation.id,
      ownerUserId: "user_1"
    });
    const settings = await harness.service.getStudioSettings({
      ownerUserId: "user_1"
    });

    expect(result.removed).toBe(true);
    expect(settings.settings?.invitations).toHaveLength(0);
    expect(settings.settings?.auditEntries.slice(0, 2).map((entry) => entry.action))
      .toEqual([
        "workspace_invitation_canceled",
        "workspace_invitation_created"
      ]);
  });

  it("rejects adding wallets that already belong to another workspace", async () => {
    const harness = createStudioSettingsHarness();

    await harness.service.updateStudioSettings({
      accentColor: "#8b5e34",
      brandName: "Forge Editions",
      brandSlug: "forge-editions",
      featuredReleaseLabel: "Hero drop",
      landingDescription: "Owner storefront copy.",
      landingHeadline: "Curated collectible releases",
      ownerUserId: "user_1",
      themePreset: "editorial_warm",
      workspaceName: "Forge Operations",
      workspaceSlug: "forge-operations"
    });
    await harness.service.updateStudioSettings({
      accentColor: "#244f3c",
      brandName: "North Editions",
      brandSlug: "north-editions",
      featuredReleaseLabel: "North feature",
      landingDescription: "North storefront copy.",
      landingHeadline: "North releases",
      ownerUserId: "user_2",
      themePreset: "gallery_mono",
      workspaceName: "North Operations",
      workspaceSlug: "north-operations"
    });

    await expect(
      harness.service.addWorkspaceMember({
        ownerUserId: "user_1",
        walletAddress: harness.users.get("user_2")!.walletAddress
      })
    ).rejects.toEqual(
      new StudioSettingsServiceError(
        "MEMBER_WORKSPACE_CONFLICT",
        "That wallet already owns another workspace.",
        409
      )
    );
  });

  it("removes workspace operators", async () => {
    const harness = createStudioSettingsHarness();

    await harness.service.updateStudioSettings({
      accentColor: "#8b5e34",
      brandName: "Forge Editions",
      brandSlug: "forge-editions",
      featuredReleaseLabel: "Hero drop",
      landingDescription: "Owner storefront copy.",
      landingHeadline: "Curated collectible releases",
      ownerUserId: "user_1",
      themePreset: "editorial_warm",
      workspaceName: "Forge Operations",
      workspaceSlug: "forge-operations"
    });
    const addedMember = await harness.service.addWorkspaceMember({
      ownerUserId: "user_1",
      walletAddress: "0x3333333333333333333333333333333333333333"
    });

    const result = await harness.service.removeWorkspaceMember({
      membershipId: addedMember.member.membershipId!,
      ownerUserId: "user_1"
    });

    expect(result.removed).toBe(true);
    expect(harness.memberships.size).toBe(0);
    expect(harness.auditLogs.slice(-2).map((entry) => entry.action)).toEqual([
      "workspace_member_added",
      "workspace_member_removed"
    ]);
  });
});
