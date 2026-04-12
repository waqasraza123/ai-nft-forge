import {
  createCommerceCheckoutSessionRepository,
  createOpsAlertStateRepository,
  createOpsReconciliationIssueRepository,
  createPublishedCollectionRepository,
  getDatabaseClient,
  type DatabaseExecutor
} from "@ai-nft-forge/database";
import {
  workspaceCommerceFleetReportResponseSchema,
  workspaceFleetOverviewResponseSchema,
  type StudioWorkspaceDirectoryEntry,
  type StudioWorkspaceScopeSummary
} from "@ai-nft-forge/shared";

import { createRuntimeWorkspaceDirectoryService } from "./directory-service";

type WorkspaceFleetRepositorySet = {
  commerceCheckoutSessionRepository: {
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
    listActiveByWorkspaceIds(workspaceIds: string[]): Promise<
      Array<{
        acknowledgedAt: Date | null;
        code: string;
        firstObservedAt: Date;
        id: string;
        lastObservedAt: Date;
        message: string;
        severity: "critical" | "warning";
        title: string;
        workspaceId: string;
      }>
    >;
  };
  opsReconciliationIssueRepository: {
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
  };
};

type WorkspaceFleetServiceDependencies = {
  now: () => Date;
  repositories: WorkspaceFleetRepositorySet;
  workspaceDirectoryService: {
    listAccessibleWorkspaceDirectory(input: {
      currentWorkspaceId?: string | null | undefined;
      workspaces: StudioWorkspaceScopeSummary[];
    }): Promise<{
      workspaces: StudioWorkspaceDirectoryEntry[];
    }>;
  };
};

function createWorkspaceFleetRepositories(database: DatabaseExecutor) {
  return {
    commerceCheckoutSessionRepository:
      createCommerceCheckoutSessionRepository(database),
    opsAlertStateRepository: createOpsAlertStateRepository(database),
    opsReconciliationIssueRepository:
      createOpsReconciliationIssueRepository(database),
    publishedCollectionRepository: createPublishedCollectionRepository(database)
  };
}

function incrementCountByWorkspaceId(
  counts: Map<string, number>,
  workspaceId: string
) {
  counts.set(workspaceId, (counts.get(workspaceId) ?? 0) + 1);
}

function compareFleetAlertSeverity(
  left: "critical" | "warning",
  right: "critical" | "warning"
) {
  if (left === right) {
    return 0;
  }

  return left === "critical" ? -1 : 1;
}

function escapeCsvValue(value: string | number | null) {
  const normalizedValue =
    value === null ? "" : typeof value === "number" ? String(value) : value;

  if (!/[",\n]/.test(normalizedValue)) {
    return normalizedValue;
  }

  return `"${normalizedValue.replaceAll('"', '""')}"`;
}

export function createWorkspaceFleetService(
  dependencies: WorkspaceFleetServiceDependencies
) {
  async function getAccessibleWorkspaceFleet(input: {
    currentWorkspaceId?: string | null | undefined;
    workspaces: StudioWorkspaceScopeSummary[];
  }) {
    const generatedAt = dependencies.now().toISOString();
    const directory =
      await dependencies.workspaceDirectoryService.listAccessibleWorkspaceDirectory(
        {
          currentWorkspaceId: input.currentWorkspaceId,
          workspaces: input.workspaces
        }
      );
    const workspaceIds = input.workspaces.map((workspace) => workspace.id);

    if (workspaceIds.length === 0) {
      return workspaceFleetOverviewResponseSchema.parse({
        fleet: {
          alertQueue: [],
          summary: {
            activeAlertCount: 0,
            activeWorkspaceCount: 0,
            archivedWorkspaceCount: 0,
            completedCheckoutCount: 0,
            criticalAlertCount: 0,
            generatedAt,
            openCheckoutCount: 0,
            openReconciliationIssueCount: 0,
            totalCheckoutCount: 0,
            totalWorkspaceCount: 0,
            unfulfilledCheckoutCount: 0
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

    const totalPublicationCountByWorkspaceId = new Map<string, number>();
    const livePublicationCountByWorkspaceId = new Map<string, number>();
    const totalCheckoutCountByWorkspaceId = new Map<string, number>();
    const openCheckoutCountByWorkspaceId = new Map<string, number>();
    const completedCheckoutCountByWorkspaceId = new Map<string, number>();
    const unfulfilledCheckoutCountByWorkspaceId = new Map<string, number>();
    const automationFailedCheckoutCountByWorkspaceId = new Map<
      string,
      number
    >();
    const activeAlertCountByWorkspaceId = new Map<string, number>();
    const criticalAlertCountByWorkspaceId = new Map<string, number>();
    const warningAlertCountByWorkspaceId = new Map<string, number>();
    const openReconciliationIssueCountByWorkspaceId = new Map<string, number>();
    const workspaceById = new Map(
      input.workspaces.map((workspace) => [workspace.id, workspace] as const)
    );

    for (const publication of publications) {
      incrementCountByWorkspaceId(
        totalPublicationCountByWorkspaceId,
        publication.workspaceId
      );

      if (publication.storefrontStatus === "live") {
        incrementCountByWorkspaceId(
          livePublicationCountByWorkspaceId,
          publication.workspaceId
        );
      }
    }

    for (const checkout of checkouts) {
      const workspaceId = checkout.publishedCollection.workspaceId;

      incrementCountByWorkspaceId(totalCheckoutCountByWorkspaceId, workspaceId);

      if (checkout.status === "open") {
        incrementCountByWorkspaceId(
          openCheckoutCountByWorkspaceId,
          workspaceId
        );
      }

      if (checkout.status === "completed") {
        incrementCountByWorkspaceId(
          completedCheckoutCountByWorkspaceId,
          workspaceId
        );

        if (checkout.fulfillmentStatus === "unfulfilled") {
          incrementCountByWorkspaceId(
            unfulfilledCheckoutCountByWorkspaceId,
            workspaceId
          );
        }
      }

      if (checkout.fulfillmentAutomationStatus === "failed") {
        incrementCountByWorkspaceId(
          automationFailedCheckoutCountByWorkspaceId,
          workspaceId
        );
      }
    }

    for (const alert of alerts) {
      incrementCountByWorkspaceId(
        activeAlertCountByWorkspaceId,
        alert.workspaceId
      );

      if (alert.severity === "critical") {
        incrementCountByWorkspaceId(
          criticalAlertCountByWorkspaceId,
          alert.workspaceId
        );
      } else {
        incrementCountByWorkspaceId(
          warningAlertCountByWorkspaceId,
          alert.workspaceId
        );
      }
    }

    for (const issue of reconciliationIssues) {
      incrementCountByWorkspaceId(
        openReconciliationIssueCountByWorkspaceId,
        issue.workspaceId
      );
    }

    const workspaceSummaries = directory.workspaces.map((directoryEntry) => ({
      commerce: {
        automationFailedCheckoutCount:
          automationFailedCheckoutCountByWorkspaceId.get(
            directoryEntry.workspace.id
          ) ?? 0,
        completedCheckoutCount:
          completedCheckoutCountByWorkspaceId.get(
            directoryEntry.workspace.id
          ) ?? 0,
        openCheckoutCount:
          openCheckoutCountByWorkspaceId.get(directoryEntry.workspace.id) ?? 0,
        totalCheckoutCount:
          totalCheckoutCountByWorkspaceId.get(directoryEntry.workspace.id) ?? 0,
        unfulfilledCheckoutCount:
          unfulfilledCheckoutCountByWorkspaceId.get(
            directoryEntry.workspace.id
          ) ?? 0
      },
      directory: directoryEntry,
      ops: {
        activeAlertCount:
          activeAlertCountByWorkspaceId.get(directoryEntry.workspace.id) ?? 0,
        criticalAlertCount:
          criticalAlertCountByWorkspaceId.get(directoryEntry.workspace.id) ?? 0,
        openReconciliationIssueCount:
          openReconciliationIssueCountByWorkspaceId.get(
            directoryEntry.workspace.id
          ) ?? 0,
        warningAlertCount:
          warningAlertCountByWorkspaceId.get(directoryEntry.workspace.id) ?? 0
      },
      publications: {
        livePublicationCount:
          livePublicationCountByWorkspaceId.get(directoryEntry.workspace.id) ??
          0,
        totalPublicationCount:
          totalPublicationCountByWorkspaceId.get(directoryEntry.workspace.id) ??
          0
      },
      workspace: directoryEntry.workspace
    }));

    const alertQueue = alerts
      .flatMap((alert) => {
        const workspace = workspaceById.get(alert.workspaceId);

        if (!workspace) {
          return [];
        }

        return [
          {
            acknowledgedAt: alert.acknowledgedAt?.toISOString() ?? null,
            alertStateId: alert.id,
            code: alert.code,
            firstObservedAt: alert.firstObservedAt.toISOString(),
            lastObservedAt: alert.lastObservedAt.toISOString(),
            message: alert.message,
            severity: alert.severity,
            title: alert.title,
            workspace
          }
        ];
      })
      .sort((left, right) => {
        const severityDifference = compareFleetAlertSeverity(
          left.severity,
          right.severity
        );

        if (severityDifference !== 0) {
          return severityDifference;
        }

        if (left.lastObservedAt !== right.lastObservedAt) {
          return right.lastObservedAt.localeCompare(left.lastObservedAt);
        }

        return right.alertStateId.localeCompare(left.alertStateId);
      });

    return workspaceFleetOverviewResponseSchema.parse({
      fleet: {
        alertQueue,
        summary: {
          activeAlertCount: alerts.length,
          activeWorkspaceCount: input.workspaces.filter(
            (workspace) => workspace.status === "active"
          ).length,
          archivedWorkspaceCount: input.workspaces.filter(
            (workspace) => workspace.status === "archived"
          ).length,
          completedCheckoutCount: checkouts.filter(
            (checkout) => checkout.status === "completed"
          ).length,
          criticalAlertCount: alerts.filter(
            (alert) => alert.severity === "critical"
          ).length,
          generatedAt,
          openCheckoutCount: checkouts.filter(
            (checkout) => checkout.status === "open"
          ).length,
          openReconciliationIssueCount: reconciliationIssues.length,
          totalCheckoutCount: checkouts.length,
          totalWorkspaceCount: input.workspaces.length,
          unfulfilledCheckoutCount: checkouts.filter(
            (checkout) =>
              checkout.status === "completed" &&
              checkout.fulfillmentStatus === "unfulfilled"
          ).length
        },
        workspaces: workspaceSummaries
      }
    });
  }

  async function getAccessibleCommerceFleetReport(input: {
    currentWorkspaceId?: string | null | undefined;
    workspaces: StudioWorkspaceScopeSummary[];
  }) {
    const overview = await getAccessibleWorkspaceFleet(input);

    return workspaceCommerceFleetReportResponseSchema.parse({
      report: {
        generatedAt: overview.fleet.summary.generatedAt,
        scopeLabel: "Accessible workspace commerce fleet",
        summary: overview.fleet.summary,
        workspaces: overview.fleet.workspaces.map((workspace) => ({
          automationFailedCheckoutCount:
            workspace.commerce.automationFailedCheckoutCount,
          brandCount: workspace.directory.brandCount,
          completedCheckoutCount: workspace.commerce.completedCheckoutCount,
          current: workspace.directory.current,
          lastActivityAt: workspace.directory.lastActivityAt,
          livePublicationCount: workspace.publications.livePublicationCount,
          openCheckoutCount: workspace.commerce.openCheckoutCount,
          unfulfilledCheckoutCount: workspace.commerce.unfulfilledCheckoutCount,
          workspace: workspace.workspace
        }))
      }
    });
  }

  async function exportAccessibleCommerceFleetCsv(input: {
    currentWorkspaceId?: string | null | undefined;
    workspaces: StudioWorkspaceScopeSummary[];
  }) {
    const report = await getAccessibleCommerceFleetReport(input);
    const header = [
      "workspace_slug",
      "workspace_name",
      "workspace_role",
      "workspace_status",
      "current",
      "brand_count",
      "live_publication_count",
      "open_checkout_count",
      "completed_checkout_count",
      "unfulfilled_checkout_count",
      "automation_failed_checkout_count",
      "last_activity_at"
    ].join(",");
    const rows = report.report.workspaces.map((workspace) =>
      [
        workspace.workspace.slug,
        workspace.workspace.name,
        workspace.workspace.role,
        workspace.workspace.status,
        workspace.current ? "yes" : "no",
        workspace.brandCount,
        workspace.livePublicationCount,
        workspace.openCheckoutCount,
        workspace.completedCheckoutCount,
        workspace.unfulfilledCheckoutCount,
        workspace.automationFailedCheckoutCount,
        workspace.lastActivityAt
      ]
        .map((value) => escapeCsvValue(value))
        .join(",")
    );

    return {
      csv: [header, ...rows].join("\n"),
      filename: "workspace-commerce-fleet.csv"
    };
  }

  return {
    exportAccessibleCommerceFleetCsv,
    getAccessibleCommerceFleetReport,
    getAccessibleWorkspaceFleet
  };
}

export function createRuntimeWorkspaceFleetService(
  rawEnvironment: NodeJS.ProcessEnv = process.env
) {
  const database = getDatabaseClient(rawEnvironment);

  return createWorkspaceFleetService({
    now: () => new Date(),
    repositories: createWorkspaceFleetRepositories(database),
    workspaceDirectoryService:
      createRuntimeWorkspaceDirectoryService(rawEnvironment)
  });
}
