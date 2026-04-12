import {
  createAuditLogRepository,
  createBrandRepository,
  createCommerceCheckoutSessionRepository,
  createOpsAlertStateRepository,
  createOpsReconciliationIssueRepository,
  createPublishedCollectionRepository,
  createUserRepository,
  createWorkspaceInvitationRepository,
  createWorkspaceMembershipRepository,
  createWorkspaceRepository,
  createWorkspaceRoleEscalationRequestRepository,
  getDatabaseClient,
  type DatabaseExecutor
} from "@ai-nft-forge/database";
import {
  defaultStudioBrandAccentColor,
  defaultStudioBrandLandingDescription,
  defaultStudioBrandLandingHeadline,
  defaultStudioBrandThemePreset,
  defaultStudioFeaturedReleaseLabel,
  studioBrandThemeSchema,
  studioWorkspaceAuditEntrySchema,
  workspaceExportResponseSchema,
  workspaceOffboardingOverviewResponseSchema,
  workspaceOffboardingSummarySchema,
  type StudioWorkspaceScopeSummary,
  type WorkspaceExportFormat,
  type WorkspaceOffboardingBlockerCode,
  type WorkspaceOffboardingCautionCode,
  type WorkspaceOffboardingSummary
} from "@ai-nft-forge/shared";

import { StudioSettingsServiceError } from "../studio-settings/error";
import { createRuntimeWorkspaceDirectoryService } from "./directory-service";

type WorkspaceOffboardingRepositorySet = {
  auditLogRepository: {
    listByEntity(input: {
      entityId: string;
      entityType: string;
      limit?: number;
    }): Promise<
      Array<{
        action: string;
        actorId: string;
        createdAt: Date;
        id: string;
        metadataJson: unknown;
      }>
    >;
  };
  brandRepository: {
    listByWorkspaceId(workspaceId: string): Promise<
      Array<{
        customDomain: string | null;
        id: string;
        name: string;
        slug: string;
        themeJson: unknown;
      }>
    >;
  };
  commerceCheckoutSessionRepository: {
    listDetailedByWorkspaceId(workspaceId: string): Promise<
      Array<{
        checkoutUrl: string;
        completedAt: Date | null;
        createdAt: Date;
        fulfillmentAutomationStatus:
          | "completed"
          | "failed"
          | "idle"
          | "processing"
          | "queued"
          | "submitted";
        fulfillmentStatus: "fulfilled" | "unfulfilled";
        id: string;
        providerKind: "manual" | "stripe";
        publicId: string;
        publishedCollection: {
          id: string;
          title: string;
          workspaceId: string;
        };
        status: "canceled" | "completed" | "expired" | "open";
      }>
    >;
    listDetailedByWorkspaceIds(workspaceIds: string[]): Promise<
      Array<{
        fulfillmentAutomationStatus:
          | "completed"
          | "failed"
          | "idle"
          | "processing"
          | "queued"
          | "submitted";
        fulfillmentStatus: "fulfilled" | "unfulfilled";
        id: string;
        publishedCollection: {
          workspaceId: string;
        };
        status: "canceled" | "completed" | "expired" | "open";
      }>
    >;
  };
  opsAlertStateRepository: {
    listActiveByWorkspaceId(workspaceId: string): Promise<
      Array<{
        acknowledgedAt: Date | null;
        code: string;
        firstObservedAt: Date;
        id: string;
        lastObservedAt: Date;
        message: string;
        severity: "critical" | "warning";
        title: string;
      }>
    >;
    listActiveByWorkspaceIds(workspaceIds: string[]): Promise<
      Array<{
        id: string;
        severity: "critical" | "warning";
        workspaceId: string;
      }>
    >;
  };
  opsReconciliationIssueRepository: {
    listOpenByWorkspaceId(workspaceId: string): Promise<
      Array<{
        firstDetectedAt: Date;
        id: string;
        kind:
          | "draft_contains_unapproved_asset"
          | "generated_asset_object_missing"
          | "published_contract_deployment_unverified"
          | "published_contract_metadata_mismatch"
          | "published_contract_missing_onchain"
          | "published_contract_owner_mismatch"
          | "published_hero_asset_missing_from_snapshot"
          | "published_public_asset_missing"
          | "published_token_mint_unverified"
          | "published_token_owner_mismatch"
          | "review_ready_draft_invalid"
          | "source_asset_object_missing";
        lastDetectedAt: Date;
        message: string;
        severity: "critical" | "warning";
        title: string;
      }>
    >;
    listOpenByWorkspaceIds(workspaceIds: string[]): Promise<
      Array<{
        id: string;
        workspaceId: string;
      }>
    >;
  };
  publishedCollectionRepository: {
    listByWorkspaceIds(workspaceIds: string[]): Promise<
      Array<{
        id: string;
        storefrontStatus: "ended" | "live" | "sold_out" | "upcoming";
        workspaceId: string;
      }>
    >;
    listDetailedByWorkspaceId(workspaceId: string): Promise<
      Array<{
        brandSlug: string;
        id: string;
        items: Array<{ id: string }>;
        mints: Array<{ id: string }>;
        publishedAt: Date;
        slug: string;
        storefrontStatus: "ended" | "live" | "sold_out" | "upcoming";
        title: string;
        updatedAt: Date;
      }>
    >;
  };
  userRepository: {
    findById(id: string): Promise<{
      avatarUrl: string | null;
      displayName: string | null;
      id: string;
      walletAddress: string;
    } | null>;
  };
  workspaceInvitationRepository: {
    listActiveByWorkspaceId(input: {
      now: Date;
      workspaceId: string;
    }): Promise<
      Array<{
        createdAt: Date;
        expiresAt: Date;
        id: string;
        invitedByUser: {
          walletAddress: string;
        };
        invitedByUserId: string;
        role: "operator" | "owner";
        walletAddress: string;
      }>
    >;
  };
  workspaceMembershipRepository: {
    listByWorkspaceId(workspaceId: string): Promise<
      Array<{
        createdAt: Date;
        id: string;
        role: "operator" | "owner";
        user: {
          avatarUrl: string | null;
          displayName: string | null;
          id: string;
          walletAddress: string;
        };
      }>
    >;
  };
  workspaceRepository: {
    findByIdForOwner(input: {
      id: string;
      ownerUserId: string;
    }): Promise<{
      id: string;
      name: string;
      ownerUserId: string;
      slug: string;
      status: "active" | "archived" | "suspended";
    } | null>;
  };
  workspaceRoleEscalationRequestRepository: {
    countPendingByWorkspaceId(workspaceId: string): Promise<number>;
    listByWorkspaceId(input: {
      limit?: number;
      workspaceId: string;
    }): Promise<
      Array<{
        createdAt: Date;
        id: string;
        justification: string | null;
        requestedByUser: {
          walletAddress: string;
        };
        requestedByUserId: string;
        requestedRole: "operator" | "owner";
        resolvedAt: Date | null;
        resolvedByUser: {
          walletAddress: string;
        } | null;
        resolvedByUserId: string | null;
        status: "approved" | "canceled" | "pending" | "rejected";
        targetUser: {
          walletAddress: string;
        };
        targetUserId: string;
      }>
    >;
  };
};

type WorkspaceDirectoryServiceDependency = {
  listAccessibleWorkspaceDirectory(input: {
    currentWorkspaceId?: string | null | undefined;
    workspaces: StudioWorkspaceScopeSummary[];
  }): Promise<{
    workspaces: Array<{
      brandCount: number;
      current: boolean;
      lastActivityAt: string | null;
      memberCount: number;
      pendingInvitationCount: number;
      pendingRoleEscalationCount: number;
      workspace: StudioWorkspaceScopeSummary;
    }>;
  }>;
};

type WorkspaceOffboardingServiceDependencies = {
  directoryService: WorkspaceDirectoryServiceDependency;
  now: () => Date;
  repositories: WorkspaceOffboardingRepositorySet;
};

function createWorkspaceOffboardingRepositories(database: DatabaseExecutor) {
  return {
    auditLogRepository: createAuditLogRepository(database),
    brandRepository: createBrandRepository(database),
    commerceCheckoutSessionRepository:
      createCommerceCheckoutSessionRepository(database),
    opsAlertStateRepository: createOpsAlertStateRepository(database),
    opsReconciliationIssueRepository:
      createOpsReconciliationIssueRepository(database),
    publishedCollectionRepository: createPublishedCollectionRepository(database),
    userRepository: createUserRepository(database),
    workspaceInvitationRepository:
      createWorkspaceInvitationRepository(database),
    workspaceMembershipRepository:
      createWorkspaceMembershipRepository(database),
    workspaceRepository: createWorkspaceRepository(database),
    workspaceRoleEscalationRequestRepository:
      createWorkspaceRoleEscalationRequestRepository(database)
  };
}

function incrementCountByWorkspaceId(
  counts: Map<string, number>,
  workspaceId: string
) {
  counts.set(workspaceId, (counts.get(workspaceId) ?? 0) + 1);
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

function serializeBrand(input: {
  customDomain: string | null;
  id: string;
  name: string;
  slug: string;
  themeJson: unknown;
}) {
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

function serializeWorkspaceMember(input: {
  addedAt: Date | null;
  membershipId: string | null;
  role: "operator" | "owner";
  user: {
    avatarUrl: string | null;
    displayName: string | null;
    id: string;
    walletAddress: string;
  };
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

function serializeWorkspaceInvitation(input: {
  createdAt: Date;
  expiresAt: Date;
  id: string;
  invitedByUser: {
    walletAddress: string;
  };
  invitedByUserId: string;
  role: "operator" | "owner";
  walletAddress: string;
}) {
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

function serializeRoleEscalationRequest(input: {
  createdAt: Date;
  id: string;
  justification: string | null;
  requestedByUser: {
    walletAddress: string;
  };
  requestedByUserId: string;
  requestedRole: "operator" | "owner";
  resolvedAt: Date | null;
  resolvedByUser: {
    walletAddress: string;
  } | null;
  resolvedByUserId: string | null;
  status: "approved" | "canceled" | "pending" | "rejected";
  targetUser: {
    walletAddress: string;
  };
  targetUserId: string;
}) {
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

function serializeAuditEntry(input: {
  action: string;
  actorId: string;
  createdAt: Date;
  id: string;
  metadataJson: unknown;
}) {
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

  const parsed = studioWorkspaceAuditEntrySchema.safeParse({
    action: input.action,
    actorUserId: input.actorId,
    actorWalletAddress,
    createdAt: input.createdAt.toISOString(),
    id: input.id,
    membershipId,
    role,
    targetUserId,
    targetWalletAddress
  });

  return parsed.success ? parsed.data : null;
}

function createWorkspaceOffboardingSummary(input: {
  activeAlertCount: number;
  livePublicationCount: number;
  openCheckoutCount: number;
  openReconciliationIssueCount: number;
  pendingInvitationCount: number;
  pendingRoleEscalationCount: number;
  unfulfilledCheckoutCount: number;
}): WorkspaceOffboardingSummary {
  const blockerCodes: WorkspaceOffboardingBlockerCode[] = [];
  const cautionCodes: WorkspaceOffboardingCautionCode[] = [];

  if (input.activeAlertCount > 0) {
    blockerCodes.push("active_alerts");
  }

  if (input.openCheckoutCount > 0) {
    blockerCodes.push("open_checkouts");
  }

  if (input.openReconciliationIssueCount > 0) {
    blockerCodes.push("open_reconciliation_issues");
  }

  if (input.livePublicationCount > 0) {
    cautionCodes.push("live_publications");
  }

  if (input.pendingInvitationCount > 0) {
    cautionCodes.push("pending_invitations");
  }

  if (input.pendingRoleEscalationCount > 0) {
    cautionCodes.push("pending_role_escalations");
  }

  if (input.unfulfilledCheckoutCount > 0) {
    cautionCodes.push("unfulfilled_checkouts");
  }

  return workspaceOffboardingSummarySchema.parse({
    activeAlertCount: input.activeAlertCount,
    blockerCodes,
    cautionCodes,
    livePublicationCount: input.livePublicationCount,
    openCheckoutCount: input.openCheckoutCount,
    openReconciliationIssueCount: input.openReconciliationIssueCount,
    pendingInvitationCount: input.pendingInvitationCount,
    pendingRoleEscalationCount: input.pendingRoleEscalationCount,
    readiness:
      blockerCodes.length > 0
        ? "blocked"
        : cautionCodes.length > 0
          ? "review_required"
          : "ready",
    unfulfilledCheckoutCount: input.unfulfilledCheckoutCount
  });
}

function escapeCsvValue(value: string | number) {
  const normalizedValue = String(value);

  if (!/[",\n]/.test(normalizedValue)) {
    return normalizedValue;
  }

  return `"${normalizedValue.replaceAll('"', '""')}"`;
}

export function createWorkspaceOffboardingService(
  dependencies: WorkspaceOffboardingServiceDependencies
) {
  return {
    async getAccessibleWorkspaceOffboardingOverview(input: {
      currentWorkspaceId?: string | null | undefined;
      workspaces: StudioWorkspaceScopeSummary[];
    }) {
      const generatedAt = dependencies.now().toISOString();
      const directory =
        await dependencies.directoryService.listAccessibleWorkspaceDirectory({
          currentWorkspaceId: input.currentWorkspaceId,
          workspaces: input.workspaces
        });
      const workspaceIds = input.workspaces.map((workspace) => workspace.id);

      if (workspaceIds.length === 0) {
        return workspaceOffboardingOverviewResponseSchema.parse({
          overview: {
            generatedAt,
            summary: {
              blockedWorkspaceCount: 0,
              readyWorkspaceCount: 0,
              reviewRequiredWorkspaceCount: 0,
              totalWorkspaceCount: 0
            },
            workspaces: []
          }
        });
      }

      const [publications, checkouts, alerts, reconciliationIssues] =
        await Promise.all([
          dependencies.repositories.publishedCollectionRepository.listByWorkspaceIds(
            workspaceIds
          ),
          dependencies.repositories.commerceCheckoutSessionRepository.listDetailedByWorkspaceIds(
            workspaceIds
          ),
          dependencies.repositories.opsAlertStateRepository.listActiveByWorkspaceIds(
            workspaceIds
          ),
          dependencies.repositories.opsReconciliationIssueRepository.listOpenByWorkspaceIds(
            workspaceIds
          )
        ]);

      const livePublicationCountByWorkspaceId = new Map<string, number>();
      const openCheckoutCountByWorkspaceId = new Map<string, number>();
      const unfulfilledCheckoutCountByWorkspaceId = new Map<string, number>();
      const activeAlertCountByWorkspaceId = new Map<string, number>();
      const openReconciliationIssueCountByWorkspaceId = new Map<string, number>();

      for (const publication of publications) {
        if (publication.storefrontStatus === "live") {
          incrementCountByWorkspaceId(
            livePublicationCountByWorkspaceId,
            publication.workspaceId
          );
        }
      }

      for (const checkout of checkouts) {
        const workspaceId = checkout.publishedCollection.workspaceId;

        if (checkout.status === "open") {
          incrementCountByWorkspaceId(
            openCheckoutCountByWorkspaceId,
            workspaceId
          );
        }

        if (
          checkout.status === "completed" &&
          checkout.fulfillmentStatus === "unfulfilled"
        ) {
          incrementCountByWorkspaceId(
            unfulfilledCheckoutCountByWorkspaceId,
            workspaceId
          );
        }
      }

      for (const alert of alerts) {
        incrementCountByWorkspaceId(activeAlertCountByWorkspaceId, alert.workspaceId);
      }

      for (const issue of reconciliationIssues) {
        incrementCountByWorkspaceId(
          openReconciliationIssueCountByWorkspaceId,
          issue.workspaceId
        );
      }

      const workspaces = directory.workspaces.map((directoryEntry) => {
        const summary = createWorkspaceOffboardingSummary({
          activeAlertCount:
            activeAlertCountByWorkspaceId.get(directoryEntry.workspace.id) ?? 0,
          livePublicationCount:
            livePublicationCountByWorkspaceId.get(directoryEntry.workspace.id) ??
            0,
          openCheckoutCount:
            openCheckoutCountByWorkspaceId.get(directoryEntry.workspace.id) ?? 0,
          openReconciliationIssueCount:
            openReconciliationIssueCountByWorkspaceId.get(
              directoryEntry.workspace.id
            ) ?? 0,
          pendingInvitationCount: directoryEntry.pendingInvitationCount,
          pendingRoleEscalationCount:
            directoryEntry.pendingRoleEscalationCount,
          unfulfilledCheckoutCount:
            unfulfilledCheckoutCountByWorkspaceId.get(
              directoryEntry.workspace.id
            ) ?? 0
        });

        return {
          current: directoryEntry.current,
          directory: directoryEntry,
          summary,
          workspace: directoryEntry.workspace
        };
      });

      return workspaceOffboardingOverviewResponseSchema.parse({
        overview: {
          generatedAt,
          summary: {
            blockedWorkspaceCount: workspaces.filter(
              (workspace) => workspace.summary.readiness === "blocked"
            ).length,
            readyWorkspaceCount: workspaces.filter(
              (workspace) => workspace.summary.readiness === "ready"
            ).length,
            reviewRequiredWorkspaceCount: workspaces.filter(
              (workspace) => workspace.summary.readiness === "review_required"
            ).length,
            totalWorkspaceCount: workspaces.length
          },
          workspaces
        }
      });
    },

    async exportOwnedWorkspace(input: {
      ownerUserId: string;
      workspaceId: string;
    }) {
      const now = dependencies.now();
      const workspace =
        await dependencies.repositories.workspaceRepository.findByIdForOwner({
          id: input.workspaceId,
          ownerUserId: input.ownerUserId
        });

      if (!workspace) {
        throw new StudioSettingsServiceError(
          "WORKSPACE_NOT_FOUND",
          "The requested workspace was not found.",
          404
        );
      }

      const owner = await dependencies.repositories.userRepository.findById(
        workspace.ownerUserId
      );

      if (!owner) {
        throw new StudioSettingsServiceError(
          "WORKSPACE_REQUIRED",
          "Workspace ownership could not be resolved.",
          409
        );
      }

      const [
        brands,
        memberships,
        invitations,
        roleEscalationRequests,
        auditLogs,
        publications,
        checkouts,
        alerts,
        reconciliationIssues
      ] = await Promise.all([
        dependencies.repositories.brandRepository.listByWorkspaceId(workspace.id),
        dependencies.repositories.workspaceMembershipRepository.listByWorkspaceId(
          workspace.id
        ),
        dependencies.repositories.workspaceInvitationRepository.listActiveByWorkspaceId(
          {
            now,
            workspaceId: workspace.id
          }
        ),
        dependencies.repositories.workspaceRoleEscalationRequestRepository.listByWorkspaceId(
          {
            limit: 100,
            workspaceId: workspace.id
          }
        ),
        dependencies.repositories.auditLogRepository.listByEntity({
          entityId: workspace.id,
          entityType: "workspace",
          limit: 100
        }),
        dependencies.repositories.publishedCollectionRepository.listDetailedByWorkspaceId(
          workspace.id
        ),
        dependencies.repositories.commerceCheckoutSessionRepository.listDetailedByWorkspaceId(
          workspace.id
        ),
        dependencies.repositories.opsAlertStateRepository.listActiveByWorkspaceId(
          workspace.id
        ),
        dependencies.repositories.opsReconciliationIssueRepository.listOpenByWorkspaceId(
          workspace.id
        )
      ]);

      const offboarding = createWorkspaceOffboardingSummary({
        activeAlertCount: alerts.length,
        livePublicationCount: publications.filter(
          (publication) => publication.storefrontStatus === "live"
        ).length,
        openCheckoutCount: checkouts.filter(
          (checkout) => checkout.status === "open"
        ).length,
        openReconciliationIssueCount: reconciliationIssues.length,
        pendingInvitationCount: invitations.length,
        pendingRoleEscalationCount: roleEscalationRequests.filter(
          (request) => request.status === "pending"
        ).length,
        unfulfilledCheckoutCount: checkouts.filter(
          (checkout) =>
            checkout.status === "completed" &&
            checkout.fulfillmentStatus === "unfulfilled"
        ).length
      });

      return workspaceExportResponseSchema.parse({
        export: {
          alerts: alerts.map((alert) => ({
            acknowledgedAt: alert.acknowledgedAt?.toISOString() ?? null,
            code: alert.code,
            firstObservedAt: alert.firstObservedAt.toISOString(),
            id: alert.id,
            lastObservedAt: alert.lastObservedAt.toISOString(),
            message: alert.message,
            severity: alert.severity,
            title: alert.title
          })),
          auditEntries: auditLogs.flatMap((auditLog) => {
            const entry = serializeAuditEntry(auditLog);

            return entry ? [entry] : [];
          }),
          brands: brands.map((brand) => serializeBrand(brand)),
          checkouts: checkouts.map((checkout) => ({
            checkoutUrl: checkout.checkoutUrl,
            completedAt: checkout.completedAt?.toISOString() ?? null,
            createdAt: checkout.createdAt.toISOString(),
            fulfillmentAutomationStatus: checkout.fulfillmentAutomationStatus,
            fulfillmentStatus: checkout.fulfillmentStatus,
            id: checkout.id,
            providerKind: checkout.providerKind,
            publicId: checkout.publicId,
            publishedCollectionId: checkout.publishedCollection.id,
            publishedCollectionTitle: checkout.publishedCollection.title,
            status: checkout.status
          })),
          generatedAt: now.toISOString(),
          invitations: invitations.map((invitation) =>
            serializeWorkspaceInvitation(invitation)
          ),
          members: [
            serializeWorkspaceMember({
              addedAt: null,
              membershipId: null,
              role: "owner",
              user: owner
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
          offboarding,
          ownerWalletAddress: owner.walletAddress,
          publications: publications.map((publication) => ({
            brandSlug: publication.brandSlug,
            id: publication.id,
            itemCount: publication.items.length,
            mintedCount: publication.mints.length,
            publishedAt: publication.publishedAt.toISOString(),
            slug: publication.slug,
            storefrontStatus: publication.storefrontStatus,
            title: publication.title,
            updatedAt: publication.updatedAt.toISOString()
          })),
          reconciliationIssues: reconciliationIssues.map((issue) => ({
            firstDetectedAt: issue.firstDetectedAt.toISOString(),
            id: issue.id,
            kind: issue.kind,
            lastDetectedAt: issue.lastDetectedAt.toISOString(),
            message: issue.message,
            severity: issue.severity,
            title: issue.title
          })),
          roleEscalationRequests: roleEscalationRequests.map((request) =>
            serializeRoleEscalationRequest(request)
          ),
          workspace: {
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
            status: workspace.status
          }
        }
      });
    },

    exportOwnedWorkspaceCsv(input: {
      exportData: ReturnType<typeof workspaceExportResponseSchema.parse>;
      format: WorkspaceExportFormat;
    }) {
      if (input.format !== "csv") {
        throw new Error("CSV export was requested with a non-CSV format.");
      }

      const row = input.exportData.export;
      const values = [
        row.workspace.id,
        row.workspace.name,
        row.workspace.slug,
        row.workspace.status,
        row.ownerWalletAddress,
        row.offboarding.readiness,
        row.offboarding.blockerCodes.join("|"),
        row.offboarding.cautionCodes.join("|"),
        row.brands.length,
        row.members.length,
        row.invitations.length,
        row.roleEscalationRequests.filter((request) => request.status === "pending")
          .length,
        row.publications.length,
        row.offboarding.livePublicationCount,
        row.checkouts.length,
        row.offboarding.openCheckoutCount,
        row.offboarding.unfulfilledCheckoutCount,
        row.offboarding.activeAlertCount,
        row.offboarding.openReconciliationIssueCount,
        row.generatedAt
      ];

      return [
        [
          "workspace_id",
          "workspace_name",
          "workspace_slug",
          "workspace_status",
          "owner_wallet_address",
          "archive_readiness",
          "blocker_codes",
          "caution_codes",
          "brand_count",
          "member_count",
          "pending_invitation_count",
          "pending_role_escalation_count",
          "publication_count",
          "live_publication_count",
          "checkout_count",
          "open_checkout_count",
          "unfulfilled_checkout_count",
          "active_alert_count",
          "open_reconciliation_issue_count",
          "generated_at"
        ].join(","),
        values.map((value) => escapeCsvValue(value)).join(",")
      ].join("\n");
    }
  };
}

export function createRuntimeWorkspaceOffboardingService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const database = getDatabaseClient(rawEnvironment);

  return createWorkspaceOffboardingService({
    directoryService: createRuntimeWorkspaceDirectoryService(rawEnvironment),
    now: () => new Date(),
    repositories: createWorkspaceOffboardingRepositories(database)
  });
}
