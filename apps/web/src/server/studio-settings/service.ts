import {
  defaultStudioBrandAccentColor,
  defaultStudioBrandLandingDescription,
  defaultStudioBrandLandingHeadline,
  defaultStudioBrandThemePreset,
  defaultStudioFeaturedReleaseLabel,
  studioBrandCreateRequestSchema,
  studioBrandResponseSchema,
  studioBrandThemeSchema,
  studioWorkspaceCreateRequestSchema,
  studioWorkspaceCreateResponseSchema,
  studioWorkspaceRoleEscalationActionResponseSchema,
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
  studioWorkspaceRoleEscalationCreateRequestSchema,
  studioWorkspaceRoleEscalationResponseSchema,
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

type WorkspaceRoleEscalationRequestStatusRecord =
  | "pending"
  | "approved"
  | "rejected"
  | "canceled";

type WorkspaceRoleEscalationRequestRecord = {
  createdAt: Date;
  id: string;
  justification: string | null;
  requestedByUser: UserRecord;
  requestedByUserId: string;
  requestedRole: StudioWorkspaceRole;
  resolvedAt: Date | null;
  resolvedByUser: UserRecord | null;
  resolvedByUserId: string | null;
  status: WorkspaceRoleEscalationRequestStatusRecord;
  targetUser: UserRecord;
  targetUserId: string;
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
    listByWorkspaceId(workspaceId: string): Promise<BrandRecord[]>;
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
    deleteByWorkspaceAndUserId(input: {
      userId: string;
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
  workspaceRoleEscalationRequestRepository: {
    create(input: {
      justification?: string | null;
      requestedByUserId: string;
      requestedRole?: StudioWorkspaceRole;
      targetUserId: string;
      workspaceId: string;
    }): Promise<{
      id: string;
    }>;
    findByIdWithRelations(input: {
      id: string;
    }): Promise<WorkspaceRoleEscalationRequestRecord | null>;
    findPendingByWorkspaceAndRequestedRole(input: {
      requestedRole: StudioWorkspaceRole;
      workspaceId: string;
    }): Promise<WorkspaceRoleEscalationRequestRecord | null>;
    listByWorkspaceId(input: {
      limit?: number;
      workspaceId: string;
    }): Promise<WorkspaceRoleEscalationRequestRecord[]>;
    resolveById(input: {
      id: string;
      resolvedAt: Date;
      resolvedByUserId: string;
      status: Exclude<WorkspaceRoleEscalationRequestStatusRecord, "pending">;
    }): Promise<{
      id: string;
      status: WorkspaceRoleEscalationRequestStatusRecord;
    }>;
  };
  workspaceRepository: {
    create(input: {
      name: string;
      ownerUserId: string;
      slug: string;
      status?: "active" | "archived" | "suspended";
    }): Promise<WorkspaceRecord>;
    findByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<WorkspaceRecord | null>;
    findBySlug(slug: string): Promise<WorkspaceRecord | null>;
    findFirstByOwnerUserId(
      ownerUserId: string
    ): Promise<WorkspaceRecord | null>;
    listByOwnerUserId(ownerUserId: string): Promise<WorkspaceRecord[]>;
    updateByIdForOwner(input: {
      id: string;
      name: string;
      ownerUserId: string;
      slug: string;
      status: "active" | "archived" | "suspended";
    }): Promise<WorkspaceRecord>;
    transferOwnershipById(input: {
      currentOwnerUserId: string;
      id: string;
      nextOwnerUserId: string;
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
    canManageRoleEscalations: role === "owner",
    canRequestRoleEscalation: role === "operator",
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

function serializeWorkspaceRoleEscalationRequest(
  input: WorkspaceRoleEscalationRequestRecord
) {
  return {
    createdAt: input.createdAt.toISOString(),
    id: input.id,
    justification: input.justification,
    requestedByUserId: input.requestedByUserId,
    requestedByWalletAddress: input.requestedByUser.walletAddress,
    requestedRole: input.requestedRole,
    resolvedAt: input.resolvedAt?.toISOString() ?? null,
    resolvedByUserId: input.resolvedByUserId,
    resolvedByWalletAddress: input.resolvedByUser?.walletAddress ?? null,
    status: input.status,
    targetUserId: input.targetUserId,
    targetWalletAddress: input.targetUser.walletAddress
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
    | "workspaceRoleEscalationRequestRepository"
    | "workspaceMembershipRepository"
  >;
  role: StudioWorkspaceRole;
  workspace: WorkspaceRecord;
}) {
  const now = new Date();
  const [memberships, invitations, roleEscalationRequests, auditLogs] =
    await Promise.all([
      input.repositories.workspaceMembershipRepository.listByWorkspaceId(
        input.workspace.id
      ),
      input.repositories.workspaceInvitationRepository.listActiveByWorkspaceId({
        now,
        workspaceId: input.workspace.id
      }),
      input.repositories.workspaceRoleEscalationRequestRepository.listByWorkspaceId(
        {
          workspaceId: input.workspace.id
        }
      ),
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
      roleEscalationRequests: roleEscalationRequests.map((request) =>
        serializeWorkspaceRoleEscalationRequest(request)
      ),
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
  workspaceId?: string | null | undefined;
}) {
  const owner = await input.repositories.userRepository.findById(
    input.ownerUserId
  );
  const workspace = input.workspaceId
    ? await input.repositories.workspaceRepository.findByIdForOwner({
        id: input.workspaceId,
        ownerUserId: input.ownerUserId
      })
    : await input.repositories.workspaceRepository.findFirstByOwnerUserId(
        input.ownerUserId
      );
  const brands = workspace
    ? await input.repositories.brandRepository.listByWorkspaceId(workspace.id)
    : [];

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
    await input.repositories.workspaceRepository.findBySlug(
      input.workspaceSlug
    );

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
  const conflictingBrand =
    await input.repositories.brandRepository.findFirstBySlug(input.brandSlug);

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
  repositories: Pick<
    StudioSettingsRepositorySet,
    "publishedCollectionRepository"
  >;
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

function assertOperatorRole(role: StudioWorkspaceRole) {
  if (role !== "operator") {
    throw new StudioSettingsServiceError(
      "FORBIDDEN",
      "Only workspace operators can request role escalation.",
      403
    );
  }
}

async function recordWorkspaceAuditLog(input: {
  action:
    | "workspace_created"
    | "workspace_invitation_accepted"
    | "workspace_invitation_canceled"
    | "workspace_invitation_created"
    | "workspace_member_added"
    | "workspace_member_removed"
    | "workspace_owner_transferred"
    | "workspace_role_escalation_approved"
    | "workspace_role_escalation_canceled"
    | "workspace_role_escalation_rejected"
    | "workspace_role_escalation_requested";
  actor: UserRecord;
  membershipId?: string | null;
  requestId?: string | null;
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
      ...(input.requestId
        ? {
            requestId: input.requestId
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
  workspaceId?: string | null | undefined;
}) {
  const owner = await input.repositories.userRepository.findById(
    input.ownerUserId
  );
  const workspace = input.workspaceId
    ? await input.repositories.workspaceRepository.findByIdForOwner({
        id: input.workspaceId,
        ownerUserId: input.ownerUserId
      })
    : await input.repositories.workspaceRepository.findFirstByOwnerUserId(
        input.ownerUserId
      );

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

async function requireWorkspaceMember(input: {
  repositories: Pick<
    StudioSettingsRepositorySet,
    "userRepository" | "workspaceMembershipRepository"
  >;
  userId: string;
  workspaceId: string;
}) {
  const [user, membership] = await Promise.all([
    input.repositories.userRepository.findById(input.userId),
    input.repositories.workspaceMembershipRepository.findByWorkspaceAndUserId({
      userId: input.userId,
      workspaceId: input.workspaceId
    })
  ]);

  if (!user || !membership) {
    throw new StudioSettingsServiceError(
      "ROLE_ESCALATION_NOT_FOUND",
      "The requested role escalation could not be resolved for this workspace.",
      404
    );
  }

  return {
    membership,
    user
  };
}

async function requireRoleEscalationRequest(input: {
  repositories: Pick<
    StudioSettingsRepositorySet,
    "workspaceRoleEscalationRequestRepository"
  >;
  requestId: string;
  workspaceId: string;
}) {
  const request =
    await input.repositories.workspaceRoleEscalationRequestRepository.findByIdWithRelations(
      {
        id: input.requestId
      }
    );

  if (!request || request.workspaceId !== input.workspaceId) {
    throw new StudioSettingsServiceError(
      "ROLE_ESCALATION_NOT_FOUND",
      "The requested role escalation was not found.",
      404
    );
  }

  return request;
}

export function createStudioSettingsService(
  dependencies: StudioSettingsServiceDependencies
) {
  return {
    async getStudioSettings(input: {
      ownerUserId: string;
      role?: StudioWorkspaceRole;
      workspaceId?: string | null;
    }) {
      return loadOwnerStudioSettings({
        ownerUserId: input.ownerUserId,
        repositories: dependencies.repositories,
        role: input.role ?? "owner",
        workspaceId: input.workspaceId
      });
    },

    async createWorkspace(input: {
      accentColor?: string | null;
      brandName: string;
      brandSlug: string;
      ownerUserId: string;
      role?: StudioWorkspaceRole;
      themePreset?:
        | "editorial_warm"
        | "gallery_mono"
        | "midnight_launch"
        | null;
      workspaceName: string;
      workspaceSlug: string;
    }) {
      assertOwnerRole(input.role ?? "owner");

      const parsedInput = studioWorkspaceCreateRequestSchema.parse({
        accentColor: input.accentColor,
        brandName: input.brandName,
        brandSlug: input.brandSlug,
        themePreset: input.themePreset,
        workspaceName: input.workspaceName,
        workspaceSlug: input.workspaceSlug
      });

      const owner = await dependencies.repositories.userRepository.findById(
        input.ownerUserId
      );

      if (!owner) {
        throw new StudioSettingsServiceError(
          "WORKSPACE_REQUIRED",
          "Create the workspace profile before managing operators.",
          409
        );
      }

      await assertWorkspaceSlugAvailable({
        existingWorkspaceId: null,
        repositories: dependencies.repositories,
        workspaceSlug: parsedInput.workspaceSlug
      });
      await assertBrandSlugAvailable({
        brandSlug: parsedInput.brandSlug,
        existingBrandId: null,
        repositories: dependencies.repositories
      });

      return dependencies.runTransaction(async (repositories) => {
        const workspace = await repositories.workspaceRepository.create({
          name: parsedInput.workspaceName,
          ownerUserId: input.ownerUserId,
          slug: parsedInput.workspaceSlug,
          status: "active"
        });
        const brand = await repositories.brandRepository.create({
          name: parsedInput.brandName,
          slug: parsedInput.brandSlug,
          themeJson: buildBrandThemeJson({
            accentColor:
              parsedInput.accentColor ?? defaultStudioBrandAccentColor,
            featuredReleaseLabel: defaultStudioFeaturedReleaseLabel,
            landingDescription: defaultStudioBrandLandingDescription,
            landingHeadline: defaultStudioBrandLandingHeadline,
            themePreset:
              parsedInput.themePreset ?? defaultStudioBrandThemePreset
          }),
          workspaceId: workspace.id
        });

        await recordWorkspaceAuditLog({
          action: "workspace_created",
          actor: owner,
          repositories,
          workspaceId: workspace.id
        });

        return studioWorkspaceCreateResponseSchema.parse({
          brand: serializeBrand(brand),
          workspace: {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
            status: workspace.status
          }
        });
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
      workspaceId?: string | null;
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
        const workspace = input.workspaceId
          ? await repositories.workspaceRepository.findByIdForOwner({
              id: input.workspaceId,
              ownerUserId: input.ownerUserId
            })
          : await repositories.workspaceRepository.findFirstByOwnerUserId(
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
      workspaceId?: string | null;
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
            input.workspaceId
              ? repositories.workspaceRepository.findByIdForOwner({
                  id: input.workspaceId,
                  ownerUserId: input.ownerUserId
                })
              : repositories.workspaceRepository.findFirstByOwnerUserId(
                  input.ownerUserId
                ),
            input.workspaceId
              ? repositories.brandRepository.listByWorkspaceId(
                  input.workspaceId
                )
              : repositories.brandRepository.listByOwnerUserId(
                  input.ownerUserId
                ),
            repositories.publishedCollectionRepository.listByOwnerUserId(
              input.ownerUserId
            )
          ]);
        const existingBrand = parsedInput.brandId
          ? (existingBrands.find((brand) => brand.id === parsedInput.brandId) ??
            null)
          : (existingBrands[0] ?? null);

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
          role: "owner",
          workspaceId: workspace.id
        });
      });
    },

    async addWorkspaceMember(input: {
      ownerUserId: string;
      role?: StudioWorkspaceRole;
      walletAddress: string;
      workspaceId?: string | null;
    }) {
      assertOwnerRole(input.role ?? "owner");

      const parsedInput = studioWorkspaceMemberCreateRequestSchema.parse({
        walletAddress: input.walletAddress
      });

      return dependencies.runTransaction(async (repositories) => {
        const now = new Date();
        const { owner, workspace } = await requireOwnerWorkspace({
          ownerUserId: input.ownerUserId,
          repositories,
          workspaceId: input.workspaceId
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
      workspaceId?: string | null;
    }) {
      assertOwnerRole(input.role ?? "owner");

      const parsedInput = studioWorkspaceInvitationCreateRequestSchema.parse({
        walletAddress: input.walletAddress
      });

      return dependencies.runTransaction(async (repositories) => {
        const now = new Date();
        const { owner, workspace } = await requireOwnerWorkspace({
          ownerUserId: input.ownerUserId,
          repositories,
          workspaceId: input.workspaceId
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

        const invitation =
          await repositories.workspaceInvitationRepository.create({
            expiresAt,
            invitedByUserId: owner.id,
            role: "operator",
            walletAddress: parsedInput.walletAddress,
            workspaceId: workspace.id
          });
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
      workspaceId?: string | null;
    }) {
      assertOwnerRole(input.role ?? "owner");

      return dependencies.runTransaction(async (repositories) => {
        const { owner, workspace } = await requireOwnerWorkspace({
          ownerUserId: input.ownerUserId,
          repositories,
          workspaceId: input.workspaceId
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

    async requestWorkspaceRoleEscalation(input: {
      actorUserId: string;
      justification?: string | null;
      ownerUserId: string;
      role?: StudioWorkspaceRole;
      workspaceId?: string | null;
    }) {
      assertOperatorRole(input.role ?? "owner");

      const parsedInput =
        studioWorkspaceRoleEscalationCreateRequestSchema.parse({
          justification: input.justification
        });

      return dependencies.runTransaction(async (repositories) => {
        const workspace = input.workspaceId
          ? await repositories.workspaceRepository.findByIdForOwner({
              id: input.workspaceId,
              ownerUserId: input.ownerUserId
            })
          : await repositories.workspaceRepository.findFirstByOwnerUserId(
              input.ownerUserId
            );

        if (!workspace) {
          throw new StudioSettingsServiceError(
            "WORKSPACE_REQUIRED",
            "Workspace operators can only request escalation inside an active workspace.",
            409
          );
        }

        const { membership, user: actor } = await requireWorkspaceMember({
          repositories,
          userId: input.actorUserId,
          workspaceId: workspace.id
        });

        if (membership.role !== "operator") {
          throw new StudioSettingsServiceError(
            "FORBIDDEN",
            "Only workspace operators can request ownership transfer.",
            403
          );
        }

        const pendingRequest =
          await repositories.workspaceRoleEscalationRequestRepository.findPendingByWorkspaceAndRequestedRole(
            {
              requestedRole: "owner",
              workspaceId: workspace.id
            }
          );

        if (pendingRequest) {
          throw new StudioSettingsServiceError(
            "ROLE_ESCALATION_ALREADY_PENDING",
            pendingRequest.targetUserId === actor.id
              ? "An ownership transfer request is already pending for this operator."
              : "An ownership transfer request is already pending for this workspace.",
            409
          );
        }

        const createdRequest =
          await repositories.workspaceRoleEscalationRequestRepository.create({
            justification:
              normalizeOptionalText(parsedInput.justification) ?? null,
            requestedByUserId: actor.id,
            requestedRole: "owner",
            targetUserId: actor.id,
            workspaceId: workspace.id
          });
        const persistedRequest =
          await repositories.workspaceRoleEscalationRequestRepository.findByIdWithRelations(
            {
              id: createdRequest.id
            }
          );

        if (!persistedRequest) {
          throw new StudioSettingsServiceError(
            "INTERNAL_SERVER_ERROR",
            "Role escalation request could not be loaded after creation.",
            500
          );
        }

        await recordWorkspaceAuditLog({
          action: "workspace_role_escalation_requested",
          actor,
          repositories,
          requestId: persistedRequest.id,
          role: persistedRequest.requestedRole,
          targetUserId: persistedRequest.targetUserId,
          targetWalletAddress: persistedRequest.targetUser.walletAddress,
          workspaceId: workspace.id
        });

        return studioWorkspaceRoleEscalationResponseSchema.parse({
          roleEscalationRequest:
            serializeWorkspaceRoleEscalationRequest(persistedRequest)
        });
      });
    },

    async approveWorkspaceRoleEscalation(input: {
      ownerUserId: string;
      requestId: string;
      role?: StudioWorkspaceRole;
      workspaceId?: string | null;
    }) {
      assertOwnerRole(input.role ?? "owner");

      return dependencies.runTransaction(async (repositories) => {
        const now = new Date();
        const { owner, workspace } = await requireOwnerWorkspace({
          ownerUserId: input.ownerUserId,
          repositories,
          workspaceId: input.workspaceId
        });
        const request = await requireRoleEscalationRequest({
          repositories,
          requestId: input.requestId,
          workspaceId: workspace.id
        });

        if (request.status !== "pending") {
          throw new StudioSettingsServiceError(
            "ROLE_ESCALATION_NOT_PENDING",
            "Only pending role escalation requests can be approved.",
            409
          );
        }

        const targetMembership =
          await repositories.workspaceMembershipRepository.findByWorkspaceAndUserId(
            {
              userId: request.targetUserId,
              workspaceId: workspace.id
            }
          );

        if (!targetMembership || targetMembership.role !== "operator") {
          throw new StudioSettingsServiceError(
            "ROLE_ESCALATION_INVALID_TARGET",
            "The target operator no longer has active workspace access.",
            409
          );
        }

        const priorOwnerMembership =
          await repositories.workspaceMembershipRepository.findByWorkspaceAndUserId(
            {
              userId: owner.id,
              workspaceId: workspace.id
            }
          );

        if (!priorOwnerMembership) {
          await repositories.workspaceMembershipRepository.create({
            role: "operator",
            userId: owner.id,
            workspaceId: workspace.id
          });
        }

        await repositories.workspaceRepository.transferOwnershipById({
          currentOwnerUserId: owner.id,
          id: workspace.id,
          nextOwnerUserId: request.targetUserId
        });
        await repositories.workspaceMembershipRepository.deleteByWorkspaceAndUserId(
          {
            userId: request.targetUserId,
            workspaceId: workspace.id
          }
        );
        await repositories.workspaceRoleEscalationRequestRepository.resolveById(
          {
            id: request.id,
            resolvedAt: now,
            resolvedByUserId: owner.id,
            status: "approved"
          }
        );

        await recordWorkspaceAuditLog({
          action: "workspace_role_escalation_approved",
          actor: owner,
          repositories,
          requestId: request.id,
          role: request.requestedRole,
          targetUserId: request.targetUserId,
          targetWalletAddress: request.targetUser.walletAddress,
          workspaceId: workspace.id
        });
        await recordWorkspaceAuditLog({
          action: "workspace_owner_transferred",
          actor: owner,
          repositories,
          requestId: request.id,
          role: "owner",
          targetUserId: request.targetUserId,
          targetWalletAddress: request.targetUser.walletAddress,
          workspaceId: workspace.id
        });

        return studioWorkspaceRoleEscalationActionResponseSchema.parse({
          requestId: request.id,
          status: "approved"
        });
      });
    },

    async rejectWorkspaceRoleEscalation(input: {
      ownerUserId: string;
      requestId: string;
      role?: StudioWorkspaceRole;
      workspaceId?: string | null;
    }) {
      assertOwnerRole(input.role ?? "owner");

      return dependencies.runTransaction(async (repositories) => {
        const now = new Date();
        const { owner, workspace } = await requireOwnerWorkspace({
          ownerUserId: input.ownerUserId,
          repositories,
          workspaceId: input.workspaceId
        });
        const request = await requireRoleEscalationRequest({
          repositories,
          requestId: input.requestId,
          workspaceId: workspace.id
        });

        if (request.status !== "pending") {
          throw new StudioSettingsServiceError(
            "ROLE_ESCALATION_NOT_PENDING",
            "Only pending role escalation requests can be rejected.",
            409
          );
        }

        await repositories.workspaceRoleEscalationRequestRepository.resolveById(
          {
            id: request.id,
            resolvedAt: now,
            resolvedByUserId: owner.id,
            status: "rejected"
          }
        );

        await recordWorkspaceAuditLog({
          action: "workspace_role_escalation_rejected",
          actor: owner,
          repositories,
          requestId: request.id,
          role: request.requestedRole,
          targetUserId: request.targetUserId,
          targetWalletAddress: request.targetUser.walletAddress,
          workspaceId: workspace.id
        });

        return studioWorkspaceRoleEscalationActionResponseSchema.parse({
          requestId: request.id,
          status: "rejected"
        });
      });
    },

    async cancelWorkspaceRoleEscalation(input: {
      actorUserId: string;
      ownerUserId: string;
      requestId: string;
      role?: StudioWorkspaceRole;
      workspaceId?: string | null;
    }) {
      assertOperatorRole(input.role ?? "owner");

      return dependencies.runTransaction(async (repositories) => {
        const workspace = input.workspaceId
          ? await repositories.workspaceRepository.findByIdForOwner({
              id: input.workspaceId,
              ownerUserId: input.ownerUserId
            })
          : await repositories.workspaceRepository.findFirstByOwnerUserId(
              input.ownerUserId
            );

        if (!workspace) {
          throw new StudioSettingsServiceError(
            "WORKSPACE_REQUIRED",
            "Workspace operators can only cancel escalation inside an active workspace.",
            409
          );
        }

        const request = await requireRoleEscalationRequest({
          repositories,
          requestId: input.requestId,
          workspaceId: workspace.id
        });

        if (request.status !== "pending") {
          throw new StudioSettingsServiceError(
            "ROLE_ESCALATION_NOT_PENDING",
            "Only pending role escalation requests can be canceled.",
            409
          );
        }

        if (
          request.requestedByUserId !== input.actorUserId ||
          request.targetUserId !== input.actorUserId
        ) {
          throw new StudioSettingsServiceError(
            "FORBIDDEN",
            "Only the requesting operator can cancel this role escalation.",
            403
          );
        }

        const actor = request.requestedByUser;

        await repositories.workspaceRoleEscalationRequestRepository.resolveById(
          {
            id: request.id,
            resolvedAt: new Date(),
            resolvedByUserId: actor.id,
            status: "canceled"
          }
        );

        await recordWorkspaceAuditLog({
          action: "workspace_role_escalation_canceled",
          actor,
          repositories,
          requestId: request.id,
          role: request.requestedRole,
          targetUserId: request.targetUserId,
          targetWalletAddress: request.targetUser.walletAddress,
          workspaceId: workspace.id
        });

        return studioWorkspaceRoleEscalationActionResponseSchema.parse({
          requestId: request.id,
          status: "canceled"
        });
      });
    },

    async removeWorkspaceMember(input: {
      membershipId: string;
      ownerUserId: string;
      role?: StudioWorkspaceRole;
      workspaceId?: string | null;
    }) {
      assertOwnerRole(input.role ?? "owner");

      return dependencies.runTransaction(async (repositories) => {
        const { owner, workspace } = await requireOwnerWorkspace({
          ownerUserId: input.ownerUserId,
          repositories,
          workspaceId: input.workspaceId
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
