"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  startTransition,
  type FormEvent,
  useEffect,
  useEffectEvent,
  useState
} from "react";

import {
  defaultWorkspaceDecommissionRetentionDays,
  defaultWorkspaceMinimumDecommissionRetentionDays,
  defaultStudioBrandAccentColor,
  defaultStudioBrandLandingDescription,
  defaultStudioBrandLandingHeadline,
  defaultStudioBrandThemePreset,
  defaultStudioFeaturedReleaseLabel,
  studioBrandResponseSchema,
  studioSettingsResponseSchema,
  studioWorkspaceCreateResponseSchema,
  studioWorkspaceInvitationDeleteResponseSchema,
  studioWorkspaceInvitationResponseSchema,
  studioWorkspaceMemberDeleteResponseSchema,
  studioWorkspaceRoleEscalationActionResponseSchema,
  studioWorkspaceRoleEscalationResponseSchema,
  studioWorkspaceStatusUpdateResponseSchema,
  workspaceDecommissionExecutionResponseSchema,
  workspaceDecommissionResponseSchema,
  workspaceOffboardingOverviewResponseSchema,
  type StudioBrandSummary,
  type StudioSettingsSummary,
  type StudioWorkspaceDirectoryEntry,
  type StudioWorkspaceScopeSummary,
  type StudioWorkspaceInvitationSummary,
  type StudioWorkspaceMemberSummary,
  type StudioWorkspaceRoleEscalationSummary,
  type StudioWorkspaceRetentionPolicy,
  type StudioWorkspaceStatus,
  type WorkspaceDecommissionSummary,
  type WorkspaceOffboardingEntry
} from "@ai-nft-forge/shared";
import {
  MetricTile,
  PageShell,
  Pill,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";

import { WorkspaceDirectoryPanel } from "../../../../components/workspace-directory-panel";
import { WorkspaceScopeSwitcher } from "../../../../components/workspace-scope-switcher";

type StudioSettingsClientProps = {
  availableWorkspaces: StudioWorkspaceScopeSummary[];
  currentWalletAddress: string;
  currentWorkspaceSlug: string | null;
  currentWorkspaceOffboarding: WorkspaceOffboardingEntry | null;
  initialSettings: StudioSettingsSummary | null;
  ownerWalletAddress: string;
  workspaceDirectoryEntries: StudioWorkspaceDirectoryEntry[];
};

type NoticeState = {
  message: string;
  tone: "error" | "info" | "success";
} | null;

type StudioBrandEditorState = {
  accentColor: string;
  brandName: string;
  brandSlug: string;
  customDomain: string;
  defaultDecommissionRetentionDays: number;
  featuredReleaseLabel: string;
  heroKicker: string;
  landingDescription: string;
  landingHeadline: string;
  minimumDecommissionRetentionDays: number;
  primaryCtaLabel: string;
  requireDecommissionReason: boolean;
  secondaryCtaLabel: string;
  storyBody: string;
  storyHeadline: string;
  themePreset: "editorial_warm" | "gallery_mono" | "midnight_launch";
  wordmark: string;
  workspaceName: string;
  workspaceSlug: string;
};

type NewBrandState = {
  accentColor: string;
  brandName: string;
  brandSlug: string;
  themePreset: "editorial_warm" | "gallery_mono" | "midnight_launch";
};

type WorkspaceCreateState = {
  accentColor: string;
  brandName: string;
  brandSlug: string;
  themePreset: "editorial_warm" | "gallery_mono" | "midnight_launch";
  workspaceName: string;
  workspaceSlug: string;
};

type MemberState = {
  walletAddress: string;
};

type WorkspaceDecommissionFormState = {
  confirmWorkspaceSlug: string;
  executeConfirmWorkspaceSlug: string;
  reason: string;
  retentionDays: number;
};

function resolveWorkspaceRetentionPolicy(
  settings: StudioSettingsSummary | null
): StudioWorkspaceRetentionPolicy {
  return (
    settings?.retentionPolicy ?? {
      defaultDecommissionRetentionDays:
        defaultWorkspaceDecommissionRetentionDays,
      minimumDecommissionRetentionDays:
        defaultWorkspaceMinimumDecommissionRetentionDays,
      requireDecommissionReason: false
    }
  );
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function createFallbackErrorMessage(response: Response) {
  switch (response.status) {
    case 401:
      return "An active studio session is required.";
    case 403:
      return "Only workspace owners can change these studio settings.";
    case 409:
      return "The requested studio settings conflict with existing records.";
    default:
      return "The studio settings request could not be completed.";
  }
}

async function parseJsonResponse<T>(input: {
  response: Response;
  schema: {
    parse(value: unknown): T;
  };
}): Promise<T> {
  const payload = await input.response.json().catch(() => null);

  if (!input.response.ok) {
    if (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
    ) {
      throw new Error(payload.error.message);
    }

    throw new Error(createFallbackErrorMessage(input.response));
  }

  return input.schema.parse(payload);
}

function createInitialEditorState(settings: StudioSettingsSummary | null) {
  const brand = settings?.brands[0] ?? settings?.brand ?? null;

  return {
    accentColor: brand?.accentColor ?? defaultStudioBrandAccentColor,
    brandName: brand?.name ?? "",
    brandSlug: brand?.slug ?? "",
    customDomain: brand?.customDomain ?? "",
    defaultDecommissionRetentionDays:
      settings?.retentionPolicy.defaultDecommissionRetentionDays ??
      defaultWorkspaceDecommissionRetentionDays,
    featuredReleaseLabel:
      brand?.featuredReleaseLabel ?? defaultStudioFeaturedReleaseLabel,
    heroKicker: brand?.heroKicker ?? "",
    landingDescription:
      brand?.landingDescription ?? defaultStudioBrandLandingDescription,
    landingHeadline:
      brand?.landingHeadline ?? defaultStudioBrandLandingHeadline,
    minimumDecommissionRetentionDays:
      settings?.retentionPolicy.minimumDecommissionRetentionDays ??
      defaultWorkspaceMinimumDecommissionRetentionDays,
    primaryCtaLabel: brand?.primaryCtaLabel ?? "",
    requireDecommissionReason:
      settings?.retentionPolicy.requireDecommissionReason ?? false,
    secondaryCtaLabel: brand?.secondaryCtaLabel ?? "",
    storyBody: brand?.storyBody ?? "",
    storyHeadline: brand?.storyHeadline ?? "",
    themePreset: brand?.themePreset ?? defaultStudioBrandThemePreset,
    wordmark: brand?.wordmark ?? "",
    workspaceName: settings?.workspace.name ?? "",
    workspaceSlug: settings?.workspace.slug ?? ""
  };
}

function createEditorState(input: {
  brand: StudioBrandSummary | null;
  retentionPolicy: StudioWorkspaceRetentionPolicy;
  workspace: StudioSettingsSummary["workspace"] | null;
}): StudioBrandEditorState {
  return {
    accentColor: input.brand?.accentColor ?? defaultStudioBrandAccentColor,
    brandName: input.brand?.name ?? "",
    brandSlug: input.brand?.slug ?? "",
    customDomain: input.brand?.customDomain ?? "",
    defaultDecommissionRetentionDays:
      input.retentionPolicy.defaultDecommissionRetentionDays,
    featuredReleaseLabel:
      input.brand?.featuredReleaseLabel ?? defaultStudioFeaturedReleaseLabel,
    heroKicker: input.brand?.heroKicker ?? "",
    landingDescription:
      input.brand?.landingDescription ?? defaultStudioBrandLandingDescription,
    landingHeadline:
      input.brand?.landingHeadline ?? defaultStudioBrandLandingHeadline,
    minimumDecommissionRetentionDays:
      input.retentionPolicy.minimumDecommissionRetentionDays,
    primaryCtaLabel: input.brand?.primaryCtaLabel ?? "",
    requireDecommissionReason: input.retentionPolicy.requireDecommissionReason,
    secondaryCtaLabel: input.brand?.secondaryCtaLabel ?? "",
    storyBody: input.brand?.storyBody ?? "",
    storyHeadline: input.brand?.storyHeadline ?? "",
    themePreset: input.brand?.themePreset ?? defaultStudioBrandThemePreset,
    wordmark: input.brand?.wordmark ?? "",
    workspaceName: input.workspace?.name ?? "",
    workspaceSlug: input.workspace?.slug ?? ""
  };
}

function createInitialNewBrandState(): NewBrandState {
  return {
    accentColor: defaultStudioBrandAccentColor,
    brandName: "",
    brandSlug: "",
    themePreset: defaultStudioBrandThemePreset
  };
}

function createInitialWorkspaceCreateState(): WorkspaceCreateState {
  return {
    accentColor: defaultStudioBrandAccentColor,
    brandName: "",
    brandSlug: "",
    themePreset: defaultStudioBrandThemePreset,
    workspaceName: "",
    workspaceSlug: ""
  };
}

function createInitialMemberState(): MemberState {
  return {
    walletAddress: ""
  };
}

function createInitialWorkspaceDecommissionFormState(
  input: {
    retentionPolicy: StudioWorkspaceRetentionPolicy;
    workspaceSlug: string | null;
  }
): WorkspaceDecommissionFormState {
  return {
    confirmWorkspaceSlug: input.workspaceSlug ?? "",
    executeConfirmWorkspaceSlug: input.workspaceSlug ?? "",
    reason: "",
    retentionDays: input.retentionPolicy.defaultDecommissionRetentionDays
  };
}

function formatWorkspaceStatus(status: StudioWorkspaceStatus) {
  return status.replaceAll("_", " ");
}

function formatWorkspaceOffboardingCode(code: string) {
  return code.replaceAll("_", " ");
}

function formatDecommissionDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function createInactiveWorkspaceMessage(status: StudioWorkspaceStatus) {
  if (status === "archived") {
    return "This workspace is archived. Review stays available, but settings, members, publications, and ops mutations are read-only until it is reactivated.";
  }

  if (status === "suspended") {
    return "This workspace is suspended. Review stays available, but settings, members, publications, and ops mutations are read-only until it is reactivated.";
  }

  return null;
}

function resolveSelectedBrandId(input: {
  currentBrandId: string | null;
  settings: StudioSettingsSummary | null;
}) {
  if (
    input.currentBrandId &&
    input.settings?.brands.some((brand) => brand.id === input.currentBrandId)
  ) {
    return input.currentBrandId;
  }

  return input.settings?.brands[0]?.id ?? input.settings?.brand.id ?? null;
}

export function StudioSettingsClient({
  availableWorkspaces,
  currentWalletAddress,
  currentWorkspaceSlug,
  currentWorkspaceOffboarding,
  initialSettings,
  ownerWalletAddress,
  workspaceDirectoryEntries
}: StudioSettingsClientProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [currentWorkspaceOffboardingState, setCurrentWorkspaceOffboardingState] =
    useState(currentWorkspaceOffboarding);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(
    initialSettings?.brands[0]?.id ?? initialSettings?.brand.id ?? null
  );
  const [editorState, setEditorState] = useState<StudioBrandEditorState>(() =>
    createInitialEditorState(initialSettings)
  );
  const [newBrandState, setNewBrandState] = useState<NewBrandState>(() =>
    createInitialNewBrandState()
  );
  const [workspaceCreateState, setWorkspaceCreateState] =
    useState<WorkspaceCreateState>(() => createInitialWorkspaceCreateState());
  const [memberState, setMemberState] = useState<MemberState>(() =>
    createInitialMemberState()
  );
  const [workspaceDecommissionFormState, setWorkspaceDecommissionFormState] =
    useState<WorkspaceDecommissionFormState>(() =>
      createInitialWorkspaceDecommissionFormState(
        {
          retentionPolicy: resolveWorkspaceRetentionPolicy(initialSettings),
          workspaceSlug: initialSettings?.workspace.slug ?? null
        }
      )
    );
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
  const [isSchedulingDecommission, setIsSchedulingDecommission] =
    useState(false);
  const [isCancelingDecommission, setIsCancelingDecommission] = useState(false);
  const [isExecutingDecommission, setIsExecutingDecommission] = useState(false);
  const [roleEscalationJustification, setRoleEscalationJustification] =
    useState("");
  const [isRequestingRoleEscalation, setIsRequestingRoleEscalation] =
    useState(false);
  const [actingRoleEscalationRequestId, setActingRoleEscalationRequestId] =
    useState<string | null>(null);
  const [actingWorkspaceStatus, setActingWorkspaceStatus] =
    useState<StudioWorkspaceStatus | null>(null);
  const [cancelingInvitationId, setCancelingInvitationId] = useState<
    string | null
  >(null);
  const [removingMembershipId, setRemovingMembershipId] = useState<
    string | null
  >(null);

  const access = settings?.access ?? {
    canManageMembers: true,
    canManageOnchain: true,
    canManageOpsPolicy: true,
    canManageRoleEscalations: true,
    canRequestRoleEscalation: false,
    canManageWorkspace: true,
    canPublishCollections: true,
    role: "owner" as const
  };
  const canManageMembers = access.canManageMembers;
  const canManageRoleEscalations = access.canManageRoleEscalations;
  const canRequestRoleEscalation = access.canRequestRoleEscalation;
  const canManageWorkspace = access.canManageWorkspace;
  const workspaceStatus = settings?.workspace.status ?? null;
  const workspaceIsActive =
    workspaceStatus === null ? false : workspaceStatus === "active";
  const inactiveWorkspaceMessage =
    workspaceStatus === null
      ? "Create a workspace before changing workspace-scoped settings."
      : createInactiveWorkspaceMessage(workspaceStatus);
  const canEditCurrentWorkspace =
    canManageWorkspace && Boolean(settings?.workspace.id) && workspaceIsActive;
  const canMutateMembers = canManageMembers && workspaceIsActive;
  const retentionPolicy = resolveWorkspaceRetentionPolicy(settings);

  const selectedBrand =
    settings?.brands.find((brand) => brand.id === selectedBrandId) ??
    settings?.brands[0] ??
    settings?.brand ??
    null;
  const resolvedOwnerWalletAddress =
    settings?.members.find((member) => member.role === "owner")
      ?.walletAddress ?? ownerWalletAddress;
  const pendingRoleEscalationRequest =
    settings?.roleEscalationRequests.find(
      (request) => request.status === "pending"
    ) ?? null;
  const actorRoleEscalationRequest =
    settings?.roleEscalationRequests.find(
      (request) =>
        request.status === "pending" &&
        request.targetWalletAddress.toLowerCase() ===
          currentWalletAddress.toLowerCase()
    ) ?? null;
  const offboardingSummary =
    currentWorkspaceOffboardingState?.summary ?? null;
  const scheduledDecommission =
    currentWorkspaceOffboardingState?.decommission ?? null;
  const exportWorkspaceId =
    currentWorkspaceOffboardingState?.workspace.id ?? settings?.workspace.id ?? null;
  const scheduledDecommissionReadyForExecution = scheduledDecommission
    ? new Date(scheduledDecommission.executeAfter).getTime() <= Date.now()
    : false;

  useEffect(() => {
    const nextSelectedBrandId = resolveSelectedBrandId({
      currentBrandId: selectedBrandId,
      settings
    });

    if (nextSelectedBrandId !== selectedBrandId) {
      setSelectedBrandId(nextSelectedBrandId);
      return;
    }

    setEditorState(
      createEditorState({
        brand: selectedBrand,
        retentionPolicy: resolveWorkspaceRetentionPolicy(settings),
        workspace: settings?.workspace ?? null
      })
    );
  }, [selectedBrand, selectedBrandId, settings]);

  useEffect(() => {
    const retentionPolicy = resolveWorkspaceRetentionPolicy(settings);

    setWorkspaceDecommissionFormState((currentState) => ({
      ...currentState,
      confirmWorkspaceSlug: settings?.workspace.slug ?? "",
      executeConfirmWorkspaceSlug: settings?.workspace.slug ?? "",
      retentionDays: Math.max(
        retentionPolicy.defaultDecommissionRetentionDays,
        retentionPolicy.minimumDecommissionRetentionDays
      )
    }));
  }, [settings?.retentionPolicy, settings?.workspace.slug]);

  const refreshSettings = useEffectEvent(
    async (input?: { silent?: boolean }) => {
      if (!input?.silent) {
        setIsRefreshing(true);
      }

      try {
        const [settingsResponse, offboardingResponse] = await Promise.all([
          fetch("/api/studio/settings", {
            cache: "no-store"
          }),
          fetch("/api/studio/workspaces/offboarding", {
            cache: "no-store"
          })
        ]);
        const [result, offboardingResult] = await Promise.all([
          parseJsonResponse({
            response: settingsResponse,
            schema: studioSettingsResponseSchema
          }),
          parseJsonResponse({
            response: offboardingResponse,
            schema: workspaceOffboardingOverviewResponseSchema
          })
        ]);
        const nextCurrentWorkspaceOffboarding =
          offboardingResult.overview.workspaces.find(
            (workspace) => workspace.current
          ) ?? null;

        startTransition(() => {
          setSettings(result.settings);
          setCurrentWorkspaceOffboardingState(nextCurrentWorkspaceOffboarding);
          setSelectedBrandId((currentBrandId) =>
            resolveSelectedBrandId({
              currentBrandId,
              settings: result.settings
            })
          );
        });
      } catch (error) {
        setNotice({
          message:
            error instanceof Error
              ? error.message
              : "Studio settings could not be refreshed.",
          tone: "error"
        });
      } finally {
        if (!input?.silent) {
          setIsRefreshing(false);
        }
      }
    }
  );

  async function handleSaveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEditCurrentWorkspace) {
      setNotice({
        message:
          inactiveWorkspaceMessage ??
          "Only workspace owners can change studio identity.",
        tone: "error"
      });
      return;
    }

    setIsSaving(true);
    setNotice({
      message: settings
        ? "Saving studio settings…"
        : "Creating studio identity…",
      tone: "info"
    });

    try {
      const response = await fetch("/api/studio/settings", {
        body: JSON.stringify({
          ...editorState,
          brandId: selectedBrand?.id ?? null,
          retentionPolicy: {
            defaultDecommissionRetentionDays:
              editorState.defaultDecommissionRetentionDays,
            minimumDecommissionRetentionDays:
              editorState.minimumDecommissionRetentionDays,
            requireDecommissionReason: editorState.requireDecommissionReason
          }
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "PUT"
      });
      const result = await parseJsonResponse({
        response,
        schema: studioSettingsResponseSchema
      });

      startTransition(() => {
        setSettings(result.settings);
        setSelectedBrandId(
          resolveSelectedBrandId({
            currentBrandId: selectedBrand?.id ?? null,
            settings: result.settings
          })
        );
      });
      setNotice({
        message: "Studio settings saved.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Studio settings could not be saved.",
        tone: "error"
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateBrand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canEditCurrentWorkspace) {
      setNotice({
        message:
          inactiveWorkspaceMessage ??
          "Only workspace owners can add brands.",
        tone: "error"
      });
      return;
    }

    setIsCreatingBrand(true);
    setNotice({
      message: "Creating additional brand…",
      tone: "info"
    });

    try {
      const response = await fetch("/api/studio/settings/brands", {
        body: JSON.stringify({
          accentColor: newBrandState.accentColor,
          brandName: newBrandState.brandName,
          brandSlug: newBrandState.brandSlug,
          featuredReleaseLabel: defaultStudioFeaturedReleaseLabel,
          landingDescription: defaultStudioBrandLandingDescription,
          landingHeadline: defaultStudioBrandLandingHeadline,
          themePreset: newBrandState.themePreset
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const payload = await parseJsonResponse({
        response,
        schema: studioBrandResponseSchema
      });

      startTransition(() => {
        setSettings((currentSettings) => {
          if (!currentSettings) {
            return currentSettings;
          }

          return {
            ...currentSettings,
            brand: currentSettings.brand,
            brands: [...currentSettings.brands, payload.brand]
          };
        });
        setSelectedBrandId(payload.brand.id);
        setNewBrandState(createInitialNewBrandState());
      });
      setNotice({
        message: `Created ${payload.brand.name}.`,
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Additional brand could not be created.",
        tone: "error"
      });
    } finally {
      setIsCreatingBrand(false);
    }
  }

  async function handleCreateWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManageWorkspace) {
      setNotice({
        message: "Only workspace owners can create workspaces.",
        tone: "error"
      });
      return;
    }

    setIsCreatingWorkspace(true);
    setNotice({
      message: "Provisioning workspace…",
      tone: "info"
    });

    try {
      const response = await fetch("/api/studio/workspaces", {
        body: JSON.stringify(workspaceCreateState),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const payload = await parseJsonResponse({
        response,
        schema: studioWorkspaceCreateResponseSchema
      });

      setWorkspaceCreateState(createInitialWorkspaceCreateState());
      setNotice({
        message: `Created ${payload.workspace.name} and switched scope.`,
        tone: "success"
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Workspace provisioning could not be completed.",
        tone: "error"
      });
    } finally {
      setIsCreatingWorkspace(false);
    }
  }

  async function handleUpdateWorkspaceStatus(status: StudioWorkspaceStatus) {
    if (!canManageWorkspace || !settings?.workspace.id) {
      setNotice({
        message: "Only workspace owners can change workspace lifecycle state.",
        tone: "error"
      });
      return;
    }

    setActingWorkspaceStatus(status);
    setNotice({
      message:
        status === "active"
          ? "Reactivating workspace…"
          : status === "suspended"
            ? "Suspending workspace…"
            : "Archiving workspace…",
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/workspaces/${settings.workspace.id}/status`,
        {
          body: JSON.stringify({
            status
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "PUT"
        }
      );
      await parseJsonResponse({
        response,
        schema: studioWorkspaceStatusUpdateResponseSchema
      });

      await refreshSettings({
        silent: true
      });
      setNotice({
        message:
          status === "active"
            ? "Workspace reactivated."
            : status === "suspended"
              ? "Workspace suspended and switched to read-only."
              : "Workspace archived and switched to read-only.",
        tone: "success"
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Workspace lifecycle state could not be updated.",
        tone: "error"
      });
    } finally {
      setActingWorkspaceStatus(null);
    }
  }

  async function handleScheduleWorkspaceDecommission(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!canManageWorkspace || !settings?.workspace.id) {
      setNotice({
        message: "Only workspace owners can schedule workspace decommission.",
        tone: "error"
      });
      return;
    }

    setIsSchedulingDecommission(true);
    setNotice({
      message: "Scheduling workspace decommission…",
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/workspaces/${settings.workspace.id}/decommission`,
        {
          body: JSON.stringify({
            confirmWorkspaceSlug:
              workspaceDecommissionFormState.confirmWorkspaceSlug,
            exportConfirmed: true,
            reason:
              workspaceDecommissionFormState.reason.trim().length > 0
                ? workspaceDecommissionFormState.reason.trim()
                : null,
            retentionDays: workspaceDecommissionFormState.retentionDays
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        }
      );
      const payload = await parseJsonResponse({
        response,
        schema: workspaceDecommissionResponseSchema
      });

      await refreshSettings({
        silent: true
      });
      setWorkspaceDecommissionFormState((currentState) => ({
        ...currentState,
        reason: ""
      }));
      setNotice({
        message: `Workspace decommission scheduled for ${formatDecommissionDateTime(payload.decommission.executeAfter)}.`,
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Workspace decommission could not be scheduled.",
        tone: "error"
      });
    } finally {
      setIsSchedulingDecommission(false);
    }
  }

  async function handleCancelWorkspaceDecommission() {
    if (!canManageWorkspace || !settings?.workspace.id) {
      setNotice({
        message: "Only workspace owners can cancel workspace decommission.",
        tone: "error"
      });
      return;
    }

    setIsCancelingDecommission(true);
    setNotice({
      message: "Canceling workspace decommission…",
      tone: "info"
    });

    try {
      await parseJsonResponse({
        response: await fetch(
          `/api/studio/workspaces/${settings.workspace.id}/decommission`,
          {
            method: "DELETE"
          }
        ),
        schema: workspaceDecommissionResponseSchema
      });
      await refreshSettings({
        silent: true
      });
      setNotice({
        message: "Workspace decommission canceled.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Workspace decommission could not be canceled.",
        tone: "error"
      });
    } finally {
      setIsCancelingDecommission(false);
    }
  }

  async function handleExecuteWorkspaceDecommission() {
    if (!canManageWorkspace || !settings?.workspace.id) {
      setNotice({
        message: "Only workspace owners can execute workspace decommission.",
        tone: "error"
      });
      return;
    }

    setIsExecutingDecommission(true);
    setNotice({
      message: "Executing workspace decommission…",
      tone: "info"
    });

    try {
      const payload = await parseJsonResponse({
        response: await fetch(
          `/api/studio/workspaces/${settings.workspace.id}/decommission/execute`,
          {
            body: JSON.stringify({
              confirmWorkspaceSlug:
                workspaceDecommissionFormState.executeConfirmWorkspaceSlug
            }),
            headers: {
              "Content-Type": "application/json"
            },
            method: "POST"
          }
        ),
        schema: workspaceDecommissionExecutionResponseSchema
      });

      setNotice({
        message: `Workspace ${payload.workspace.slug} was decommissioned.`,
        tone: "success"
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Workspace decommission could not be executed.",
        tone: "error"
      });
    } finally {
      setIsExecutingDecommission(false);
    }
  }

  async function handleCreateInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canMutateMembers) {
      setNotice({
        message:
          inactiveWorkspaceMessage ??
          "Only workspace owners can manage invitations.",
        tone: "error"
      });
      return;
    }

    setIsCreatingInvitation(true);
    setNotice({
      message: "Creating workspace invitation…",
      tone: "info"
    });

    try {
      const response = await fetch("/api/studio/settings/invitations", {
        body: JSON.stringify({
          walletAddress: memberState.walletAddress
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const payload = await parseJsonResponse({
        response,
        schema: studioWorkspaceInvitationResponseSchema
      });

      startTransition(() => {
        setSettings((currentSettings) => {
          if (!currentSettings) {
            return currentSettings;
          }

          return {
            ...currentSettings,
            invitations: [...currentSettings.invitations, payload.invitation]
          };
        });
        setMemberState(createInitialMemberState());
      });
      setNotice({
        message: `Invited ${payload.invitation.walletAddress}.`,
        tone: "success"
      });
      await refreshSettings({
        silent: true
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Workspace invitation could not be created.",
        tone: "error"
      });
    } finally {
      setIsCreatingInvitation(false);
    }
  }

  async function handleCancelInvitation(
    invitation: StudioWorkspaceInvitationSummary
  ) {
    if (!canMutateMembers) {
      return;
    }

    setCancelingInvitationId(invitation.id);
    setNotice({
      message: `Canceling ${invitation.walletAddress}…`,
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/settings/invitations/${invitation.id}`,
        {
          method: "DELETE"
        }
      );
      await parseJsonResponse({
        response,
        schema: studioWorkspaceInvitationDeleteResponseSchema
      });

      startTransition(() => {
        setSettings((currentSettings) => {
          if (!currentSettings) {
            return currentSettings;
          }

          return {
            ...currentSettings,
            invitations: currentSettings.invitations.filter(
              (currentInvitation) => currentInvitation.id !== invitation.id
            )
          };
        });
      });
      setNotice({
        message: `Canceled the invitation for ${invitation.walletAddress}.`,
        tone: "success"
      });
      await refreshSettings({
        silent: true
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Workspace invitation could not be canceled.",
        tone: "error"
      });
    } finally {
      setCancelingInvitationId(null);
    }
  }

  async function handleRemoveMember(member: StudioWorkspaceMemberSummary) {
    if (!member.membershipId || !canMutateMembers) {
      return;
    }

    setRemovingMembershipId(member.membershipId);
    setNotice({
      message: `Removing ${member.walletAddress}…`,
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/settings/members/${member.membershipId}`,
        {
          method: "DELETE"
        }
      );
      await parseJsonResponse({
        response,
        schema: studioWorkspaceMemberDeleteResponseSchema
      });

      startTransition(() => {
        setSettings((currentSettings) => {
          if (!currentSettings) {
            return currentSettings;
          }

          return {
            ...currentSettings,
            members: currentSettings.members.filter(
              (currentMember) =>
                currentMember.membershipId !== member.membershipId
            )
          };
        });
      });
      setNotice({
        message: `Removed ${member.walletAddress} from the workspace.`,
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Workspace operator could not be removed.",
        tone: "error"
      });
    } finally {
      setRemovingMembershipId(null);
    }
  }

  async function handleRequestRoleEscalation(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!canRequestRoleEscalation || !workspaceIsActive) {
      setNotice({
        message:
          inactiveWorkspaceMessage ??
          "Only workspace operators can request ownership transfer.",
        tone: "error"
      });
      return;
    }

    setIsRequestingRoleEscalation(true);
    setNotice({
      message: "Submitting ownership transfer request…",
      tone: "info"
    });

    try {
      const response = await fetch("/api/studio/settings/role-escalations", {
        body: JSON.stringify({
          justification: roleEscalationJustification
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      await parseJsonResponse({
        response,
        schema: studioWorkspaceRoleEscalationResponseSchema
      });

      setRoleEscalationJustification("");
      await refreshSettings({
        silent: true
      });
      setNotice({
        message: "Ownership transfer request submitted for owner review.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Ownership transfer request could not be submitted.",
        tone: "error"
      });
    } finally {
      setIsRequestingRoleEscalation(false);
    }
  }

  async function handleApproveRoleEscalation(
    request: StudioWorkspaceRoleEscalationSummary
  ) {
    if (!canManageRoleEscalations || !workspaceIsActive) {
      return;
    }

    setActingRoleEscalationRequestId(request.id);
    setNotice({
      message: `Approving ownership transfer for ${request.targetWalletAddress}…`,
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/settings/role-escalations/${request.id}/approve`,
        {
          method: "POST"
        }
      );
      await parseJsonResponse({
        response,
        schema: studioWorkspaceRoleEscalationActionResponseSchema
      });

      await refreshSettings({
        silent: true
      });
      setNotice({
        message: "Ownership transferred and workspace access refreshed.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Ownership transfer could not be approved.",
        tone: "error"
      });
    } finally {
      setActingRoleEscalationRequestId(null);
    }
  }

  async function handleRejectRoleEscalation(
    request: StudioWorkspaceRoleEscalationSummary
  ) {
    if (!canManageRoleEscalations || !workspaceIsActive) {
      return;
    }

    setActingRoleEscalationRequestId(request.id);
    setNotice({
      message: `Rejecting ownership transfer for ${request.targetWalletAddress}…`,
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/settings/role-escalations/${request.id}/reject`,
        {
          method: "POST"
        }
      );
      await parseJsonResponse({
        response,
        schema: studioWorkspaceRoleEscalationActionResponseSchema
      });

      await refreshSettings({
        silent: true
      });
      setNotice({
        message: "Ownership transfer request rejected.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Ownership transfer request could not be rejected.",
        tone: "error"
      });
    } finally {
      setActingRoleEscalationRequestId(null);
    }
  }

  async function handleCancelRoleEscalation(
    request: StudioWorkspaceRoleEscalationSummary
  ) {
    if (!canRequestRoleEscalation || !workspaceIsActive) {
      return;
    }

    setActingRoleEscalationRequestId(request.id);
    setNotice({
      message: "Canceling ownership transfer request…",
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/settings/role-escalations/${request.id}`,
        {
          method: "DELETE"
        }
      );
      await parseJsonResponse({
        response,
        schema: studioWorkspaceRoleEscalationActionResponseSchema
      });

      await refreshSettings({
        silent: true
      });
      setNotice({
        message: "Ownership transfer request canceled.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Ownership transfer request could not be canceled.",
        tone: "error"
      });
    } finally {
      setActingRoleEscalationRequestId(null);
    }
  }

  return (
    <PageShell
      eyebrow="Settings"
      title="Define the durable studio identity"
      lead="This protected settings surface owns the workspace and public brand profile used by collection publication. Saved settings now also carry storefront landing copy so the public brand route can be merchandised without hardcoded page text."
      actions={
        <>
          <button
            className="button-action"
            disabled={isRefreshing}
            onClick={() => {
              void refreshSettings();
            }}
            type="button"
          >
            {isRefreshing ? "Refreshing…" : "Refresh data"}
          </button>
          <Link className="action-link" href="/studio/collections">
            Open collections
          </Link>
          <Link className="inline-link" href="/studio">
            Back to studio
          </Link>
        </>
      }
      tone="studio"
    >
      <SurfaceGrid>
        <SurfaceCard
          body="Workspace and brand identity are now persisted behind the session boundary and reused by collection publication. This keeps public routes stable and removes ad hoc brand entry during publish."
          eyebrow="Phase 3"
          span={8}
          title="Owner-scoped studio profile"
        >
          <div className="metric-list">
            <MetricTile label="Owner" value={resolvedOwnerWalletAddress} />
            <MetricTile label="Current actor" value={currentWalletAddress} />
            <MetricTile label="Role" value={access.role} />
            <MetricTile
              label="Workspace"
              value={settings?.workspace.slug ?? "Unconfigured"}
            />
            <MetricTile
              label="Status"
              value={workspaceStatus ? formatWorkspaceStatus(workspaceStatus) : "Unconfigured"}
            />
            <MetricTile
              label="Primary brand"
              value={settings?.brand.slug ?? "Unconfigured"}
            />
            <MetricTile
              label="Brand count"
              value={settings?.brands.length?.toString() ?? "0"}
            />
            <MetricTile
              label="Members"
              value={settings?.members.length?.toString() ?? "1"}
            />
            <MetricTile
              label="Pending invites"
              value={settings?.invitations.length?.toString() ?? "0"}
            />
            <MetricTile
              label="Role escalation"
              value={(
                settings?.roleEscalationRequests.filter(
                  (request) => request.status === "pending"
                ).length ?? 0
              ).toString()}
            />
          </div>
          {inactiveWorkspaceMessage && settings?.workspace ? (
            <div className="status-banner status-banner--info">
              <strong>{formatWorkspaceStatus(settings.workspace.status)}</strong>
              <span>{inactiveWorkspaceMessage}</span>
            </div>
          ) : null}
          <div className="pill-row">
            <Pill>/studio/settings</Pill>
            <Pill>
              {selectedBrand?.publicBrandPath ?? "/brands/[brandSlug]"}
            </Pill>
            <Pill>
              {selectedBrand?.accentColor ?? defaultStudioBrandAccentColor}
            </Pill>
            <Pill>
              {selectedBrand?.themePreset ?? defaultStudioBrandThemePreset}
            </Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="Selection now targets one accessible workspace at a time, so owners and operators can move between workspace contexts without rewriting the rest of the studio URLs."
          eyebrow="Workspace"
          span={4}
          title="Active workspace scope"
        >
          <WorkspaceScopeSwitcher
            currentWorkspaceSlug={currentWorkspaceSlug}
            workspaces={availableWorkspaces}
          />
        </SurfaceCard>
        <SurfaceCard
          body="Archive and suspend keep the workspace readable while blocking further settings, collection, commerce, and ops mutations. Reactivation restores normal write access."
          eyebrow="Lifecycle"
          span={4}
          title="Workspace lifecycle"
        >
          {!settings?.workspace ? (
            <div className="status-banner status-banner--info">
              <strong>No workspace selected</strong>
              <span>Create a workspace before changing lifecycle state.</span>
            </div>
          ) : null}
          {settings?.workspace ? (
            <>
              <div className="pill-row">
                <Pill>{formatWorkspaceStatus(settings.workspace.status)}</Pill>
                <Pill>/{settings.workspace.slug}</Pill>
              </div>
              {inactiveWorkspaceMessage ? (
                <div className="status-banner status-banner--info">
                  <strong>Read-only</strong>
                  <span>{inactiveWorkspaceMessage}</span>
                </div>
              ) : null}
              {!canManageWorkspace ? (
                <div className="status-banner status-banner--info">
                  <strong>Owner only</strong>
                  <span>
                    Operators can review lifecycle state, but only owners can
                    archive, suspend, or reactivate a workspace.
                  </span>
                </div>
              ) : null}
              <div className="studio-action-row">
                {settings.workspace.status === "active" ? (
                  <>
                    <button
                      className="button-action button-action--secondary"
                      disabled={
                        !canManageWorkspace || actingWorkspaceStatus !== null
                      }
                      onClick={() => {
                        void handleUpdateWorkspaceStatus("suspended");
                      }}
                      type="button"
                    >
                      {actingWorkspaceStatus === "suspended"
                        ? "Suspending…"
                        : "Suspend workspace"}
                    </button>
                    <button
                      className="button-action"
                      disabled={
                        !canManageWorkspace || actingWorkspaceStatus !== null
                      }
                      onClick={() => {
                        void handleUpdateWorkspaceStatus("archived");
                      }}
                      type="button"
                    >
                      {actingWorkspaceStatus === "archived"
                        ? "Archiving…"
                        : "Archive workspace"}
                    </button>
                  </>
                ) : (
                  <button
                    className="button-action button-action--accent"
                    disabled={
                      !canManageWorkspace || actingWorkspaceStatus !== null
                    }
                    onClick={() => {
                      void handleUpdateWorkspaceStatus("active");
                    }}
                    type="button"
                  >
                    {actingWorkspaceStatus === "active"
                      ? "Reactivating…"
                      : "Reactivate workspace"}
                  </button>
                )}
              </div>
            </>
          ) : null}
        </SurfaceCard>
        <SurfaceCard
          body="Offboarding review combines workspace-native access signals with workspace-scoped commerce and ops blockers so owners can export a durable handoff package before they archive or retire a workspace."
          eyebrow="Offboarding"
          span={4}
          title="Export and archive review"
        >
          {!settings?.workspace ? (
            <div className="status-banner status-banner--info">
              <strong>No workspace selected</strong>
              <span>Choose a workspace before exporting or reviewing archive readiness.</span>
            </div>
          ) : null}
          {offboardingSummary ? (
            <>
              <div className="pill-row">
                <Pill>{formatWorkspaceOffboardingCode(offboardingSummary.readiness)}</Pill>
                <Pill>{offboardingSummary.openCheckoutCount} open checkouts</Pill>
                <Pill>{offboardingSummary.activeAlertCount} active alerts</Pill>
                <Pill>{offboardingSummary.openReconciliationIssueCount} open reconciliation</Pill>
              </div>
              {offboardingSummary.blockerCodes.length ? (
                <div className="status-banner status-banner--error">
                  <strong>Archive blocked</strong>
                  <span>
                    Resolve{" "}
                    {offboardingSummary.blockerCodes
                      .map(formatWorkspaceOffboardingCode)
                      .join(", ")}
                    {" "}before offboarding this workspace.
                  </span>
                </div>
              ) : null}
              {!offboardingSummary.blockerCodes.length &&
              offboardingSummary.cautionCodes.length ? (
                <div className="status-banner status-banner--info">
                  <strong>Review before archive</strong>
                  <span>
                    Check{" "}
                    {offboardingSummary.cautionCodes
                      .map(formatWorkspaceOffboardingCode)
                      .join(", ")}
                    {" "}before final offboarding.
                  </span>
                </div>
              ) : null}
              {!offboardingSummary.blockerCodes.length &&
              !offboardingSummary.cautionCodes.length ? (
                <div className="status-banner status-banner--success">
                  <strong>Archive-ready</strong>
                  <span>
                    No active operational blockers are currently attached to this workspace.
                  </span>
                </div>
              ) : null}
              {canManageWorkspace ? (
                <div className="studio-action-row">
                  <Link
                    className="action-link"
                    href={`/api/studio/workspaces/${exportWorkspaceId ?? ""}/export?format=json`}
                  >
                    Export JSON
                  </Link>
                  <Link
                    className="inline-link"
                    href={`/api/studio/workspaces/${exportWorkspaceId ?? ""}/export?format=csv`}
                  >
                    Export CSV
                  </Link>
                </div>
              ) : (
                <div className="status-banner status-banner--info">
                  <strong>Owner only</strong>
                  <span>
                    Operators can review archive readiness, but only owners can export workspace data.
                  </span>
                </div>
              )}
            </>
          ) : null}
        </SurfaceCard>
        <SurfaceCard
          body="Decommission permanently removes the workspace and its workspace-scoped data after a retention window. Policy defaults and minimums are workspace-owned, execution is owner-only, and final cleanup only unlocks after archive plus a fully clean offboarding review."
          eyebrow="Retention"
          span={4}
          title="Decommission workspace"
        >
          {!settings?.workspace ? (
            <div className="status-banner status-banner--info">
              <strong>No workspace selected</strong>
              <span>
                Choose a workspace before scheduling a decommission window.
              </span>
            </div>
          ) : null}
          {settings?.workspace ? (
            <div className="stack-md">
              {!canManageWorkspace ? (
                <div className="status-banner status-banner--info">
                  <strong>Owner only</strong>
                  <span>
                    Operators can review retention state, but only owners can
                    schedule, cancel, or execute workspace decommission.
                  </span>
                </div>
              ) : null}
              <div className="pill-row">
                <Pill>
                  Default {retentionPolicy.defaultDecommissionRetentionDays} days
                </Pill>
                <Pill>
                  Minimum {retentionPolicy.minimumDecommissionRetentionDays} days
                </Pill>
                <Pill>
                  Reason{" "}
                  {retentionPolicy.requireDecommissionReason
                    ? "required"
                    : "optional"}
                </Pill>
              </div>
              {canManageWorkspace && scheduledDecommission ? (
                <>
                  <div className="pill-row">
                    <Pill>{scheduledDecommission.status}</Pill>
                    <Pill>
                      {scheduledDecommission.retentionDays} day retention
                    </Pill>
                  </div>
                  <div className="status-banner status-banner--info">
                    <strong>Scheduled</strong>
                    <span>
                      Execution opens on{" "}
                      {formatDecommissionDateTime(
                        scheduledDecommission.executeAfter
                      )}
                      .
                    </span>
                  </div>
                  {scheduledDecommission.reason ? (
                    <p className="surface-card__body-copy">
                      Reason: {scheduledDecommission.reason}
                    </p>
                  ) : null}
                  <label className="field-label" htmlFor="decommission-execute-slug">
                    Confirm workspace slug to execute
                  </label>
                  <input
                    className="text-input"
                    id="decommission-execute-slug"
                    onChange={(event) => {
                      const value = event.target.value;

                      setWorkspaceDecommissionFormState((currentState) => ({
                        ...currentState,
                        executeConfirmWorkspaceSlug: value
                      }));
                    }}
                    placeholder={settings.workspace.slug}
                    type="text"
                    value={workspaceDecommissionFormState.executeConfirmWorkspaceSlug}
                  />
                  {!scheduledDecommissionReadyForExecution ? (
                    <div className="status-banner">
                      <strong>Retention window active</strong>
                      <span>
                        Final execution stays locked until{" "}
                        {formatDecommissionDateTime(
                          scheduledDecommission.executeAfter
                        )}
                        .
                      </span>
                    </div>
                  ) : null}
                  <div className="studio-action-row">
                    <button
                      className="button-action button-action--secondary"
                      disabled={
                        isCancelingDecommission ||
                        isExecutingDecommission ||
                        isSchedulingDecommission
                      }
                      onClick={() => {
                        void handleCancelWorkspaceDecommission();
                      }}
                      type="button"
                    >
                      {isCancelingDecommission
                        ? "Canceling…"
                        : "Cancel schedule"}
                    </button>
                    <button
                      className="button-action"
                      disabled={
                        isCancelingDecommission ||
                        isExecutingDecommission ||
                        !scheduledDecommissionReadyForExecution
                      }
                      onClick={() => {
                        void handleExecuteWorkspaceDecommission();
                      }}
                      type="button"
                    >
                      {isExecutingDecommission
                        ? "Decommissioning…"
                        : "Execute decommission"}
                    </button>
                  </div>
                </>
              ) : null}
              {canManageWorkspace &&
              !scheduledDecommission &&
              settings.workspace.status !== "archived" ? (
                <div className="status-banner">
                  <strong>Archive required</strong>
                  <span>
                    Archive the workspace before you can schedule permanent
                    decommission.
                  </span>
                </div>
              ) : null}
              {canManageWorkspace &&
              !scheduledDecommission &&
              settings.workspace.status === "archived" &&
              offboardingSummary?.readiness !== "ready" ? (
                <div className="status-banner status-banner--info">
                  <strong>Resolve offboarding review first</strong>
                  <span>
                    Decommission unlocks only after this workspace reaches a
                    ready offboarding state.
                  </span>
                </div>
              ) : null}
              {canManageWorkspace &&
              !scheduledDecommission &&
              settings.workspace.status === "archived" &&
              offboardingSummary?.readiness === "ready" ? (
                <form
                  className="stack-sm"
                  onSubmit={(event) => {
                    void handleScheduleWorkspaceDecommission(event);
                  }}
                >
                  <label className="field-label" htmlFor="decommission-retention">
                    Retention window
                  </label>
                  <input
                    className="text-input"
                    id="decommission-retention"
                    max={365}
                    min={retentionPolicy.minimumDecommissionRetentionDays}
                    onChange={(event) => {
                      const value = Number(event.target.value);

                      setWorkspaceDecommissionFormState((currentState) => ({
                        ...currentState,
                        retentionDays: value
                      }));
                    }}
                    required
                    type="number"
                    value={workspaceDecommissionFormState.retentionDays}
                  />
                  <p className="surface-card__body-copy">
                    Default policy: {retentionPolicy.defaultDecommissionRetentionDays} day(s).
                    Minimum allowed: {retentionPolicy.minimumDecommissionRetentionDays} day(s).
                  </p>
                  <label className="field-label" htmlFor="decommission-slug">
                    Confirm workspace slug
                  </label>
                  <input
                    className="text-input"
                    id="decommission-slug"
                    onChange={(event) => {
                      const value = event.target.value;

                      setWorkspaceDecommissionFormState((currentState) => ({
                        ...currentState,
                        confirmWorkspaceSlug: value
                      }));
                    }}
                    placeholder={settings.workspace.slug}
                    type="text"
                    value={workspaceDecommissionFormState.confirmWorkspaceSlug}
                  />
                  <label className="field-label" htmlFor="decommission-reason">
                    Reason
                    {retentionPolicy.requireDecommissionReason
                      ? " (required)"
                      : " (optional)"}
                  </label>
                  <textarea
                    className="text-input"
                    id="decommission-reason"
                    onChange={(event) => {
                      const value = event.target.value;

                      setWorkspaceDecommissionFormState((currentState) => ({
                        ...currentState,
                        reason: value
                      }));
                    }}
                    rows={3}
                    value={workspaceDecommissionFormState.reason}
                  />
                  <button
                    className="button-action"
                    disabled={isSchedulingDecommission}
                    type="submit"
                  >
                    {isSchedulingDecommission
                      ? "Scheduling…"
                      : "Schedule decommission"}
                  </button>
                </form>
              ) : null}
            </div>
          ) : null}
        </SurfaceCard>
        <WorkspaceDirectoryPanel
          body="This directory is built from workspace-native brands, members, invitations, role-escalation requests, and audit history so the current accessible estate is visible without depending on owner-anchored collection or commerce data."
          entries={workspaceDirectoryEntries}
          eyebrow="Workspace directory"
          span={12}
          title="Accessible workspace estate"
        />
        <SurfaceCard
          body="Workspace provisioning now bootstraps a fresh workspace plus its first brand in one owner-only action, then hands the authenticated selection over to that new workspace immediately."
          eyebrow="Provisioning"
          span={4}
          title="Create workspace"
        >
          {!canManageWorkspace ? (
            <div className="status-banner status-banner--info">
              <strong>Owner only</strong>
              <span>
                Operators can review the workspace estate, but only owners can
                provision another workspace.
              </span>
            </div>
          ) : null}
          <form className="studio-form" onSubmit={handleCreateWorkspace}>
            <fieldset disabled={!canManageWorkspace || isCreatingWorkspace}>
              <label className="field-stack">
                <span className="field-label">Workspace name</span>
                <input
                  className="input-field"
                  maxLength={120}
                  onChange={(event) => {
                    setWorkspaceCreateState((current) => ({
                      ...current,
                      workspaceName: event.target.value
                    }));
                  }}
                  placeholder="West Coast Forge"
                  required
                  value={workspaceCreateState.workspaceName}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Workspace slug</span>
                <input
                  className="input-field"
                  maxLength={80}
                  onChange={(event) => {
                    setWorkspaceCreateState((current) => ({
                      ...current,
                      workspaceSlug: event.target.value
                    }));
                  }}
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  placeholder="west-coast-forge"
                  required
                  value={workspaceCreateState.workspaceSlug}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Initial brand name</span>
                <input
                  className="input-field"
                  maxLength={120}
                  onChange={(event) => {
                    setWorkspaceCreateState((current) => ({
                      ...current,
                      brandName: event.target.value
                    }));
                  }}
                  placeholder="West Coast Editions"
                  required
                  value={workspaceCreateState.brandName}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Initial brand slug</span>
                <input
                  className="input-field"
                  maxLength={80}
                  onChange={(event) => {
                    setWorkspaceCreateState((current) => ({
                      ...current,
                      brandSlug: event.target.value
                    }));
                  }}
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  placeholder="west-coast-editions"
                  required
                  value={workspaceCreateState.brandSlug}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Accent color</span>
                <input
                  className="input-field"
                  onChange={(event) => {
                    setWorkspaceCreateState((current) => ({
                      ...current,
                      accentColor: event.target.value
                    }));
                  }}
                  type="color"
                  value={workspaceCreateState.accentColor}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Theme preset</span>
                <select
                  className="input-field"
                  onChange={(event) => {
                    setWorkspaceCreateState((current) => ({
                      ...current,
                      themePreset: event.target
                        .value as WorkspaceCreateState["themePreset"]
                    }));
                  }}
                  value={workspaceCreateState.themePreset}
                >
                  <option value="editorial_warm">Editorial warm</option>
                  <option value="gallery_mono">Gallery mono</option>
                  <option value="midnight_launch">Midnight launch</option>
                </select>
              </label>
              <div className="studio-action-row">
                <button className="button-action" type="submit">
                  {isCreatingWorkspace ? "Provisioning…" : "Create workspace"}
                </button>
                <Link className="inline-link" href="/studio/commerce/fleet">
                  Open commerce fleet
                </Link>
              </div>
            </fieldset>
          </form>
        </SurfaceCard>
        <SurfaceCard
          body="Configure the shared workspace slug plus the currently selected brand profile. Multi-brand administration keeps one owner workspace and lets publication target an explicit brand instead of assuming a single storefront."
          eyebrow="Profile"
          span={8}
          title={settings ? "Update studio identity" : "Create studio identity"}
        >
          {!canManageWorkspace ? (
            <div className="status-banner status-banner--info">
              <strong>Operator read-only</strong>
              <span>
                Operators can review workspace identity and brand configuration,
                but only workspace owners can change it.
              </span>
            </div>
          ) : null}
          {inactiveWorkspaceMessage && settings?.workspace ? (
            <div className="status-banner status-banner--info">
              <strong>Workspace read-only</strong>
              <span>{inactiveWorkspaceMessage}</span>
            </div>
          ) : null}
          <form className="studio-form" onSubmit={handleSaveSettings}>
            <fieldset disabled={!canEditCurrentWorkspace || isSaving}>
              {settings?.brands.length ? (
                <label className="field-stack">
                  <span className="field-label">Editing brand</span>
                  <select
                    className="input-field"
                    onChange={(event) => {
                      setSelectedBrandId(event.target.value || null);
                    }}
                    value={selectedBrand?.id ?? ""}
                  >
                    {settings.brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name} · /brands/{brand.slug}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="field-stack">
                <span className="field-label">Workspace name</span>
                <input
                  className="input-field"
                  maxLength={120}
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      workspaceName: event.target.value
                    }));
                  }}
                  placeholder="Forge Operations"
                  required
                  value={editorState.workspaceName}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Workspace slug</span>
                <input
                  className="input-field"
                  maxLength={80}
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      workspaceSlug: event.target.value
                    }));
                  }}
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  placeholder="forge-operations"
                  required
                  value={editorState.workspaceSlug}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">
                  Default decommission retention
                </span>
                <input
                  className="input-field"
                  max={365}
                  min={editorState.minimumDecommissionRetentionDays}
                  onChange={(event) => {
                    const value = Number(event.target.value);

                    setEditorState((current) => ({
                      ...current,
                      defaultDecommissionRetentionDays: value
                    }));
                  }}
                  required
                  type="number"
                  value={editorState.defaultDecommissionRetentionDays}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">
                  Minimum decommission retention
                </span>
                <input
                  className="input-field"
                  max={365}
                  min={7}
                  onChange={(event) => {
                    const value = Number(event.target.value);

                    setEditorState((current) => ({
                      ...current,
                      defaultDecommissionRetentionDays: Math.max(
                        current.defaultDecommissionRetentionDays,
                        value
                      ),
                      minimumDecommissionRetentionDays: value
                    }));
                  }}
                  required
                  type="number"
                  value={editorState.minimumDecommissionRetentionDays}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">
                  Require decommission reason
                </span>
                <select
                  className="input-field"
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      requireDecommissionReason:
                        event.target.value === "required"
                    }));
                  }}
                  value={
                    editorState.requireDecommissionReason
                      ? "required"
                      : "optional"
                  }
                >
                  <option value="optional">Optional</option>
                  <option value="required">Required</option>
                </select>
              </label>
              <label className="field-stack">
                <span className="field-label">Brand name</span>
                <input
                  className="input-field"
                  maxLength={120}
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      brandName: event.target.value
                    }));
                  }}
                  placeholder="Forge Editions"
                  required
                  value={editorState.brandName}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Brand slug</span>
                <input
                  className="input-field"
                  maxLength={80}
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      brandSlug: event.target.value
                    }));
                  }}
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  placeholder="forge-editions"
                  required
                  value={editorState.brandSlug}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Custom domain</span>
                <input
                  className="input-field"
                  maxLength={253}
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      customDomain: event.target.value
                    }));
                  }}
                  placeholder="collections.example.com"
                  value={editorState.customDomain}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Theme preset</span>
                <select
                  className="input-field"
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      themePreset: event.target.value as
                        | "editorial_warm"
                        | "gallery_mono"
                        | "midnight_launch"
                    }));
                  }}
                  value={editorState.themePreset}
                >
                  <option value="editorial_warm">Editorial warm</option>
                  <option value="gallery_mono">Gallery mono</option>
                  <option value="midnight_launch">Midnight launch</option>
                </select>
              </label>
              <label className="field-stack">
                <span className="field-label">Landing headline</span>
                <input
                  className="input-field"
                  maxLength={120}
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      landingHeadline: event.target.value
                    }));
                  }}
                  placeholder="Curated collectible releases"
                  required
                  value={editorState.landingHeadline}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Landing description</span>
                <textarea
                  className="input-field input-field--multiline"
                  maxLength={280}
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      landingDescription: event.target.value
                    }));
                  }}
                  rows={5}
                  value={editorState.landingDescription}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Wordmark</span>
                <input
                  className="input-field"
                  maxLength={40}
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      wordmark: event.target.value
                    }));
                  }}
                  placeholder="Forge Editions"
                  value={editorState.wordmark}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Hero kicker</span>
                <input
                  className="input-field"
                  maxLength={60}
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      heroKicker: event.target.value
                    }));
                  }}
                  placeholder="Season three launch"
                  value={editorState.heroKicker}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Story headline</span>
                <input
                  className="input-field"
                  maxLength={120}
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      storyHeadline: event.target.value
                    }));
                  }}
                  placeholder="A collectible portrait program built for premium launches."
                  value={editorState.storyHeadline}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Story body</span>
                <textarea
                  className="input-field input-field--multiline"
                  maxLength={600}
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      storyBody: event.target.value
                    }));
                  }}
                  rows={5}
                  value={editorState.storyBody}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Featured release label</span>
                <input
                  className="input-field"
                  maxLength={40}
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      featuredReleaseLabel: event.target.value
                    }));
                  }}
                  placeholder="Featured release"
                  required
                  value={editorState.featuredReleaseLabel}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Primary CTA label</span>
                <input
                  className="input-field"
                  maxLength={40}
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      primaryCtaLabel: event.target.value
                    }));
                  }}
                  placeholder="View featured release"
                  value={editorState.primaryCtaLabel}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Secondary CTA label</span>
                <input
                  className="input-field"
                  maxLength={40}
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      secondaryCtaLabel: event.target.value
                    }));
                  }}
                  placeholder="Browse archive"
                  value={editorState.secondaryCtaLabel}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Accent color</span>
                <div className="color-input-row">
                  <input
                    className="color-swatch-input"
                    onChange={(event) => {
                      setEditorState((current) => ({
                        ...current,
                        accentColor: event.target.value
                      }));
                    }}
                    type="color"
                    value={editorState.accentColor}
                  />
                  <input
                    className="input-field"
                    maxLength={7}
                    onChange={(event) => {
                      setEditorState((current) => ({
                        ...current,
                        accentColor: event.target.value
                      }));
                    }}
                    pattern="^#[0-9a-fA-F]{6}$"
                    required
                    value={editorState.accentColor}
                  />
                </div>
              </label>
              <div className="studio-action-row">
                <button
                  className="button-action button-action--accent"
                  disabled={!canManageWorkspace || isSaving}
                  type="submit"
                >
                  {isSaving
                    ? "Saving…"
                    : settings
                      ? "Save settings"
                      : "Create settings"}
                </button>
              </div>
            </fieldset>
          </form>
        </SurfaceCard>
        <SurfaceCard
          body="Add an additional publication brand under the same owner workspace. New brands start with a minimal storefront profile and can then be refined in the main editor."
          eyebrow="Brands"
          span={4}
          title="Create brand"
        >
          {!canManageWorkspace ? (
            <div className="status-banner status-banner--info">
              <strong>Owner action required</strong>
              <span>Only workspace owners can create additional brands.</span>
            </div>
          ) : null}
          {inactiveWorkspaceMessage && settings?.workspace ? (
            <div className="status-banner status-banner--info">
              <strong>Workspace read-only</strong>
              <span>{inactiveWorkspaceMessage}</span>
            </div>
          ) : null}
          <form className="studio-form" onSubmit={handleCreateBrand}>
            <fieldset disabled={!canEditCurrentWorkspace || isCreatingBrand}>
              <label className="field-stack">
                <span className="field-label">Brand name</span>
                <input
                  className="input-field"
                  maxLength={120}
                  onChange={(event) => {
                    setNewBrandState((current) => ({
                      ...current,
                      brandName: event.target.value
                    }));
                  }}
                  placeholder="North Editions"
                  required
                  value={newBrandState.brandName}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Brand slug</span>
                <input
                  className="input-field"
                  maxLength={80}
                  onChange={(event) => {
                    setNewBrandState((current) => ({
                      ...current,
                      brandSlug: event.target.value
                    }));
                  }}
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  placeholder="north-editions"
                  required
                  value={newBrandState.brandSlug}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Theme preset</span>
                <select
                  className="input-field"
                  onChange={(event) => {
                    setNewBrandState((current) => ({
                      ...current,
                      themePreset: event.target.value as
                        | "editorial_warm"
                        | "gallery_mono"
                        | "midnight_launch"
                    }));
                  }}
                  value={newBrandState.themePreset}
                >
                  <option value="editorial_warm">Editorial warm</option>
                  <option value="gallery_mono">Gallery mono</option>
                  <option value="midnight_launch">Midnight launch</option>
                </select>
              </label>
              <label className="field-stack">
                <span className="field-label">Accent color</span>
                <div className="color-input-row">
                  <input
                    className="color-swatch-input"
                    onChange={(event) => {
                      setNewBrandState((current) => ({
                        ...current,
                        accentColor: event.target.value
                      }));
                    }}
                    type="color"
                    value={newBrandState.accentColor}
                  />
                  <input
                    className="input-field"
                    maxLength={7}
                    onChange={(event) => {
                      setNewBrandState((current) => ({
                        ...current,
                        accentColor: event.target.value
                      }));
                    }}
                    pattern="^#[0-9a-fA-F]{6}$"
                    required
                    value={newBrandState.accentColor}
                  />
                </div>
              </label>
              <div className="pill-row">
                <Pill>
                  {settings?.workspace.slug ??
                    editorState.workspaceSlug ??
                    "workspace-slug"}
                </Pill>
                <Pill>
                  {newBrandState.brandSlug
                    ? `/brands/${newBrandState.brandSlug}`
                    : "/brands/[brandSlug]"}
                </Pill>
                <Pill>{newBrandState.themePreset.replaceAll("_", " ")}</Pill>
              </div>
              <div className="studio-action-row">
                <button
                  className="button-action"
                  disabled={
                    !canEditCurrentWorkspace ||
                    isCreatingBrand ||
                    !settings?.workspace.id
                  }
                  type="submit"
                >
                  {isCreatingBrand ? "Creating…" : "Add brand"}
                </button>
              </div>
            </fieldset>
          </form>
        </SurfaceCard>
        <SurfaceCard
          body="Workspace access now uses owner-governed invitations, active memberships, and durable audit history. Operators inherit the same workspace and brand context for day-to-day studio work, while ownership retains the high-risk settings and publication controls."
          eyebrow="Access"
          span={4}
          title="Workspace access"
        >
          <div className="pill-row">
            <Pill>{access.role}</Pill>
            <Pill>{settings?.members.length ?? 1} total members</Pill>
            <Pill>{settings?.invitations.length ?? 0} pending invites</Pill>
          </div>
          {!canManageMembers ? (
            <div className="status-banner status-banner--info">
              <strong>Operator read-only</strong>
              <span>
                Only workspace owners can create invitations or remove members.
              </span>
            </div>
          ) : null}
          {inactiveWorkspaceMessage && settings?.workspace ? (
            <div className="status-banner status-banner--info">
              <strong>Workspace read-only</strong>
              <span>{inactiveWorkspaceMessage}</span>
            </div>
          ) : null}
          {settings?.members.length ? (
            <div className="collection-item-list">
              {settings.members.map((member) => (
                <div className="collection-item-card" key={member.id}>
                  <div className="collection-item-card__copy">
                    <strong>
                      {member.userDisplayName ?? member.walletAddress}
                    </strong>
                    <span>{member.walletAddress}</span>
                    <span>
                      {member.role === "owner" ? "Owner" : "Operator"}
                      {member.addedAt
                        ? ` · added ${formatTimestamp(member.addedAt)}`
                        : ""}
                    </span>
                  </div>
                  {member.membershipId ? (
                    <div className="collection-item-card__actions">
                      <button
                        className="button-action"
                        disabled={
                          !canMutateMembers ||
                          removingMembershipId === member.membershipId
                        }
                        onClick={() => {
                          void handleRemoveMember(member);
                        }}
                        type="button"
                      >
                        {removingMembershipId === member.membershipId
                          ? "Removing…"
                          : "Remove"}
                      </button>
                    </div>
                  ) : (
                    <div className="collection-item-card__actions">
                      <Pill>Owner</Pill>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="collection-empty-state">
              No workspace members are configured yet.
            </div>
          )}
          <div className="collection-item-list">
            {settings?.invitations.length ? (
              settings.invitations.map((invitation) => (
                <div className="collection-item-card" key={invitation.id}>
                  <div className="collection-item-card__copy">
                    <strong>{invitation.walletAddress}</strong>
                    <span>
                      Pending operator invitation
                      {invitation.role === "owner" ? " owner" : ""}
                    </span>
                    <span>
                      Sent {formatTimestamp(invitation.createdAt)} · expires{" "}
                      {formatTimestamp(invitation.expiresAt)}
                    </span>
                  </div>
                  <div className="collection-item-card__actions">
                    <button
                      className="button-action"
                      disabled={
                        !canMutateMembers ||
                        cancelingInvitationId === invitation.id
                      }
                      onClick={() => {
                        void handleCancelInvitation(invitation);
                      }}
                      type="button"
                    >
                      {cancelingInvitationId === invitation.id
                        ? "Canceling…"
                        : "Cancel"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="collection-empty-state">
                No pending invitations.
              </div>
            )}
          </div>
          <form className="studio-form" onSubmit={handleCreateInvitation}>
            <fieldset disabled={!canMutateMembers || isCreatingInvitation}>
              <label className="field-stack">
                <span className="field-label">Invite operator wallet</span>
                <input
                  className="input-field"
                  onChange={(event) => {
                    setMemberState({
                      walletAddress: event.target.value
                    });
                  }}
                  placeholder="0x..."
                  required
                  value={memberState.walletAddress}
                />
              </label>
              <div className="studio-action-row">
                <button
                  className="button-action"
                  disabled={!canMutateMembers || isCreatingInvitation}
                  type="submit"
                >
                  {isCreatingInvitation ? "Inviting…" : "Send invitation"}
                </button>
              </div>
            </fieldset>
          </form>
        </SurfaceCard>
        <SurfaceCard
          body="Ownership transfer is now gated behind an explicit operator escalation request and owner review. Approval promotes the requesting operator to workspace owner, demotes the prior owner to operator, and records the full lifecycle in the workspace audit stream."
          eyebrow="Escalation"
          span={4}
          title="Role escalation"
        >
          <div className="pill-row">
            <Pill>{settings?.roleEscalationRequests.length ?? 0} requests</Pill>
            <Pill>
              {pendingRoleEscalationRequest
                ? "pending review"
                : "no pending request"}
            </Pill>
            <Pill>
              {access.role === "owner" ? "owner review" : "operator request"}
            </Pill>
          </div>
          {inactiveWorkspaceMessage && settings?.workspace ? (
            <div className="status-banner status-banner--info">
              <strong>Workspace read-only</strong>
              <span>{inactiveWorkspaceMessage}</span>
            </div>
          ) : null}
          {canRequestRoleEscalation ? (
            actorRoleEscalationRequest ? (
              <div className="collection-item-card">
                <div className="collection-item-card__copy">
                  <strong>Ownership transfer request submitted</strong>
                  <span>
                    Submitted{" "}
                    {formatTimestamp(actorRoleEscalationRequest.createdAt)}
                  </span>
                  <span>
                    {actorRoleEscalationRequest.justification ||
                      "No request note provided."}
                  </span>
                </div>
                <div className="collection-item-card__actions">
                  <button
                    className="button-action"
                    disabled={
                      !workspaceIsActive ||
                      actingRoleEscalationRequestId ===
                        actorRoleEscalationRequest.id
                    }
                    onClick={() => {
                      void handleCancelRoleEscalation(
                        actorRoleEscalationRequest
                      );
                    }}
                    type="button"
                  >
                    {actingRoleEscalationRequestId ===
                    actorRoleEscalationRequest.id
                      ? "Canceling…"
                      : "Cancel"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {pendingRoleEscalationRequest ? (
                  <div className="status-banner status-banner--info">
                    <strong>Owner review already pending</strong>
                    <span>
                      Another ownership transfer request is already open for
                      this workspace. Wait for the current request to resolve
                      before submitting a new one.
                    </span>
                  </div>
                ) : null}
                <form
                  className="studio-form"
                  onSubmit={handleRequestRoleEscalation}
                >
                  <fieldset
                    disabled={
                      !canRequestRoleEscalation ||
                      !workspaceIsActive ||
                      isRequestingRoleEscalation ||
                      Boolean(pendingRoleEscalationRequest)
                    }
                  >
                    <label className="field-stack">
                      <span className="field-label">Request note</span>
                      <textarea
                        className="input-field input-field--multiline"
                        maxLength={280}
                        onChange={(event) => {
                          setRoleEscalationJustification(event.target.value);
                        }}
                        placeholder="Explain why ownership transfer is needed and what should happen after approval."
                        rows={5}
                        value={roleEscalationJustification}
                      />
                    </label>
                    <div className="studio-action-row">
                      <button
                        className="button-action"
                        disabled={
                          !canRequestRoleEscalation ||
                          isRequestingRoleEscalation ||
                          Boolean(pendingRoleEscalationRequest)
                        }
                        type="submit"
                      >
                        {isRequestingRoleEscalation
                          ? "Submitting…"
                          : "Request ownership transfer"}
                      </button>
                    </div>
                  </fieldset>
                </form>
              </>
            )
          ) : null}
          {canManageRoleEscalations ? (
            <>
              {settings?.roleEscalationRequests.some(
                (request) => request.status === "pending"
              ) ? (
                <div className="collection-item-list">
                  {(settings?.roleEscalationRequests ?? [])
                    .filter((request) => request.status === "pending")
                    .map((request) => (
                      <div className="collection-item-card" key={request.id}>
                        <div className="collection-item-card__copy">
                          <strong>{request.targetWalletAddress}</strong>
                          <span>
                            Requested {formatTimestamp(request.createdAt)}
                          </span>
                          <span>
                            {request.justification ||
                              "No request note provided."}
                          </span>
                        </div>
                        <div className="collection-item-card__actions">
                          <button
                            className="button-action button-action--accent"
                            disabled={
                              !workspaceIsActive ||
                              actingRoleEscalationRequestId === request.id
                            }
                            onClick={() => {
                              void handleApproveRoleEscalation(request);
                            }}
                            type="button"
                          >
                            {actingRoleEscalationRequestId === request.id
                              ? "Working…"
                              : "Approve"}
                          </button>
                          <button
                            className="button-action"
                            disabled={
                              !workspaceIsActive ||
                              actingRoleEscalationRequestId === request.id
                            }
                            onClick={() => {
                              void handleRejectRoleEscalation(request);
                            }}
                            type="button"
                          >
                            {actingRoleEscalationRequestId === request.id
                              ? "Working…"
                              : "Reject"}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="collection-empty-state">
                  No pending role escalation requests.
                </div>
              )}
            </>
          ) : null}
          <div className="collection-item-list">
            {settings?.roleEscalationRequests.length ? (
              settings.roleEscalationRequests.map((request) => (
                <div className="collection-item-card" key={request.id}>
                  <div className="collection-item-card__copy">
                    <strong>
                      {request.status.replaceAll("_", " ")} ·{" "}
                      {request.targetWalletAddress}
                    </strong>
                    <span>
                      Requested {formatTimestamp(request.createdAt)}
                      {request.resolvedAt
                        ? ` · resolved ${formatTimestamp(request.resolvedAt)}`
                        : ""}
                    </span>
                    <span>
                      {request.justification || "No request note provided."}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="collection-empty-state">
                No role escalation requests have been recorded yet.
              </div>
            )}
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="Member lifecycle and ownership-transfer actions are written to the workspace audit stream so owners can trace invitation creation, invitation cancellation, acceptance, explicit member removal, and role escalation outcomes without inspecting the database."
          eyebrow="Audit"
          span={8}
          title="Member lifecycle history"
        >
          <div className="pill-row">
            <Pill>{settings?.auditEntries.length ?? 0} recent events</Pill>
            <Pill>workspace audit</Pill>
            <Link className="inline-link" href="/ops/audit">
              Open full audit
            </Link>
          </div>
          {settings?.auditEntries.length ? (
            <div className="collection-item-list">
              {settings.auditEntries.map((entry) => (
                <div className="collection-item-card" key={entry.id}>
                  <div className="collection-item-card__copy">
                    <strong>{entry.action.replaceAll("_", " ")}</strong>
                    <span>
                      Actor {entry.actorWalletAddress}
                      {entry.targetWalletAddress
                        ? ` · target ${entry.targetWalletAddress}`
                        : ""}
                    </span>
                    <span>
                      {formatTimestamp(entry.createdAt)}
                      {entry.role ? ` · role ${entry.role}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="collection-empty-state">
              No member lifecycle events have been recorded yet.
            </div>
          )}
        </SurfaceCard>
        <SurfaceCard
          body="These values become the durable publication target for the selected brand and the editorial source of truth for its public landing. Brand slug changes are still validated against existing public collection routes before they are accepted."
          eyebrow="Preview"
          span={4}
          title="Storefront preview"
        >
          <div className="settings-preview-card">
            <div
              className="settings-preview-card__swatch"
              style={{ backgroundColor: editorState.accentColor }}
            />
            <div className="settings-preview-card__copy">
              <strong>
                {editorState.wordmark || editorState.brandName || "Wordmark"}
              </strong>
              <span>{editorState.heroKicker || "Hero kicker"}</span>
              <span>{editorState.themePreset.replaceAll("_", " ")}</span>
            </div>
            <div className="settings-preview-card__copy">
              <strong>
                {editorState.landingHeadline || "Landing headline"}
              </strong>
              <span>{editorState.landingDescription}</span>
              <span>
                {editorState.featuredReleaseLabel ||
                  defaultStudioFeaturedReleaseLabel}
              </span>
            </div>
            <div className="settings-preview-card__copy">
              <strong>{editorState.storyHeadline || "Story headline"}</strong>
              <span>{editorState.storyBody || "Story body preview"}</span>
              <span>
                {editorState.primaryCtaLabel || "Primary CTA"} /{" "}
                {editorState.secondaryCtaLabel || "Secondary CTA"}
              </span>
            </div>
            <div className="settings-preview-card__copy">
              <strong>{editorState.brandName || "Brand name"}</strong>
              <span>
                {editorState.brandSlug
                  ? `/brands/${editorState.brandSlug}`
                  : "/brands/[brandSlug]"}
              </span>
              <span>
                {editorState.customDomain || "No custom domain configured"}
              </span>
            </div>
          </div>
          <div className="pill-row">
            <Pill>{editorState.workspaceSlug || "workspace-slug"}</Pill>
            <Pill>{editorState.brandSlug || "brand-slug"}</Pill>
            <Pill>{editorState.accentColor}</Pill>
            <Pill>{editorState.themePreset.replaceAll("_", " ")}</Pill>
            <Pill>
              {editorState.featuredReleaseLabel ||
                defaultStudioFeaturedReleaseLabel}
            </Pill>
          </div>
          <div className="settings-preview-links">
            <Link className="inline-link" href="/studio/collections">
              Collections publish from this profile
            </Link>
            <Link className="inline-link" href="/studio/assets">
              Generated assets still feed the same curation path
            </Link>
          </div>
        </SurfaceCard>
      </SurfaceGrid>
      {notice ? (
        <div className={`notice-banner notice-banner--${notice.tone}`}>
          {notice.message}
        </div>
      ) : null}
    </PageShell>
  );
}
