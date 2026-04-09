import { describe, expect, it } from "vitest";

import { StudioSettingsServiceError } from "./error";
import { createStudioSettingsService } from "./service";

function createStudioSettingsHarness() {
  let workspaceIndex = 0;
  let brandIndex = 0;
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

  const repositories = {
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

      async findFirstBySlug(slug: string) {
        return (
          [...brands.values()].find((brand) => brand.slug === slug) ?? null
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
    workspaceRepository: {
      async create(input: {
        name: string;
        ownerUserId: string;
        slug: string;
        status?: "active" | "archived" | "suspended";
      }) {
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
    brands,
    publications,
    service,
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
  });
});
