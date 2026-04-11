import {
  defaultStudioBrandAccentColor,
  defaultStudioBrandLandingDescription,
  defaultStudioBrandLandingHeadline,
  defaultStudioBrandThemePreset,
  defaultStudioFeaturedReleaseLabel,
  studioBrandCreateRequestSchema,
  studioBrandResponseSchema,
  studioBrandThemeSchema,
  studioWorkspaceAuditActionSchema,
  studioWorkspaceAuditEntrySchema,
  studioWorkspaceInvitationCreateRequestSchema,
  studioWorkspaceInvitationDeleteResponseSchema,
  studioWorkspaceInvitationResponseSchema,
  studioSettingsResponseSchema,
  studioSettingsUpdateRequestSchema,
  studioWorkspaceMemberCreateRequestSchema,
  studioWorkspaceMemberDeleteResponseSchema,
  studioWorkspaceMemberResponseSchema,
  type StudioWorkspaceRole
} from "@ai-nft-forge/shared";

import { StudioSettingsServiceError } from "./error";

type WorkspaceRecord = {
  id: string;
  name: string;
  ownerUserId: string;
  slug: string;
  status: "active" | "archived" | "suspended";
};

type BrandRecord = {
  customDomain: string | null;
  id: string;
  name: string;
  slug: string;
  themeJson: unknown;
  workspaceId: string;
};

type PublishedCollectionRecord = {
  brandName: string;
  brandSlug: string;
  description: string | null;
  id: string;
  publishedAt: Date;
  slug: string;
  title: string;
  updatedAt: Date;
};

type UserRecord = {
  avatarUrl: string | null;
  displayName: string | null;
  id: string;
  walletAddress: string;
};

type WorkspaceMembershipRecord = {
  createdAt: Date;
  id: string;
  role: StudioWorkspaceRole;
  user: UserRecord;
  userId: string;
  workspace: {
    id: string;
    ownerUserId: string;
  };
  workspaceId: string;
};

type WorkspaceInvitationRecord = {
  createdAt: Date;
  expiresAt: Date;
  id: string;
  invitedByUser: UserRecord;
  invitedByUserId: string;
  role: StudioWorkspaceRole;
  walletAddress: string;
  workspaceId: string;
};

type WorkspaceInvitationWithWorkspaceRecord = WorkspaceInvitationRecord & {
  workspace: {
    id: string;
    ownerUserId: string;
  };
};

type WorkspaceInvitationLookupRecord = {
  createdAt: Date;
  expiresAt: Date;
  id: string;
  role: StudioWorkspaceRole;
  walletAddress: string;
  workspace: {
    id: string;
    ownerUserId: string;
  };
  workspaceId: string;
};

type AuditLogRecord = {
  action: string;
  actorId: string;
  actorType: string;
  createdAt: Date;
  entityId: string;
  entityType: string;
  id: string;
  metadataJson: unknown;
};

const workspaceInvitationTtlDays = 14;

type StudioSettingsRepositorySet = {
  auditLogRepository: {
    create(input: {
      action: string;
      actorId: string;
      actorType: string;
      entityId: string;
      entityType: string;
      metadataJson: unknown;
    }): Promise<AuditLogRecord>;
    listByEntity(input: {
      entityId: string;
      entityType: string;
      limit?: number;
    }): Promise<AuditLogRecord[]>;
  };
  brandRepository: {
    create(input: {
      customDomain?: string | null;
      name: string;
      slug: string;
      themeJson: unknown;
      workspaceId: string;
    }): Promise<BrandRecord>;
    findByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<BrandRecord | null>;
    findFirstByOwnerUserId(ownerUserId: string): Promise<BrandRecord | null>;
    findFirstBySlug(slug: string): Promise<BrandRecord | null>;
    listByOwnerUserId(ownerUserId: string): Promise<BrandRecord[]>;
    updateByIdForOwner(input: {
      customDomain?: string | null;
      id: string;
      name: string;
      ownerUserId: string;
      slug: string;
      themeJson: unknown;
      workspaceId: string;
    }): Promise<BrandRecord>;
  };
  publishedCollectionRepository: {
    findByBrandSlugAndCollectionSlug(input: {
      brandSlug: string;
      slug: string;
    }): Promise<{ id: string } | null>;
    listByOwnerUserId(
      ownerUserId: string
    ): Promise<PublishedCollectionRecord[]>;
    updateByIdForOwner(input: {
      brandName: string;
      brandSlug: string;
      description: string | null;
      id: string;
      ownerUserId: string;
      slug: string;
      title: string;
    }): Promise<{ id: string }>;
  };
  userRepository: {
    findById(id: string): Promise<UserRecord | null>;
    findByWalletAddress(walletAddress: string): Promise<UserRecord | null>;
    upsertWalletUser(input: {
      avatarUrl?: string | null;
      displayName?: string | null;
      walletAddress: string;
    }): Promise<UserRecord>;
  };
  workspaceMembershipRepository: {
    create(input: {
      role?: StudioWorkspaceRole;
      userId: string;
      workspaceId: string;
    }): Promise<{
      id: string;
    }>;
    deleteByIdForWorkspace(input: {
      id: string;
      workspaceId: string;
    }): Promise<{ count: number }>;
    findByIdWithUserAndWorkspace(input: {
      id: string;
    }): Promise<WorkspaceMembershipRecord | null>;
    findByWorkspaceAndUserId(input: {
      userId: string;
      workspaceId: string;
    }): Promise<{
      id: string;
      role: StudioWorkspaceRole;
      userId: string;
      workspaceId: string;
    } | null>;
    findFirstByUserId(userId: string): Promise<{
      workspace: {
        id: string;
      };
    } | null>;
    listByWorkspaceId(workspaceId: string): Promise<
      Array<{
        createdAt: Date;
        id: string;
        role: StudioWorkspaceRole;
        user: UserRecord;
        userId: string;
      }>
    >;
  };
  workspaceInvitationRepository: {
    create(input: {
      expiresAt: Date;
      invitedByUserId: string;
      role?: StudioWorkspaceRole;
      walletAddress: string;
      workspaceId: string;
    }): Promise<{
      id: string;
    }>;
    deleteByIdForWorkspace(input: {
      id: string;
      workspaceId: string;
    }): Promise<{ count: number }>;
    findActiveByWorkspaceAndWalletAddress(input: {
      now: Date;
      walletAddress: string;
      workspaceId: string;
    }): Promise<{
      id: string;
      walletAddress: string;
      workspaceId: string;
    } | null>;
    findByIdWithWorkspace(input: {
      id: string;
    }): Promise<WorkspaceInvitationWithWorkspaceRecord | null>;
    listActiveByWalletAddress(input: {
      now: Date;
      walletAddress: string;
    }): Promise<WorkspaceInvitationLookupRecord[]>;
    listActiveByWorkspaceId(input: {
      now: Date;
      workspaceId: string;
    }): Promise<WorkspaceInvitationRecord[]>;
  };
  workspaceRepository: {
    create(input: {
      name: string;
      ownerUserId: string;
      slug: string;
      status?: "active" | "archived" | "suspended";
    }): Promise<WorkspaceRecord>;
    findBySlug(slug: string): Promise<WorkspaceRecord | null>;
    findFirstByOwnerUserId(
      ownerUserId: string
    ): Promise<WorkspaceRecord | null>;
    updateByIdForOwner(input: {
      id: string;
      name: string;
      ownerUserId: string;
      slug: string;
      status: "active" | "archived" | "suspended";
    }): Promise<WorkspaceRecord>;
  };
};

type StudioSettingsServiceDependencies = {
  repositories: StudioSettingsRepositorySet;
  runTransaction<T>(
    operation: (repositories: StudioSettingsRepositorySet) => Promise<T>
  ): Promise<T>;
};

function normalizeOptionalDomain(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function normalizeOptionalText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : null;
}

function parseBrandTheme(themeJson: unknown) {
  const parsedTheme = studioBrandThemeSchema.safeParse(themeJson);

  if (parsedTheme.success) {
    return {
      accentColor: parsedTheme.data.accentColor,
      featuredReleaseLabel:
        parsedTheme.data.featuredReleaseLabel ??
        defaultStudioFeaturedReleaseLabel,
      heroKicker: parsedTheme.data.heroKicker ?? null,
      landingDescription:
        parsedTheme.data.landingDescription ??
        defaultStudioBrandLandingDescription,
      landingHeadline:
        parsedTheme.data.landingHeadline ?? defaultStudioBrandLandingHeadline,
      primaryCtaLabel: parsedTheme.data.primaryCtaLabel ?? null,
      secondaryCtaLabel: parsedTheme.data.secondaryCtaLabel ?? null,
      storyBody: parsedTheme.data.storyBody ?? null,
      storyHeadline: parsedTheme.data.storyHeadline ?? null,
      themePreset:
        parsedTheme.data.themePreset ?? defaultStudioBrandThemePreset,
      wordmark: parsedTheme.data.wordmark ?? null
    };
  }

  return {
    accentColor: defaultStudioBrandAccentColor,
    featuredReleaseLabel: defaultStudioFeaturedReleaseLabel,
    heroKicker: null,
    landingDescription: defaultStudioBrandLandingDescription,
    landingHeadline: defaultStudioBrandLandingHeadline,
    primaryCtaLabel: null,
    secondaryCtaLabel: null,
    storyBody: null,
    storyHeadline: null,
    themePreset: defaultStudioBrandThemePreset,
    wordmark: null
  };
}

function buildBrandThemeJson(input: {
  accentColor: string;
  featuredReleaseLabel: string;
  heroKicker?: string | null | undefined;
  landingDescription: string;
  landingHeadline: string;
  primaryCtaLabel?: string | null | undefined;
  secondaryCtaLabel?: string | null | undefined;
  storyBody?: string | null | undefined;
  storyHeadline?: string | null | undefined;
  themePreset: "editorial_warm" | "gallery_mono" | "midnight_launch";
  wordmark?: string | null | undefined;
}) {
  return {
    accentColor: input.accentColor,
    featuredReleaseLabel: input.featuredReleaseLabel,
    heroKicker: normalizeOptionalText(input.heroKicker),
    landingDescription: input.landingDescription,
    landingHeadline: input.landingHeadline,
    primaryCtaLabel: normalizeOptionalText(input.primaryCtaLabel),
    secondaryCtaLabel: normalizeOptionalText(input.secondaryCtaLabel),
    storyBody: normalizeOptionalText(input.storyBody),
    storyHeadline: normalizeOptionalText(input.storyHeadline),
    themePreset: input.themePreset,
    wordmark: normalizeOptionalText(input.wordmark)
  };
}

function serializeBrand(input: BrandRecord) {
  const theme = parseBrandTheme(input.themeJson);

  return {
    accentColor: theme.accentColor,
    customDomain: input.customDomain,
    featuredReleaseLabel: theme.featuredReleaseLabel,
    heroKicker: theme.heroKicker,
    id: input.id,
    landingDescription: theme.landingDescription,
    landingHeadline: theme.landingHeadline,
    name: input.name,
    primaryCtaLabel: theme.primaryCtaLabel,
    publicBrandPath: `/brands/${input.slug}`,
    secondaryCtaLabel: theme.secondaryCtaLabel,
    slug: input.slug,
    storyBody: theme.storyBody,
    storyHeadline: theme.storyHeadline,
    themePreset: theme.themePreset,
    wordmark: theme.wordmark
  };
}

function createWorkspaceAccess(role: StudioWorkspaceRole) {
  return {
    canManageMembers: role === "owner",
    canManageOnchain: role === "owner",
    canManageOpsPolicy: role === "owner",
    canManageWorkspace: role === "owner",
    canPublishCollections: role === "owner",
    role
  };
}

function serializeWorkspaceMember(input: {
  addedAt: Date | null;
  membershipId: string | null;
  role: StudioWorkspaceRole;
  user: UserRecord;
}) {
  return {
    addedAt: input.addedAt?.toISOString() ?? null,
    id: input.membershipId ?? `owner:${input.user.id}`,
    membershipId: input.membershipId,
    role: input.role,
    userAvatarUrl: input.user.avatarUrl,
    userDisplayName: input.user.displayName,
    userId: input.user.id,
    walletAddress: input.user.walletAddress
  };
}

function serializeWorkspaceInvitation(input: WorkspaceInvitationRecord) {
  return {
    createdAt: input.createdAt.toISOString(),
    expiresAt: input.expiresAt.toISOString(),
    id: input.id,
    invitedByUserId: input.invitedByUserId,
    invitedByWalletAddress: input.invitedByUser.walletAddress,
    role: input.role,
    walletAddress: input.walletAddress
  };
}

function serializeWorkspaceAuditEntry(input: AuditLogRecord) {
  const parsedAction = studioWorkspaceAuditActionSchema.safeParse(input.action);

  if (!parsedAction.success) {
    return null;
  }

  const metadata =
    typeof input.metadataJson === "object" && input.metadataJson !== null
      ? input.metadataJson
      : {};
  const targetWalletAddress =
    "targetWalletAddress" in metadata &&
    typeof metadata.targetWalletAddress === "string"
      ? metadata.targetWalletAddress
      : null;
  const actorWalletAddress =
    "actorWalletAddress" in metadata &&
    typeof metadata.actorWalletAddress === "string"
      ? metadata.actorWalletAddress
      : targetWalletAddress;
  const membershipId =
    "membershipId" in metadata && typeof metadata.membershipId === "string"
      ? metadata.membershipId
      : null;
  const role =
    "role" in metadata && typeof metadata.role === "string"
      ? metadata.role
      : null;
  const targetUserId =
    "targetUserId" in metadata && typeof metadata.targetUserId === "string"
      ? metadata.targetUserId
      : null;

  if (!actorWalletAddress) {
    return null;
  }

  return studioWorkspaceAuditEntrySchema.parse({
    action: parsedAction.data,
    actorUserId: input.actorId,
    actorWalletAddress,
    createdAt: input.createdAt.toISOString(),
    id: input.id,
    membershipId,
    role,
    targetUserId,
    targetWalletAddress
  });
}

async function serializeStudioSettings(input: {
  brands: BrandRecord[];
  owner: UserRecord;
  repositories: Pick<
    StudioSettingsRepositorySet,
    | "auditLogRepository"
    | "workspaceInvitationRepository"
    | "workspaceMembershipRepository"
  >;
  role: StudioWorkspaceRole;
  workspace: WorkspaceRecord;
}) {
  const now = new Date();
  const [memberships, invitations, auditLogs] = await Promise.all([
    input.repositories.workspaceMembershipRepository.listByWorkspaceId(
      input.workspace.id
    ),
    input.repositories.workspaceInvitationRepository.listActiveByWorkspaceId({
      now,
      workspaceId: input.workspace.id
    }),
    input.repositories.auditLogRepository.listByEntity({
      entityId: input.workspace.id,
      entityType: "workspace",
      limit: 25
    })
  ]);
  const auditEntries = auditLogs.flatMap((auditLog) => {
    const serializedAuditEntry = serializeWorkspaceAuditEntry(auditLog);

    return serializedAuditEntry ? [serializedAuditEntry] : [];
  });

  return studioSettingsResponseSchema.parse({
    settings: {
      access: createWorkspaceAccess(input.role),
      auditEntries,
      brand: serializeBrand(input.brands[0]!),
      brands: input.brands.map((brand) => serializeBrand(brand)),
      invitations: invitations.map((invitation) =>
        serializeWorkspaceInvitation(invitation)
      ),
      members: [
        serializeWorkspaceMember({
          addedAt: null,
          membershipId: null,
          role: "owner",
          user: input.owner
        }),
        ...memberships.map((membership) =>
          serializeWorkspaceMember({
            addedAt: membership.createdAt,
            membershipId: membership.id,
            role: membership.role,
            user: membership.user
          })
        )
      ],
      workspace: {
        id: input.workspace.id,
        name: input.workspace.name,
        slug: input.workspace.slug,
        status: input.workspace.status
      }
    }
  });
}

async function loadOwnerStudioSettings(input: {
  ownerUserId: string;
  repositories: StudioSettingsRepositorySet;
  role: StudioWorkspaceRole;
}) {
  const [owner, workspace, brands] = await Promise.all([
    input.repositories.userRepository.findById(input.ownerUserId),
    input.repositories.workspaceRepository.findFirstByOwnerUserId(
      input.ownerUserId
    ),
    input.repositories.brandRepository.listByOwnerUserId(input.ownerUserId)
  ]);

  if (!workspace || brands.length === 0 || !owner) {
    return studioSettingsResponseSchema.parse({
      settings: null
    });
  }

  return serializeStudioSettings({
    brands,
    owner,
    repositories: input.repositories,
    role: input.role,
    workspace
  });
}

async function assertWorkspaceSlugAvailable(input: {
  existingWorkspaceId: string | null;
  repositories: Pick<StudioSettingsRepositorySet, "workspaceRepository">;
  workspaceSlug: string;
}) {
  const conflictingWorkspace =
    await input.repositories.workspaceRepository.findBySlug(input.workspaceSlug);

  if (
    conflictingWorkspace &&
    conflictingWorkspace.id !== input.existingWorkspaceId
  ) {
    throw new StudioSettingsServiceError(
      "WORKSPACE_SLUG_CONFLICT",
      "Workspace slug is already in use.",
      409
    );
  }
}

async function assertBrandSlugAvailable(input: {
  brandSlug: string;
  existingBrandId: string | null;
  repositories: Pick<StudioSettingsRepositorySet, "brandRepository">;
}) {
  const conflictingBrand = await input.repositories.brandRepository.findFirstBySlug(
    input.brandSlug
  );

  if (conflictingBrand && conflictingBrand.id !== input.existingBrandId) {
    throw new StudioSettingsServiceError(
      "BRAND_SLUG_CONFLICT",
      "Brand slug is already in use.",
      409
    );
  }
}

async function assertPublicationRouteCompatibility(input: {
  nextBrandSlug: string;
  publications: PublishedCollectionRecord[];
  repositories: Pick<StudioSettingsRepositorySet, "publishedCollectionRepository">;
}) {
  for (const publication of input.publications) {
    const routeConflict =
      await input.repositories.publishedCollectionRepository.findByBrandSlugAndCollectionSlug(
        {
          brandSlug: input.nextBrandSlug,
          slug: publication.slug
        }
      );

    if (routeConflict && routeConflict.id !== publication.id) {
      throw new StudioSettingsServiceError(
        "BRAND_PUBLICATION_CONFLICT",
        "The requested brand slug would conflict with an existing published collection route.",
        409
      );
    }
  }
}

function assertOwnerRole(role: StudioWorkspaceRole) {
  if (role !== "owner") {
    throw new StudioSettingsServiceError(
      "FORBIDDEN",
      "Only workspace owners can change these settings.",
      403
    );
  }
}

async function recordWorkspaceAuditLog(input: {
  action:
    | "workspace_invitation_accepted"
    | "workspace_invitation_canceled"
    | "workspace_invitation_created"
    | "workspace_member_added"
    | "workspace_member_removed";
  actor: UserRecord;
  membershipId?: string | null;
  repositories: Pick<StudioSettingsRepositorySet, "auditLogRepository">;
  role?: StudioWorkspaceRole | null;
  targetUserId?: string | null;
  targetWalletAddress?: string | null;
  workspaceId: string;
}) {
  await input.repositories.auditLogRepository.create({
    action: input.action,
    actorId: input.actor.id,
    actorType: "user",
    entityId: input.workspaceId,
    entityType: "workspace",
    metadataJson: {
      actorWalletAddress: input.actor.walletAddress,
      ...(input.membershipId
        ? {
            membershipId: input.membershipId
          }
        : {}),
      ...(input.role
        ? {
            role: input.role
          }
        : {}),
      ...(input.targetUserId
        ? {
            targetUserId: input.targetUserId
          }
        : {}),
      ...(input.targetWalletAddress
        ? {
            targetWalletAddress: input.targetWalletAddress
          }
        : {})
    }
  });
}

async function requireOwnerWorkspace(input: {
  ownerUserId: string;
  repositories: Pick<
    StudioSettingsRepositorySet,
    "userRepository" | "workspaceRepository"
  >;
}) {
  const [owner, workspace] = await Promise.all([
    input.repositories.userRepository.findById(input.ownerUserId),
    input.repositories.workspaceRepository.findFirstByOwnerUserId(
      input.ownerUserId
    )
  ]);

  if (!owner || !workspace) {
    throw new StudioSettingsServiceError(
      "WORKSPACE_REQUIRED",
      "Create the workspace profile before managing operators.",
      409
    );
  }

  return {
    owner,
    workspace
  };
}

export function createStudioSettingsService(
  dependencies: StudioSettingsServiceDependencies
) {
  return {
    async getStudioSettings(input: {
      ownerUserId: string;
      role?: StudioWorkspaceRole;
    }) {
      return loadOwnerStudioSettings({
        ownerUserId: input.ownerUserId,
        repositories: dependencies.repositories,
        role: input.role ?? "owner"
      });
    },

    async createStudioBrand(input: {
      accentColor: string;
      brandName: string;
      brandSlug: string;
      customDomain?: string | null;
      featuredReleaseLabel: string;
      heroKicker?: string | null;
      landingDescription: string;
      landingHeadline: string;
      ownerUserId: string;
      primaryCtaLabel?: string | null;
      role?: StudioWorkspaceRole;
      secondaryCtaLabel?: string | null;
      storyBody?: string | null;
      storyHeadline?: string | null;
      themePreset: "editorial_warm" | "gallery_mono" | "midnight_launch";
      wordmark?: string | null;
    }) {
      assertOwnerRole(input.role ?? "owner");

      const parsedInput = studioBrandCreateRequestSchema.parse({
        accentColor: input.accentColor,
        brandName: input.brandName,
        brandSlug: input.brandSlug,
        customDomain: input.customDomain,
        featuredReleaseLabel: input.featuredReleaseLabel,
        heroKicker: input.heroKicker,
        landingDescription: input.landingDescription,
        landingHeadline: input.landingHeadline,
        primaryCtaLabel: input.primaryCtaLabel,
        secondaryCtaLabel: input.secondaryCtaLabel,
        storyBody: input.storyBody,
        storyHeadline: input.storyHeadline,
        themePreset: input.themePreset,
        wordmark: input.wordmark
      });

      return dependencies.runTransaction(async (repositories) => {
        const workspace =
          await repositories.workspaceRepository.findFirstByOwnerUserId(
            input.ownerUserId
          );

        if (!workspace) {
          throw new StudioSettingsServiceError(
            "WORKSPACE_REQUIRED",
            "Create the workspace profile before adding additional brands.",
            409
          );
        }

        await assertBrandSlugAvailable({
          brandSlug: parsedInput.brandSlug,
          existingBrandId: null,
          repositories
        });

        const brand = await repositories.brandRepository.create({
          customDomain: normalizeOptionalDomain(parsedInput.customDomain),
          name: parsedInput.brandName,
          slug: parsedInput.brandSlug,
          themeJson: buildBrandThemeJson({
            accentColor: parsedInput.accentColor,
            featuredReleaseLabel: parsedInput.featuredReleaseLabel,
            heroKicker: parsedInput.heroKicker,
            landingDescription: parsedInput.landingDescription,
            landingHeadline: parsedInput.landingHeadline,
            primaryCtaLabel: parsedInput.primaryCtaLabel,
            secondaryCtaLabel: parsedInput.secondaryCtaLabel,
            storyBody: parsedInput.storyBody,
            storyHeadline: parsedInput.storyHeadline,
            themePreset: parsedInput.themePreset,
            wordmark: parsedInput.wordmark
          }),
          workspaceId: workspace.id
        });

        return studioBrandResponseSchema.parse({
          brand: serializeBrand(brand)
        });
      });
    },

    async updateStudioSettings(input: {
      accentColor: string;
      brandId?: string | null;
      brandName: string;
      brandSlug: string;
      customDomain?: string | null;
      featuredReleaseLabel: string;
      heroKicker?: string | null;
      landingDescription: string;
      landingHeadline: string;
      ownerUserId: string;
      primaryCtaLabel?: string | null;
      role?: StudioWorkspaceRole;
      secondaryCtaLabel?: string | null;
      storyBody?: string | null;
      storyHeadline?: string | null;
      themePreset: "editorial_warm" | "gallery_mono" | "midnight_launch";
      wordmark?: string | null;
      workspaceName: string;
      workspaceSlug: string;
    }) {
      assertOwnerRole(input.role ?? "owner");

      const parsedInput = studioSettingsUpdateRequestSchema.parse({
        accentColor: input.accentColor,
        brandId: input.brandId,
        brandName: input.brandName,
        brandSlug: input.brandSlug,
        customDomain: input.customDomain,
        featuredReleaseLabel: input.featuredReleaseLabel,
        heroKicker: input.heroKicker,
        landingDescription: input.landingDescription,
        landingHeadline: input.landingHeadline,
        primaryCtaLabel: input.primaryCtaLabel,
        secondaryCtaLabel: input.secondaryCtaLabel,
        storyBody: input.storyBody,
        storyHeadline: input.storyHeadline,
        themePreset: input.themePreset,
        wordmark: input.wordmark,
        workspaceName: input.workspaceName,
        workspaceSlug: input.workspaceSlug
      });

      return dependencies.runTransaction(async (repositories) => {
        const [existingWorkspace, existingBrands, ownedPublications] =
          await Promise.all([
            repositories.workspaceRepository.findFirstByOwnerUserId(
              input.ownerUserId
            ),
            repositories.brandRepository.listByOwnerUserId(input.ownerUserId),
            repositories.publishedCollectionRepository.listByOwnerUserId(
              input.ownerUserId
            )
          ]);
        const existingBrand = parsedInput.brandId
          ? existingBrands.find((brand) => brand.id === parsedInput.brandId) ??
            null
          : existingBrands[0] ?? null;

        if (parsedInput.brandId && !existingBrand) {
          throw new StudioSettingsServiceError(
            "BRAND_NOT_FOUND",
            "The requested brand was not found.",
            404
          );
        }

        await assertWorkspaceSlugAvailable({
          existingWorkspaceId: existingWorkspace?.id ?? null,
          repositories,
          workspaceSlug: parsedInput.workspaceSlug
        });
        await assertBrandSlugAvailable({
          brandSlug: parsedInput.brandSlug,
          existingBrandId: existingBrand?.id ?? null,
          repositories
        });

        const publicationsForBrand = existingBrand
          ? ownedPublications.filter(
              (publication) => publication.brandSlug === existingBrand.slug
            )
          : [];

        if (
          existingBrand &&
          existingBrand.slug !== parsedInput.brandSlug &&
          publicationsForBrand.length > 0
        ) {
          await assertPublicationRouteCompatibility({
            nextBrandSlug: parsedInput.brandSlug,
            publications: publicationsForBrand,
            repositories
          });
        }

        const workspace =
          existingWorkspace ??
          (await repositories.workspaceRepository.create({
            name: parsedInput.workspaceName,
            ownerUserId: input.ownerUserId,
            slug: parsedInput.workspaceSlug,
            status: "active"
          }));

        const persistedWorkspace =
          existingWorkspace &&
          (await repositories.workspaceRepository.updateByIdForOwner({
            id: existingWorkspace.id,
            name: parsedInput.workspaceName,
            ownerUserId: input.ownerUserId,
            slug: parsedInput.workspaceSlug,
            status: existingWorkspace.status
          }));

        const brand =
          existingBrand ??
          (await repositories.brandRepository.create({
            customDomain: normalizeOptionalDomain(parsedInput.customDomain),
            name: parsedInput.brandName,
            slug: parsedInput.brandSlug,
            themeJson: buildBrandThemeJson({
              accentColor: parsedInput.accentColor,
              featuredReleaseLabel: parsedInput.featuredReleaseLabel,
              heroKicker: parsedInput.heroKicker,
              landingDescription: parsedInput.landingDescription,
              landingHeadline: parsedInput.landingHeadline,
              primaryCtaLabel: parsedInput.primaryCtaLabel,
              secondaryCtaLabel: parsedInput.secondaryCtaLabel,
              storyBody: parsedInput.storyBody,
              storyHeadline: parsedInput.storyHeadline,
              themePreset: parsedInput.themePreset,
              wordmark: parsedInput.wordmark
            }),
            workspaceId: workspace.id
          }));

        const updatedBrand =
          existingBrand &&
          (await repositories.brandRepository.updateByIdForOwner({
            customDomain: normalizeOptionalDomain(parsedInput.customDomain),
            id: existingBrand.id,
            name: parsedInput.brandName,
            ownerUserId: input.ownerUserId,
            slug: parsedInput.brandSlug,
            themeJson: buildBrandThemeJson({
              accentColor: parsedInput.accentColor,
              featuredReleaseLabel: parsedInput.featuredReleaseLabel,
              heroKicker: parsedInput.heroKicker,
              landingDescription: parsedInput.landingDescription,
              landingHeadline: parsedInput.landingHeadline,
              primaryCtaLabel: parsedInput.primaryCtaLabel,
              secondaryCtaLabel: parsedInput.secondaryCtaLabel,
              storyBody: parsedInput.storyBody,
              storyHeadline: parsedInput.storyHeadline,
              themePreset: parsedInput.themePreset,
              wordmark: parsedInput.wordmark
            }),
            workspaceId: workspace.id
          }));

        if (existingBrand && updatedBrand && publicationsForBrand.length > 0) {
          await Promise.all(
            publicationsForBrand.map((publication) =>
              repositories.publishedCollectionRepository.updateByIdForOwner({
                brandName: updatedBrand.name,
                brandSlug: updatedBrand.slug,
                description: publication.description,
                id: publication.id,
                ownerUserId: input.ownerUserId,
                slug: publication.slug,
                title: publication.title
              })
            )
          );
        }

        return loadOwnerStudioSettings({
          ownerUserId: input.ownerUserId,
          repositories,
          role: "owner"
        });
      });
    },

    async addWorkspaceMember(input: {
      ownerUserId: string;
      role?: StudioWorkspaceRole;
      walletAddress: string;
    }) {
      assertOwnerRole(input.role ?? "owner");

      const parsedInput = studioWorkspaceMemberCreateRequestSchema.parse({
        walletAddress: input.walletAddress
      });

      return dependencies.runTransaction(async (repositories) => {
        const now = new Date();
        const { owner, workspace } = await requireOwnerWorkspace({
          ownerUserId: input.ownerUserId,
          repositories
        });

        if (
          owner.walletAddress.toLowerCase() ===
          parsedInput.walletAddress.toLowerCase()
        ) {
          throw new StudioSettingsServiceError(
            "MEMBER_ALREADY_EXISTS",
            "Workspace owners already have full access.",
            409
          );
        }

        const existingUser =
          await repositories.userRepository.findByWalletAddress(
            parsedInput.walletAddress
          );

        if (existingUser) {
          const [ownedWorkspace, existingMembership] = await Promise.all([
            repositories.workspaceRepository.findFirstByOwnerUserId(
              existingUser.id
            ),
            repositories.workspaceMembershipRepository.findFirstByUserId(
              existingUser.id
            )
          ]);

          if (ownedWorkspace) {
            throw new StudioSettingsServiceError(
              "MEMBER_WORKSPACE_CONFLICT",
              "That wallet already owns another workspace.",
              409
            );
          }

          if (existingMembership) {
            if (existingMembership.workspace.id === workspace.id) {
              throw new StudioSettingsServiceError(
                "MEMBER_ALREADY_EXISTS",
                "That wallet already has access to this workspace.",
                409
              );
            }

            throw new StudioSettingsServiceError(
              "MEMBER_WORKSPACE_CONFLICT",
              "That wallet already belongs to another workspace.",
              409
            );
          }
        }

        const member =
          existingUser ??
          (await repositories.userRepository.upsertWalletUser({
            walletAddress: parsedInput.walletAddress
          }));
        const existingWorkspaceMembership =
          await repositories.workspaceMembershipRepository.findByWorkspaceAndUserId(
            {
              userId: member.id,
              workspaceId: workspace.id
            }
          );

        if (existingWorkspaceMembership) {
          throw new StudioSettingsServiceError(
            "MEMBER_ALREADY_EXISTS",
            "That wallet already has access to this workspace.",
            409
          );
        }

        const createdMembership =
          await repositories.workspaceMembershipRepository.create({
            role: "operator",
            userId: member.id,
            workspaceId: workspace.id
          });
        const persistedMembership =
          await repositories.workspaceMembershipRepository.findByIdWithUserAndWorkspace(
            {
              id: createdMembership.id
            }
          );

        if (!persistedMembership) {
          throw new StudioSettingsServiceError(
            "INTERNAL_SERVER_ERROR",
            "Workspace member could not be loaded after creation.",
            500
          );
        }

        await recordWorkspaceAuditLog({
          action: "workspace_member_added",
          actor: owner,
          membershipId: persistedMembership.id,
          repositories,
          role: persistedMembership.role,
          targetUserId: persistedMembership.user.id,
          targetWalletAddress: persistedMembership.user.walletAddress,
          workspaceId: workspace.id
        });

        return studioWorkspaceMemberResponseSchema.parse({
          member: serializeWorkspaceMember({
            addedAt: persistedMembership.createdAt,
            membershipId: persistedMembership.id,
            role: persistedMembership.role,
            user: persistedMembership.user
          })
        });
      });
    },

    async createWorkspaceInvitation(input: {
      ownerUserId: string;
      role?: StudioWorkspaceRole;
      walletAddress: string;
    }) {
      assertOwnerRole(input.role ?? "owner");

      const parsedInput = studioWorkspaceInvitationCreateRequestSchema.parse({
        walletAddress: input.walletAddress
      });

      return dependencies.runTransaction(async (repositories) => {
        const now = new Date();
        const { owner, workspace } = await requireOwnerWorkspace({
          ownerUserId: input.ownerUserId,
          repositories
        });

        if (
          owner.walletAddress.toLowerCase() ===
          parsedInput.walletAddress.toLowerCase()
        ) {
          throw new StudioSettingsServiceError(
            "INVITATION_ALREADY_EXISTS",
            "Workspace owners do not need invitations.",
            409
          );
        }

        const existingUser =
          await repositories.userRepository.findByWalletAddress(
            parsedInput.walletAddress
          );

        if (existingUser) {
          const [ownedWorkspace, existingMembership] = await Promise.all([
            repositories.workspaceRepository.findFirstByOwnerUserId(
              existingUser.id
            ),
            repositories.workspaceMembershipRepository.findFirstByUserId(
              existingUser.id
            )
          ]);

          if (ownedWorkspace) {
            throw new StudioSettingsServiceError(
              "MEMBER_WORKSPACE_CONFLICT",
              "That wallet already owns another workspace.",
              409
            );
          }

          if (existingMembership) {
            if (existingMembership.workspace.id === workspace.id) {
              throw new StudioSettingsServiceError(
                "MEMBER_ALREADY_EXISTS",
                "That wallet already has access to this workspace.",
                409
              );
            }

            throw new StudioSettingsServiceError(
              "MEMBER_WORKSPACE_CONFLICT",
              "That wallet already belongs to another workspace.",
              409
            );
          }
        }

        const existingWorkspaceInvitation =
          await repositories.workspaceInvitationRepository.findActiveByWorkspaceAndWalletAddress(
            {
              now,
              walletAddress: parsedInput.walletAddress,
              workspaceId: workspace.id
            }
          );

        if (existingWorkspaceInvitation) {
          throw new StudioSettingsServiceError(
            "INVITATION_ALREADY_EXISTS",
            "That wallet already has a pending invitation for this workspace.",
            409
          );
        }

        const pendingInvitations =
          await repositories.workspaceInvitationRepository.listActiveByWalletAddress(
            {
              now,
              walletAddress: parsedInput.walletAddress
            }
          );

        if (pendingInvitations.length > 0) {
          throw new StudioSettingsServiceError(
            "MEMBER_WORKSPACE_CONFLICT",
            "That wallet already has a pending invitation for another workspace.",
            409
          );
        }

        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + workspaceInvitationTtlDays);

        const invitation = await repositories.workspaceInvitationRepository.create(
          {
            expiresAt,
            invitedByUserId: owner.id,
            role: "operator",
            walletAddress: parsedInput.walletAddress,
            workspaceId: workspace.id
          }
        );
        const persistedInvitation =
          await repositories.workspaceInvitationRepository.findByIdWithWorkspace(
            {
              id: invitation.id
            }
          );

        if (!persistedInvitation) {
          throw new StudioSettingsServiceError(
            "INTERNAL_SERVER_ERROR",
            "Workspace invitation could not be loaded after creation.",
            500
          );
        }

        await recordWorkspaceAuditLog({
          action: "workspace_invitation_created",
          actor: owner,
          repositories,
          role: "operator",
          targetWalletAddress: persistedInvitation.walletAddress,
          workspaceId: workspace.id
        });

        return studioWorkspaceInvitationResponseSchema.parse({
          invitation: serializeWorkspaceInvitation(persistedInvitation)
        });
      });
    },

    async cancelWorkspaceInvitation(input: {
      invitationId: string;
      ownerUserId: string;
      role?: StudioWorkspaceRole;
    }) {
      assertOwnerRole(input.role ?? "owner");

      return dependencies.runTransaction(async (repositories) => {
        const { owner, workspace } = await requireOwnerWorkspace({
          ownerUserId: input.ownerUserId,
          repositories
        });
        const invitation =
          await repositories.workspaceInvitationRepository.findByIdWithWorkspace(
            {
              id: input.invitationId
            }
          );

        if (
          !invitation ||
          invitation.workspace.id !== workspace.id ||
          invitation.workspace.ownerUserId !== input.ownerUserId
        ) {
          throw new StudioSettingsServiceError(
            "INVITATION_NOT_FOUND",
            "The requested workspace invitation was not found.",
            404
          );
        }

        const deleted =
          await repositories.workspaceInvitationRepository.deleteByIdForWorkspace(
            {
              id: input.invitationId,
              workspaceId: workspace.id
            }
          );

        if (deleted.count === 0) {
          throw new StudioSettingsServiceError(
            "INVITATION_NOT_FOUND",
            "The requested workspace invitation was not found.",
            404
          );
        }

        await recordWorkspaceAuditLog({
          action: "workspace_invitation_canceled",
          actor: owner,
          repositories,
          role: invitation.role,
          targetWalletAddress: invitation.walletAddress,
          workspaceId: workspace.id
        });

        return studioWorkspaceInvitationDeleteResponseSchema.parse({
          invitationId: input.invitationId,
          removed: true
        });
      });
    },

    async removeWorkspaceMember(input: {
      membershipId: string;
      ownerUserId: string;
      role?: StudioWorkspaceRole;
    }) {
      assertOwnerRole(input.role ?? "owner");

      return dependencies.runTransaction(async (repositories) => {
        const { owner, workspace } = await requireOwnerWorkspace({
          ownerUserId: input.ownerUserId,
          repositories
        });
        const membership =
          await repositories.workspaceMembershipRepository.findByIdWithUserAndWorkspace(
            {
              id: input.membershipId
            }
          );

        if (
          !membership ||
          membership.workspace.id !== workspace.id ||
          membership.workspace.ownerUserId !== input.ownerUserId
        ) {
          throw new StudioSettingsServiceError(
            "MEMBER_NOT_FOUND",
            "The requested workspace member was not found.",
            404
          );
        }

        const deleted =
          await repositories.workspaceMembershipRepository.deleteByIdForWorkspace(
            {
              id: input.membershipId,
              workspaceId: workspace.id
            }
          );

        if (deleted.count === 0) {
          throw new StudioSettingsServiceError(
            "MEMBER_NOT_FOUND",
            "The requested workspace member was not found.",
            404
          );
        }

        await recordWorkspaceAuditLog({
          action: "workspace_member_removed",
          actor: owner,
          membershipId: membership.id,
          repositories,
          role: membership.role,
          targetUserId: membership.user.id,
          targetWalletAddress: membership.user.walletAddress,
          workspaceId: workspace.id
        });

        return studioWorkspaceMemberDeleteResponseSchema.parse({
          membershipId: input.membershipId,
          removed: true
        });
      });
    }
  };
}
