"use client";

import { useRouter } from "next/navigation";
import {
  startTransition,
  type FormEvent,
  type ReactNode,
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
  ActionButton,
  ActionLink,
  ActionRow,
  EmptyState as SettingsEmptyState,
  FormPanel,
  FieldLabel,
  FieldStack,
  MetricTile,
  PanelHeading as SettingsPanelHeading,
  PageShell,
  Pill,
  RailCard as SettingsRailCard,
  InputField,
  RecordActions as SettingsRecordActions,
  RecordCard as SettingsRecordCard,
  RecordCopy as SettingsRecordCopy,
  RecordList as SettingsRecordList,
  SectionHeading as SettingsSectionHeading,
  SignalCard as SettingsSignalCard,
  SelectField,
  SurfaceCard,
  SurfaceGrid,
  StatusBanner,
  TextAreaField,
  cn
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

type StatusBannerTone = "error" | "info" | "success" | "warning";

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
      settings?.lifecycleDeliveryPolicy.deliverDecommissionNotifications ??
      true,
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

function createInitialWorkspaceDecommissionFormState(input: {
  retentionPolicy: StudioWorkspaceRetentionPolicy;
  workspaceSlug: string | null;
}): WorkspaceDecommissionFormState {
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
  const tone = deliveries.some(
    (delivery) => delivery.deliveryState === "failed"
  )
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

function SettingsStatusMessage(input: {
  children: ReactNode;
  tone?: StatusBannerTone;
  title: string;
}) {
  return (
    <StatusBanner className="flex flex-col gap-1.5" tone={input.tone ?? "info"}>
      <strong>{input.title}</strong>
      <span>{input.children}</span>
    </StatusBanner>
  );
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
  const [
    currentWorkspaceOffboardingState,
    setCurrentWorkspaceOffboardingState
  ] = useState(currentWorkspaceOffboarding);
  const [
    workspaceOffboardingEntriesState,
    setWorkspaceOffboardingEntriesState
  ] = useState(workspaceOffboardingEntries);
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
      createInitialWorkspaceDecommissionFormState({
        retentionPolicy: resolveWorkspaceRetentionPolicy(initialSettings),
        workspaceSlug: initialSettings?.workspace.slug ?? null
      })
    );
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [
    isSavingLifecycleAutomationPolicy,
    setIsSavingLifecycleAutomationPolicy
  ] = useState(false);
  const [isSavingLifecycleSlaPolicy, setIsSavingLifecycleSlaPolicy] =
    useState(false);
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [isCreatingInvitation, setIsCreatingInvitation] = useState(false);
  const [isSchedulingDecommission, setIsSchedulingDecommission] =
    useState(false);
  const [isCancelingDecommission, setIsCancelingDecommission] = useState(false);
  const [isExecutingDecommission, setIsExecutingDecommission] = useState(false);
  const [
    recordingDecommissionNotificationKind,
    setRecordingDecommissionNotificationKind
  ] = useState<WorkspaceDecommissionNotificationKind | null>(null);
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
    settings?.invitations.filter(
      (invitation) => invitation.status !== "expired"
    ).length ?? 0;
  const expiringInvitationCount =
    settings?.invitations.filter(
      (invitation) => invitation.status === "expiring"
    ).length ?? 0;
  const pendingRoleEscalationCount =
    settings?.roleEscalationRequests.filter(
      (request) => request.status === "pending"
    ).length ?? 0;
  const accessibleReadyWorkspaceCount = workspaceOffboardingEntriesState.filter(
    (entry) => entry.summary.readiness === "ready"
  ).length;
  const accessibleReviewWorkspaceCount =
    workspaceOffboardingEntriesState.filter(
      (entry) => entry.summary.readiness === "review_required"
    ).length;
  const accessibleBlockedWorkspaceCount =
    workspaceOffboardingEntriesState.filter(
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
  const offboardingSummary = currentWorkspaceOffboardingState?.summary ?? null;
  const scheduledDecommission =
    currentWorkspaceOffboardingState?.decommission ?? null;
  const decommissionWorkflow =
    currentWorkspaceOffboardingState?.decommissionWorkflow ?? null;
  const exportWorkspaceId =
    currentWorkspaceOffboardingState?.workspace.id ??
    settings?.workspace.id ??
    null;
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
          setWorkspaceOffboardingEntriesState(
            offboardingResult.overview.workspaces
          );
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
            deliverInvitationReminders: editorState.deliverInvitationReminders,
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
        message: settings?.workspace.id
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
        message: settings?.workspace.id
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
          inactiveWorkspaceMessage ?? "Only workspace owners can add brands.",
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
        tone: payload.delivery.deliveryState === "failed" ? "error" : "success"
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
        <ActionRow compact>
          <ActionButton
            disabled={isRefreshing}
            onClick={() => {
              void refreshSettings();
            }}
            tone="accent"
            type="button"
          >
            {isRefreshing ? "Refreshing…" : "Refresh data"}
          </ActionButton>
          <ActionLink href="/studio/collections" tone="action">
            Open collections
          </ActionLink>
          <ActionLink href="/studio/commerce" tone="inline">
            Open commerce
          </ActionLink>
        </ActionRow>
      }
      tone="studio"
    >
      <div className="space-y-6">
        {notice ? (
          <SettingsStatusMessage
            title={formatStatus(notice.tone)}
            tone={notice.tone}
          >
            {notice.message}
          </SettingsStatusMessage>
        ) : null}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.95fr)]">
          <section className="space-y-5 rounded-[28px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-surface)] md:p-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
                Workspace control context
              </span>
              <h2 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight text-[color:var(--color-text)]">
                {settings?.workspace.name ?? "Select or provision a workspace"}
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
                This cockpit keeps identity, governance, public presence, team
                access, lifecycle posture, retention, and offboarding visible in
                one workspace-native administration surface.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SettingsSignalCard
                detail={
                  settings?.workspace.slug
                    ? `/${settings.workspace.slug}`
                    : "Create or select a workspace to unlock scoped administration."
                }
                label="Workspace"
                tone={
                  workspaceStatus === "active"
                    ? "success"
                    : workspaceStatus
                      ? "warning"
                      : "default"
                }
                value={
                  workspaceStatus
                    ? formatWorkspaceStatus(workspaceStatus)
                    : "Unconfigured"
                }
              />
              <SettingsSignalCard
                detail={
                  offboardingSummary
                    ? `${offboardingSummary.blockerCodes.length} blockers · ${offboardingSummary.cautionCodes.length} cautions`
                    : "Load archive-readiness and export state for this workspace."
                }
                label="Offboarding readiness"
                tone={
                  offboardingSummary?.readiness === "ready"
                    ? "success"
                    : offboardingSummary?.readiness === "blocked"
                      ? "critical"
                      : offboardingSummary?.readiness
                        ? "warning"
                        : "default"
                }
                value={
                  offboardingSummary
                    ? formatWorkspaceOffboardingCode(
                        offboardingSummary.readiness
                      )
                    : "Pending"
                }
              />
              <SettingsSignalCard
                detail={`${pendingInvitationCount} invites · ${pendingRoleEscalationCount} ownership requests · ${recentWebhookFailedCount} failed deliveries`}
                label="Attention queue"
                tone={workspaceAttentionCount > 0 ? "warning" : "success"}
                value={workspaceAttentionCount.toString()}
              />
              <SettingsSignalCard
                detail={`${recentLifecycleDeliveries.length} recent deliveries · ${recentLifecycleAutomationRuns.length} recent automation runs`}
                label="Lifecycle posture"
                tone={
                  lifecycleAutomationHealth?.status === "healthy" &&
                  lifecycleSlaSummary?.status === "healthy"
                    ? "success"
                    : recentWebhookFailedCount > 0
                      ? "critical"
                      : "warning"
                }
                value={`${lifecycleAutomationHealth?.status ?? "unreachable"} / ${lifecycleSlaSummary?.status ?? "unreachable"}`}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            <ActionRow compact>
              <Pill>/studio/settings</Pill>
              <Pill>
                {selectedBrand?.publicBrandPath ?? "/brands/[brandSlug]"}
              </Pill>
              <Pill>
                {selectedBrand?.customDomain ?? "No custom domain configured"}
              </Pill>
              <Pill>
                {selectedBrand?.accentColor ?? defaultStudioBrandAccentColor}
              </Pill>
              <Pill>
                {selectedBrand?.themePreset ?? defaultStudioBrandThemePreset}
              </Pill>
            </ActionRow>
            {inactiveWorkspaceMessage && settings?.workspace ? (
              <SettingsStatusMessage
                title={formatWorkspaceStatus(settings.workspace.status)}
              >
                {inactiveWorkspaceMessage}
              </SettingsStatusMessage>
            ) : null}
          </section>
          <section className="space-y-4 rounded-[28px] border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-surface)] md:p-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
                Active workspace
              </span>
              <h3 className="font-[var(--font-display)] text-2xl font-semibold text-[color:var(--color-text)]">
                Switch workspace scope
              </h3>
              <p className="text-sm leading-7 text-[color:var(--color-muted)]">
                Settings stay bound to one selected workspace at a time, so team
                access, lifecycle policy, retention, and brand state always stay
                scoped.
              </p>
            </div>
            <WorkspaceScopeSwitcher
              currentWorkspaceSlug={currentWorkspaceSlug}
              workspaces={availableWorkspaces}
            />
            <ActionRow>
              <ActionLink href="/studio/assets" tone="inline">
                Open assets
              </ActionLink>
              <ActionLink href="/studio/collections" tone="inline">
                Open collections
              </ActionLink>
              <ActionLink href="/studio/commerce" tone="inline">
                Open commerce
              </ActionLink>
            </ActionRow>
          </section>
        </div>
        <StudioSettingsSectionNav items={sectionNavItems} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
          <main className="space-y-8">
            <section className="space-y-4 scroll-mt-28" id="workspace">
              <SettingsSectionHeading
                eyebrow="Workspace"
                lead="Keep workspace naming, retention defaults, delivery policy, lifecycle controls, and archive-readiness visible together so operators know exactly what they are administering."
                title="Identity, permissions, and control-state policy"
              />
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
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>Operator read-only</strong>
                      <span>
                        Operators can review workspace policy and identity, but
                        only workspace owners can change them.
                      </span>
                    </div>
                  ) : null}
                  {inactiveWorkspaceMessage && settings?.workspace ? (
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>Workspace read-only</strong>
                      <span>{inactiveWorkspaceMessage}</span>
                    </div>
                  ) : null}
                  <form className="space-y-4" onSubmit={handleSaveSettings}>
                    <fieldset disabled={!canEditCurrentWorkspace || isSaving}>
                      <div className="grid gap-4 xl:grid-cols-3">
                        <FormPanel>
                          <SettingsPanelHeading
                            lead="The workspace name and slug define the current administration context across Studio and Ops."
                            title="Workspace identity"
                          />
                          <FieldStack>
                            <FieldLabel>Workspace name</FieldLabel>
                            <InputField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </FieldStack>
                          <FieldStack>
                            <FieldLabel>Workspace slug</FieldLabel>
                            <InputField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </FieldStack>
                        </FormPanel>
                        <FormPanel>
                          <SettingsPanelHeading
                            lead="These values govern future decommission schedules and offboarding requirements for this workspace."
                            title="Retention defaults"
                          />
                          <FieldStack>
                            <FieldLabel>
                              Default decommission retention
                            </FieldLabel>
                            <InputField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                              value={
                                editorState.defaultDecommissionRetentionDays
                              }
                            />
                          </FieldStack>
                          <FieldStack>
                            <FieldLabel>
                              Minimum decommission retention
                            </FieldLabel>
                            <InputField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                              value={
                                editorState.minimumDecommissionRetentionDays
                              }
                            />
                          </FieldStack>
                          <FieldStack>
                            <FieldLabel>Require decommission reason</FieldLabel>
                            <SelectField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                            </SelectField>
                          </FieldStack>
                        </FormPanel>
                        <FormPanel>
                          <SettingsPanelHeading
                            lead="Delivery controls decide whether reminder and decommission events fan out to configured webhook providers in addition to the audit-log leg."
                            title="Lifecycle delivery policy"
                          />
                          <FieldStack>
                            <FieldLabel>Lifecycle webhook delivery</FieldLabel>
                            <SelectField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                            </SelectField>
                          </FieldStack>
                          <FieldStack>
                            <FieldLabel>
                              Invitation reminder delivery
                            </FieldLabel>
                            <SelectField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                            </SelectField>
                          </FieldStack>
                          <FieldStack>
                            <FieldLabel>
                              Decommission notice delivery
                            </FieldLabel>
                            <SelectField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                            </SelectField>
                          </FieldStack>
                          <ActionRow compact>
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
                          </ActionRow>
                        </FormPanel>
                      </div>
                      <ActionRow padTop>
                        <ActionButton
                          disabled={!canManageWorkspace || isSaving}
                          type="submit"
                        >
                          {isSaving
                            ? "Saving…"
                            : settings
                              ? "Save workspace settings"
                              : "Create settings"}
                        </ActionButton>
                      </ActionRow>
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
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>No workspace selected</strong>
                      <span>
                        Create a workspace before changing lifecycle state.
                      </span>
                    </div>
                  ) : null}
                  {settings?.workspace ? (
                    <>
                      <ActionRow compact>
                        <Pill>
                          {formatWorkspaceStatus(settings.workspace.status)}
                        </Pill>
                        <Pill>/{settings.workspace.slug}</Pill>
                        <Pill>{access.role}</Pill>
                      </ActionRow>
                      {inactiveWorkspaceMessage ? (
                        <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                          <strong>Read-only</strong>
                          <span>{inactiveWorkspaceMessage}</span>
                        </div>
                      ) : null}
                      {!canManageWorkspace ? (
                        <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                          <strong>Owner only</strong>
                          <span>
                            Operators can review lifecycle state, but only
                            owners can archive, suspend, or reactivate a
                            workspace.
                          </span>
                        </div>
                      ) : null}
                      <ActionRow padTop>
                        {settings.workspace.status === "active" ? (
                          <>
                            <ActionButton
                              tone="secondary"
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
                            </ActionButton>
                            <ActionButton
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
                            </ActionButton>
                          </>
                        ) : (
                          <ActionButton
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
                          </ActionButton>
                        )}
                      </ActionRow>
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
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>No workspace selected</strong>
                      <span>
                        Choose a workspace before exporting or reviewing archive
                        readiness.
                      </span>
                    </div>
                  ) : null}
                  {offboardingSummary ? (
                    <>
                      <ActionRow compact>
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
                      </ActionRow>
                      {offboardingSummary.blockerCodes.length ? (
                        <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-red-500/45 bg-red-500/12 text-red-50">
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
                        <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
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
                        <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-emerald-500/45 bg-emerald-500/12 text-emerald-50">
                          <strong>Archive-ready</strong>
                          <span>
                            No active operational blockers are currently
                            attached to this workspace.
                          </span>
                        </div>
                      ) : null}
                      {canManageWorkspace ? (
                        <ActionRow padTop>
                          <ActionLink
                            className="px-3 py-1.5"
                            href={`/api/studio/workspaces/${exportWorkspaceId ?? ""}/export?format=json`}
                            tone="action"
                          >
                            Export JSON
                          </ActionLink>
                          <ActionLink
                            href={`/api/studio/workspaces/${exportWorkspaceId ?? ""}/export?format=csv`}
                            tone="inline"
                          >
                            Export CSV
                          </ActionLink>
                        </ActionRow>
                      ) : (
                        <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
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

            <section className="space-y-4 scroll-mt-28" id="brand">
              <SettingsSectionHeading
                eyebrow="Brand"
                lead="Keep the selected brand’s path, voice, theme, and editorial copy together so publication always points to an explicit, trustworthy target."
                title="Public presence and storefront profile"
              />
              <SurfaceGrid>
                <SurfaceCard
                  body="Brand configuration still uses the same studio settings contract and publication target rules. The form is now organized as one brand brief rather than a generic settings dump."
                  eyebrow="Brand profile"
                  span={8}
                  title={
                    settings
                      ? "Selected brand public presence"
                      : "Create brand profile"
                  }
                >
                  {!canManageWorkspace ? (
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>Operator read-only</strong>
                      <span>
                        Operators can review brand configuration, but only
                        workspace owners can change it.
                      </span>
                    </div>
                  ) : null}
                  {inactiveWorkspaceMessage && settings?.workspace ? (
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>Workspace read-only</strong>
                      <span>{inactiveWorkspaceMessage}</span>
                    </div>
                  ) : null}
                  <form className="space-y-4" onSubmit={handleSaveSettings}>
                    <fieldset disabled={!canEditCurrentWorkspace || isSaving}>
                      <div className="grid gap-4 xl:grid-cols-3">
                        <section className="grid gap-4 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)]/60 p-4">
                          <SettingsPanelHeading
                            lead="Choose which brand you are editing and keep its durable public path aligned with collections."
                            title="Brand routing"
                          />
                          {settings?.brands.length ? (
                            <FieldStack>
                              <FieldLabel>Editing brand</FieldLabel>
                              <SelectField
                                className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                                onChange={(event) => {
                                  setSelectedBrandId(
                                    event.target.value || null
                                  );
                                }}
                                value={selectedBrand?.id ?? ""}
                              >
                                {settings.brands.map((brand) => (
                                  <option key={brand.id} value={brand.id}>
                                    {brand.name} · /brands/{brand.slug}
                                  </option>
                                ))}
                              </SelectField>
                            </FieldStack>
                          ) : null}
                          <FieldStack>
                            <FieldLabel>Brand name</FieldLabel>
                            <InputField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </FieldStack>
                          <FieldStack>
                            <FieldLabel>Brand slug</FieldLabel>
                            <InputField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </FieldStack>
                          <FieldStack>
                            <FieldLabel>Custom domain</FieldLabel>
                            <InputField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </FieldStack>
                          <FieldStack>
                            <FieldLabel>Theme preset</FieldLabel>
                            <SelectField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                              <option value="gallery_mono">Gallery mono</option>
                              <option value="midnight_launch">
                                Midnight launch
                              </option>
                            </SelectField>
                          </FieldStack>
                          <FieldStack>
                            <FieldLabel>Accent color</FieldLabel>
                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
                              <InputField
                                className="h-11 w-14 cursor-pointer rounded-xl border-white/10 bg-transparent p-0"
                                onChange={(event) => {
                                  setEditorState((current) => ({
                                    ...current,
                                    accentColor: event.target.value
                                  }));
                                }}
                                type="color"
                                value={editorState.accentColor}
                              />
                              <InputField
                                className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </FieldStack>
                        </section>
                        <section className="grid gap-4 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)]/60 p-4">
                          <SettingsPanelHeading
                            lead="These fields shape how the public brand route frames published collection releases."
                            title="Landing narrative"
                          />
                          <FieldStack>
                            <FieldLabel>Landing headline</FieldLabel>
                            <InputField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </FieldStack>
                          <FieldStack>
                            <FieldLabel>Landing description</FieldLabel>
                            <TextAreaField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] min-h-[10rem] resize-y focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </FieldStack>
                          <FieldStack>
                            <FieldLabel>Wordmark</FieldLabel>
                            <InputField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </FieldStack>
                          <FieldStack>
                            <FieldLabel>Hero kicker</FieldLabel>
                            <InputField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </FieldStack>
                          <FieldStack>
                            <FieldLabel>Story headline</FieldLabel>
                            <InputField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </FieldStack>
                          <FieldStack>
                            <FieldLabel>Story body</FieldLabel>
                            <TextAreaField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] min-h-[10rem] resize-y focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </FieldStack>
                        </section>
                        <section className="grid gap-4 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)]/60 p-4">
                          <SettingsPanelHeading
                            lead="Keep featured release language and CTA labels aligned with the current brand voice."
                            title="Storefront actions"
                          />
                          <FieldStack>
                            <FieldLabel>Featured release label</FieldLabel>
                            <InputField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </FieldStack>
                          <FieldStack>
                            <FieldLabel>Primary CTA label</FieldLabel>
                            <InputField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </FieldStack>
                          <FieldStack>
                            <FieldLabel>Secondary CTA label</FieldLabel>
                            <InputField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </FieldStack>
                          <ActionRow compact>
                            <Pill>
                              {editorState.brandSlug
                                ? `/brands/${editorState.brandSlug}`
                                : "/brands/[brandSlug]"}
                            </Pill>
                            <Pill>
                              {editorState.customDomain ||
                                "No custom domain configured"}
                            </Pill>
                            <Pill>
                              {editorState.themePreset.replaceAll("_", " ")}
                            </Pill>
                          </ActionRow>
                        </section>
                      </div>
                      <ActionRow padTop>
                        <ActionButton
                          disabled={!canManageWorkspace || isSaving}
                          type="submit"
                        >
                          {isSaving
                            ? "Saving…"
                            : settings
                              ? "Save brand profile"
                              : "Create settings"}
                        </ActionButton>
                      </ActionRow>
                    </fieldset>
                  </form>
                </SurfaceCard>
                <SurfaceCard
                  body="These values become the durable publication target for the selected brand and the editorial source of truth for its public landing."
                  eyebrow="Preview"
                  span={4}
                  title="Storefront preview"
                >
                  <div className="grid gap-4 rounded-[28px] border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)]/70 p-4 shadow-[var(--shadow-surface)]">
                    <div
                      className="h-16 rounded-2xl border border-white/10 shadow-[var(--shadow-surface)]"
                      style={{ backgroundColor: editorState.accentColor }}
                    />
                    <div className="flex flex-col gap-1 text-sm leading-6 text-[color:var(--color-muted)]">
                      <strong>
                        {editorState.wordmark ||
                          editorState.brandName ||
                          "Wordmark"}
                      </strong>
                      <span>{editorState.heroKicker || "Hero kicker"}</span>
                      <span>
                        {editorState.themePreset.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 text-sm leading-6 text-[color:var(--color-muted)]">
                      <strong>
                        {editorState.landingHeadline || "Landing headline"}
                      </strong>
                      <span>{editorState.landingDescription}</span>
                      <span>
                        {editorState.featuredReleaseLabel ||
                          defaultStudioFeaturedReleaseLabel}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 text-sm leading-6 text-[color:var(--color-muted)]">
                      <strong>
                        {editorState.storyHeadline || "Story headline"}
                      </strong>
                      <span>
                        {editorState.storyBody || "Story body preview"}
                      </span>
                      <span>
                        {editorState.primaryCtaLabel || "Primary CTA"} /{" "}
                        {editorState.secondaryCtaLabel || "Secondary CTA"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 text-sm leading-6 text-[color:var(--color-muted)]">
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
                  <ActionRow compact>
                    <Pill>{editorState.workspaceSlug || "workspace-slug"}</Pill>
                    <Pill>{editorState.brandSlug || "brand-slug"}</Pill>
                    <Pill>{editorState.accentColor}</Pill>
                    <Pill>{editorState.themePreset.replaceAll("_", " ")}</Pill>
                    <Pill>
                      {editorState.featuredReleaseLabel ||
                        defaultStudioFeaturedReleaseLabel}
                    </Pill>
                  </ActionRow>
                  <div className="flex flex-col gap-2">
                    <ActionLink href="/studio/collections" tone="inline">
                      Collections publish from this profile
                    </ActionLink>
                    <ActionLink href="/studio/assets" tone="inline">
                      Generated assets still feed the same curation path
                    </ActionLink>
                  </div>
                </SurfaceCard>
                <SurfaceCard
                  body="Add an additional publication brand under the same owner workspace. New brands start with a minimal storefront profile and can then be refined in the main editor."
                  eyebrow="Brands"
                  span={12}
                  title="Create brand"
                >
                  {!canManageWorkspace ? (
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>Owner action required</strong>
                      <span>
                        Only workspace owners can create additional brands.
                      </span>
                    </div>
                  ) : null}
                  {inactiveWorkspaceMessage && settings?.workspace ? (
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>Workspace read-only</strong>
                      <span>{inactiveWorkspaceMessage}</span>
                    </div>
                  ) : null}
                  <form className="space-y-4" onSubmit={handleCreateBrand}>
                    <fieldset
                      disabled={!canEditCurrentWorkspace || isCreatingBrand}
                    >
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <FieldStack>
                          <FieldLabel>Brand name</FieldLabel>
                          <InputField
                            className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                        </FieldStack>
                        <FieldStack>
                          <FieldLabel>Brand slug</FieldLabel>
                          <InputField
                            className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                        </FieldStack>
                        <FieldStack>
                          <FieldLabel>Theme preset</FieldLabel>
                          <SelectField
                            className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </SelectField>
                        </FieldStack>
                        <FieldStack>
                          <FieldLabel>Accent color</FieldLabel>
                          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5">
                            <InputField
                              className="h-11 w-14 cursor-pointer rounded-xl border-white/10 bg-transparent p-0"
                              onChange={(event) => {
                                setNewBrandState((current) => ({
                                  ...current,
                                  accentColor: event.target.value
                                }));
                              }}
                              type="color"
                              value={newBrandState.accentColor}
                            />
                            <InputField
                              className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                        </FieldStack>
                      </div>
                      <ActionRow compact>
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
                        <Pill>
                          {newBrandState.themePreset.replaceAll("_", " ")}
                        </Pill>
                      </ActionRow>
                      <ActionRow padTop>
                        <ActionButton
                          disabled={
                            !canEditCurrentWorkspace ||
                            isCreatingBrand ||
                            !settings?.workspace.id
                          }
                          type="submit"
                        >
                          {isCreatingBrand ? "Creating…" : "Add brand"}
                        </ActionButton>
                      </ActionRow>
                    </fieldset>
                  </form>
                </SurfaceCard>
              </SurfaceGrid>
            </section>

            <section className="space-y-4 scroll-mt-28" id="team">
              <SettingsSectionHeading
                eyebrow="Team"
                lead="Separate the current operator roster from pending invitations so owners can quickly see who already has access and what still needs action."
                title="Member access and invitation queue"
              />
              <SurfaceGrid>
                <SurfaceCard
                  body="Workspace members inherit the same workspace and brand context for day-to-day studio work, while ownership retains high-risk settings and publication controls."
                  eyebrow="Members"
                  span={6}
                  title="Team access"
                >
                  <ActionRow compact>
                    <Pill>{access.role}</Pill>
                    <Pill>{settings?.members.length ?? 1} total members</Pill>
                  </ActionRow>
                  {!canManageMembers ? (
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>Operator read-only</strong>
                      <span>Only workspace owners can remove members.</span>
                    </div>
                  ) : null}
                  {inactiveWorkspaceMessage && settings?.workspace ? (
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>Workspace read-only</strong>
                      <span>{inactiveWorkspaceMessage}</span>
                    </div>
                  ) : null}
                  {settings?.members.length ? (
                    <SettingsRecordList>
                      {settings.members.map((member) => (
                        <SettingsRecordCard key={member.id}>
                          <SettingsRecordCopy>
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
                          </SettingsRecordCopy>
                          {member.membershipId ? (
                            <SettingsRecordActions>
                              <ActionButton
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
                              </ActionButton>
                            </SettingsRecordActions>
                          ) : (
                            <SettingsRecordActions>
                              <Pill>Owner</Pill>
                            </SettingsRecordActions>
                          )}
                        </SettingsRecordCard>
                      ))}
                    </SettingsRecordList>
                  ) : (
                    <SettingsEmptyState>
                      No workspace members are configured yet.
                    </SettingsEmptyState>
                  )}
                </SurfaceCard>
                <SurfaceCard
                  body="Invitation records stay durable so owners can distinguish active, expiring, and expired rows, log reminders, and cancel outstanding access before offboarding."
                  eyebrow="Invitations"
                  span={6}
                  title="Invitation queue"
                >
                  <ActionRow compact>
                    <Pill>{pendingInvitationCount} pending invites</Pill>
                    <Pill>{expiringInvitationCount} expiring</Pill>
                    <Pill>
                      {settings?.invitations.length ?? 0} total invitation rows
                    </Pill>
                  </ActionRow>
                  {!canManageMembers ? (
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>Operator read-only</strong>
                      <span>
                        Only workspace owners can create invitations, log
                        reminders, or cancel invitations.
                      </span>
                    </div>
                  ) : null}
                  {inactiveWorkspaceMessage && settings?.workspace ? (
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>Workspace read-only</strong>
                      <span>{inactiveWorkspaceMessage}</span>
                    </div>
                  ) : null}
                  <SettingsRecordList>
                    {settings?.invitations.length ? (
                      settings.invitations.map((invitation) => (
                        <SettingsRecordCard key={invitation.id}>
                          <SettingsRecordCopy>
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
                          </SettingsRecordCopy>
                          <SettingsRecordActions>
                            <ActionButton
                              tone="secondary"
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
                            </ActionButton>
                            <ActionButton
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
                            </ActionButton>
                          </SettingsRecordActions>
                        </SettingsRecordCard>
                      ))
                    ) : (
                      <SettingsEmptyState>
                        No pending invitations.
                      </SettingsEmptyState>
                    )}
                  </SettingsRecordList>
                  <form className="space-y-4" onSubmit={handleCreateInvitation}>
                    <fieldset
                      disabled={!canMutateMembers || isCreatingInvitation}
                    >
                      <FieldStack>
                        <FieldLabel>Invite operator wallet</FieldLabel>
                        <InputField
                          className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                          onChange={(event) => {
                            setMemberState({
                              walletAddress: event.target.value
                            });
                          }}
                          placeholder="0x..."
                          required
                          value={memberState.walletAddress}
                        />
                      </FieldStack>
                      <ActionRow padTop>
                        <ActionButton
                          disabled={!canMutateMembers || isCreatingInvitation}
                          type="submit"
                        >
                          {isCreatingInvitation
                            ? "Inviting…"
                            : "Send invitation"}
                        </ActionButton>
                      </ActionRow>
                    </fieldset>
                  </form>
                </SurfaceCard>
              </SurfaceGrid>
            </section>

            <section className="space-y-4 scroll-mt-28" id="ownership">
              <SettingsSectionHeading
                eyebrow="Ownership"
                lead="Keep ownership-sensitive actions in one explicit review lane so operators understand when they can request transfer and owners can act with full context."
                title="Ownership transfer and role-escalation control lane"
              />
              <SurfaceGrid>
                <SurfaceCard
                  body="Ownership transfer stays gated behind an explicit operator escalation request and owner review. Approval promotes the requesting operator to owner, demotes the prior owner to operator, and records the full lifecycle in the audit stream."
                  eyebrow="Escalation"
                  span={12}
                  title="Role escalation"
                >
                  <ActionRow compact>
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
                  </ActionRow>
                  {inactiveWorkspaceMessage && settings?.workspace ? (
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>Workspace read-only</strong>
                      <span>{inactiveWorkspaceMessage}</span>
                    </div>
                  ) : null}
                  {canRequestRoleEscalation ? (
                    actorRoleEscalationRequest ? (
                      <SettingsRecordCard>
                        <SettingsRecordCopy>
                          <strong>Ownership transfer request submitted</strong>
                          <span>
                            Submitted{" "}
                            {formatTimestamp(
                              actorRoleEscalationRequest.createdAt
                            )}
                          </span>
                          <span>
                            {actorRoleEscalationRequest.justification ||
                              "No request note provided."}
                          </span>
                        </SettingsRecordCopy>
                        <SettingsRecordActions>
                          <ActionButton
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
                          </ActionButton>
                        </SettingsRecordActions>
                      </SettingsRecordCard>
                    ) : (
                      <>
                        {pendingRoleEscalationRequest ? (
                          <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                            <strong>Owner review already pending</strong>
                            <span>
                              Another ownership transfer request is already open
                              for this workspace. Wait for the current request
                              to resolve before submitting a new one.
                            </span>
                          </div>
                        ) : null}
                        <form
                          className="space-y-4"
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
                            <FieldStack>
                              <FieldLabel>Request note</FieldLabel>
                              <TextAreaField
                                className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] min-h-[10rem] resize-y focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                            </FieldStack>
                            <ActionRow padTop>
                              <ActionButton
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
                              </ActionButton>
                            </ActionRow>
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
                        <SettingsRecordList>
                          {(settings?.roleEscalationRequests ?? [])
                            .filter((request) => request.status === "pending")
                            .map((request) => (
                              <SettingsRecordCard key={request.id}>
                                <SettingsRecordCopy>
                                  <strong>{request.targetWalletAddress}</strong>
                                  <span>
                                    Requested{" "}
                                    {formatTimestamp(request.createdAt)}
                                  </span>
                                  <span>
                                    {request.justification ||
                                      "No request note provided."}
                                  </span>
                                </SettingsRecordCopy>
                                <SettingsRecordActions>
                                  <ActionButton
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
                                    {actingRoleEscalationRequestId ===
                                    request.id
                                      ? "Working…"
                                      : "Approve"}
                                  </ActionButton>
                                  <ActionButton
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
                                    {actingRoleEscalationRequestId ===
                                    request.id
                                      ? "Working…"
                                      : "Reject"}
                                  </ActionButton>
                                </SettingsRecordActions>
                              </SettingsRecordCard>
                            ))}
                        </SettingsRecordList>
                      ) : (
                        <SettingsEmptyState>
                          No pending role escalation requests.
                        </SettingsEmptyState>
                      )}
                    </>
                  ) : null}
                  <SettingsRecordList>
                    {settings?.roleEscalationRequests.length ? (
                      settings.roleEscalationRequests.map((request) => (
                        <SettingsRecordCard key={request.id}>
                          <SettingsRecordCopy>
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
                          </SettingsRecordCopy>
                        </SettingsRecordCard>
                      ))
                    ) : (
                      <SettingsEmptyState>
                        No role escalation requests have been recorded yet.
                      </SettingsEmptyState>
                    )}
                  </SettingsRecordList>
                </SurfaceCard>
              </SurfaceGrid>
            </section>

            <section className="space-y-4 scroll-mt-28" id="lifecycle">
              <SettingsSectionHeading
                eyebrow="Lifecycle"
                lead="Treat reminder scheduling, notice workflows, SLA posture, and provider delivery as policy modules instead of loose controls."
                title="Automation, SLA, and delivery health"
              />
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
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>Operator read-only</strong>
                      <span>
                        Operators can review lifecycle automation, but only
                        workspace owners can change it.
                      </span>
                    </div>
                  ) : null}
                  {!settings?.workspace ? (
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>No workspace selected</strong>
                      <span>
                        Choose a workspace before changing lifecycle automation.
                      </span>
                    </div>
                  ) : (
                    <form
                      className="space-y-4"
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
                        <FieldStack>
                          <FieldLabel>Automation status</FieldLabel>
                          <SelectField
                            className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </SelectField>
                        </FieldStack>
                        <FieldStack>
                          <FieldLabel>
                            Invitation reminder automation
                          </FieldLabel>
                          <SelectField
                            className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </SelectField>
                        </FieldStack>
                        <FieldStack>
                          <FieldLabel>
                            Decommission notice automation
                          </FieldLabel>
                          <SelectField
                            className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </SelectField>
                        </FieldStack>
                        <ActionRow compact>
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
                        </ActionRow>
                        <ActionButton type="submit">
                          {isSavingLifecycleAutomationPolicy
                            ? "Saving…"
                            : "Save lifecycle automation"}
                        </ActionButton>
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
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>Operator read-only</strong>
                      <span>
                        Operators can review lifecycle SLA state, but only
                        workspace owners can change it.
                      </span>
                    </div>
                  ) : null}
                  {!settings?.workspace ? (
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>No workspace selected</strong>
                      <span>
                        Choose a workspace before changing lifecycle SLA policy.
                      </span>
                    </div>
                  ) : (
                    <form
                      className="space-y-4"
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
                        <FieldStack>
                          <FieldLabel>SLA monitoring</FieldLabel>
                          <SelectField
                            className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          </SelectField>
                        </FieldStack>
                        <FieldStack>
                          <FieldLabel>Automation max age (minutes)</FieldLabel>
                          <InputField
                            className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                            value={
                              editorState.lifecycleSlaAutomationMaxAgeMinutes
                            }
                          />
                        </FieldStack>
                        <FieldStack>
                          <FieldLabel>Webhook failure threshold</FieldLabel>
                          <InputField
                            className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                            value={
                              editorState.lifecycleSlaWebhookFailureThreshold
                            }
                          />
                        </FieldStack>
                        <StatusBanner
                          tone={
                            getSlaTone(
                              lifecycleSlaSummary?.status ?? "unreachable"
                            ) as StatusBannerTone
                          }
                        >
                          <strong>
                            {lifecycleSlaSummary?.status ?? "unreachable"}
                          </strong>
                          <span>
                            {lifecycleSlaSummary?.message ??
                              "Lifecycle SLA summary is not available on this service instance."}
                          </span>
                        </StatusBanner>
                        <ActionRow compact>
                          <Pill>
                            Current{" "}
                            {lifecycleSlaPolicy.enabled
                              ? "enabled"
                              : "disabled"}
                          </Pill>
                          <Pill>
                            Max age {lifecycleSlaPolicy.automationMaxAgeMinutes}
                            m
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
                        </ActionRow>
                        {lifecycleSlaSummary?.reasonCodes.length ? (
                          <ActionRow compact>
                            {lifecycleSlaSummary.reasonCodes.map(
                              (reasonCode) => (
                                <Pill key={reasonCode}>
                                  {formatStatus(reasonCode)}
                                </Pill>
                              )
                            )}
                          </ActionRow>
                        ) : null}
                        <ActionButton type="submit">
                          {isSavingLifecycleSlaPolicy
                            ? "Saving…"
                            : "Save lifecycle SLA"}
                        </ActionButton>
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
                    <div className="space-y-4">
                      <StatusBanner
                        tone={
                          lifecycleAutomationHealth.status === "healthy"
                            ? "success"
                            : lifecycleAutomationHealth.status === "warning" ||
                                lifecycleAutomationHealth.status === "stale" ||
                                lifecycleAutomationHealth.status ===
                                  "unreachable"
                              ? "error"
                              : "info"
                        }
                      >
                        <strong>{lifecycleAutomationHealth.status}</strong>
                        <span>{lifecycleAutomationHealth.message}</span>
                      </StatusBanner>
                      <ActionRow compact>
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
                      </ActionRow>
                      <SettingsRecordList>
                        {recentLifecycleAutomationRuns.length ? (
                          recentLifecycleAutomationRuns.map((run) => (
                            <SettingsRecordCard key={run.id}>
                              <SettingsRecordCopy>
                                <strong>
                                  {formatStatus(run.status)} ·{" "}
                                  {run.triggerSource}
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
                                  {run.invitationReminderCount === 1
                                    ? ""
                                    : "s"}{" "}
                                  · {run.decommissionNoticeCount} decommission
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
                              </SettingsRecordCopy>
                            </SettingsRecordCard>
                          ))
                        ) : (
                          <SettingsEmptyState>
                            No lifecycle automation runs have been recorded yet.
                          </SettingsEmptyState>
                        )}
                      </SettingsRecordList>
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
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>No workspace selected</strong>
                      <span>
                        Choose a workspace before reviewing lifecycle delivery
                        state.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ActionRow compact>
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
                      </ActionRow>
                      <SettingsRecordList>
                        {recentLifecycleDeliveries.length ? (
                          recentLifecycleDeliveries.map((delivery) => (
                            <SettingsRecordCard key={delivery.id}>
                              <SettingsRecordCopy>
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
                              </SettingsRecordCopy>
                              <SettingsRecordActions>
                                <Pill>{delivery.deliveryState}</Pill>
                                <ActionButton
                                  tone="secondary"
                                  disabled={
                                    !canManageWorkspace ||
                                    delivery.deliveryChannel !== "webhook" ||
                                    retryingLifecycleDeliveryId ===
                                      delivery.id ||
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
                                </ActionButton>
                              </SettingsRecordActions>
                            </SettingsRecordCard>
                          ))
                        ) : (
                          <SettingsEmptyState>
                            No lifecycle deliveries have been recorded yet.
                          </SettingsEmptyState>
                        )}
                      </SettingsRecordList>
                    </div>
                  )}
                </SurfaceCard>
              </SurfaceGrid>
            </section>

            <section className="space-y-4 scroll-mt-28" id="retention">
              <SettingsSectionHeading
                eyebrow="Retention"
                lead="Keep current workspace offboarding review and permanent decommission controls close together so the retention story is easy to understand before any irreversible action."
                title="Archive readiness and decommission execution"
              />
              <SurfaceGrid>
                <SurfaceCard
                  body="Current workspace offboarding review combines workspace-native access signals with workspace-scoped commerce and ops blockers so owners can understand what still blocks final archive or export."
                  eyebrow="Readiness"
                  span={4}
                  title="Current workspace offboarding"
                >
                  {!currentWorkspaceOffboardingState ? (
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>No workspace offboarding data</strong>
                      <span>
                        Select a workspace to review its current archive and
                        export posture.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ActionRow compact>
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
                      </ActionRow>
                      {currentWorkspaceOffboardingState.summary.blockerCodes
                        .length ? (
                        <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-red-500/45 bg-red-500/12 text-red-50">
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
                        <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                          <strong>Review cues</strong>
                          <span>
                            {currentWorkspaceOffboardingState.summary.cautionCodes
                              .map(formatWorkspaceOffboardingCode)
                              .join(", ")}
                          </span>
                        </div>
                      ) : null}
                      <ActionRow compact>
                        <Pill>
                          {
                            currentWorkspaceOffboardingState.lifecycleDelivery
                              .failedCount
                          }{" "}
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
                      </ActionRow>
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
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>No workspace selected</strong>
                      <span>
                        Choose a workspace before scheduling a decommission
                        window.
                      </span>
                    </div>
                  ) : null}
                  {settings?.workspace ? (
                    <div className="space-y-4">
                      {!canManageWorkspace ? (
                        <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                          <strong>Owner only</strong>
                          <span>
                            Operators can review retention state, but only
                            owners can schedule, cancel, or execute workspace
                            decommission.
                          </span>
                        </div>
                      ) : null}
                      <ActionRow compact>
                        <Pill>
                          Default{" "}
                          {retentionPolicy.defaultDecommissionRetentionDays}{" "}
                          days
                        </Pill>
                        <Pill>
                          Minimum{" "}
                          {retentionPolicy.minimumDecommissionRetentionDays}{" "}
                          days
                        </Pill>
                        <Pill>
                          Reason{" "}
                          {retentionPolicy.requireDecommissionReason
                            ? "required"
                            : "optional"}
                        </Pill>
                      </ActionRow>
                      {canManageWorkspace && scheduledDecommission ? (
                        <>
                          <ActionRow compact>
                            <Pill>{scheduledDecommission.status}</Pill>
                            <Pill>
                              {scheduledDecommission.retentionDays} day
                              retention
                            </Pill>
                            <Pill>
                              {decommissionWorkflow?.notificationCount ?? 0}{" "}
                              notices
                            </Pill>
                          </ActionRow>
                          <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
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
                            <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                              Reason: {scheduledDecommission.reason}
                            </p>
                          ) : null}
                          {decommissionWorkflow?.latestNotification ? (
                            <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)]">
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
                            <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
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
                            <ActionButton
                              tone="secondary"
                              disabled={
                                Boolean(
                                  recordingDecommissionNotificationKind
                                ) ||
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
                            </ActionButton>
                          ) : null}
                          <label
                            className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]"
                            htmlFor="decommission-execute-slug"
                          >
                            Confirm workspace slug to execute
                          </label>
                          <InputField
                            className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                            <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)]">
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
                          <ActionRow padTop>
                            <ActionButton
                              tone="secondary"
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
                            </ActionButton>
                            <ActionButton
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
                            </ActionButton>
                          </ActionRow>
                        </>
                      ) : null}
                      {canManageWorkspace &&
                      !scheduledDecommission &&
                      settings.workspace.status !== "archived" ? (
                        <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)]">
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
                        <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
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
                          className="space-y-3"
                          onSubmit={(event) => {
                            void handleScheduleWorkspaceDecommission(event);
                          }}
                        >
                          <label
                            className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]"
                            htmlFor="decommission-retention"
                          >
                            Retention window
                          </label>
                          <InputField
                            className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                            id="decommission-retention"
                            max={365}
                            min={
                              retentionPolicy.minimumDecommissionRetentionDays
                            }
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
                          <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                            Default policy:{" "}
                            {retentionPolicy.defaultDecommissionRetentionDays}{" "}
                            day(s). Minimum allowed:{" "}
                            {retentionPolicy.minimumDecommissionRetentionDays}{" "}
                            day(s).
                          </p>
                          <label
                            className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]"
                            htmlFor="decommission-slug"
                          >
                            Confirm workspace slug
                          </label>
                          <InputField
                            className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                            className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]"
                            htmlFor="decommission-reason"
                          >
                            Reason
                            {retentionPolicy.requireDecommissionReason
                              ? " (required)"
                              : " (optional)"}
                          </label>
                          <TextAreaField
                            className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                          <ActionButton
                            disabled={isSchedulingDecommission}
                            type="submit"
                          >
                            {isSchedulingDecommission
                              ? "Scheduling…"
                              : "Schedule decommission"}
                          </ActionButton>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </SurfaceCard>
              </SurfaceGrid>
            </section>

            <section className="space-y-4 scroll-mt-28" id="estate">
              <SettingsSectionHeading
                eyebrow="Estate"
                lead="Keep the accessible workspace estate visible alongside provisioning and offboarding review so the current workspace fits into a broader operational picture."
                title="Workspace directory and administrative estate review"
              />
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
                    <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-sm text-[color:var(--color-text)] border-blue-500/35 bg-blue-500/12 text-blue-50">
                      <strong>Owner only</strong>
                      <span>
                        Operators can review the workspace estate, but only
                        owners can provision another workspace.
                      </span>
                    </div>
                  ) : null}
                  <form className="space-y-4" onSubmit={handleCreateWorkspace}>
                    <fieldset
                      disabled={!canManageWorkspace || isCreatingWorkspace}
                    >
                      <FieldStack>
                        <FieldLabel>Workspace name</FieldLabel>
                        <InputField
                          className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                      </FieldStack>
                      <FieldStack>
                        <FieldLabel>Workspace slug</FieldLabel>
                        <InputField
                          className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                      </FieldStack>
                      <FieldStack>
                        <FieldLabel>Initial brand name</FieldLabel>
                        <InputField
                          className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                      </FieldStack>
                      <FieldStack>
                        <FieldLabel>Initial brand slug</FieldLabel>
                        <InputField
                          className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                      </FieldStack>
                      <FieldStack>
                        <FieldLabel>Accent color</FieldLabel>
                        <InputField
                          className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                          onChange={(event) => {
                            setWorkspaceCreateState((current) => ({
                              ...current,
                              accentColor: event.target.value
                            }));
                          }}
                          type="color"
                          value={workspaceCreateState.accentColor}
                        />
                      </FieldStack>
                      <FieldStack>
                        <FieldLabel>Theme preset</FieldLabel>
                        <SelectField
                          className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
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
                        </SelectField>
                      </FieldStack>
                      <ActionRow padTop>
                        <ActionButton type="submit">
                          {isCreatingWorkspace
                            ? "Provisioning…"
                            : "Create workspace"}
                        </ActionButton>
                        <ActionLink href="/studio/commerce/fleet" tone="inline">
                          Open commerce fleet
                        </ActionLink>
                      </ActionRow>
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

            <section className="space-y-4 scroll-mt-28" id="audit">
              <SettingsSectionHeading
                eyebrow="Audit"
                lead="Keep invitation, membership, ownership, and decommission actions visible without letting the audit stream dominate the page."
                title="Recent member lifecycle history"
              />
              <SurfaceGrid>
                <SurfaceCard
                  body="Member lifecycle and ownership-transfer actions are written to the workspace audit stream so owners can trace invitation creation, cancellation, acceptance, member removal, and role escalation outcomes without inspecting the database."
                  eyebrow="Audit"
                  span={12}
                  title="Member lifecycle history"
                >
                  <ActionRow compact>
                    <Pill>
                      {settings?.auditEntries.length ?? 0} recent events
                    </Pill>
                    <Pill>workspace audit</Pill>
                    <ActionLink href="/ops/audit" tone="inline">
                      Open full audit
                    </ActionLink>
                  </ActionRow>
                  {settings?.auditEntries.length ? (
                    <SettingsRecordList>
                      {settings.auditEntries.map((entry) => (
                        <SettingsRecordCard key={entry.id}>
                          <SettingsRecordCopy>
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
                          </SettingsRecordCopy>
                        </SettingsRecordCard>
                      ))}
                    </SettingsRecordList>
                  ) : (
                    <SettingsEmptyState>
                      No member lifecycle events have been recorded yet.
                    </SettingsEmptyState>
                  )}
                </SurfaceCard>
              </SurfaceGrid>
            </section>
          </main>

          <aside className="space-y-4 xl:sticky xl:top-24">
            <SettingsRailCard
              body={`${settings?.workspace.name ?? "No workspace selected"} is running in ${access.role} view with ${availableWorkspaces.length} accessible workspace${availableWorkspaces.length === 1 ? "" : "s"}.`}
              eyebrow="Control context"
              title="Current workspace frame"
            >
              <ActionRow compact>
                <Pill>
                  {workspaceStatus
                    ? formatWorkspaceStatus(workspaceStatus)
                    : "unconfigured"}
                </Pill>
                <Pill>{settings?.workspace.slug ?? "no-workspace"}</Pill>
                <Pill>{access.role}</Pill>
              </ActionRow>
              {canManageWorkspace && exportWorkspaceId ? (
                <ActionRow>
                  <ActionLink
                    href={`/api/studio/workspaces/${exportWorkspaceId}/export?format=json`}
                    tone="inline"
                  >
                    Export JSON
                  </ActionLink>
                  <ActionLink
                    href={`/api/studio/workspaces/${exportWorkspaceId}/export?format=csv`}
                    tone="inline"
                  >
                    Export CSV
                  </ActionLink>
                </ActionRow>
              ) : null}
            </SettingsRailCard>
            <SettingsRailCard
              eyebrow="Attention queue"
              title="Current workspace signals"
            >
              <div className="grid gap-3">
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
                  value={(
                    offboardingSummary?.blockerCodes.length ?? 0
                  ).toString()}
                />
              </div>
              {offboardingSummary?.blockerCodes.length ? (
                <SettingsStatusMessage title="Resolve blockers" tone="error">
                  {offboardingSummary.blockerCodes
                    .map(formatWorkspaceOffboardingCode)
                    .join(", ")}
                </SettingsStatusMessage>
              ) : null}
            </SettingsRailCard>
            <SettingsRailCard
              body={
                lifecycleAutomationHealth?.message ??
                "Automation health is unavailable."
              }
              eyebrow="Lifecycle posture"
              title="Automation and SLA"
            >
              <ActionRow compact>
                <Pill>
                  {lifecycleAutomationHealth?.status ?? "unreachable"}
                </Pill>
                <Pill>{lifecycleSlaSummary?.status ?? "unreachable"}</Pill>
                <Pill>Failed webhooks {recentWebhookFailedCount}</Pill>
              </ActionRow>
              <StatusBanner
                tone={
                  getSlaTone(
                    lifecycleSlaSummary?.status ?? "unreachable"
                  ) as StatusBannerTone
                }
              >
                <strong>{lifecycleSlaSummary?.status ?? "unreachable"}</strong>
                <span>
                  {lifecycleSlaSummary?.message ??
                    "Lifecycle SLA summary is not available."}
                </span>
              </StatusBanner>
            </SettingsRailCard>
            <SettingsRailCard
              eyebrow="Estate posture"
              title="Accessible workspace estate"
            >
              <div className="grid gap-3">
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
            </SettingsRailCard>
            <SettingsRailCard
              body={`${(selectedBrand?.name ?? editorState.brandName) || "Brand"} routes to ${
                selectedBrand?.publicBrandPath ??
                `/brands/${editorState.brandSlug || "[brandSlug]"}`
              }${
                selectedBrand?.customDomain
                  ? ` and currently maps to ${selectedBrand.customDomain}.`
                  : "."
              }`}
              eyebrow="Public presence"
              title="Selected brand target"
            >
              <ActionRow compact>
                <Pill>
                  {selectedBrand?.themePreset ?? editorState.themePreset}
                </Pill>
                <Pill>
                  {selectedBrand?.accentColor ?? editorState.accentColor}
                </Pill>
              </ActionRow>
            </SettingsRailCard>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
