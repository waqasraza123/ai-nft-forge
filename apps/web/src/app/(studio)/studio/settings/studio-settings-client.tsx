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
  defaultWorkspaceLifecycleAutomationEnabled,
  defaultWorkspaceLifecycleDecommissionAutomationEnabled,
  defaultWorkspaceLifecycleInvitationAutomationEnabled,
  defaultWorkspaceLifecycleSlaAutomationMaxAgeMinutes,
  defaultWorkspaceLifecycleSlaEnabled,
  defaultWorkspaceLifecycleSlaWebhookFailureThreshold,
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
  studioWorkspaceInvitationReminderResponseSchema,
  studioWorkspaceInvitationResponseSchema,
  studioWorkspaceLifecycleAutomationPolicyResponseSchema,
  studioWorkspaceLifecycleSlaPolicyResponseSchema,
  workspaceLifecycleNotificationDeliveryRetryResponseSchema,
  studioWorkspaceMemberDeleteResponseSchema,
  studioWorkspaceRoleEscalationActionResponseSchema,
  studioWorkspaceRoleEscalationResponseSchema,
  studioWorkspaceStatusUpdateResponseSchema,
  workspaceDecommissionExecutionResponseSchema,
  workspaceDecommissionNotificationRecordResponseSchema,
  workspaceDecommissionResponseSchema,
  workspaceOffboardingOverviewResponseSchema,
  type StudioBrandSummary,
  type StudioSettingsSummary,
  type StudioWorkspaceDirectoryEntry,
  type StudioWorkspaceScopeSummary,
  type StudioWorkspaceInvitationSummary,
  type StudioWorkspaceLifecycleAutomationPolicy,
  type StudioWorkspaceLifecycleDeliveryPolicy,
  type StudioWorkspaceLifecycleSlaPolicy,
  type StudioWorkspaceLifecycleSlaSummary,
  type StudioWorkspaceMemberSummary,
  type StudioWorkspaceRoleEscalationSummary,
  type StudioWorkspaceRetentionPolicy,
  type StudioWorkspaceStatus,
  type WorkspaceDecommissionNotificationKind,
  type WorkspaceOffboardingEntry,
  type WorkspaceLifecycleNotificationDeliverySummary
} from "@ai-nft-forge/shared";
import {
  MetricTile,
  PageShell,
  Pill,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";

import { WorkspaceDirectoryPanel } from "../../../../components/workspace-directory-panel";
import { WorkspaceOffboardingPanel } from "../../../../components/workspace-offboarding-panel";
import { WorkspaceScopeSwitcher } from "../../../../components/workspace-scope-switcher";
import {
  StudioSettingsSectionNav,
  type StudioSettingsSectionNavItem
} from "../../../../components/studio/studio-settings-section-nav";

type StudioSettingsClientProps = {
  availableWorkspaces: StudioWorkspaceScopeSummary[];
  currentWalletAddress: string;
  currentWorkspaceSlug: string | null;
  currentWorkspaceOffboarding: WorkspaceOffboardingEntry | null;
  initialSettings: StudioSettingsSummary | null;
  ownerWalletAddress: string;
  workspaceOffboardingEntries: WorkspaceOffboardingEntry[];
  workspaceDirectoryEntries: StudioWorkspaceDirectoryEntry[];
};

type NoticeState = {
  message: string;
  tone: "error" | "info" | "success";
} | null;

type StudioBrandEditorState = {
  accentColor: string;
  automateDecommissionNotices: boolean;
  automateInvitationReminders: boolean;
  automationEnabled: boolean;
  lifecycleSlaAutomationMaxAgeMinutes: number;
  lifecycleSlaEnabled: boolean;
  lifecycleSlaWebhookFailureThreshold: number;
  brandName: string;
  brandSlug: string;
  customDomain: string;
  deliverDecommissionNotifications: boolean;
  deliverInvitationReminders: boolean;
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
  webhookEnabled: boolean;
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

function resolveWorkspaceLifecycleDeliveryPolicy(
  settings: StudioSettingsSummary | null
): StudioWorkspaceLifecycleDeliveryPolicy {
  return (
    settings?.lifecycleDeliveryPolicy ?? {
      deliverDecommissionNotifications: true,
      deliverInvitationReminders: true,
      webhookEnabled: false
    }
  );
}

function resolveWorkspaceLifecycleAutomationPolicy(
  settings: StudioSettingsSummary | null
): StudioWorkspaceLifecycleAutomationPolicy {
  return (
    settings?.lifecycleAutomationPolicy ?? {
      automateDecommissionNotices:
        defaultWorkspaceLifecycleDecommissionAutomationEnabled,
      automateInvitationReminders:
        defaultWorkspaceLifecycleInvitationAutomationEnabled,
      enabled: defaultWorkspaceLifecycleAutomationEnabled
    }
  );
}

function resolveWorkspaceLifecycleSlaPolicy(
  settings: StudioSettingsSummary | null
): StudioWorkspaceLifecycleSlaPolicy {
  return (
    settings?.lifecycleSlaPolicy ?? {
      automationMaxAgeMinutes:
        defaultWorkspaceLifecycleSlaAutomationMaxAgeMinutes,
      enabled: defaultWorkspaceLifecycleSlaEnabled,
      webhookFailureThreshold:
        defaultWorkspaceLifecycleSlaWebhookFailureThreshold
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
    automateDecommissionNotices:
      settings?.lifecycleAutomationPolicy.automateDecommissionNotices ?? true,
    automateInvitationReminders:
      settings?.lifecycleAutomationPolicy.automateInvitationReminders ?? true,
    automationEnabled: settings?.lifecycleAutomationPolicy.enabled ?? true,
    lifecycleSlaAutomationMaxAgeMinutes:
      settings?.lifecycleSlaPolicy.automationMaxAgeMinutes ??
      defaultWorkspaceLifecycleSlaAutomationMaxAgeMinutes,
    lifecycleSlaEnabled: settings?.lifecycleSlaPolicy.enabled ?? true,
    lifecycleSlaWebhookFailureThreshold:
      settings?.lifecycleSlaPolicy.webhookFailureThreshold ??
      defaultWorkspaceLifecycleSlaWebhookFailureThreshold,
    brandName: brand?.name ?? "",
    brandSlug: brand?.slug ?? "",
    customDomain: brand?.customDomain ?? "",
    deliverDecommissionNotifications:
      settings?.lifecycleDeliveryPolicy.deliverDecommissionNotifications ?? true,
    deliverInvitationReminders:
      settings?.lifecycleDeliveryPolicy.deliverInvitationReminders ?? true,
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
    webhookEnabled: settings?.lifecycleDeliveryPolicy.webhookEnabled ?? false,
    wordmark: brand?.wordmark ?? "",
    workspaceName: settings?.workspace.name ?? "",
    workspaceSlug: settings?.workspace.slug ?? ""
  };
}

function createEditorState(input: {
  brand: StudioBrandSummary | null;
  lifecycleAutomationPolicy: StudioWorkspaceLifecycleAutomationPolicy;
  retentionPolicy: StudioWorkspaceRetentionPolicy;
  lifecycleDeliveryPolicy: StudioWorkspaceLifecycleDeliveryPolicy;
  lifecycleSlaPolicy: StudioWorkspaceLifecycleSlaPolicy;
  workspace: StudioSettingsSummary["workspace"] | null;
}): StudioBrandEditorState {
  return {
    accentColor: input.brand?.accentColor ?? defaultStudioBrandAccentColor,
    automateDecommissionNotices:
      input.lifecycleAutomationPolicy.automateDecommissionNotices,
    automateInvitationReminders:
      input.lifecycleAutomationPolicy.automateInvitationReminders,
    automationEnabled: input.lifecycleAutomationPolicy.enabled,
    lifecycleSlaAutomationMaxAgeMinutes:
      input.lifecycleSlaPolicy.automationMaxAgeMinutes,
    lifecycleSlaEnabled: input.lifecycleSlaPolicy.enabled,
    lifecycleSlaWebhookFailureThreshold:
      input.lifecycleSlaPolicy.webhookFailureThreshold,
    brandName: input.brand?.name ?? "",
    brandSlug: input.brand?.slug ?? "",
    customDomain: input.brand?.customDomain ?? "",
    deliverDecommissionNotifications:
      input.lifecycleDeliveryPolicy.deliverDecommissionNotifications,
    deliverInvitationReminders:
      input.lifecycleDeliveryPolicy.deliverInvitationReminders,
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
    webhookEnabled: input.lifecycleDeliveryPolicy.webhookEnabled,
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

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

function getSlaTone(
  status: StudioWorkspaceLifecycleSlaSummary["status"] | "unreachable"
) {
  if (status === "healthy") {
    return "success";
  }

  if (status === "disabled") {
    return "info";
  }

  return "error";
}

function formatWorkspaceOffboardingCode(code: string) {
  return code.replaceAll("_", " ");
}

function formatWorkspaceInvitationStatus(
  status: StudioWorkspaceInvitationSummary["status"]
) {
  return status.replaceAll("_", " ");
}

function formatDecommissionNotificationKind(
  kind: WorkspaceDecommissionNotificationKind
) {
  return kind.replaceAll("_", " ");
}

function formatLifecycleDeliveryState(
  state: WorkspaceLifecycleNotificationDeliverySummary["deliveryState"]
) {
  return state.replaceAll("_", " ");
}

function formatLifecycleEventKind(
  kind: WorkspaceLifecycleNotificationDeliverySummary["eventKind"]
) {
  return kind.replaceAll("_", " ");
}

function formatLifecycleDeliveryChannel(
  channel: WorkspaceLifecycleNotificationDeliverySummary["deliveryChannel"]
) {
  return channel.replaceAll("_", " ");
}

function formatLifecycleProviderKey(
  key: WorkspaceLifecycleNotificationDeliverySummary["providerKey"]
) {
  if (key === "primary") {
    return "Primary webhook";
  }

  if (key === "secondary") {
    return "Secondary webhook";
  }

  return "Webhook";
}

function summarizeLifecycleDeliveries(
  deliveries: WorkspaceLifecycleNotificationDeliverySummary[]
) {
  if (deliveries.length === 0) {
    return {
      summary: "No external delivery records were created.",
      tone: "success" as const
    };
  }

  const summary = deliveries
    .map((delivery) => {
      const label =
        delivery.deliveryChannel === "audit_log"
          ? "Audit-log"
          : formatLifecycleProviderKey(delivery.providerKey);

      return `${label} ${formatLifecycleDeliveryState(delivery.deliveryState)}`;
    })
    .join(" · ");
  const tone = deliveries.some((delivery) => delivery.deliveryState === "failed")
    ? ("error" as const)
    : ("success" as const);

  return {
    summary,
    tone
  };
}

function formatDurationSeconds(value: number | null) {
  if (value === null) {
    return "n/a";
  }

  if (value < 60) {
    return `${value}s`;
  }

  const minutes = Math.floor(value / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes === 0
    ? `${hours}h`
    : `${hours}h ${remainingMinutes}m`;
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
  workspaceOffboardingEntries,
  workspaceDirectoryEntries
}: StudioSettingsClientProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [currentWorkspaceOffboardingState, setCurrentWorkspaceOffboardingState] =
    useState(currentWorkspaceOffboarding);
  const [workspaceOffboardingEntriesState, setWorkspaceOffboardingEntriesState] =
    useState(workspaceOffboardingEntries);
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
  const [isSavingLifecycleAutomationPolicy, setIsSavingLifecycleAutomationPolicy] =
    useState(false);
  const [isSavingLifecycleSlaPolicy, setIsSavingLifecycleSlaPolicy] =
    useState(false);
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
  const [isSchedulingDecommission, setIsSchedulingDecommission] =
    useState(false);
  const [isCancelingDecommission, setIsCancelingDecommission] = useState(false);
  const [isExecutingDecommission, setIsExecutingDecommission] = useState(false);
  const [recordingDecommissionNotificationKind, setRecordingDecommissionNotificationKind] =
    useState<WorkspaceDecommissionNotificationKind | null>(null);
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
  const [remindingInvitationId, setRemindingInvitationId] = useState<
    string | null
  >(null);
  const [removingMembershipId, setRemovingMembershipId] = useState<
    string | null
  >(null);
  const [retryingLifecycleDeliveryId, setRetryingLifecycleDeliveryId] =
    useState<string | null>(null);

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
  const canManageLifecycleAutomation =
    canManageWorkspace && Boolean(settings?.workspace.id);
  const canMutateMembers = canManageMembers && workspaceIsActive;
  const retentionPolicy = resolveWorkspaceRetentionPolicy(settings);
  const lifecycleDeliveryPolicy =
    resolveWorkspaceLifecycleDeliveryPolicy(settings);
  const lifecycleAutomationPolicy =
    resolveWorkspaceLifecycleAutomationPolicy(settings);
  const lifecycleSlaPolicy = resolveWorkspaceLifecycleSlaPolicy(settings);
  const lifecycleSlaSummary = settings?.lifecycleSlaSummary ?? null;
  const lifecycleAutomationHealth = settings?.lifecycleAutomationHealth ?? null;
  const lifecycleNotificationProviders =
    settings?.lifecycleNotificationProviders ?? [];
  const recentLifecycleAutomationRuns =
    settings?.recentLifecycleAutomationRuns ?? [];
  const recentLifecycleDeliveries = settings?.recentLifecycleDeliveries ?? [];
  const recentAuditLogDeliveryCount = recentLifecycleDeliveries.filter(
    (delivery) =>
      delivery.deliveryChannel === "audit_log" &&
      delivery.deliveryState === "delivered"
  ).length;
  const recentWebhookDeliveredCount = recentLifecycleDeliveries.filter(
    (delivery) =>
      delivery.deliveryChannel === "webhook" &&
      delivery.deliveryState === "delivered"
  ).length;
  const recentWebhookFailedCount = recentLifecycleDeliveries.filter(
    (delivery) =>
      delivery.deliveryChannel === "webhook" &&
      delivery.deliveryState === "failed"
  ).length;
  const recentWebhookQueuedCount = recentLifecycleDeliveries.filter(
    (delivery) =>
      delivery.deliveryChannel === "webhook" &&
      (delivery.deliveryState === "queued" ||
        delivery.deliveryState === "processing")
  ).length;
  const pendingInvitationCount =
    settings?.invitations.filter((invitation) => invitation.status !== "expired")
      .length ?? 0;
  const expiringInvitationCount =
    settings?.invitations.filter((invitation) => invitation.status === "expiring")
      .length ?? 0;
  const pendingRoleEscalationCount =
    settings?.roleEscalationRequests.filter(
      (request) => request.status === "pending"
    ).length ?? 0;
  const accessibleReadyWorkspaceCount = workspaceOffboardingEntriesState.filter(
    (entry) => entry.summary.readiness === "ready"
  ).length;
  const accessibleReviewWorkspaceCount = workspaceOffboardingEntriesState.filter(
    (entry) => entry.summary.readiness === "review_required"
  ).length;
  const accessibleBlockedWorkspaceCount = workspaceOffboardingEntriesState.filter(
    (entry) => entry.summary.readiness === "blocked"
  ).length;
  const scheduledDecommissionCount = workspaceOffboardingEntriesState.filter(
    (entry) => entry.decommission !== null
  ).length;

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
  const decommissionWorkflow =
    currentWorkspaceOffboardingState?.decommissionWorkflow ?? null;
  const exportWorkspaceId =
    currentWorkspaceOffboardingState?.workspace.id ?? settings?.workspace.id ?? null;
  const scheduledDecommissionReadyForExecution = scheduledDecommission
    ? new Date(scheduledDecommission.executeAfter).getTime() <= Date.now()
    : false;
  const workspaceAttentionCount =
    pendingInvitationCount +
    pendingRoleEscalationCount +
    recentWebhookFailedCount +
    (offboardingSummary?.blockerCodes.length ?? 0);
  const sectionNavItems: StudioSettingsSectionNavItem[] = [
    {
      href: "#workspace",
      label: "Workspace",
      meta: settings?.workspace
        ? `${formatWorkspaceStatus(settings.workspace.status)} · /${settings.workspace.slug}`
        : "Identity and control context",
      tone:
        workspaceStatus === "active"
          ? "success"
          : workspaceStatus
            ? "warning"
            : "default"
    },
    {
      href: "#brand",
      label: "Brand",
      meta: selectedBrand
        ? `${settings?.brands.length ?? 0} brands · ${selectedBrand.publicBrandPath}`
        : "Public presence and storefront profile"
    },
    {
      href: "#team",
      label: "Team",
      meta: `${settings?.members.length ?? 1} members · ${pendingInvitationCount} pending invites`,
      tone: pendingInvitationCount > 0 ? "warning" : "default"
    },
    {
      href: "#ownership",
      label: "Ownership",
      meta:
        pendingRoleEscalationCount > 0
          ? `${pendingRoleEscalationCount} request pending review`
          : access.role === "owner"
            ? "Owner review lane"
            : "Operator request lane",
      tone: pendingRoleEscalationCount > 0 ? "critical" : "default"
    },
    {
      href: "#lifecycle",
      label: "Lifecycle",
      meta: `${lifecycleAutomationHealth?.status ?? "unreachable"} automation · ${lifecycleSlaSummary?.status ?? "unreachable"} SLA`,
      tone:
        lifecycleAutomationHealth?.status === "healthy" &&
        lifecycleSlaSummary?.status === "healthy"
          ? "success"
          : recentWebhookFailedCount > 0
            ? "critical"
            : "warning"
    },
    {
      href: "#retention",
      label: "Retention",
      meta: offboardingSummary
        ? `${formatWorkspaceOffboardingCode(offboardingSummary.readiness)} · ${
            scheduledDecommission ? "schedule active" : "review open"
          }`
        : "Archive readiness and decommission",
      tone:
        offboardingSummary?.readiness === "ready"
          ? "success"
          : offboardingSummary?.readiness === "blocked"
            ? "critical"
            : "warning"
    },
    {
      href: "#estate",
      label: "Estate",
      meta: `${workspaceDirectoryEntries.length} accessible workspaces`,
      tone: accessibleBlockedWorkspaceCount > 0 ? "warning" : "default"
    },
    {
      href: "#audit",
      label: "Audit",
      meta: `${settings?.auditEntries.length ?? 0} recent events`
    }
  ];

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
        lifecycleAutomationPolicy:
          resolveWorkspaceLifecycleAutomationPolicy(settings),
        lifecycleDeliveryPolicy:
          resolveWorkspaceLifecycleDeliveryPolicy(settings),
        lifecycleSlaPolicy: resolveWorkspaceLifecycleSlaPolicy(settings),
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
          setWorkspaceOffboardingEntriesState(offboardingResult.overview.workspaces);
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
          lifecycleAutomationPolicy: {
            automateDecommissionNotices:
              editorState.automateDecommissionNotices,
            automateInvitationReminders:
              editorState.automateInvitationReminders,
            enabled: editorState.automationEnabled
          },
          lifecycleSlaPolicy: {
            automationMaxAgeMinutes:
              editorState.lifecycleSlaAutomationMaxAgeMinutes,
            enabled: editorState.lifecycleSlaEnabled,
            webhookFailureThreshold:
              editorState.lifecycleSlaWebhookFailureThreshold
          },
          lifecycleDeliveryPolicy: {
            deliverDecommissionNotifications:
              editorState.deliverDecommissionNotifications,
            deliverInvitationReminders:
              editorState.deliverInvitationReminders,
            webhookEnabled: editorState.webhookEnabled
          },
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

  async function handleSaveLifecycleAutomationPolicy() {
    if (!settings?.workspace.id || !canManageLifecycleAutomation) {
      setNotice({
        message:
          settings?.workspace.id
            ? "Only workspace owners can change lifecycle automation."
            : "Choose a workspace before changing lifecycle automation.",
        tone: "error"
      });
      return;
    }

    setIsSavingLifecycleAutomationPolicy(true);
    setNotice({
      message: "Saving lifecycle automation policy…",
      tone: "info"
    });

    try {
      await parseJsonResponse({
        response: await fetch(
          `/api/studio/workspaces/${settings.workspace.id}/lifecycle-automation-policy`,
          {
            body: JSON.stringify({
              automateDecommissionNotices:
                editorState.automateDecommissionNotices,
              automateInvitationReminders:
                editorState.automateInvitationReminders,
              enabled: editorState.automationEnabled
            }),
            headers: {
              "Content-Type": "application/json"
            },
            method: "PUT"
          }
        ),
        schema: studioWorkspaceLifecycleAutomationPolicyResponseSchema
      });
      await refreshSettings({
        silent: true
      });
      setNotice({
        message: "Lifecycle automation policy saved.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Lifecycle automation policy could not be saved.",
        tone: "error"
      });
    } finally {
      setIsSavingLifecycleAutomationPolicy(false);
    }
  }

  async function handleSaveLifecycleSlaPolicy() {
    if (!settings?.workspace.id || !canManageLifecycleAutomation) {
      setNotice({
        message:
          settings?.workspace.id
            ? "Only workspace owners can change lifecycle SLA policy."
            : "Choose a workspace before changing lifecycle SLA policy.",
        tone: "error"
      });
      return;
    }

    setIsSavingLifecycleSlaPolicy(true);
    setNotice({
      message: "Saving lifecycle SLA policy…",
      tone: "info"
    });

    try {
      await parseJsonResponse({
        response: await fetch(
          `/api/studio/workspaces/${settings.workspace.id}/lifecycle-sla-policy`,
          {
            body: JSON.stringify({
              automationMaxAgeMinutes:
                editorState.lifecycleSlaAutomationMaxAgeMinutes,
              enabled: editorState.lifecycleSlaEnabled,
              webhookFailureThreshold:
                editorState.lifecycleSlaWebhookFailureThreshold
            }),
            headers: {
              "Content-Type": "application/json"
            },
            method: "PUT"
          }
        ),
        schema: studioWorkspaceLifecycleSlaPolicyResponseSchema
      });
      await refreshSettings({
        silent: true
      });
      setNotice({
        message: "Lifecycle SLA policy saved.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Lifecycle SLA policy could not be saved.",
        tone: "error"
      });
    } finally {
      setIsSavingLifecycleSlaPolicy(false);
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

  async function handleRemindInvitation(
    invitation: StudioWorkspaceInvitationSummary
  ) {
    if (!canManageMembers || !workspaceIsActive) {
      return;
    }

    setRemindingInvitationId(invitation.id);
    setNotice({
      message: `Recording reminder for ${invitation.walletAddress}…`,
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/settings/invitations/${invitation.id}`,
        {
          method: "POST"
        }
      );
      const payload = await parseJsonResponse({
        response,
        schema: studioWorkspaceInvitationReminderResponseSchema
      });
      const deliveryResult = summarizeLifecycleDeliveries(payload.deliveries);

      startTransition(() => {
        setSettings((currentSettings) => {
          if (!currentSettings) {
            return currentSettings;
          }

          return {
            ...currentSettings,
            invitations: currentSettings.invitations.map((currentInvitation) =>
              currentInvitation.id === invitation.id
                ? payload.invitation
                : currentInvitation
            )
          };
        });
      });
      setNotice({
        message: `Reminder recorded for ${payload.invitation.walletAddress}. ${deliveryResult.summary}.`,
        tone: deliveryResult.tone
      });
      await refreshSettings({
        silent: true
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Workspace invitation reminder could not be recorded.",
        tone: "error"
      });
    } finally {
      setRemindingInvitationId(null);
    }
  }

  async function handleRecordDecommissionNotification(
    kind: WorkspaceDecommissionNotificationKind
  ) {
    if (!canManageWorkspace || !settings?.workspace.id) {
      setNotice({
        message:
          inactiveWorkspaceMessage ??
          "Only workspace owners can record decommission notifications.",
        tone: "error"
      });
      return;
    }

    setRecordingDecommissionNotificationKind(kind);
    setNotice({
      message: `Recording ${formatDecommissionNotificationKind(kind)} decommission notice…`,
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/workspaces/${settings.workspace.id}/decommission/notifications`,
        {
          body: JSON.stringify({
            kind
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        }
      );
      const payload = await parseJsonResponse({
        response,
        schema: workspaceDecommissionNotificationRecordResponseSchema
      });
      const deliveryResult = summarizeLifecycleDeliveries(payload.deliveries);

      setNotice({
        message: `${formatDecommissionNotificationKind(kind)} decommission notice recorded. ${deliveryResult.summary}.`,
        tone: deliveryResult.tone
      });
      await refreshSettings({
        silent: true
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Decommission notification could not be recorded.",
        tone: "error"
      });
    } finally {
      setRecordingDecommissionNotificationKind(null);
    }
  }

  async function handleRetryLifecycleDelivery(
    delivery: WorkspaceLifecycleNotificationDeliverySummary
  ) {
    if (!canManageWorkspace || !settings?.workspace.id) {
      setNotice({
        message: "Only workspace owners can retry lifecycle deliveries.",
        tone: "error"
      });
      return;
    }

    setRetryingLifecycleDeliveryId(delivery.id);
    setNotice({
      message: `Retrying ${formatLifecycleEventKind(delivery.eventKind)} delivery…`,
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/workspaces/${settings.workspace.id}/lifecycle-deliveries/${delivery.id}/retry`,
        {
          method: "POST"
        }
      );
      const payload = await parseJsonResponse({
        response,
        schema: workspaceLifecycleNotificationDeliveryRetryResponseSchema
      });

      setNotice({
        message:
          payload.delivery.deliveryState === "queued" ||
          payload.delivery.deliveryState === "processing"
            ? `${formatLifecycleEventKind(payload.delivery.eventKind)} delivery requeued.`
            : `${formatLifecycleEventKind(payload.delivery.eventKind)} delivery is ${formatLifecycleDeliveryState(
                payload.delivery.deliveryState
              )}.`,
        tone:
          payload.delivery.deliveryState === "failed" ? "error" : "success"
      });
      await refreshSettings({
        silent: true
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Lifecycle delivery could not be retried.",
        tone: "error"
      });
    } finally {
      setRetryingLifecycleDeliveryId(null);
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
      title="Workspace administration cockpit"
      lead="Operate workspace identity, public brand profile, team access, lifecycle policy, retention, offboarding, and recent governance history from one workspace-scoped control room."
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
          <Link className="inline-link" href="/studio/commerce">
            Open commerce
          </Link>
        </>
      }
      tone="studio"
    >
      <div className="studio-settings-cockpit">
        {notice ? (
          <div className={`notice-banner notice-banner--${notice.tone}`}>
            {notice.message}
          </div>
        ) : null}
        <div className="studio-settings-hero-band">
          <section className="studio-settings-hero-card">
            <div className="studio-settings-hero-card__copy">
              <span className="studio-settings-hero-card__eyebrow">
                Workspace control context
              </span>
              <h2 className="studio-settings-hero-card__title">
                {settings?.workspace.name ?? "Select or provision a workspace"}
              </h2>
              <p className="studio-settings-hero-card__lead">
                This cockpit keeps identity, governance, public presence, team
                access, lifecycle posture, retention, and offboarding visible in
                one workspace-native administration surface.
              </p>
            </div>
            <div className="studio-settings-hero-card__signals">
              <article
                className={`studio-settings-signal-card studio-settings-signal-card--${
                  workspaceStatus === "active"
                    ? "success"
                    : workspaceStatus
                      ? "warning"
                      : "default"
                }`}
              >
                <span className="studio-settings-signal-card__label">
                  Workspace
                </span>
                <strong>
                  {workspaceStatus
                    ? formatWorkspaceStatus(workspaceStatus)
                    : "Unconfigured"}
                </strong>
                <span>
                  {settings?.workspace.slug
                    ? `/${settings.workspace.slug}`
                    : "Create or select a workspace to unlock scoped administration."}
                </span>
              </article>
              <article
                className={`studio-settings-signal-card studio-settings-signal-card--${
                  offboardingSummary?.readiness === "ready"
                    ? "success"
                    : offboardingSummary?.readiness === "blocked"
                      ? "critical"
                      : offboardingSummary?.readiness
                        ? "warning"
                        : "default"
                }`}
              >
                <span className="studio-settings-signal-card__label">
                  Offboarding readiness
                </span>
                <strong>
                  {offboardingSummary
                    ? formatWorkspaceOffboardingCode(
                        offboardingSummary.readiness
                      )
                    : "Pending"}
                </strong>
                <span>
                  {offboardingSummary
                    ? `${offboardingSummary.blockerCodes.length} blockers · ${offboardingSummary.cautionCodes.length} cautions`
                    : "Load archive-readiness and export state for this workspace."}
                </span>
              </article>
              <article
                className={`studio-settings-signal-card studio-settings-signal-card--${
                  workspaceAttentionCount > 0 ? "warning" : "success"
                }`}
              >
                <span className="studio-settings-signal-card__label">
                  Attention queue
                </span>
                <strong>{workspaceAttentionCount}</strong>
                <span>
                  {pendingInvitationCount} invites · {pendingRoleEscalationCount}{" "}
                  ownership requests · {recentWebhookFailedCount} failed
                  deliveries
                </span>
              </article>
              <article
                className={`studio-settings-signal-card studio-settings-signal-card--${
                  lifecycleAutomationHealth?.status === "healthy" &&
                  lifecycleSlaSummary?.status === "healthy"
                    ? "success"
                    : recentWebhookFailedCount > 0
                      ? "critical"
                      : "warning"
                }`}
              >
                <span className="studio-settings-signal-card__label">
                  Lifecycle posture
                </span>
                <strong>
                  {lifecycleAutomationHealth?.status ?? "unreachable"} /{" "}
                  {lifecycleSlaSummary?.status ?? "unreachable"}
                </strong>
                <span>
                  {recentLifecycleDeliveries.length} recent deliveries ·{" "}
                  {recentLifecycleAutomationRuns.length} recent automation runs
                </span>
              </article>
            </div>
            <div className="metric-list">
              <MetricTile label="Owner" value={resolvedOwnerWalletAddress} />
              <MetricTile label="Current actor" value={currentWalletAddress} />
              <MetricTile label="Role" value={access.role} />
              <MetricTile
                label="Primary brand"
                value={selectedBrand?.slug ?? "Unconfigured"}
              />
              <MetricTile
                label="Public path"
                value={selectedBrand?.publicBrandPath ?? "/brands/[brandSlug]"}
              />
              <MetricTile
                label="Members"
                value={(settings?.members.length ?? 1).toString()}
              />
              <MetricTile
                label="Pending invites"
                value={pendingInvitationCount.toString()}
              />
              <MetricTile
                label="Pending escalation"
                value={pendingRoleEscalationCount.toString()}
              />
            </div>
            <div className="pill-row">
              <Pill>/studio/settings</Pill>
              <Pill>{selectedBrand?.publicBrandPath ?? "/brands/[brandSlug]"}</Pill>
              <Pill>
                {selectedBrand?.customDomain ?? "No custom domain configured"}
              </Pill>
              <Pill>
                {selectedBrand?.accentColor ?? defaultStudioBrandAccentColor}
              </Pill>
              <Pill>
                {selectedBrand?.themePreset ?? defaultStudioBrandThemePreset}
              </Pill>
            </div>
            {inactiveWorkspaceMessage && settings?.workspace ? (
              <div className="status-banner status-banner--info">
                <strong>{formatWorkspaceStatus(settings.workspace.status)}</strong>
                <span>{inactiveWorkspaceMessage}</span>
              </div>
            ) : null}
          </section>
          <section className="studio-settings-hero-sidecard">
            <div className="studio-settings-hero-sidecard__header">
              <span className="studio-settings-hero-sidecard__eyebrow">
                Active workspace
              </span>
              <h3 className="studio-settings-hero-sidecard__title">
                Switch workspace scope
              </h3>
              <p className="studio-settings-hero-sidecard__lead">
                Settings stay bound to one selected workspace at a time, so team
                access, lifecycle policy, retention, and brand state always stay
                scoped.
              </p>
            </div>
            <WorkspaceScopeSwitcher
              currentWorkspaceSlug={currentWorkspaceSlug}
              workspaces={availableWorkspaces}
            />
            <div className="studio-settings-hero-sidecard__links">
              <Link className="inline-link" href="/studio/assets">
                Open assets
              </Link>
              <Link className="inline-link" href="/studio/collections">
                Open collections
              </Link>
              <Link className="inline-link" href="/studio/commerce">
                Open commerce
              </Link>
            </div>
          </section>
        </div>
        <StudioSettingsSectionNav items={sectionNavItems} />
        <div className="studio-settings-layout">
          <main className="studio-settings-main">
            <section className="studio-settings-section" id="workspace">
              <header className="studio-settings-section__header">
                <div className="studio-settings-section__copy">
                  <span className="studio-settings-section__eyebrow">
                    Workspace
                  </span>
                  <h2 className="studio-settings-section__title">
                    Identity, permissions, and control-state policy
                  </h2>
                  <p className="studio-settings-section__lead">
                    Keep workspace naming, retention defaults, delivery policy,
                    lifecycle controls, and archive-readiness visible together so
                    operators know exactly what they are administering.
                  </p>
                </div>
              </header>
              <SurfaceGrid>
                <SurfaceCard
                  body="Workspace identity, retention defaults, and lifecycle delivery policy remain saved through the existing settings contract. The layout here separates them into clearer administrative modules without changing behavior."
                  eyebrow="Workspace"
                  span={12}
                  title={
                    settings
                      ? "Workspace identity and policy"
                      : "Create workspace identity"
                  }
                >
                  {!canManageWorkspace ? (
                    <div className="status-banner status-banner--info">
                      <strong>Operator read-only</strong>
                      <span>
                        Operators can review workspace policy and identity, but
                        only workspace owners can change them.
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
                      <div className="studio-settings-form-cluster">
                        <section className="studio-settings-form-panel">
                          <div className="studio-settings-form-panel__header">
                            <h3>Workspace identity</h3>
                            <p>
                              The workspace name and slug define the current
                              administration context across Studio and Ops.
                            </p>
                          </div>
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
                        </section>
                        <section className="studio-settings-form-panel">
                          <div className="studio-settings-form-panel__header">
                            <h3>Retention defaults</h3>
                            <p>
                              These values govern future decommission schedules
                              and offboarding requirements for this workspace.
                            </p>
                          </div>
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
                        </section>
                        <section className="studio-settings-form-panel">
                          <div className="studio-settings-form-panel__header">
                            <h3>Lifecycle delivery policy</h3>
                            <p>
                              Delivery controls decide whether reminder and
                              decommission events fan out to configured webhook
                              providers in addition to the audit-log leg.
                            </p>
                          </div>
                          <label className="field-stack">
                            <span className="field-label">
                              Lifecycle webhook delivery
                            </span>
                            <select
                              className="input-field"
                              onChange={(event) => {
                                setEditorState((current) => ({
                                  ...current,
                                  webhookEnabled:
                                    event.target.value === "enabled"
                                }));
                              }}
                              value={
                                editorState.webhookEnabled
                                  ? "enabled"
                                  : "disabled"
                              }
                            >
                              <option value="disabled">Disabled</option>
                              <option value="enabled">Enabled</option>
                            </select>
                          </label>
                          <label className="field-stack">
                            <span className="field-label">
                              Invitation reminder delivery
                            </span>
                            <select
                              className="input-field"
                              disabled={!editorState.webhookEnabled}
                              onChange={(event) => {
                                setEditorState((current) => ({
                                  ...current,
                                  deliverInvitationReminders:
                                    event.target.value === "enabled"
                                }));
                              }}
                              value={
                                editorState.deliverInvitationReminders
                                  ? "enabled"
                                  : "disabled"
                              }
                            >
                              <option value="enabled">Enabled</option>
                              <option value="disabled">Disabled</option>
                            </select>
                          </label>
                          <label className="field-stack">
                            <span className="field-label">
                              Decommission notice delivery
                            </span>
                            <select
                              className="input-field"
                              disabled={!editorState.webhookEnabled}
                              onChange={(event) => {
                                setEditorState((current) => ({
                                  ...current,
                                  deliverDecommissionNotifications:
                                    event.target.value === "enabled"
                                }));
                              }}
                              value={
                                editorState.deliverDecommissionNotifications
                                  ? "enabled"
                                  : "disabled"
                              }
                            >
                              <option value="enabled">Enabled</option>
                              <option value="disabled">Disabled</option>
                            </select>
                          </label>
                          <div className="pill-row">
                            <Pill>
                              Webhook{" "}
                              {lifecycleDeliveryPolicy.webhookEnabled
                                ? "enabled"
                                : "disabled"}
                            </Pill>
                            <Pill>
                              Invites{" "}
                              {lifecycleDeliveryPolicy.deliverInvitationReminders
                                ? "enabled"
                                : "disabled"}
                            </Pill>
                            <Pill>
                              Decommission{" "}
                              {lifecycleDeliveryPolicy.deliverDecommissionNotifications
                                ? "enabled"
                                : "disabled"}
                            </Pill>
                            {lifecycleNotificationProviders.map((provider) => (
                              <Pill key={provider.key}>
                                {provider.label}{" "}
                                {provider.enabled ? "configured" : "disabled"}
                              </Pill>
                            ))}
                          </div>
                        </section>
                      </div>
                      <div className="studio-action-row">
                        <button
                          className="button-action button-action--accent"
                          disabled={!canManageWorkspace || isSaving}
                          type="submit"
                        >
                          {isSaving
                            ? "Saving…"
                            : settings
                              ? "Save workspace settings"
                              : "Create settings"}
                        </button>
                      </div>
                    </fieldset>
                  </form>
                </SurfaceCard>
                <SurfaceCard
                  body="Archive and suspend keep the workspace readable while blocking further settings, collection, commerce, and ops mutations. Reactivation restores normal write access."
                  eyebrow="Lifecycle"
                  span={6}
                  title="Workspace lifecycle"
                >
                  {!settings?.workspace ? (
                    <div className="status-banner status-banner--info">
                      <strong>No workspace selected</strong>
                      <span>
                        Create a workspace before changing lifecycle state.
                      </span>
                    </div>
                  ) : null}
                  {settings?.workspace ? (
                    <>
                      <div className="pill-row">
                        <Pill>{formatWorkspaceStatus(settings.workspace.status)}</Pill>
                        <Pill>/{settings.workspace.slug}</Pill>
                        <Pill>{access.role}</Pill>
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
                            Operators can review lifecycle state, but only
                            owners can archive, suspend, or reactivate a
                            workspace.
                          </span>
                        </div>
                      ) : null}
                      <div className="studio-action-row">
                        {settings.workspace.status === "active" ? (
                          <>
                            <button
                              className="button-action button-action--secondary"
                              disabled={
                                !canManageWorkspace ||
                                actingWorkspaceStatus !== null
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
                                !canManageWorkspace ||
                                actingWorkspaceStatus !== null
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
                              !canManageWorkspace ||
                              actingWorkspaceStatus !== null
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
                  span={6}
                  title="Export and archive review"
                >
                  {!settings?.workspace ? (
                    <div className="status-banner status-banner--info">
                      <strong>No workspace selected</strong>
                      <span>
                        Choose a workspace before exporting or reviewing archive
                        readiness.
                      </span>
                    </div>
                  ) : null}
                  {offboardingSummary ? (
                    <>
                      <div className="pill-row">
                        <Pill>
                          {formatWorkspaceOffboardingCode(
                            offboardingSummary.readiness
                          )}
                        </Pill>
                        <Pill>
                          {offboardingSummary.openCheckoutCount} open checkouts
                        </Pill>
                        <Pill>
                          {offboardingSummary.activeAlertCount} active alerts
                        </Pill>
                        <Pill>
                          {offboardingSummary.openReconciliationIssueCount} open
                          reconciliation
                        </Pill>
                      </div>
                      {offboardingSummary.blockerCodes.length ? (
                        <div className="status-banner status-banner--error">
                          <strong>Archive blocked</strong>
                          <span>
                            Resolve{" "}
                            {offboardingSummary.blockerCodes
                              .map(formatWorkspaceOffboardingCode)
                              .join(", ")}{" "}
                            before offboarding this workspace.
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
                              .join(", ")}{" "}
                            before final offboarding.
                          </span>
                        </div>
                      ) : null}
                      {!offboardingSummary.blockerCodes.length &&
                      !offboardingSummary.cautionCodes.length ? (
                        <div className="status-banner status-banner--success">
                          <strong>Archive-ready</strong>
                          <span>
                            No active operational blockers are currently
                            attached to this workspace.
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
                            Operators can review archive readiness, but only
                            owners can export workspace data.
                          </span>
                        </div>
                      )}
                    </>
                  ) : null}
                </SurfaceCard>
              </SurfaceGrid>
            </section>

            <section className="studio-settings-section" id="brand">
              <header className="studio-settings-section__header">
                <div className="studio-settings-section__copy">
                  <span className="studio-settings-section__eyebrow">
                    Brand
                  </span>
                  <h2 className="studio-settings-section__title">
                    Public presence and storefront profile
                  </h2>
                  <p className="studio-settings-section__lead">
                    Keep the selected brand’s path, voice, theme, and editorial
                    copy together so publication always points to an explicit,
                    trustworthy target.
                  </p>
                </div>
              </header>
              <SurfaceGrid>
                <SurfaceCard
                  body="Brand configuration still uses the same studio settings contract and publication target rules. The form is now organized as one brand brief rather than a generic settings dump."
                  eyebrow="Brand profile"
                  span={8}
                  title={settings ? "Selected brand public presence" : "Create brand profile"}
                >
                  {!canManageWorkspace ? (
                    <div className="status-banner status-banner--info">
                      <strong>Operator read-only</strong>
                      <span>
                        Operators can review brand configuration, but only
                        workspace owners can change it.
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
                      <div className="studio-settings-form-cluster">
                        <section className="studio-settings-form-panel">
                          <div className="studio-settings-form-panel__header">
                            <h3>Brand routing</h3>
                            <p>
                              Choose which brand you are editing and keep its
                              durable public path aligned with collections.
                            </p>
                          </div>
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
                              <option value="editorial_warm">
                                Editorial warm
                              </option>
                              <option value="gallery_mono">
                                Gallery mono
                              </option>
                              <option value="midnight_launch">
                                Midnight launch
                              </option>
                            </select>
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
                        </section>
                        <section className="studio-settings-form-panel">
                          <div className="studio-settings-form-panel__header">
                            <h3>Landing narrative</h3>
                            <p>
                              These fields shape how the public brand route
                              frames published collection releases.
                            </p>
                          </div>
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
                            <span className="field-label">
                              Landing description
                            </span>
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
                        </section>
                        <section className="studio-settings-form-panel">
                          <div className="studio-settings-form-panel__header">
                            <h3>Storefront actions</h3>
                            <p>
                              Keep featured release language and CTA labels
                              aligned with the current brand voice.
                            </p>
                          </div>
                          <label className="field-stack">
                            <span className="field-label">
                              Featured release label
                            </span>
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
                            <span className="field-label">
                              Primary CTA label
                            </span>
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
                            <span className="field-label">
                              Secondary CTA label
                            </span>
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
                          <div className="pill-row">
                            <Pill>
                              {editorState.brandSlug
                                ? `/brands/${editorState.brandSlug}`
                                : "/brands/[brandSlug]"}
                            </Pill>
                            <Pill>
                              {editorState.customDomain ||
                                "No custom domain configured"}
                            </Pill>
                            <Pill>{editorState.themePreset.replaceAll("_", " ")}</Pill>
                          </div>
                        </section>
                      </div>
                      <div className="studio-action-row">
                        <button
                          className="button-action button-action--accent"
                          disabled={!canManageWorkspace || isSaving}
                          type="submit"
                        >
                          {isSaving
                            ? "Saving…"
                            : settings
                              ? "Save brand profile"
                              : "Create settings"}
                        </button>
                      </div>
                    </fieldset>
                  </form>
                </SurfaceCard>
                <SurfaceCard
                  body="These values become the durable publication target for the selected brand and the editorial source of truth for its public landing."
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
                      <strong>
                        {editorState.storyHeadline || "Story headline"}
                      </strong>
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
                        {editorState.customDomain ||
                          "No custom domain configured"}
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
                <SurfaceCard
                  body="Add an additional publication brand under the same owner workspace. New brands start with a minimal storefront profile and can then be refined in the main editor."
                  eyebrow="Brands"
                  span={12}
                  title="Create brand"
                >
                  {!canManageWorkspace ? (
                    <div className="status-banner status-banner--info">
                      <strong>Owner action required</strong>
                      <span>
                        Only workspace owners can create additional brands.
                      </span>
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
                      <div className="studio-settings-form-cluster">
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
                            <option value="editorial_warm">
                              Editorial warm
                            </option>
                            <option value="gallery_mono">Gallery mono</option>
                            <option value="midnight_launch">
                              Midnight launch
                            </option>
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
                      </div>
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
              </SurfaceGrid>
            </section>

            <section className="studio-settings-section" id="team">
              <header className="studio-settings-section__header">
                <div className="studio-settings-section__copy">
                  <span className="studio-settings-section__eyebrow">Team</span>
                  <h2 className="studio-settings-section__title">
                    Member access and invitation queue
                  </h2>
                  <p className="studio-settings-section__lead">
                    Separate the current operator roster from pending invitations
                    so owners can quickly see who already has access and what
                    still needs action.
                  </p>
                </div>
              </header>
              <SurfaceGrid>
                <SurfaceCard
                  body="Workspace members inherit the same workspace and brand context for day-to-day studio work, while ownership retains high-risk settings and publication controls."
                  eyebrow="Members"
                  span={6}
                  title="Team access"
                >
                  <div className="pill-row">
                    <Pill>{access.role}</Pill>
                    <Pill>{settings?.members.length ?? 1} total members</Pill>
                  </div>
                  {!canManageMembers ? (
                    <div className="status-banner status-banner--info">
                      <strong>Operator read-only</strong>
                      <span>
                        Only workspace owners can remove members.
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
                </SurfaceCard>
                <SurfaceCard
                  body="Invitation records stay durable so owners can distinguish active, expiring, and expired rows, log reminders, and cancel outstanding access before offboarding."
                  eyebrow="Invitations"
                  span={6}
                  title="Invitation queue"
                >
                  <div className="pill-row">
                    <Pill>{pendingInvitationCount} pending invites</Pill>
                    <Pill>{expiringInvitationCount} expiring</Pill>
                    <Pill>
                      {settings?.invitations.length ?? 0} total invitation rows
                    </Pill>
                  </div>
                  {!canManageMembers ? (
                    <div className="status-banner status-banner--info">
                      <strong>Operator read-only</strong>
                      <span>
                        Only workspace owners can create invitations, log
                        reminders, or cancel invitations.
                      </span>
                    </div>
                  ) : null}
                  {inactiveWorkspaceMessage && settings?.workspace ? (
                    <div className="status-banner status-banner--info">
                      <strong>Workspace read-only</strong>
                      <span>{inactiveWorkspaceMessage}</span>
                    </div>
                  ) : null}
                  <div className="collection-item-list">
                    {settings?.invitations.length ? (
                      settings.invitations.map((invitation) => (
                        <div className="collection-item-card" key={invitation.id}>
                          <div className="collection-item-card__copy">
                            <strong>{invitation.walletAddress}</strong>
                            <span>
                              {formatWorkspaceInvitationStatus(
                                invitation.status
                              )}{" "}
                              operator invitation
                              {invitation.role === "owner" ? " owner" : ""}
                            </span>
                            <span>
                              Sent {formatTimestamp(invitation.createdAt)} ·
                              expires {formatTimestamp(invitation.expiresAt)}
                            </span>
                            <span>
                              {invitation.reminderCount} reminder
                              {invitation.reminderCount === 1 ? "" : "s"}
                              {invitation.lastRemindedAt
                                ? ` · last reminder ${formatTimestamp(
                                    invitation.lastRemindedAt
                                  )}`
                                : ""}
                            </span>
                          </div>
                          <div className="collection-item-card__actions">
                            <button
                              className="button-action button-action--secondary"
                              disabled={
                                !canMutateMembers ||
                                invitation.status === "expired" ||
                                remindingInvitationId === invitation.id ||
                                cancelingInvitationId === invitation.id
                              }
                              onClick={() => {
                                void handleRemindInvitation(invitation);
                              }}
                              type="button"
                            >
                              {remindingInvitationId === invitation.id
                                ? "Recording…"
                                : "Record reminder"}
                            </button>
                            <button
                              className="button-action"
                              disabled={
                                !canMutateMembers ||
                                remindingInvitationId === invitation.id ||
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
                        <span className="field-label">
                          Invite operator wallet
                        </span>
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
              </SurfaceGrid>
            </section>

            <section className="studio-settings-section" id="ownership">
              <header className="studio-settings-section__header">
                <div className="studio-settings-section__copy">
                  <span className="studio-settings-section__eyebrow">
                    Ownership
                  </span>
                  <h2 className="studio-settings-section__title">
                    Ownership transfer and role-escalation control lane
                  </h2>
                  <p className="studio-settings-section__lead">
                    Keep ownership-sensitive actions in one explicit review lane
                    so operators understand when they can request transfer and
                    owners can act with full context.
                  </p>
                </div>
              </header>
              <SurfaceGrid>
                <SurfaceCard
                  body="Ownership transfer stays gated behind an explicit operator escalation request and owner review. Approval promotes the requesting operator to owner, demotes the prior owner to operator, and records the full lifecycle in the audit stream."
                  eyebrow="Escalation"
                  span={12}
                  title="Role escalation"
                >
                  <div className="pill-row">
                    <Pill>
                      {settings?.roleEscalationRequests.length ?? 0} requests
                    </Pill>
                    <Pill>
                      {pendingRoleEscalationRequest
                        ? "pending review"
                        : "no pending request"}
                    </Pill>
                    <Pill>
                      {access.role === "owner"
                        ? "owner review"
                        : "operator request"}
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
                          <strong>
                            Ownership transfer request submitted
                          </strong>
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
                              Another ownership transfer request is already open
                              for this workspace. Wait for the current request
                              to resolve before submitting a new one.
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
                                  setRoleEscalationJustification(
                                    event.target.value
                                  );
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
                              <div
                                className="collection-item-card"
                                key={request.id}
                              >
                                <div className="collection-item-card__copy">
                                  <strong>{request.targetWalletAddress}</strong>
                                  <span>
                                    Requested{" "}
                                    {formatTimestamp(request.createdAt)}
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
                                      actingRoleEscalationRequestId ===
                                        request.id
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
                                      actingRoleEscalationRequestId ===
                                        request.id
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
                                ? ` · resolved ${formatTimestamp(
                                    request.resolvedAt
                                  )}`
                                : ""}
                            </span>
                            <span>
                              {request.justification ||
                                "No request note provided."}
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
              </SurfaceGrid>
            </section>

            <section className="studio-settings-section" id="lifecycle">
              <header className="studio-settings-section__header">
                <div className="studio-settings-section__copy">
                  <span className="studio-settings-section__eyebrow">
                    Lifecycle
                  </span>
                  <h2 className="studio-settings-section__title">
                    Automation, SLA, and delivery health
                  </h2>
                  <p className="studio-settings-section__lead">
                    Treat reminder scheduling, notice workflows, SLA posture,
                    and provider delivery as policy modules instead of loose
                    controls.
                  </p>
                </div>
              </header>
              <SurfaceGrid>
                <SurfaceCard
                  body="Lifecycle automation decides whether the worker should auto-record invitation reminders and decommission notices for this workspace. Delivery transport stays separate below."
                  eyebrow={
                    lifecycleAutomationPolicy.enabled
                      ? "Automation on"
                      : "Automation off"
                  }
                  span={4}
                  title="Lifecycle automation policy"
                >
                  {!canManageWorkspace ? (
                    <div className="status-banner status-banner--info">
                      <strong>Operator read-only</strong>
                      <span>
                        Operators can review lifecycle automation, but only
                        workspace owners can change it.
                      </span>
                    </div>
                  ) : null}
                  {!settings?.workspace ? (
                    <div className="status-banner status-banner--info">
                      <strong>No workspace selected</strong>
                      <span>
                        Choose a workspace before changing lifecycle automation.
                      </span>
                    </div>
                  ) : (
                    <form
                      className="studio-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleSaveLifecycleAutomationPolicy();
                      }}
                    >
                      <fieldset
                        disabled={
                          !canManageLifecycleAutomation ||
                          isSavingLifecycleAutomationPolicy
                        }
                      >
                        <label className="field-stack">
                          <span className="field-label">Automation status</span>
                          <select
                            className="input-field"
                            onChange={(event) => {
                              setEditorState((current) => ({
                                ...current,
                                automationEnabled:
                                  event.target.value === "enabled"
                              }));
                            }}
                            value={
                              editorState.automationEnabled
                                ? "enabled"
                                : "disabled"
                            }
                          >
                            <option value="enabled">Enabled</option>
                            <option value="disabled">Disabled</option>
                          </select>
                        </label>
                        <label className="field-stack">
                          <span className="field-label">
                            Invitation reminder automation
                          </span>
                          <select
                            className="input-field"
                            disabled={!editorState.automationEnabled}
                            onChange={(event) => {
                              setEditorState((current) => ({
                                ...current,
                                automateInvitationReminders:
                                  event.target.value === "enabled"
                              }));
                            }}
                            value={
                              editorState.automateInvitationReminders
                                ? "enabled"
                                : "disabled"
                            }
                          >
                            <option value="enabled">Enabled</option>
                            <option value="disabled">Disabled</option>
                          </select>
                        </label>
                        <label className="field-stack">
                          <span className="field-label">
                            Decommission notice automation
                          </span>
                          <select
                            className="input-field"
                            disabled={!editorState.automationEnabled}
                            onChange={(event) => {
                              setEditorState((current) => ({
                                ...current,
                                automateDecommissionNotices:
                                  event.target.value === "enabled"
                              }));
                            }}
                            value={
                              editorState.automateDecommissionNotices
                                ? "enabled"
                                : "disabled"
                            }
                          >
                            <option value="enabled">Enabled</option>
                            <option value="disabled">Disabled</option>
                          </select>
                        </label>
                        <div className="pill-row">
                          <Pill>
                            Current{" "}
                            {lifecycleAutomationPolicy.enabled
                              ? "enabled"
                              : "disabled"}
                          </Pill>
                          <Pill>
                            Invites{" "}
                            {lifecycleAutomationPolicy.automateInvitationReminders
                              ? "enabled"
                              : "disabled"}
                          </Pill>
                          <Pill>
                            Decommission{" "}
                            {lifecycleAutomationPolicy.automateDecommissionNotices
                              ? "enabled"
                              : "disabled"}
                          </Pill>
                        </div>
                        <button className="button-action" type="submit">
                          {isSavingLifecycleAutomationPolicy
                            ? "Saving…"
                            : "Save lifecycle automation"}
                        </button>
                      </fieldset>
                    </form>
                  )}
                </SurfaceCard>
                <SurfaceCard
                  body="Workspace SLA policy turns lifecycle automation health and webhook delivery failures into an explicit owner-controlled threshold instead of relying on ad hoc review."
                  eyebrow={lifecycleSlaSummary?.status ?? "unreachable"}
                  span={4}
                  title="Lifecycle SLA policy"
                >
                  {!canManageWorkspace ? (
                    <div className="status-banner status-banner--info">
                      <strong>Operator read-only</strong>
                      <span>
                        Operators can review lifecycle SLA state, but only
                        workspace owners can change it.
                      </span>
                    </div>
                  ) : null}
                  {!settings?.workspace ? (
                    <div className="status-banner status-banner--info">
                      <strong>No workspace selected</strong>
                      <span>
                        Choose a workspace before changing lifecycle SLA policy.
                      </span>
                    </div>
                  ) : (
                    <form
                      className="studio-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleSaveLifecycleSlaPolicy();
                      }}
                    >
                      <fieldset
                        disabled={
                          !canManageLifecycleAutomation ||
                          isSavingLifecycleSlaPolicy
                        }
                      >
                        <label className="field-stack">
                          <span className="field-label">SLA monitoring</span>
                          <select
                            className="input-field"
                            onChange={(event) => {
                              setEditorState((current) => ({
                                ...current,
                                lifecycleSlaEnabled:
                                  event.target.value === "enabled"
                              }));
                            }}
                            value={
                              editorState.lifecycleSlaEnabled
                                ? "enabled"
                                : "disabled"
                            }
                          >
                            <option value="enabled">Enabled</option>
                            <option value="disabled">Disabled</option>
                          </select>
                        </label>
                        <label className="field-stack">
                          <span className="field-label">
                            Automation max age (minutes)
                          </span>
                          <input
                            className="input-field"
                            min={5}
                            onChange={(event) => {
                              const value = Number(event.target.value);

                              setEditorState((current) => ({
                                ...current,
                                lifecycleSlaAutomationMaxAgeMinutes:
                                  Number.isFinite(value)
                                    ? value
                                    : current.lifecycleSlaAutomationMaxAgeMinutes
                              }));
                            }}
                            step={1}
                            type="number"
                            value={editorState.lifecycleSlaAutomationMaxAgeMinutes}
                          />
                        </label>
                        <label className="field-stack">
                          <span className="field-label">
                            Webhook failure threshold
                          </span>
                          <input
                            className="input-field"
                            min={1}
                            onChange={(event) => {
                              const value = Number(event.target.value);

                              setEditorState((current) => ({
                                ...current,
                                lifecycleSlaWebhookFailureThreshold:
                                  Number.isFinite(value)
                                    ? value
                                    : current.lifecycleSlaWebhookFailureThreshold
                              }));
                            }}
                            step={1}
                            type="number"
                            value={editorState.lifecycleSlaWebhookFailureThreshold}
                          />
                        </label>
                        <div
                          className={`status-banner status-banner--${getSlaTone(
                            lifecycleSlaSummary?.status ?? "unreachable"
                          )}`}
                        >
                          <strong>
                            {lifecycleSlaSummary?.status ?? "unreachable"}
                          </strong>
                          <span>
                            {lifecycleSlaSummary?.message ??
                              "Lifecycle SLA summary is not available on this service instance."}
                          </span>
                        </div>
                        <div className="pill-row">
                          <Pill>
                            Current{" "}
                            {lifecycleSlaPolicy.enabled ? "enabled" : "disabled"}
                          </Pill>
                          <Pill>
                            Max age {lifecycleSlaPolicy.automationMaxAgeMinutes}m
                          </Pill>
                          <Pill>
                            Failure threshold{" "}
                            {lifecycleSlaPolicy.webhookFailureThreshold}
                          </Pill>
                          <Pill>
                            Failed webhooks{" "}
                            {lifecycleSlaSummary?.failedWebhookCount ?? 0}
                          </Pill>
                          <Pill>
                            Last automation{" "}
                            {formatTimestamp(
                              lifecycleSlaSummary?.lastAutomationRunAt ?? null
                            ) ?? "n/a"}
                          </Pill>
                        </div>
                        {lifecycleSlaSummary?.reasonCodes.length ? (
                          <div className="pill-row">
                            {lifecycleSlaSummary.reasonCodes.map((reasonCode) => (
                              <Pill key={reasonCode}>
                                {formatStatus(reasonCode)}
                              </Pill>
                            ))}
                          </div>
                        ) : null}
                        <button className="button-action" type="submit">
                          {isSavingLifecycleSlaPolicy
                            ? "Saving…"
                            : "Save lifecycle SLA"}
                        </button>
                      </fieldset>
                    </form>
                  )}
                </SurfaceCard>
                <SurfaceCard
                  body={
                    lifecycleAutomationHealth
                      ? "Reminder and decommission-notice automation persists durable run history so owners and operators can see whether the lease-protected schedule is actually healthy."
                      : "Lifecycle automation health is only available after workspace settings load."
                  }
                  eyebrow={lifecycleAutomationHealth?.status ?? "unreachable"}
                  span={4}
                  title="Lifecycle automation health"
                >
                  {lifecycleAutomationHealth ? (
                    <div className="stack-md">
                      <div
                        className={`status-banner status-banner--${
                          lifecycleAutomationHealth.status === "healthy"
                            ? "success"
                            : lifecycleAutomationHealth.status === "warning" ||
                                lifecycleAutomationHealth.status === "stale" ||
                                lifecycleAutomationHealth.status === "unreachable"
                              ? "error"
                              : "info"
                        }`}
                      >
                        <strong>{lifecycleAutomationHealth.status}</strong>
                        <span>{lifecycleAutomationHealth.message}</span>
                      </div>
                      <div className="pill-row">
                        <Pill>
                          {lifecycleAutomationHealth.enabled
                            ? "Scheduler enabled"
                            : "Manual only"}
                        </Pill>
                        <Pill>
                          Interval{" "}
                          {formatDurationSeconds(
                            lifecycleAutomationHealth.intervalSeconds
                          )}
                        </Pill>
                        <Pill>
                          Jitter{" "}
                          {formatDurationSeconds(
                            lifecycleAutomationHealth.jitterSeconds
                          )}
                        </Pill>
                        <Pill>
                          Lock TTL{" "}
                          {formatDurationSeconds(
                            lifecycleAutomationHealth.lockTtlSeconds
                          )}
                        </Pill>
                        <Pill>
                          Last run{" "}
                          {lifecycleAutomationHealth.lastRunAgeSeconds !== null
                            ? `${formatDurationSeconds(
                                lifecycleAutomationHealth.lastRunAgeSeconds
                              )} ago`
                            : "n/a"}
                        </Pill>
                      </div>
                      <div className="collection-item-list">
                        {recentLifecycleAutomationRuns.length ? (
                          recentLifecycleAutomationRuns.map((run) => (
                            <div className="collection-item-card" key={run.id}>
                              <div className="collection-item-card__copy">
                                <strong>
                                  {formatStatus(run.status)} · {run.triggerSource}
                                </strong>
                                <span>
                                  Started{" "}
                                  {formatTimestamp(run.startedAt) ?? "Not set"}
                                  {run.completedAt
                                    ? ` · completed ${
                                        formatTimestamp(run.completedAt) ??
                                        "Not set"
                                      }`
                                    : ""}
                                </span>
                                <span>
                                  {run.workspaceCount} workspace
                                  {run.workspaceCount === 1 ? "" : "s"} ·{" "}
                                  {run.invitationReminderCount} invite reminder
                                  {run.invitationReminderCount === 1 ? "" : "s"} ·{" "}
                                  {run.decommissionNoticeCount} decommission
                                  notice
                                  {run.decommissionNoticeCount === 1 ? "" : "s"}
                                </span>
                                <span>
                                  Audit-log {run.auditLogDeliveryCount} ·
                                  webhook queued {run.webhookQueuedCount} ·
                                  failures {run.failedWorkspaceCount}
                                  {run.failureMessage
                                    ? ` · ${run.failureMessage}`
                                    : ""}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="collection-empty-state">
                            No lifecycle automation runs have been recorded yet.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </SurfaceCard>
                <SurfaceCard
                  body="Lifecycle delivery records show the mandatory audit-log leg plus one record per configured webhook provider for invitation reminders and decommission notices. Delivery stays worker-owned and provider-agnostic."
                  eyebrow="Lifecycle delivery"
                  span={12}
                  title="Lifecycle delivery health"
                >
                  {!settings?.workspace ? (
                    <div className="status-banner status-banner--info">
                      <strong>No workspace selected</strong>
                      <span>
                        Choose a workspace before reviewing lifecycle delivery
                        state.
                      </span>
                    </div>
                  ) : (
                    <div className="stack-md">
                      <div className="pill-row">
                        <Pill>
                          Audit-log delivered {recentAuditLogDeliveryCount}
                        </Pill>
                        <Pill>
                          Webhook delivered {recentWebhookDeliveredCount}
                        </Pill>
                        <Pill>Webhook failed {recentWebhookFailedCount}</Pill>
                        <Pill>Webhook queued {recentWebhookQueuedCount}</Pill>
                        <Pill>
                          Webhook{" "}
                          {lifecycleDeliveryPolicy.webhookEnabled
                            ? "enabled"
                            : "disabled"}
                        </Pill>
                        <Pill>
                          Invites{" "}
                          {lifecycleDeliveryPolicy.deliverInvitationReminders
                            ? "enabled"
                            : "disabled"}
                        </Pill>
                        <Pill>
                          Decommission{" "}
                          {lifecycleDeliveryPolicy.deliverDecommissionNotifications
                            ? "enabled"
                            : "disabled"}
                        </Pill>
                        {lifecycleNotificationProviders.map((provider) => (
                          <Pill key={provider.key}>
                            {provider.label}{" "}
                            {provider.enabled ? "configured" : "disabled"}
                          </Pill>
                        ))}
                      </div>
                      <div className="collection-item-list">
                        {recentLifecycleDeliveries.length ? (
                          recentLifecycleDeliveries.map((delivery) => (
                            <div className="collection-item-card" key={delivery.id}>
                              <div className="collection-item-card__copy">
                                <strong>
                                  {formatLifecycleEventKind(delivery.eventKind)}
                                </strong>
                                <span>
                                  {formatLifecycleDeliveryChannel(
                                    delivery.deliveryChannel
                                  )}{" "}
                                  ·{" "}
                                  {delivery.deliveryChannel === "webhook"
                                    ? `${formatLifecycleProviderKey(
                                        delivery.providerKey
                                      )} · `
                                    : ""}
                                  {formatLifecycleDeliveryState(
                                    delivery.deliveryState
                                  )}{" "}
                                  ·{" "}
                                  {formatTimestamp(delivery.eventOccurredAt) ??
                                    "No event time"}
                                </span>
                                <span>
                                  {delivery.invitationWalletAddress
                                    ? `Invitation ${delivery.invitationWalletAddress}`
                                    : delivery.decommissionNotificationKind
                                      ? `${formatDecommissionNotificationKind(
                                          delivery.decommissionNotificationKind
                                        )} decommission notice`
                                      : "Lifecycle delivery"}
                                </span>
                                <span>
                                  {delivery.attemptCount} attempt
                                  {delivery.attemptCount === 1 ? "" : "s"}
                                  {delivery.failureMessage
                                    ? ` · ${delivery.failureMessage}`
                                    : ""}
                                </span>
                              </div>
                              <div className="collection-item-card__actions">
                                <Pill>{delivery.deliveryState}</Pill>
                                <button
                                  className="button-action button-action--secondary"
                                  disabled={
                                    !canManageWorkspace ||
                                    delivery.deliveryChannel !== "webhook" ||
                                    retryingLifecycleDeliveryId === delivery.id ||
                                    (delivery.deliveryState !== "failed" &&
                                      delivery.deliveryState !== "skipped")
                                  }
                                  onClick={() => {
                                    void handleRetryLifecycleDelivery(delivery);
                                  }}
                                  type="button"
                                >
                                  {retryingLifecycleDeliveryId === delivery.id
                                    ? "Retrying…"
                                    : "Retry"}
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="collection-empty-state">
                            No lifecycle deliveries have been recorded yet.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </SurfaceCard>
              </SurfaceGrid>
            </section>

            <section className="studio-settings-section" id="retention">
              <header className="studio-settings-section__header">
                <div className="studio-settings-section__copy">
                  <span className="studio-settings-section__eyebrow">
                    Retention
                  </span>
                  <h2 className="studio-settings-section__title">
                    Archive readiness and decommission execution
                  </h2>
                  <p className="studio-settings-section__lead">
                    Keep current workspace offboarding review and permanent
                    decommission controls close together so the retention story
                    is easy to understand before any irreversible action.
                  </p>
                </div>
              </header>
              <SurfaceGrid>
                <SurfaceCard
                  body="Current workspace offboarding review combines workspace-native access signals with workspace-scoped commerce and ops blockers so owners can understand what still blocks final archive or export."
                  eyebrow="Readiness"
                  span={4}
                  title="Current workspace offboarding"
                >
                  {!currentWorkspaceOffboardingState ? (
                    <div className="status-banner status-banner--info">
                      <strong>No workspace offboarding data</strong>
                      <span>
                        Select a workspace to review its current archive and
                        export posture.
                      </span>
                    </div>
                  ) : (
                    <div className="stack-md">
                      <div className="pill-row">
                        <Pill>
                          {formatWorkspaceOffboardingCode(
                            currentWorkspaceOffboardingState.summary.readiness
                          )}
                        </Pill>
                        <Pill>
                          {
                            currentWorkspaceOffboardingState.summary
                              .pendingInvitationCount
                          }{" "}
                          pending invites
                        </Pill>
                        <Pill>
                          {
                            currentWorkspaceOffboardingState.summary
                              .pendingRoleEscalationCount
                          }{" "}
                          pending escalations
                        </Pill>
                        <Pill>
                          {
                            currentWorkspaceOffboardingState.summary
                              .livePublicationCount
                          }{" "}
                          live releases
                        </Pill>
                      </div>
                      {currentWorkspaceOffboardingState.summary.blockerCodes
                        .length ? (
                        <div className="status-banner status-banner--error">
                          <strong>Blocked</strong>
                          <span>
                            {currentWorkspaceOffboardingState.summary.blockerCodes
                              .map(formatWorkspaceOffboardingCode)
                              .join(", ")}
                          </span>
                        </div>
                      ) : null}
                      {currentWorkspaceOffboardingState.summary.cautionCodes
                        .length ? (
                        <div className="status-banner status-banner--info">
                          <strong>Review cues</strong>
                          <span>
                            {currentWorkspaceOffboardingState.summary.cautionCodes
                              .map(formatWorkspaceOffboardingCode)
                              .join(", ")}
                          </span>
                        </div>
                      ) : null}
                      <div className="pill-row">
                        <Pill>
                          {currentWorkspaceOffboardingState.lifecycleDelivery.failedCount}{" "}
                          failed lifecycle deliveries
                        </Pill>
                        <Pill>
                          {
                            currentWorkspaceOffboardingState.lifecycleDelivery
                              .deliveredCount
                          }{" "}
                          delivered
                        </Pill>
                        <Pill>
                          SLA{" "}
                          {formatStatus(
                            currentWorkspaceOffboardingState.lifecycleSlaSummary
                              .status
                          )}
                        </Pill>
                      </div>
                    </div>
                  )}
                </SurfaceCard>
                <SurfaceCard
                  body="Decommission permanently removes the workspace and its workspace-scoped data after a retention window. Policy defaults and minimums are workspace-owned, execution is owner-only, and final cleanup only unlocks after archive plus a clean offboarding review."
                  eyebrow="Decommission"
                  span={8}
                  title="Decommission workspace"
                >
                  {!settings?.workspace ? (
                    <div className="status-banner status-banner--info">
                      <strong>No workspace selected</strong>
                      <span>
                        Choose a workspace before scheduling a decommission
                        window.
                      </span>
                    </div>
                  ) : null}
                  {settings?.workspace ? (
                    <div className="stack-md">
                      {!canManageWorkspace ? (
                        <div className="status-banner status-banner--info">
                          <strong>Owner only</strong>
                          <span>
                            Operators can review retention state, but only
                            owners can schedule, cancel, or execute workspace
                            decommission.
                          </span>
                        </div>
                      ) : null}
                      <div className="pill-row">
                        <Pill>
                          Default {retentionPolicy.defaultDecommissionRetentionDays}{" "}
                          days
                        </Pill>
                        <Pill>
                          Minimum {retentionPolicy.minimumDecommissionRetentionDays}{" "}
                          days
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
                              {scheduledDecommission.retentionDays} day
                              retention
                            </Pill>
                            <Pill>
                              {decommissionWorkflow?.notificationCount ?? 0}{" "}
                              notices
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
                          {decommissionWorkflow?.latestNotification ? (
                            <div className="status-banner">
                              <strong>Latest notice recorded</strong>
                              <span>
                                {formatDecommissionNotificationKind(
                                  decommissionWorkflow.latestNotification.kind
                                )}{" "}
                                at{" "}
                                {formatDecommissionDateTime(
                                  decommissionWorkflow.latestNotification.sentAt
                                )}
                                .
                              </span>
                            </div>
                          ) : null}
                          {decommissionWorkflow?.nextDueKind ? (
                            <div className="status-banner status-banner--info">
                              <strong>Notice due</strong>
                              <span>
                                Record the{" "}
                                {formatDecommissionNotificationKind(
                                  decommissionWorkflow.nextDueKind
                                )}{" "}
                                notice for this decommission workflow.
                              </span>
                            </div>
                          ) : null}
                          {canManageWorkspace &&
                          decommissionWorkflow?.nextDueKind ? (
                            <button
                              className="button-action button-action--secondary"
                              disabled={
                                Boolean(recordingDecommissionNotificationKind) ||
                                isCancelingDecommission ||
                                isExecutingDecommission
                              }
                              onClick={() => {
                                void handleRecordDecommissionNotification(
                                  decommissionWorkflow.nextDueKind!
                                );
                              }}
                              type="button"
                            >
                              {recordingDecommissionNotificationKind ===
                              decommissionWorkflow.nextDueKind
                                ? "Recording notice…"
                                : `Record ${formatDecommissionNotificationKind(
                                    decommissionWorkflow.nextDueKind!
                                  )} notice`}
                            </button>
                          ) : null}
                          <label
                            className="field-label"
                            htmlFor="decommission-execute-slug"
                          >
                            Confirm workspace slug to execute
                          </label>
                          <input
                            className="text-input"
                            id="decommission-execute-slug"
                            onChange={(event) => {
                              const value = event.target.value;

                              setWorkspaceDecommissionFormState(
                                (currentState) => ({
                                  ...currentState,
                                  executeConfirmWorkspaceSlug: value
                                })
                              );
                            }}
                            placeholder={settings.workspace.slug}
                            type="text"
                            value={
                              workspaceDecommissionFormState.executeConfirmWorkspaceSlug
                            }
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
                            Archive the workspace before you can schedule
                            permanent decommission.
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
                            Decommission unlocks only after this workspace
                            reaches a ready offboarding state.
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
                          <label
                            className="field-label"
                            htmlFor="decommission-retention"
                          >
                            Retention window
                          </label>
                          <input
                            className="text-input"
                            id="decommission-retention"
                            max={365}
                            min={retentionPolicy.minimumDecommissionRetentionDays}
                            onChange={(event) => {
                              const value = Number(event.target.value);

                              setWorkspaceDecommissionFormState(
                                (currentState) => ({
                                  ...currentState,
                                  retentionDays: value
                                })
                              );
                            }}
                            required
                            type="number"
                            value={workspaceDecommissionFormState.retentionDays}
                          />
                          <p className="surface-card__body-copy">
                            Default policy:{" "}
                            {retentionPolicy.defaultDecommissionRetentionDays}{" "}
                            day(s). Minimum allowed:{" "}
                            {retentionPolicy.minimumDecommissionRetentionDays}{" "}
                            day(s).
                          </p>
                          <label className="field-label" htmlFor="decommission-slug">
                            Confirm workspace slug
                          </label>
                          <input
                            className="text-input"
                            id="decommission-slug"
                            onChange={(event) => {
                              const value = event.target.value;

                              setWorkspaceDecommissionFormState(
                                (currentState) => ({
                                  ...currentState,
                                  confirmWorkspaceSlug: value
                                })
                              );
                            }}
                            placeholder={settings.workspace.slug}
                            type="text"
                            value={
                              workspaceDecommissionFormState.confirmWorkspaceSlug
                            }
                          />
                          <label
                            className="field-label"
                            htmlFor="decommission-reason"
                          >
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

                              setWorkspaceDecommissionFormState(
                                (currentState) => ({
                                  ...currentState,
                                  reason: value
                                })
                              );
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
              </SurfaceGrid>
            </section>

            <section className="studio-settings-section" id="estate">
              <header className="studio-settings-section__header">
                <div className="studio-settings-section__copy">
                  <span className="studio-settings-section__eyebrow">Estate</span>
                  <h2 className="studio-settings-section__title">
                    Workspace directory and administrative estate review
                  </h2>
                  <p className="studio-settings-section__lead">
                    Keep the accessible workspace estate visible alongside
                    provisioning and offboarding review so the current workspace
                    fits into a broader operational picture.
                  </p>
                </div>
              </header>
              <SurfaceGrid>
                <WorkspaceDirectoryPanel
                  body="This directory is built from workspace-native brands, members, invitations, role-escalation requests, and audit history so the accessible estate is visible without depending on owner-anchored collection or commerce data."
                  entries={workspaceDirectoryEntries}
                  eyebrow="Workspace directory"
                  span={8}
                  title="Accessible workspace estate"
                />
                <SurfaceCard
                  body="Workspace provisioning bootstraps a fresh workspace plus its first brand in one owner-only action, then hands the authenticated selection over to that new workspace immediately."
                  eyebrow="Provisioning"
                  span={4}
                  title="Create workspace"
                >
                  {!canManageWorkspace ? (
                    <div className="status-banner status-banner--info">
                      <strong>Owner only</strong>
                      <span>
                        Operators can review the workspace estate, but only
                        owners can provision another workspace.
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
                          <option value="midnight_launch">
                            Midnight launch
                          </option>
                        </select>
                      </label>
                      <div className="studio-action-row">
                        <button className="button-action" type="submit">
                          {isCreatingWorkspace
                            ? "Provisioning…"
                            : "Create workspace"}
                        </button>
                        <Link className="inline-link" href="/studio/commerce/fleet">
                          Open commerce fleet
                        </Link>
                      </div>
                    </fieldset>
                  </form>
                </SurfaceCard>
                <WorkspaceOffboardingPanel
                  body="Estate-wide offboarding review keeps readiness, lifecycle, delivery, retention, and scheduled decommission state visible across all accessible workspaces without changing any offboarding behavior."
                  entries={workspaceOffboardingEntriesState}
                  eyebrow="Estate retention"
                  span={12}
                  title="Workspace offboarding estate"
                />
              </SurfaceGrid>
            </section>

            <section className="studio-settings-section" id="audit">
              <header className="studio-settings-section__header">
                <div className="studio-settings-section__copy">
                  <span className="studio-settings-section__eyebrow">Audit</span>
                  <h2 className="studio-settings-section__title">
                    Recent member lifecycle history
                  </h2>
                  <p className="studio-settings-section__lead">
                    Keep invitation, membership, ownership, and decommission
                    actions visible without letting the audit stream dominate the
                    page.
                  </p>
                </div>
              </header>
              <SurfaceGrid>
                <SurfaceCard
                  body="Member lifecycle and ownership-transfer actions are written to the workspace audit stream so owners can trace invitation creation, cancellation, acceptance, member removal, and role escalation outcomes without inspecting the database."
                  eyebrow="Audit"
                  span={12}
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
              </SurfaceGrid>
            </section>
          </main>

          <aside className="studio-settings-rail">
            <article className="studio-settings-rail-card">
              <span className="studio-settings-rail-card__eyebrow">
                Control context
              </span>
              <h3 className="studio-settings-rail-card__title">
                Current workspace frame
              </h3>
              <p className="studio-settings-rail-card__body">
                {settings?.workspace.name ?? "No workspace selected"} is running
                in {access.role} view with {availableWorkspaces.length} accessible
                workspace{availableWorkspaces.length === 1 ? "" : "s"}.
              </p>
              <div className="pill-row">
                <Pill>
                  {workspaceStatus
                    ? formatWorkspaceStatus(workspaceStatus)
                    : "unconfigured"}
                </Pill>
                <Pill>{settings?.workspace.slug ?? "no-workspace"}</Pill>
                <Pill>{access.role}</Pill>
              </div>
              {canManageWorkspace && exportWorkspaceId ? (
                <div className="studio-settings-rail-card__actions">
                  <Link
                    className="inline-link"
                    href={`/api/studio/workspaces/${exportWorkspaceId}/export?format=json`}
                  >
                    Export JSON
                  </Link>
                  <Link
                    className="inline-link"
                    href={`/api/studio/workspaces/${exportWorkspaceId}/export?format=csv`}
                  >
                    Export CSV
                  </Link>
                </div>
              ) : null}
            </article>
            <article className="studio-settings-rail-card">
              <span className="studio-settings-rail-card__eyebrow">
                Attention queue
              </span>
              <h3 className="studio-settings-rail-card__title">
                Current workspace signals
              </h3>
              <div className="metric-list metric-list--single-column">
                <MetricTile
                  label="Pending invites"
                  value={pendingInvitationCount.toString()}
                />
                <MetricTile
                  label="Pending ownership review"
                  value={pendingRoleEscalationCount.toString()}
                />
                <MetricTile
                  label="Failed deliveries"
                  value={recentWebhookFailedCount.toString()}
                />
                <MetricTile
                  label="Archive blockers"
                  value={(offboardingSummary?.blockerCodes.length ?? 0).toString()}
                />
              </div>
              {offboardingSummary?.blockerCodes.length ? (
                <div className="status-banner status-banner--error">
                  <strong>Resolve blockers</strong>
                  <span>
                    {offboardingSummary.blockerCodes
                      .map(formatWorkspaceOffboardingCode)
                      .join(", ")}
                  </span>
                </div>
              ) : null}
            </article>
            <article className="studio-settings-rail-card">
              <span className="studio-settings-rail-card__eyebrow">
                Lifecycle posture
              </span>
              <h3 className="studio-settings-rail-card__title">
                Automation and SLA
              </h3>
              <p className="studio-settings-rail-card__body">
                {lifecycleAutomationHealth?.message ??
                  "Automation health is unavailable."}
              </p>
              <div className="pill-row">
                <Pill>{lifecycleAutomationHealth?.status ?? "unreachable"}</Pill>
                <Pill>{lifecycleSlaSummary?.status ?? "unreachable"}</Pill>
                <Pill>Failed webhooks {recentWebhookFailedCount}</Pill>
              </div>
              <div
                className={`status-banner status-banner--${getSlaTone(
                  lifecycleSlaSummary?.status ?? "unreachable"
                )}`}
              >
                <strong>{lifecycleSlaSummary?.status ?? "unreachable"}</strong>
                <span>
                  {lifecycleSlaSummary?.message ??
                    "Lifecycle SLA summary is not available."}
                </span>
              </div>
            </article>
            <article className="studio-settings-rail-card">
              <span className="studio-settings-rail-card__eyebrow">
                Estate posture
              </span>
              <h3 className="studio-settings-rail-card__title">
                Accessible workspace estate
              </h3>
              <div className="metric-list metric-list--single-column">
                <MetricTile
                  label="Ready"
                  value={accessibleReadyWorkspaceCount.toString()}
                />
                <MetricTile
                  label="Review required"
                  value={accessibleReviewWorkspaceCount.toString()}
                />
                <MetricTile
                  label="Blocked"
                  value={accessibleBlockedWorkspaceCount.toString()}
                />
                <MetricTile
                  label="Scheduled decommissions"
                  value={scheduledDecommissionCount.toString()}
                />
              </div>
            </article>
            <article className="studio-settings-rail-card">
              <span className="studio-settings-rail-card__eyebrow">
                Public presence
              </span>
              <h3 className="studio-settings-rail-card__title">
                Selected brand target
              </h3>
              <p className="studio-settings-rail-card__body">
                {(selectedBrand?.name ?? editorState.brandName) || "Brand"} routes
                to{" "}
                {selectedBrand?.publicBrandPath ??
                  `/brands/${editorState.brandSlug || "[brandSlug]"}`}
                {selectedBrand?.customDomain
                  ? ` and currently maps to ${selectedBrand.customDomain}.`
                  : "."}
              </p>
              <div className="pill-row">
                <Pill>
                  {selectedBrand?.themePreset ?? editorState.themePreset}
                </Pill>
                <Pill>
                  {selectedBrand?.accentColor ?? editorState.accentColor}
                </Pill>
              </div>
            </article>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
