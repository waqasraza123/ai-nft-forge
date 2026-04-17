"use client";

import Link from "next/link";
import {
  startTransition,
  type FormEvent,
  type ReactNode,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState
} from "react";
import { createPublicClient, custom, getAddress, isAddressEqual } from "viem";
import { useConnection, useConnect, useDisconnect } from "wagmi";

import {
  createCollectionContractPath,
  createCollectionTokenUriPath
} from "@ai-nft-forge/contracts";
import {
  collectionContractDeploymentIntentResponseSchema,
  collectionContractMintIntentResponseSchema,
  collectionDraftListResponseSchema,
  collectionDraftResponseSchema,
  generatedAssetDownloadIntentResponseSchema,
  type CollectionContractChainKey,
  type CollectionDraftStatus,
  type CollectionDraftSummary,
  type CollectionGeneratedAssetCandidate,
  type CollectionPublicationTarget,
  type GeneratedAssetModerationStatus,
  type StudioWorkspaceRole
} from "@ai-nft-forge/shared";
import {
  ActionButton,
  ActionLink,
  EmptyState,
  FieldLabel,
  FieldStack,
  InsetMetric,
  InputField,
  MetricTile,
  PageShell,
  Pill,
  SurfaceCard,
  StatusBanner,
  TextAreaField,
  cn
} from "@ai-nft-forge/ui";

import {
  CollectibleEditorialBand,
  CollectiblePreviewCard,
  StudioSceneCard
} from "../../../../components/collectible-visuals";
import {
  createWalletAddChainParameters,
  getWalletChainByKey,
  getWalletChainLabel
} from "../../../../lib/wallet/chains";

type StudioCollectionsClientProps = {
  initialDrafts: CollectionDraftSummary[];
  initialGeneratedAssetCandidates: CollectionGeneratedAssetCandidate[];
  initialPublicationTarget: CollectionPublicationTarget | null;
  initialPublicationTargets: CollectionPublicationTarget[];
  ownerWalletAddress: string;
  studioRole: StudioWorkspaceRole;
};

const collectionActionRowClasses = "flex flex-wrap items-center gap-2";
const collectionFieldGridClasses = "grid gap-3 md:grid-cols-2";
const collectionFieldLabelClasses =
  "text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]";

const collectionInputFieldClasses =
  "rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30";
const collectionSectionGridClasses =
  "grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_minmax(0,1fr)]";
const collectionWorkspaceColumnClasses = "grid gap-4";
const collectionPanelHeaderClasses = "grid gap-1.5";
const collectionBrowserStatGridClasses =
  "grid gap-3 sm:grid-cols-2 xl:grid-cols-3";
const collectionCreateFormGridClasses = "grid gap-3 md:grid-cols-2";
const collectionCuesClasses = "flex flex-wrap items-center gap-2";
const collectionFocusPanelClasses = "grid gap-4 md:grid-cols-[240px_1fr]";
const collectionFocusMediaClasses =
  "overflow-hidden rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)]";
const collectionFocusSummaryClasses = "grid gap-3";
const collectionStatGridClasses = "grid gap-2 md:grid-cols-2 xl:grid-cols-3";
const collectionArtGridClasses = "grid gap-3 md:grid-cols-2 xl:grid-cols-3";
const collectionArtCardWideGridClasses =
  "grid gap-3 md:grid-cols-2 xl:grid-cols-2";
const collectionLaunchGridClasses = "grid gap-3 sm:grid-cols-3";
const collectionLinkGridClasses = "grid gap-1.5 md:grid-cols-2";
const collectionMintListClasses = "grid gap-3";
const collectionMintCardClasses =
  "grid gap-1 rounded-2xl border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] p-4 shadow-[var(--shadow-surface)]";
const collectionFormSectionClasses =
  "grid gap-4 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)]/60 p-4";
const collectionStickyRailClasses = "grid gap-4 xl:sticky xl:top-24";
const collectionStatusCardClasses =
  "flex flex-col gap-2 rounded-2xl border p-4 shadow-[var(--shadow-surface)]";

const collectionCardStateToneClasses = {
  default:
    "border-[color:var(--color-line)] bg-[color:var(--color-surface)]/75",
  success: "border-emerald-500/45 bg-emerald-500/12 text-emerald-50",
  warning: "border-amber-400/45 bg-amber-400/12 text-amber-100",
  danger: "border-red-500/45 bg-red-500/12 text-red-50"
} as const;

type NoticeState = {
  message: string;
  tone: "error" | "info" | "success";
} | null;

const statusBannerToneClasses = {
  error: "border-red-500/45 bg-red-500/12 text-red-50",
  info: "border-blue-500/35 bg-blue-500/12 text-blue-50",
  success: "border-emerald-500/45 bg-emerald-500/12 text-emerald-50",
  warning: "border-amber-400/45 bg-amber-400/12 text-amber-100"
} as const;

function getStatusBannerToneClass(tone: keyof typeof statusBannerToneClasses) {
  return statusBannerToneClasses[tone];
}

type GeneratedAssetPreviewUrlMap = Record<string, string>;

type BrowserEthereumProvider = {
  request(input: { method: string; params?: unknown[] }): Promise<unknown>;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
};

type SupportedWalletConnectorId = "baseAccount" | "injected";

type OnchainFlowState = {
  chainLabel: string;
  kind: "deployment" | "mint";
  message: string;
  status:
    | "awaiting_signature"
    | "checking_wallet"
    | "confirming"
    | "failed"
    | "preparing"
    | "recording"
    | "replaced"
    | "submitted"
    | "success"
    | "switching_chain";
  txHash: string | null;
};

class WalletFlowError extends Error {
  txHash: string | null;

  constructor(message: string, txHash: string | null = null) {
    super(message);
    this.name = "WalletFlowError";
    this.txHash = txHash;
  }
}

function parseWalletErrorMessage(input: {
  action: "connect" | "deploy" | "mint" | "switch" | "wait";
  error: unknown;
}) {
  const errorCode =
    typeof input.error === "object" &&
    input.error !== null &&
    "code" in input.error &&
    typeof input.error.code === "number"
      ? input.error.code
      : null;
  const errorMessage =
    input.error instanceof Error
      ? input.error.message
      : typeof input.error === "string"
        ? input.error
        : "Unexpected wallet error.";
  const normalizedErrorMessage = errorMessage.toLowerCase();

  if (input.error instanceof WalletFlowError) {
    return input.error.message;
  }

  if (
    errorCode === 4001 ||
    normalizedErrorMessage.includes("user rejected") ||
    normalizedErrorMessage.includes("user denied") ||
    normalizedErrorMessage.includes("rejected the request")
  ) {
    return "Wallet request was rejected.";
  }

  if (
    normalizedErrorMessage.includes("timeout") ||
    normalizedErrorMessage.includes("timed out")
  ) {
    return "Transaction was submitted but not confirmed in time. Retry confirmation after the network catches up.";
  }

  if (
    normalizedErrorMessage.includes("insufficient funds") ||
    normalizedErrorMessage.includes("intrinsic gas")
  ) {
    return "The connected wallet could not cover the transaction cost on the selected chain.";
  }

  switch (input.action) {
    case "connect":
      return `Wallet connection failed. ${errorMessage}`;
    case "switch":
      return `Chain switch failed. ${errorMessage}`;
    case "wait":
      return `Transaction confirmation failed. ${errorMessage}`;
    case "deploy":
      return `Deployment failed. ${errorMessage}`;
    case "mint":
      return `Mint failed. ${errorMessage}`;
    default:
      return errorMessage;
  }
}

function createFallbackErrorMessage(response: Response) {
  switch (response.status) {
    case 401:
      return "An active studio session is required.";
    case 403:
      return "Only workspace owners can publish collections or manage onchain state.";
    case 404:
      return "The requested collection draft record was not found.";
    case 409:
      return "The requested collection draft action conflicts with the current state.";
    default:
      return "The collection draft request could not be completed.";
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

function sortDrafts(drafts: CollectionDraftSummary[]) {
  return [...drafts].sort((left, right) => {
    const updatedAtDifference =
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();

    if (updatedAtDifference !== 0) {
      return updatedAtDifference;
    }

    return right.id.localeCompare(left.id);
  });
}

function upsertDraft(
  drafts: CollectionDraftSummary[],
  updatedDraft: CollectionDraftSummary
) {
  const remainingDrafts = drafts.filter(
    (draft) => draft.id !== updatedDraft.id
  );

  return sortDrafts([...remainingDrafts, updatedDraft]);
}

function formatDraftStatus(status: CollectionDraftStatus) {
  return status === "review_ready" ? "Review ready" : "Draft";
}

function formatCandidateLabel(candidate: CollectionGeneratedAssetCandidate) {
  return `${candidate.sourceAssetOriginalFilename} · variant ${candidate.variantIndex}`;
}

function formatCandidateTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatModerationStatus(status: GeneratedAssetModerationStatus) {
  switch (status) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return "Pending review";
  }
}

function formatStorefrontStatus(status: string) {
  switch (status) {
    case "live":
      return "Live";
    case "sold_out":
      return "Sold out";
    case "upcoming":
      return "Upcoming";
    default:
      return "Ended";
  }
}

function getDraftPreviewGeneratedAssetId(draft: CollectionDraftSummary) {
  return (
    draft.publication?.heroGeneratedAssetId ??
    draft.items[0]?.generatedAsset.generatedAssetId ??
    null
  );
}

function getDraftAttentionLabel(input: {
  draft: CollectionDraftSummary;
  hasInvalidItems: boolean;
}) {
  if (input.hasInvalidItems) {
    return "Needs repair";
  }

  if (input.draft.publication?.activeDeployment) {
    return "Onchain live";
  }

  if (input.draft.publication) {
    return "Published";
  }

  if (input.draft.status === "review_ready") {
    return "Ready to publish";
  }

  if (input.draft.itemCount > 0) {
    return "In curation";
  }

  return "Needs composition";
}

function createInitialEditorState(draft: CollectionDraftSummary | null) {
  return {
    description: draft?.description ?? "",
    slug: draft?.slug ?? "",
    status: draft?.status ?? ("draft" satisfies CollectionDraftStatus),
    title: draft?.title ?? ""
  };
}

function createInitialPublicationMerchandisingState(
  draft: CollectionDraftSummary | null
) {
  return {
    displayOrder: draft?.publication?.displayOrder ?? 0,
    endAt: draft?.publication?.endAt
      ? draft.publication.endAt.slice(0, 16)
      : "",
    heroGeneratedAssetId: draft?.publication?.heroGeneratedAssetId ?? "",
    isFeatured: draft?.publication?.isFeatured ?? false,
    launchAt: draft?.publication?.launchAt
      ? draft.publication.launchAt.slice(0, 16)
      : "",
    priceAmountMinor:
      draft?.publication?.priceAmountMinor !== null &&
      draft?.publication?.priceAmountMinor !== undefined
        ? draft.publication.priceAmountMinor.toString()
        : "",
    priceCurrency: draft?.publication?.priceCurrency?.toUpperCase() ?? "",
    priceLabel: draft?.publication?.priceLabel ?? "",
    primaryCtaHref: draft?.publication?.primaryCtaHref ?? "",
    primaryCtaLabel: draft?.publication?.primaryCtaLabel ?? "",
    secondaryCtaHref: draft?.publication?.secondaryCtaHref ?? "",
    secondaryCtaLabel: draft?.publication?.secondaryCtaLabel ?? "",
    soldCount: draft?.publication?.soldCount.toString() ?? "0",
    storefrontBody: draft?.publication?.storefrontBody ?? "",
    storefrontHeadline: draft?.publication?.storefrontHeadline ?? "",
    storefrontStatus: draft?.publication?.storefrontStatus ?? "ended",
    totalSupply:
      draft?.publication?.totalSupply !== null &&
      draft?.publication?.totalSupply !== undefined
        ? draft.publication.totalSupply.toString()
        : ""
  };
}

function toOptionalIsoTimestamp(value: string) {
  if (!value.trim()) {
    return null;
  }

  return new Date(value).toISOString();
}

function toOptionalPositiveInteger(value: string) {
  if (!value.trim()) {
    return null;
  }

  return Number.parseInt(value, 10);
}

function shortHex(value: string) {
  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function buildPublishedCollectionMetadataPath(publicPath: string) {
  return `${publicPath}/metadata`;
}

function buildPublishedCollectionContractPath(input: {
  brandSlug: string;
  collectionSlug: string;
}) {
  return createCollectionContractPath(input);
}

function resolveSelectedPublicationTargetId(input: {
  currentTargetId: string | null;
  draft: CollectionDraftSummary | null;
  publicationTargets: CollectionPublicationTarget[];
}) {
  if (
    input.currentTargetId &&
    input.publicationTargets.some(
      (target) => target.brandId === input.currentTargetId
    )
  ) {
    return input.currentTargetId;
  }

  const publicationBrandTarget = input.draft?.publication
    ? input.publicationTargets.find(
        (target) => target.brandSlug === input.draft?.publication?.brandSlug
      )
    : null;

  return (
    publicationBrandTarget?.brandId ??
    input.publicationTargets[0]?.brandId ??
    null
  );
}

type CollectionDraftBrowserCardProps = {
  draft: CollectionDraftSummary;
  hasInvalidItems: boolean;
  isSelected: boolean;
  onSelect: () => void;
  previewUrl: string | null;
};

function CollectionDraftBrowserCard({
  draft,
  hasInvalidItems,
  isSelected,
  onSelect,
  previewUrl
}: CollectionDraftBrowserCardProps) {
  const attentionLabel = getDraftAttentionLabel({
    draft,
    hasInvalidItems
  });

  return (
    <button
      className={cn(
        "grid gap-3 rounded-[1.75rem] border bg-[linear-gradient(180deg,rgba(255,255,255,0.11),rgba(255,255,255,0.03))] p-3 text-left shadow-[var(--shadow-surface)] transition",
        "border-[color:var(--color-line)] hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-surface-strong)]",
        isSelected
          ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)]/40"
          : null
      )}
      onClick={onSelect}
      type="button"
    >
      <div className="grid gap-2">
        <CollectiblePreviewCard
          badge={attentionLabel}
          className="bg-transparent p-0 shadow-none"
          imageAlt={draft.title}
          imageUrl={previewUrl}
          meta={draft.publication ? "Published route" : "Draft in workspace"}
          subtitle={draft.slug}
          title={draft.title}
        />
        <div className="flex flex-wrap justify-end gap-2">
          <Pill>{attentionLabel}</Pill>
        </div>
      </div>
      <div className="grid gap-1.5">
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
          <Pill>{formatDraftStatus(draft.status)}</Pill>
          <Pill>{draft.publication ? "Published" : "Draft only"}</Pill>
          {hasInvalidItems ? <Pill>Blocked</Pill> : null}
        </div>
        <strong>{draft.title}</strong>
        <p>
          {draft.description?.trim() ||
            "No internal release framing has been saved yet."}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[color:var(--color-muted)]">
          <span>{draft.itemCount} curated items</span>
          <span>Updated {formatCandidateTimestamp(draft.updatedAt)}</span>
          <span>
            {draft.publication?.publicPath ?? `/collections/${draft.slug}`}
          </span>
        </div>
      </div>
    </button>
  );
}

type CollectionArtworkCardProps = {
  actions: ReactNode;
  meta: ReactNode;
  previewUrl: string | null;
  statusLabel: string;
  statusTone: "default" | "danger" | "success" | "warning";
  subtitle: string;
  title: string;
};

function CollectionArtworkCard({
  actions,
  meta,
  previewUrl,
  statusLabel,
  statusTone,
  subtitle,
  title
}: CollectionArtworkCardProps) {
  const statusToneClass =
    statusTone === "success"
      ? collectionCardStateToneClasses.success
      : statusTone === "warning"
        ? collectionCardStateToneClasses.warning
        : statusTone === "danger"
          ? collectionCardStateToneClasses.danger
          : collectionCardStateToneClasses.default;
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] p-3 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
      <CollectiblePreviewCard
        badge={statusLabel}
        className="bg-transparent p-0 shadow-none"
        imageAlt={title}
        imageUrl={previewUrl}
        meta={subtitle}
        subtitle="Collectible frame"
        title={title}
      />
      <div
        className={cn(
          "mt-3 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em]",
          statusToneClass
        )}
      >
        {statusLabel}
      </div>
      <div className="mt-3 grid gap-1.5 px-1">
        <strong>{title}</strong>
        <span className="text-sm text-[color:var(--color-muted)]">
          {subtitle}
        </span>
        <div className="flex flex-wrap gap-2 text-xs text-[color:var(--color-muted)]">
          {meta}
        </div>
      </div>
      <div className="mt-4 border-t border-[color:var(--color-line)] p-3">
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
    </article>
  );
}

function CollectionStatusNote(input: {
  body: string;
  title: string;
  tone: "error" | "info" | "success";
}) {
  return (
    <div
      className={cn(collectionStatusCardClasses, {
        "border-blue-500/35 bg-blue-500/12 text-blue-50": input.tone === "info",
        "border-emerald-500/45 bg-emerald-500/12 text-emerald-50":
          input.tone === "success",
        "border-red-500/45 bg-red-500/12 text-red-50": input.tone === "error"
      })}
    >
      <strong>{input.title}</strong>
      <span className="text-sm leading-6 text-current/85">{input.body}</span>
    </div>
  );
}

export function StudioCollectionsClient({
  initialDrafts,
  initialGeneratedAssetCandidates,
  initialPublicationTarget,
  initialPublicationTargets,
  ownerWalletAddress,
  studioRole
}: StudioCollectionsClientProps) {
  const walletConnection = useConnection();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const [drafts, setDrafts] = useState(() => sortDrafts(initialDrafts));
  const [generatedAssetCandidates, setGeneratedAssetCandidates] = useState(
    initialGeneratedAssetCandidates
  );
  const [publicationTargets, setPublicationTargets] = useState(
    initialPublicationTargets
  );
  const [selectedPublicationTargetId, setSelectedPublicationTargetId] =
    useState<string | null>(
      initialPublicationTarget?.brandId ??
        initialPublicationTargets[0]?.brandId ??
        null
    );
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(
    initialDrafts[0]?.id ?? null
  );
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [editorState, setEditorState] = useState(() =>
    createInitialEditorState(initialDrafts[0] ?? null)
  );
  const [publicationMerchandisingState, setPublicationMerchandisingState] =
    useState(() =>
      createInitialPublicationMerchandisingState(initialDrafts[0] ?? null)
    );
  const [deploymentChainKey, setDeploymentChainKey] =
    useState<CollectionContractChainKey>("base-sepolia");
  const [mintRequestState, setMintRequestState] = useState(() => ({
    recipientWalletAddress: "",
    tokenId: initialDrafts[0]?.items[0]?.position.toString() ?? "1"
  }));
  const [deploymentIntentJson, setDeploymentIntentJson] = useState("");
  const [mintIntentJson, setMintIntentJson] = useState("");
  const [selectedWalletConnectorId, setSelectedWalletConnectorId] = useState<
    SupportedWalletConnectorId | ""
  >("baseAccount");
  const [pendingDeploymentTxHash, setPendingDeploymentTxHash] = useState<
    string | null
  >(null);
  const [pendingMintTxHash, setPendingMintTxHash] = useState<string | null>(
    null
  );
  const [onchainFlowState, setOnchainFlowState] =
    useState<OnchainFlowState | null>(null);
  const [generatedAssetPreviewUrls, setGeneratedAssetPreviewUrls] =
    useState<GeneratedAssetPreviewUrlMap>({});
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [savingDraftId, setSavingDraftId] = useState<string | null>(null);
  const [publishingDraftId, setPublishingDraftId] = useState<string | null>(
    null
  );
  const [savingPublicationDraftId, setSavingPublicationDraftId] = useState<
    string | null
  >(null);
  const [deployingDraftId, setDeployingDraftId] = useState<string | null>(null);
  const [mintingDraftId, setMintingDraftId] = useState<string | null>(null);
  const [unpublishingDraftId, setUnpublishingDraftId] = useState<string | null>(
    null
  );
  const [busyItemKey, setBusyItemKey] = useState<string | null>(null);
  const failedGeneratedAssetPreviewIdsRef = useRef<Set<string>>(new Set());

  const selectedDraft =
    drafts.find((draft) => draft.id === selectedDraftId) ?? drafts[0] ?? null;
  const selectedPublicationTarget =
    publicationTargets.find(
      (target) => target.brandId === selectedPublicationTargetId
    ) ??
    publicationTargets[0] ??
    null;
  const selectedDraftInvalidItems =
    selectedDraft?.items.filter(
      (item) => item.generatedAsset.moderationStatus !== "approved"
    ) ?? [];
  const selectedDraftHasInvalidItems = selectedDraftInvalidItems.length > 0;
  const selectedDraftNeedsRepairDowngrade =
    selectedDraft?.status === "review_ready" && selectedDraftHasInvalidItems;
  const baseAccountConnector =
    connectors.find((connector) => connector.id === "baseAccount") ?? null;
  const injectedWalletConnector =
    connectors.find((connector) => connector.id === "injected") ?? null;
  const connectedWalletAddress = walletConnection.address ?? null;
  const connectedWalletChainId = walletConnection.chainId ?? null;
  const connectedWalletConnector = walletConnection.connector ?? null;
  const walletProviderAvailable =
    Boolean(baseAccountConnector) || Boolean(injectedWalletConnector);
  const includedGeneratedAssetIds = new Set(
    selectedDraft?.items.map((item) => item.generatedAsset.generatedAssetId) ??
      []
  );
  const connectedOwnerWallet =
    connectedWalletAddress &&
    isAddressEqual(
      getAddress(connectedWalletAddress),
      getAddress(ownerWalletAddress)
    );
  const connectedWalletChainLabel = getWalletChainLabel(connectedWalletChainId);
  const canManagePublication = studioRole === "owner";
  const canManageOnchain = studioRole === "owner";
  const previewAssetIds = useMemo(() => {
    const assetIds = new Set<string>();

    for (const draft of drafts) {
      const draftPreviewGeneratedAssetId =
        getDraftPreviewGeneratedAssetId(draft);

      if (draftPreviewGeneratedAssetId) {
        assetIds.add(draftPreviewGeneratedAssetId);
      }
    }

    for (const item of selectedDraft?.items ?? []) {
      assetIds.add(item.generatedAsset.generatedAssetId);
    }

    for (const candidate of generatedAssetCandidates.slice(0, 18)) {
      assetIds.add(candidate.generatedAssetId);
    }

    return [...assetIds];
  }, [drafts, generatedAssetCandidates, selectedDraft]);

  useEffect(() => {
    if (!selectedDraft && selectedDraftId) {
      setSelectedDraftId(drafts[0]?.id ?? null);
      return;
    }

    if (selectedDraft && selectedDraft.id !== selectedDraftId) {
      setSelectedDraftId(selectedDraft.id);
    }
  }, [drafts, selectedDraft, selectedDraftId]);

  useEffect(() => {
    setEditorState(createInitialEditorState(selectedDraft));
    setPublicationMerchandisingState(
      createInitialPublicationMerchandisingState(selectedDraft)
    );
    setDeploymentChainKey(
      selectedDraft?.publication?.activeDeployment?.chain.key ?? "base-sepolia"
    );
    setMintRequestState({
      recipientWalletAddress: "",
      tokenId: selectedDraft?.items[0]?.position.toString() ?? "1"
    });
    setDeploymentIntentJson("");
    setMintIntentJson("");
    setPendingDeploymentTxHash(null);
    setPendingMintTxHash(null);
    setOnchainFlowState(null);
  }, [selectedDraft]);

  useEffect(() => {
    const nextPublicationTargetId = resolveSelectedPublicationTargetId({
      currentTargetId: selectedPublicationTargetId,
      draft: selectedDraft,
      publicationTargets
    });

    if (nextPublicationTargetId !== selectedPublicationTargetId) {
      setSelectedPublicationTargetId(nextPublicationTargetId);
    }
  }, [publicationTargets, selectedDraft, selectedPublicationTargetId]);

  useEffect(() => {
    const nextConnectorId =
      connectedWalletConnector?.id === "baseAccount" ||
      connectedWalletConnector?.id === "injected"
        ? connectedWalletConnector.id
        : baseAccountConnector
          ? "baseAccount"
          : injectedWalletConnector
            ? "injected"
            : "";

    setSelectedWalletConnectorId((currentValue) => {
      if (
        currentValue &&
        ((currentValue === "baseAccount" && baseAccountConnector) ||
          (currentValue === "injected" && injectedWalletConnector))
      ) {
        return currentValue;
      }

      return nextConnectorId;
    });
  }, [
    baseAccountConnector,
    connectedWalletConnector?.id,
    injectedWalletConnector
  ]);

  const requestGeneratedAssetPreviewUrl = useEffectEvent(
    async (generatedAssetId: string) => {
      const cachedUrl = generatedAssetPreviewUrls[generatedAssetId];

      if (cachedUrl) {
        return cachedUrl;
      }

      const response = await fetch(
        `/api/studio/generated-assets/${generatedAssetId}/download-intent`,
        {
          method: "POST"
        }
      );
      const result = await parseJsonResponse({
        response,
        schema: generatedAssetDownloadIntentResponseSchema
      });

      setGeneratedAssetPreviewUrls((currentGeneratedAssetPreviewUrls) => {
        if (currentGeneratedAssetPreviewUrls[generatedAssetId]) {
          return currentGeneratedAssetPreviewUrls;
        }

        return {
          ...currentGeneratedAssetPreviewUrls,
          [generatedAssetId]: result.download.url
        };
      });

      return result.download.url;
    }
  );

  useEffect(() => {
    const missingAssetIds = previewAssetIds.filter(
      (generatedAssetId) =>
        !generatedAssetPreviewUrls[generatedAssetId] &&
        !failedGeneratedAssetPreviewIdsRef.current.has(generatedAssetId)
    );

    if (missingAssetIds.length === 0) {
      return;
    }

    let isCancelled = false;

    void (async () => {
      for (const generatedAssetId of missingAssetIds) {
        try {
          await requestGeneratedAssetPreviewUrl(generatedAssetId);
        } catch {
          failedGeneratedAssetPreviewIdsRef.current.add(generatedAssetId);
        }

        if (isCancelled) {
          return;
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [
    generatedAssetPreviewUrls,
    previewAssetIds,
    requestGeneratedAssetPreviewUrl
  ]);

  const refreshDrafts = useEffectEvent(async (input?: { silent?: boolean }) => {
    if (!input?.silent) {
      setIsRefreshing(true);
    }

    try {
      const response = await fetch("/api/studio/collections", {
        cache: "no-store"
      });
      const result = await parseJsonResponse({
        response,
        schema: collectionDraftListResponseSchema
      });

      startTransition(() => {
        setDrafts(sortDrafts(result.drafts));
        setGeneratedAssetCandidates(result.generatedAssetCandidates);
        setPublicationTargets(result.publicationTargets);
        setSelectedPublicationTargetId((currentTargetId) =>
          resolveSelectedPublicationTargetId({
            currentTargetId,
            draft:
              result.drafts.find((draft) => draft.id === selectedDraftId) ??
              result.drafts[0] ??
              null,
            publicationTargets: result.publicationTargets
          })
        );
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Collection drafts could not be refreshed.",
        tone: "error"
      });
    } finally {
      if (!input?.silent) {
        setIsRefreshing(false);
      }
    }
  });

  const applyUpdatedDraft = useEffectEvent((draft: CollectionDraftSummary) => {
    startTransition(() => {
      setDrafts((currentDrafts) => upsertDraft(currentDrafts, draft));
      setSelectedDraftId(draft.id);
    });
  });

  function getSelectedWalletConnector() {
    if (selectedWalletConnectorId === "baseAccount" && baseAccountConnector) {
      return baseAccountConnector;
    }

    if (selectedWalletConnectorId === "injected" && injectedWalletConnector) {
      return injectedWalletConnector;
    }

    if (
      connectedWalletConnector?.id === "baseAccount" ||
      connectedWalletConnector?.id === "injected"
    ) {
      return connectedWalletConnector;
    }

    return baseAccountConnector ?? injectedWalletConnector;
  }

  async function requestOwnerWalletConnection() {
    if (
      connectedWalletConnector &&
      connectedWalletAddress &&
      connectedOwnerWallet &&
      (connectedWalletConnector.id === "baseAccount" ||
        connectedWalletConnector.id === "injected")
    ) {
      const provider =
        (await connectedWalletConnector.getProvider()) as BrowserEthereumProvider | null;

      if (!provider) {
        throw new WalletFlowError(
          "The connected wallet provider is unavailable in this browser."
        );
      }

      return {
        provider,
        walletAddress: getAddress(connectedWalletAddress)
      };
    }

    const connector = getSelectedWalletConnector();

    if (!connector) {
      throw new WalletFlowError(
        "No supported wallet connector is available in this browser."
      );
    }

    const connection = await connectAsync({
      connector
    });
    const walletAddress = connection.accounts[0];

    if (!walletAddress) {
      throw new WalletFlowError(
        "The wallet did not return an account for this browser session."
      );
    }

    const provider =
      (await connector.getProvider()) as BrowserEthereumProvider | null;

    if (!provider) {
      throw new WalletFlowError(
        "The connected wallet provider is unavailable in this browser."
      );
    }

    const normalizedConnectedWalletAddress = getAddress(walletAddress);

    if (
      !isAddressEqual(
        normalizedConnectedWalletAddress,
        getAddress(ownerWalletAddress)
      )
    ) {
      throw new WalletFlowError(
        "The connected wallet does not match the authenticated studio owner wallet."
      );
    }

    return {
      provider,
      walletAddress: normalizedConnectedWalletAddress
    };
  }

  async function ensureWalletChain(input: {
    chainKey: CollectionContractChainKey;
    provider: BrowserEthereumProvider;
  }) {
    const chain = getWalletChainByKey(input.chainKey);

    try {
      await input.provider.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: `0x${chain.id.toString(16)}`
          }
        ]
      });
    } catch (error) {
      const errorCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "number"
          ? error.code
          : null;

      if (errorCode !== 4902) {
        throw error;
      }

      await input.provider.request({
        method: "wallet_addEthereumChain",
        params: [createWalletAddChainParameters(chain)]
      });
      await input.provider.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: `0x${chain.id.toString(16)}`
          }
        ]
      });
    }

    return chain;
  }

  async function submitWalletTransaction(input: {
    chainKey: CollectionContractChainKey;
    chainLabel: string;
    kind: "deployment" | "mint";
    transaction: {
      data: string;
      to: string | null;
      value: string;
    };
  }) {
    setOnchainFlowState({
      chainLabel: input.chainLabel,
      kind: input.kind,
      message: "Connecting owner wallet…",
      status: "checking_wallet",
      txHash: null
    });

    const { provider, walletAddress } = await requestOwnerWalletConnection();

    setOnchainFlowState({
      chainLabel: input.chainLabel,
      kind: input.kind,
      message: "Switching wallet to the selected chain…",
      status: "switching_chain",
      txHash: null
    });

    const chain = await ensureWalletChain({
      chainKey: input.chainKey,
      provider
    });
    const publicClient = createPublicClient({
      chain,
      transport: custom(provider)
    });

    setOnchainFlowState({
      chainLabel: input.chainLabel,
      kind: input.kind,
      message: "Approve the transaction in your wallet to continue.",
      status: "awaiting_signature",
      txHash: null
    });

    const submittedHash = await provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          data: input.transaction.data,
          from: walletAddress,
          ...(input.transaction.to
            ? {
                to: input.transaction.to
              }
            : {}),
          value: input.transaction.value
        }
      ]
    });

    if (typeof submittedHash !== "string") {
      throw new WalletFlowError(
        "The wallet did not return a transaction hash after submission."
      );
    }

    let finalTxHash = submittedHash;
    let transactionWasCancelled = false;

    setOnchainFlowState({
      chainLabel: input.chainLabel,
      kind: input.kind,
      message: "Transaction submitted. Waiting for an onchain receipt…",
      status: "submitted",
      txHash: submittedHash
    });

    try {
      await publicClient.waitForTransactionReceipt({
        hash: submittedHash as `0x${string}`,
        onReplaced(replacement) {
          finalTxHash = replacement.transaction.hash;

          if (replacement.reason === "cancelled") {
            transactionWasCancelled = true;
            return;
          }

          setOnchainFlowState({
            chainLabel: input.chainLabel,
            kind: input.kind,
            message:
              replacement.reason === "repriced"
                ? "The wallet repriced the transaction. Waiting on the replacement hash…"
                : "The wallet replaced the transaction. Waiting on the replacement hash…",
            status: "replaced",
            txHash: finalTxHash
          });
        },
        timeout: 120_000
      });
    } catch (error) {
      throw new WalletFlowError(
        parseWalletErrorMessage({
          action: "wait",
          error
        }),
        finalTxHash
      );
    }

    if (transactionWasCancelled) {
      throw new WalletFlowError(
        "The transaction was cancelled in the wallet before confirmation."
      );
    }

    setOnchainFlowState({
      chainLabel: input.chainLabel,
      kind: input.kind,
      message: "Confirmed onchain. Recording the verified result…",
      status: "recording",
      txHash: finalTxHash
    });

    return finalTxHash as `0x${string}`;
  }

  async function recordVerifiedDeploymentTx(input: {
    chainKey: CollectionContractChainKey;
    draftId: string;
    txHash: `0x${string}`;
  }) {
    const response = await fetch(
      `/api/studio/collections/${input.draftId}/onchain/deployment`,
      {
        body: JSON.stringify({
          chainKey: input.chainKey,
          deployTxHash: input.txHash
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      }
    );
    const result = await parseJsonResponse({
      response,
      schema: collectionDraftResponseSchema
    });

    applyUpdatedDraft(result.draft);
    setPendingDeploymentTxHash(null);

    return result;
  }

  async function recordVerifiedMintTx(input: {
    draftId: string;
    recipientWalletAddress: string;
    tokenId: number;
    txHash: `0x${string}`;
  }) {
    const response = await fetch(
      `/api/studio/collections/${input.draftId}/onchain/mints`,
      {
        body: JSON.stringify({
          recipientWalletAddress: input.recipientWalletAddress,
          tokenId: input.tokenId,
          txHash: input.txHash
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      }
    );
    const result = await parseJsonResponse({
      response,
      schema: collectionDraftResponseSchema
    });

    applyUpdatedDraft(result.draft);
    setPendingMintTxHash(null);

    return result;
  }

  async function handleConnectWallet() {
    setNotice({
      message: "Connecting owner wallet…",
      tone: "info"
    });

    try {
      await requestOwnerWalletConnection();
      setNotice({
        message: "Owner wallet connected.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message: parseWalletErrorMessage({
          action: "connect",
          error
        }),
        tone: "error"
      });
    }
  }

  async function handleDisconnectWallet() {
    setNotice({
      message: "Disconnecting wallet session…",
      tone: "info"
    });

    try {
      await disconnectAsync();
      setNotice({
        message: "Wallet disconnected from this browser session.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Wallet disconnection failed.",
        tone: "error"
      });
    }
  }

  async function handleCreateDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsCreating(true);
    setNotice({
      message: "Creating collection draft…",
      tone: "info"
    });

    try {
      const response = await fetch("/api/studio/collections", {
        body: JSON.stringify({
          description: createDescription,
          title: createTitle
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const result = await parseJsonResponse({
        response,
        schema: collectionDraftResponseSchema
      });

      applyUpdatedDraft(result.draft);
      setCreateTitle("");
      setCreateDescription("");
      setNotice({
        message: "Collection draft created.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Collection draft could not be created.",
        tone: "error"
      });
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSaveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedDraft) {
      return;
    }

    setSavingDraftId(selectedDraft.id);
    setNotice({
      message: "Saving collection draft…",
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/collections/${selectedDraft.id}`,
        {
          body: JSON.stringify({
            description: editorState.description,
            slug: editorState.slug,
            status: editorState.status,
            title: editorState.title
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "PATCH"
        }
      );
      const result = await parseJsonResponse({
        response,
        schema: collectionDraftResponseSchema
      });

      applyUpdatedDraft(result.draft);
      setNotice({
        message: "Collection draft saved.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Collection draft could not be saved.",
        tone: "error"
      });
    } finally {
      setSavingDraftId(null);
    }
  }

  async function handlePublishDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedDraft) {
      return;
    }

    setPublishingDraftId(selectedDraft.id);
    setNotice({
      message: selectedDraft.publication
        ? "Updating published collection…"
        : "Publishing collection draft…",
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/collections/${selectedDraft.id}/publish`,
        {
          body: JSON.stringify({
            brandId: selectedPublicationTarget?.brandId ?? null
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        }
      );
      const result = await parseJsonResponse({
        response,
        schema: collectionDraftResponseSchema
      });

      applyUpdatedDraft(result.draft);
      setNotice({
        message: result.draft.publication
          ? `Published to ${result.draft.publication.publicPath}.`
          : "Collection draft published.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Collection draft could not be published.",
        tone: "error"
      });
    } finally {
      setPublishingDraftId(null);
    }
  }

  async function handleUnpublishDraft() {
    if (!selectedDraft) {
      return;
    }

    setUnpublishingDraftId(selectedDraft.id);
    setNotice({
      message: "Unpublishing collection draft…",
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/collections/${selectedDraft.id}/publish`,
        {
          method: "DELETE"
        }
      );
      const result = await parseJsonResponse({
        response,
        schema: collectionDraftResponseSchema
      });

      applyUpdatedDraft(result.draft);
      setNotice({
        message: "Published collection removed from the public route.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Published collection could not be removed.",
        tone: "error"
      });
    } finally {
      setUnpublishingDraftId(null);
    }
  }

  async function handleSavePublicationMerchandising(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedDraft?.publication) {
      return;
    }

    setSavingPublicationDraftId(selectedDraft.id);
    setNotice({
      message: "Saving publication merchandising…",
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/collections/${selectedDraft.id}/publish`,
        {
          body: JSON.stringify({
            displayOrder: publicationMerchandisingState.displayOrder,
            endAt: toOptionalIsoTimestamp(publicationMerchandisingState.endAt),
            heroGeneratedAssetId:
              publicationMerchandisingState.heroGeneratedAssetId || null,
            isFeatured: publicationMerchandisingState.isFeatured,
            launchAt: toOptionalIsoTimestamp(
              publicationMerchandisingState.launchAt
            ),
            priceAmountMinor: toOptionalPositiveInteger(
              publicationMerchandisingState.priceAmountMinor
            ),
            priceCurrency:
              publicationMerchandisingState.priceCurrency.trim() || null,
            priceLabel: publicationMerchandisingState.priceLabel || null,
            primaryCtaHref:
              publicationMerchandisingState.primaryCtaHref || null,
            primaryCtaLabel:
              publicationMerchandisingState.primaryCtaLabel || null,
            secondaryCtaHref:
              publicationMerchandisingState.secondaryCtaHref || null,
            secondaryCtaLabel:
              publicationMerchandisingState.secondaryCtaLabel || null,
            soldCount: Number.parseInt(
              publicationMerchandisingState.soldCount || "0",
              10
            ),
            storefrontBody:
              publicationMerchandisingState.storefrontBody || null,
            storefrontHeadline:
              publicationMerchandisingState.storefrontHeadline || null,
            storefrontStatus: publicationMerchandisingState.storefrontStatus,
            totalSupply: toOptionalPositiveInteger(
              publicationMerchandisingState.totalSupply
            )
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "PATCH"
        }
      );
      const result = await parseJsonResponse({
        response,
        schema: collectionDraftResponseSchema
      });

      applyUpdatedDraft(result.draft);
      setNotice({
        message: "Publication merchandising saved.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Publication merchandising could not be saved.",
        tone: "error"
      });
    } finally {
      setSavingPublicationDraftId(null);
    }
  }

  async function handleDeployWithWallet() {
    if (!selectedDraft?.publication) {
      return;
    }

    setDeployingDraftId(selectedDraft.id);
    setNotice({
      message: "Preparing deployment transaction…",
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/collections/${selectedDraft.id}/onchain/deployment-intent`,
        {
          body: JSON.stringify({
            chainKey: deploymentChainKey
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        }
      );
      const intent = await parseJsonResponse({
        response,
        schema: collectionContractDeploymentIntentResponseSchema
      });

      setDeploymentIntentJson(JSON.stringify(intent, null, 2));
      setOnchainFlowState({
        chainLabel: intent.deployment.chain.label,
        kind: "deployment",
        message: "Prepared deployment intent. Opening wallet flow…",
        status: "preparing",
        txHash: null
      });

      const txHash = await submitWalletTransaction({
        chainKey: intent.deployment.chain.key,
        chainLabel: intent.deployment.chain.label,
        kind: "deployment",
        transaction: intent.deployment.transaction
      });

      setPendingDeploymentTxHash(txHash);
      await recordVerifiedDeploymentTx({
        chainKey: intent.deployment.chain.key,
        draftId: selectedDraft.id,
        txHash
      });
      setOnchainFlowState({
        chainLabel: intent.deployment.chain.label,
        kind: "deployment",
        message: "Deployment confirmed and recorded from chain state.",
        status: "success",
        txHash
      });
      setNotice({
        message: "Contract deployed, verified, and recorded.",
        tone: "success"
      });
    } catch (error) {
      const message = parseWalletErrorMessage({
        action: "deploy",
        error
      });
      const txHash = error instanceof WalletFlowError ? error.txHash : null;

      if (txHash) {
        setPendingDeploymentTxHash(txHash);
      }

      setOnchainFlowState((current) => ({
        chainLabel:
          current?.chainLabel ?? getWalletChainByKey(deploymentChainKey).name,
        kind: "deployment",
        message,
        status: "failed",
        txHash
      }));
      setNotice({
        message,
        tone: "error"
      });
    } finally {
      setDeployingDraftId(null);
    }
  }

  async function handleRetryDeploymentRecord() {
    if (!selectedDraft?.publication || !pendingDeploymentTxHash) {
      return;
    }

    setDeployingDraftId(selectedDraft.id);
    setOnchainFlowState({
      chainLabel: getWalletChainByKey(deploymentChainKey).name,
      kind: "deployment",
      message: "Retrying deployment confirmation and record…",
      status: "recording",
      txHash: pendingDeploymentTxHash
    });

    try {
      await recordVerifiedDeploymentTx({
        chainKey: deploymentChainKey,
        draftId: selectedDraft.id,
        txHash: pendingDeploymentTxHash as `0x${string}`
      });
      setOnchainFlowState({
        chainLabel: getWalletChainByKey(deploymentChainKey).name,
        kind: "deployment",
        message: "Deployment confirmed and recorded from chain state.",
        status: "success",
        txHash: pendingDeploymentTxHash
      });
      setNotice({
        message: "Contract deployment recorded from verified chain state.",
        tone: "success"
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Deployment confirmation retry failed.";

      setOnchainFlowState({
        chainLabel: getWalletChainByKey(deploymentChainKey).name,
        kind: "deployment",
        message,
        status: "failed",
        txHash: pendingDeploymentTxHash
      });
      setNotice({
        message,
        tone: "error"
      });
    } finally {
      setDeployingDraftId(null);
    }
  }

  async function handleMintWithWallet() {
    if (!selectedDraft?.publication) {
      return;
    }

    setMintingDraftId(selectedDraft.id);
    setNotice({
      message: "Preparing mint transaction…",
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/collections/${selectedDraft.id}/onchain/mint-intent`,
        {
          body: JSON.stringify({
            recipientWalletAddress: mintRequestState.recipientWalletAddress,
            tokenId: Number.parseInt(mintRequestState.tokenId || "0", 10)
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        }
      );
      const intent = await parseJsonResponse({
        response,
        schema: collectionContractMintIntentResponseSchema
      });

      setMintIntentJson(JSON.stringify(intent, null, 2));
      setOnchainFlowState({
        chainLabel: intent.mint.chain.label,
        kind: "mint",
        message: "Prepared mint intent. Opening wallet flow…",
        status: "preparing",
        txHash: null
      });

      const txHash = await submitWalletTransaction({
        chainKey: intent.mint.chain.key,
        chainLabel: intent.mint.chain.label,
        kind: "mint",
        transaction: intent.mint.transaction
      });

      setPendingMintTxHash(txHash);
      await recordVerifiedMintTx({
        draftId: selectedDraft.id,
        recipientWalletAddress: intent.mint.recipientWalletAddress,
        tokenId: intent.mint.tokenId,
        txHash
      });
      setOnchainFlowState({
        chainLabel: intent.mint.chain.label,
        kind: "mint",
        message: "Mint confirmed and recorded from chain state.",
        status: "success",
        txHash
      });
      setNotice({
        message: "Mint confirmed, verified, and recorded.",
        tone: "success"
      });
    } catch (error) {
      const message = parseWalletErrorMessage({
        action: "mint",
        error
      });
      const txHash = error instanceof WalletFlowError ? error.txHash : null;

      if (txHash) {
        setPendingMintTxHash(txHash);
      }

      setOnchainFlowState((current) => ({
        chainLabel:
          current?.chainLabel ??
          selectedDraft.publication?.activeDeployment?.chain.label ??
          getWalletChainByKey(deploymentChainKey).name,
        kind: "mint",
        message,
        status: "failed",
        txHash
      }));
      setNotice({
        message,
        tone: "error"
      });
    } finally {
      setMintingDraftId(null);
    }
  }

  async function handleRetryMintRecord() {
    if (!selectedDraft?.publication || !pendingMintTxHash) {
      return;
    }

    const tokenId = Number.parseInt(mintRequestState.tokenId || "0", 10);

    setMintingDraftId(selectedDraft.id);
    setOnchainFlowState({
      chainLabel:
        selectedDraft.publication.activeDeployment?.chain.label ??
        getWalletChainByKey(deploymentChainKey).name,
      kind: "mint",
      message: "Retrying mint confirmation and record…",
      status: "recording",
      txHash: pendingMintTxHash
    });

    try {
      await recordVerifiedMintTx({
        draftId: selectedDraft.id,
        recipientWalletAddress: mintRequestState.recipientWalletAddress,
        tokenId,
        txHash: pendingMintTxHash as `0x${string}`
      });
      setOnchainFlowState({
        chainLabel:
          selectedDraft.publication.activeDeployment?.chain.label ??
          getWalletChainByKey(deploymentChainKey).name,
        kind: "mint",
        message: "Mint confirmed and recorded from chain state.",
        status: "success",
        txHash: pendingMintTxHash
      });
      setNotice({
        message: "Mint recorded from verified chain state.",
        tone: "success"
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Mint confirmation retry failed.";

      setOnchainFlowState({
        chainLabel:
          selectedDraft.publication.activeDeployment?.chain.label ??
          getWalletChainByKey(deploymentChainKey).name,
        kind: "mint",
        message,
        status: "failed",
        txHash: pendingMintTxHash
      });
      setNotice({
        message,
        tone: "error"
      });
    } finally {
      setMintingDraftId(null);
    }
  }

  async function addGeneratedAssetToSelectedDraft(generatedAssetId: string) {
    if (!selectedDraft) {
      return;
    }

    setBusyItemKey(`add:${generatedAssetId}`);
    setNotice({
      message: "Adding generated asset to collection draft…",
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/collections/${selectedDraft.id}/items`,
        {
          body: JSON.stringify({
            generatedAssetId
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        }
      );
      const result = await parseJsonResponse({
        response,
        schema: collectionDraftResponseSchema
      });

      applyUpdatedDraft(result.draft);
      setNotice({
        message: "Generated asset added to collection draft.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Generated asset could not be added to the collection draft.",
        tone: "error"
      });
    } finally {
      setBusyItemKey(null);
    }
  }

  async function removeDraftItem(itemId: string) {
    if (!selectedDraft) {
      return;
    }

    setBusyItemKey(`remove:${itemId}`);
    setNotice({
      message: "Removing curated asset from collection draft…",
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/collections/${selectedDraft.id}/items/${itemId}`,
        {
          method: "DELETE"
        }
      );
      const result = await parseJsonResponse({
        response,
        schema: collectionDraftResponseSchema
      });

      applyUpdatedDraft(result.draft);
      setNotice({
        message: "Curated asset removed from collection draft.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Curated asset could not be removed from the collection draft.",
        tone: "error"
      });
    } finally {
      setBusyItemKey(null);
    }
  }

  async function moveDraftItem(itemId: string, direction: -1 | 1) {
    if (!selectedDraft) {
      return;
    }

    const currentIndex = selectedDraft.items.findIndex(
      (item) => item.id === itemId
    );

    if (currentIndex < 0) {
      return;
    }

    const nextIndex = currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= selectedDraft.items.length) {
      return;
    }

    const reorderedItemIds = selectedDraft.items.map((item) => item.id);
    const currentItemId = reorderedItemIds[currentIndex];
    const nextItemId = reorderedItemIds[nextIndex];

    if (!currentItemId || !nextItemId) {
      return;
    }

    reorderedItemIds[currentIndex] = nextItemId;
    reorderedItemIds[nextIndex] = currentItemId;

    setBusyItemKey(`reorder:${itemId}`);
    setNotice({
      message: "Reordering curated assets…",
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/collections/${selectedDraft.id}/items/reorder`,
        {
          body: JSON.stringify({
            itemIds: reorderedItemIds
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        }
      );
      const result = await parseJsonResponse({
        response,
        schema: collectionDraftResponseSchema
      });

      applyUpdatedDraft(result.draft);
      setNotice({
        message: "Curated asset order updated.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Curated asset order could not be updated.",
        tone: "error"
      });
    } finally {
      setBusyItemKey(null);
    }
  }

  const reviewReadyCount = drafts.filter(
    (draft) => draft.status === "review_ready"
  ).length;
  const publishedCount = drafts.filter((draft) => draft.publication).length;
  const featuredPublishedCount = drafts.filter(
    (draft) => draft.publication?.isFeatured
  ).length;
  const deployedCount = drafts.filter(
    (draft) => draft.publication?.activeDeployment
  ).length;
  const curatedAssetCount = drafts.reduce(
    (count, draft) => count + draft.itemCount,
    0
  );
  const approvedCandidateCount = generatedAssetCandidates.filter(
    (candidate) => candidate.moderationStatus === "approved"
  ).length;
  const selectedDraftPreviewGeneratedAssetId = selectedDraft
    ? getDraftPreviewGeneratedAssetId(selectedDraft)
    : null;
  const selectedDraftPreviewUrl = selectedDraftPreviewGeneratedAssetId
    ? (generatedAssetPreviewUrls[selectedDraftPreviewGeneratedAssetId] ?? null)
    : null;
  const selectedDraftPublicPath = selectedDraft
    ? (selectedDraft.publication?.publicPath ??
      (selectedPublicationTarget
        ? `${selectedPublicationTarget.publicBrandPath}/collections/${selectedDraft.slug}`
        : "/brands/[brandSlug]/collections/[collectionSlug]"))
    : null;
  const selectedDraftMetadataPath = selectedDraft?.publication
    ? buildPublishedCollectionMetadataPath(selectedDraft.publication.publicPath)
    : null;
  const selectedDraftContractPath = selectedDraft?.publication
    ? buildPublishedCollectionContractPath({
        brandSlug: selectedDraft.publication.brandSlug,
        collectionSlug: selectedDraft.publication.collectionSlug
      })
    : null;
  const selectedDraftLaunchNotes: Array<{
    body: string;
    title: string;
    tone: "error" | "info" | "success";
  }> = [];

  if (selectedDraft) {
    if (selectedDraft.itemCount === 0) {
      selectedDraftLaunchNotes.push({
        body: "Curate at least one approved output from the candidate rail before this release can move forward.",
        title: "Composition required",
        tone: "error"
      });
    }

    if (selectedDraftHasInvalidItems) {
      selectedDraftLaunchNotes.push({
        body: selectedDraftNeedsRepairDowngrade
          ? "This release should move back to draft until every curated item returns to approved status."
          : "Replace or remove the curated items that are no longer approved before pushing this release further.",
        title: "Curation repair required",
        tone: "error"
      });
    }

    if (selectedDraft.status !== "review_ready") {
      selectedDraftLaunchNotes.push({
        body: "Save the draft as review ready when the title, route, story, and curated order are locked.",
        title: "Review readiness is still pending",
        tone: "info"
      });
    }

    if (!selectedPublicationTarget) {
      selectedDraftLaunchNotes.push({
        body: "Configure a publication target in Studio Settings before publishing any release.",
        title: "Publication target missing",
        tone: "error"
      });
    }

    if (
      selectedDraft.publication &&
      !selectedDraft.publication.activeDeployment
    ) {
      selectedDraftLaunchNotes.push({
        body: "The public release is live, but no verified contract deployment has been recorded yet.",
        title: "Onchain deployment pending",
        tone: "info"
      });
    }

    if (
      selectedDraft.publication?.activeDeployment &&
      selectedDraft.publication.mintedTokenCount === 0
    ) {
      selectedDraftLaunchNotes.push({
        body: "The contract is deployed. Use the mint controls when collector or operator issuance should begin.",
        title: "Mint path ready",
        tone: "success"
      });
    }
  }

  return (
    <PageShell
      eyebrow="Studio collections"
      title="Compose releases, publish with intent, and supervise launch state"
      lead="Use Collections as the internal launch builder: shape the draft story, sequence curated art, read blockers at a glance, and move each release from review to public and onchain state without leaving the workspace."
      actions={
        <>
          <ActionButton
            disabled={isRefreshing}
            onClick={() => {
              void refreshDrafts();
            }}
            type="button"
          >
            {isRefreshing ? "Refreshing…" : "Refresh workspace"}
          </ActionButton>
          <ActionLink href="/studio/assets" tone="action">
            Open assets
          </ActionLink>
          <ActionLink href="/studio/settings" tone="action">
            Open settings
          </ActionLink>
          <ActionLink href="/studio" tone="inline">
            Back to studio
          </ActionLink>
        </>
      }
      tone="studio"
    >
      <div className={collectionSectionGridClasses}>
        <aside className={collectionWorkspaceColumnClasses}>
          <SurfaceCard
            body="Drafts, attention, and creation live together here so the operator can see what exists, what is blocked, and what is nearest to launch."
            eyebrow="Release browser"
            title="Draft inventory"
          >
            <div className="grid gap-4">
              <div className={collectionBrowserStatGridClasses}>
                <MetricTile label="Drafts" value={drafts.length.toString()} />
                <MetricTile
                  label="Review ready"
                  value={reviewReadyCount.toString()}
                />
                <MetricTile
                  label="Published"
                  value={publishedCount.toString()}
                />
                <MetricTile label="Deployed" value={deployedCount.toString()} />
                <MetricTile
                  label="Featured"
                  value={featuredPublishedCount.toString()}
                />
                <MetricTile
                  label="Curated items"
                  value={curatedAssetCount.toString()}
                />
              </div>
              <div className={collectionCuesClasses}>
                <Pill>{approvedCandidateCount} approved outputs ready</Pill>
                <Pill>{generatedAssetCandidates.length} recent candidates</Pill>
                <Pill>Owner {shortHex(ownerWalletAddress)}</Pill>
              </div>
              <form className="grid gap-4" onSubmit={handleCreateDraft}>
                <div className={collectionPanelHeaderClasses}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                    Create draft
                  </p>
                  <h2>Start a new release object</h2>
                  <p>
                    Create the shell first, then shape its story, composition,
                    publication state, and onchain path.
                  </p>
                </div>
                <FieldStack>
                  <FieldLabel>Title</FieldLabel>
                  <InputField
                    className={collectionInputFieldClasses}
                    maxLength={120}
                    onChange={(event) => {
                      setCreateTitle(event.target.value);
                    }}
                    placeholder="Genesis Portrait Set"
                    required
                    value={createTitle}
                  />
                </FieldStack>
                <FieldStack>
                  <FieldLabel>Internal framing</FieldLabel>
                  <TextAreaField
                    className={collectionInputFieldClasses}
                    maxLength={1000}
                    onChange={(event) => {
                      setCreateDescription(event.target.value);
                    }}
                    placeholder="What kind of release is this and why does it exist?"
                    rows={4}
                    value={createDescription}
                  />
                </FieldStack>
                <div className={collectionActionRowClasses}>
                  <ActionButton disabled={isCreating} type="submit">
                    {isCreating ? "Creating…" : "Create release draft"}
                  </ActionButton>
                </div>
              </form>
              <div className="grid gap-3">
                {drafts.length === 0 ? (
                  <EmptyState className="bg-[color:var(--color-surface-strong)]/55 leading-6">
                    No collection drafts exist yet. Create one to begin the
                    release workflow.
                  </EmptyState>
                ) : (
                  drafts.map((draft) => (
                    <CollectionDraftBrowserCard
                      draft={draft}
                      hasInvalidItems={draft.items.some(
                        (item) =>
                          item.generatedAsset.moderationStatus !== "approved"
                      )}
                      isSelected={draft.id === selectedDraft?.id}
                      key={draft.id}
                      onSelect={() => {
                        setSelectedDraftId(draft.id);
                        setNotice(null);
                      }}
                      previewUrl={(() => {
                        const previewGeneratedAssetId =
                          getDraftPreviewGeneratedAssetId(draft);

                        return previewGeneratedAssetId
                          ? (generatedAssetPreviewUrls[
                              previewGeneratedAssetId
                            ] ?? null)
                          : null;
                      })()}
                    />
                  ))
                )}
              </div>
            </div>
          </SurfaceCard>
        </aside>

        <section className={collectionWorkspaceColumnClasses}>
          {selectedDraft ? (
            <>
              <SurfaceCard
                body="Define the release identity here, then use the composition board beneath it to turn approved outputs into an ordered edition."
                eyebrow="Active release"
                title={selectedDraft.title}
              >
                <div className="grid gap-5">
                  <CollectibleEditorialBand>
                    <div className={collectionFocusPanelClasses}>
                      <CollectiblePreviewCard
                        badge={
                          selectedDraft.publication
                            ? "Live release shell"
                            : "Draft shell"
                        }
                        className="bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.03))]"
                        imageAlt={selectedDraft.title}
                        imageUrl={selectedDraftPreviewUrl}
                        meta={`${selectedDraft.itemCount} curated items · ${formatCandidateTimestamp(
                          selectedDraft.updatedAt
                        )}`}
                        subtitle={selectedDraft.slug}
                        title={selectedDraft.title}
                      />
                      <div className={collectionFocusSummaryClasses}>
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill>{formatDraftStatus(selectedDraft.status)}</Pill>
                          <Pill>{selectedDraft.itemCount} curated items</Pill>
                          <Pill>
                            Updated{" "}
                            {formatCandidateTimestamp(selectedDraft.updatedAt)}
                          </Pill>
                          {selectedDraft.publication ? (
                            <Pill>Published</Pill>
                          ) : null}
                          {selectedDraft.publication?.isFeatured ? (
                            <Pill>Featured release</Pill>
                          ) : null}
                          {selectedDraftHasInvalidItems ? (
                            <Pill>
                              {selectedDraftInvalidItems.length} invalid item
                              {selectedDraftInvalidItems.length === 1
                                ? ""
                                : "s"}
                            </Pill>
                          ) : null}
                        </div>
                        <div className="grid gap-2">
                          <h2>{selectedDraft.title}</h2>
                          <p>
                            {selectedDraft.description?.trim() ||
                              "Add internal story framing so reviewers and operators understand the release intent."}
                          </p>
                        </div>
                        <div className={collectionStatGridClasses}>
                          <div className="grid gap-0.5 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)]/75 p-3 text-sm">
                            <span className="text-[color:var(--color-muted)]">
                              Route
                            </span>
                            <strong>{selectedDraftPublicPath}</strong>
                          </div>
                          <div className="grid gap-0.5 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)]/75 p-3 text-sm">
                            <span className="text-[color:var(--color-muted)]">
                              Publication
                            </span>
                            <strong>
                              {selectedDraft.publication
                                ? formatStorefrontStatus(
                                    selectedDraft.publication.storefrontStatus
                                  )
                                : "Not published"}
                            </strong>
                          </div>
                          <div className="grid gap-0.5 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)]/75 p-3 text-sm">
                            <span className="text-[color:var(--color-muted)]">
                              Onchain
                            </span>
                            <strong>
                              {selectedDraft.publication?.activeDeployment
                                ? selectedDraft.publication.activeDeployment
                                    .chain.label
                                : "No deployment"}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollectibleEditorialBand>
                  <form className="grid gap-3" onSubmit={handleSaveDraft}>
                    <div className={collectionCreateFormGridClasses}>
                      <FieldStack>
                        <FieldLabel>Title</FieldLabel>
                        <InputField
                          className={collectionInputFieldClasses}
                          maxLength={120}
                          onChange={(event) => {
                            setEditorState((current) => ({
                              ...current,
                              title: event.target.value
                            }));
                          }}
                          required
                          value={editorState.title}
                        />
                      </FieldStack>
                      <FieldStack>
                        <FieldLabel>Slug</FieldLabel>
                        <InputField
                          className={collectionInputFieldClasses}
                          maxLength={80}
                          onChange={(event) => {
                            setEditorState((current) => ({
                              ...current,
                              slug: event.target.value
                            }));
                          }}
                          pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                          required
                          value={editorState.slug}
                        />
                      </FieldStack>
                      <FieldStack>
                        <FieldLabel>Workflow state</FieldLabel>
                        <select
                          className={collectionInputFieldClasses}
                          onChange={(event) => {
                            setEditorState((current) => ({
                              ...current,
                              status: event.target
                                .value as CollectionDraftStatus
                            }));
                          }}
                          value={editorState.status}
                        >
                          <option value="draft">Draft</option>
                          <option value="review_ready">Review ready</option>
                        </select>
                      </FieldStack>
                      <FieldStack className="md:col-span-2">
                        <FieldLabel>Internal story</FieldLabel>
                        <TextAreaField
                          className={collectionInputFieldClasses}
                          maxLength={1000}
                          onChange={(event) => {
                            setEditorState((current) => ({
                              ...current,
                              description: event.target.value
                            }));
                          }}
                          rows={5}
                          value={editorState.description}
                        />
                      </FieldStack>
                    </div>
                    <div className={collectionActionRowClasses}>
                      <ActionButton
                        disabled={savingDraftId === selectedDraft.id}
                        type="submit"
                      >
                        {savingDraftId === selectedDraft.id
                          ? "Saving…"
                          : "Save release identity"}
                      </ActionButton>
                    </div>
                  </form>
                </div>
              </SurfaceCard>

              <SurfaceCard
                body="The composition board is the release backbone. The order below becomes the edition order, publication payload, and token numbering path."
                eyebrow="Composition board"
                title="Curated release sequence"
              >
                {selectedDraft.items.length === 0 ? (
                  <EmptyState className="bg-[color:var(--color-surface-strong)]/55 leading-6">
                    No generated assets have been curated into this release yet.
                    Add approved outputs from the candidate rail.
                  </EmptyState>
                ) : (
                  <div className={collectionArtCardWideGridClasses}>
                    {selectedDraft.items.map((item, index) => (
                      <CollectionArtworkCard
                        actions={
                          <>
                            <ActionButton
                              disabled={
                                busyItemKey !== null ||
                                savingDraftId === selectedDraft.id ||
                                index === 0
                              }
                              onClick={() => {
                                void moveDraftItem(item.id, -1);
                              }}
                              type="button"
                            >
                              Move up
                            </ActionButton>
                            <ActionButton
                              disabled={
                                busyItemKey !== null ||
                                savingDraftId === selectedDraft.id ||
                                index === selectedDraft.items.length - 1
                              }
                              onClick={() => {
                                void moveDraftItem(item.id, 1);
                              }}
                              type="button"
                            >
                              Move down
                            </ActionButton>
                            <ActionButton
                              disabled={
                                busyItemKey !== null ||
                                savingDraftId === selectedDraft.id
                              }
                              onClick={() => {
                                void removeDraftItem(item.id);
                              }}
                              type="button"
                            >
                              Remove
                            </ActionButton>
                          </>
                        }
                        key={item.id}
                        meta={
                          <>
                            <span>{item.generatedAsset.pipelineKey}</span>
                            <span>
                              Source {item.generatedAsset.sourceAssetId}
                            </span>
                            <span>
                              Added{" "}
                              {formatCandidateTimestamp(
                                item.generatedAsset.createdAt
                              )}
                            </span>
                          </>
                        }
                        previewUrl={
                          generatedAssetPreviewUrls[
                            item.generatedAsset.generatedAssetId
                          ] ?? null
                        }
                        statusLabel={formatModerationStatus(
                          item.generatedAsset.moderationStatus
                        )}
                        statusTone={
                          item.generatedAsset.moderationStatus === "approved"
                            ? "success"
                            : "danger"
                        }
                        subtitle={`Edition ${item.position}`}
                        title={formatCandidateLabel(item.generatedAsset)}
                      />
                    ))}
                  </div>
                )}
              </SurfaceCard>

              <SurfaceCard
                body="Approved outputs stay on deck here so operators can keep composing the release without bouncing back to the assets workspace."
                eyebrow="Curation rail"
                title="Recent generated outputs"
              >
                {generatedAssetCandidates.length === 0 ? (
                  <EmptyState className="bg-[color:var(--color-surface-strong)]/55 leading-6">
                    No generated assets are available yet. Generate variants in
                    `/studio/assets` first.
                  </EmptyState>
                ) : (
                  <div className={collectionArtGridClasses}>
                    {generatedAssetCandidates.map((candidate) => {
                      const isIncluded = includedGeneratedAssetIds.has(
                        candidate.generatedAssetId
                      );
                      const isApproved =
                        candidate.moderationStatus === "approved";

                      return (
                        <CollectionArtworkCard
                          actions={
                            <>
                              <Pill>Source {candidate.sourceAssetId}</Pill>
                              <ActionButton
                                disabled={
                                  !selectedDraft ||
                                  !isApproved ||
                                  isIncluded ||
                                  busyItemKey !== null ||
                                  savingDraftId !== null
                                }
                                onClick={() => {
                                  void addGeneratedAssetToSelectedDraft(
                                    candidate.generatedAssetId
                                  );
                                }}
                                type="button"
                              >
                                {isIncluded
                                  ? "Included"
                                  : isApproved
                                    ? "Add to release"
                                    : "Awaiting approval"}
                              </ActionButton>
                            </>
                          }
                          key={candidate.generatedAssetId}
                          meta={
                            <>
                              <span>{candidate.pipelineKey}</span>
                              <span>
                                {formatCandidateTimestamp(candidate.createdAt)}
                              </span>
                              <span>
                                {formatModerationStatus(
                                  candidate.moderationStatus
                                )}
                              </span>
                            </>
                          }
                          previewUrl={
                            generatedAssetPreviewUrls[
                              candidate.generatedAssetId
                            ] ?? null
                          }
                          statusLabel={
                            isIncluded
                              ? "Included"
                              : formatModerationStatus(
                                  candidate.moderationStatus
                                )
                          }
                          statusTone={
                            isIncluded
                              ? "success"
                              : candidate.moderationStatus === "approved"
                                ? "default"
                                : "warning"
                          }
                          subtitle={`Variant ${candidate.variantIndex}`}
                          title={formatCandidateLabel(candidate)}
                        />
                      );
                    })}
                  </div>
                )}
              </SurfaceCard>
            </>
          ) : (
            <SurfaceCard
              body="Create a draft from the browser column, then select it to begin composing the release, publication plan, and onchain path."
              eyebrow="No release selected"
              title="Choose a release draft"
            >
              <CollectibleEditorialBand>
                <StudioSceneCard
                  eyebrow="Launch workspace"
                  note="The collections workspace is ready. Select a release draft to unlock composition, publication controls, and onchain supervision."
                  title="No active release selected"
                />
              </CollectibleEditorialBand>
            </SurfaceCard>
          )}
        </section>

        <aside className={collectionStickyRailClasses}>
          {notice ? (
            <SurfaceCard
              body={notice.message}
              eyebrow="Workflow status"
              title={
                notice.tone === "error" ? "Action failed" : "Latest update"
              }
            >
              <CollectionStatusNote
                body={notice.message}
                title={
                  notice.tone === "error" ? "Action failed" : "Latest update"
                }
                tone={
                  notice.tone === "error"
                    ? "error"
                    : notice.tone === "success"
                      ? "success"
                      : "info"
                }
              />
            </SurfaceCard>
          ) : null}

          <SurfaceCard
            body="Publication state, blockers, and release links stay in one control rail so operators can decide quickly whether this draft needs curation, publication, or onchain work."
            eyebrow="Launch rail"
            title={
              selectedDraft?.publication
                ? "Published release control"
                : "Release control"
            }
          >
            {selectedDraft ? (
              <div className="grid gap-4">
                <div className={collectionLaunchGridClasses}>
                  <InsetMetric
                    label="Draft state"
                    detail={`${selectedDraft.itemCount} curated items`}
                    value={formatDraftStatus(selectedDraft.status)}
                  />
                  <InsetMetric
                    label="Publication"
                    detail={selectedDraftPublicPath ?? "Route pending"}
                    value={
                      selectedDraft.publication
                        ? formatStorefrontStatus(
                            selectedDraft.publication.storefrontStatus
                          )
                        : "Not published"
                    }
                  />
                  <InsetMetric
                    label="Onchain"
                    detail={
                      selectedDraft.publication
                        ? `${selectedDraft.publication.mintedTokenCount} recorded mints`
                        : "Publish first"
                    }
                    value={
                      selectedDraft.publication?.activeDeployment
                        ? selectedDraft.publication.activeDeployment.chain.label
                        : "No deployment"
                    }
                  />
                </div>

                {!canManagePublication ? (
                  <CollectionStatusNote
                    body="Operators can shape the release, but publication and merchandising stay owner-only."
                    title="Owner action required"
                    tone="info"
                  />
                ) : null}

                {selectedDraftLaunchNotes.map((note) => (
                  <CollectionStatusNote
                    body={note.body}
                    key={`${note.title}-${note.body}`}
                    title={note.title}
                    tone={note.tone}
                  />
                ))}

                {selectedPublicationTarget ? (
                  <div className="grid gap-3 rounded-2xl border border-[color:var(--color-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] p-4 shadow-[var(--shadow-surface)]">
                    <div className="grid gap-1">
                      <strong>{selectedPublicationTarget.brandName}</strong>
                      <span className="text-sm text-[color:var(--color-muted)]">
                        {selectedPublicationTarget.publicBrandPath}
                      </span>
                      <span className="text-sm text-[color:var(--color-muted)]">
                        Selected route: {selectedDraftPublicPath}
                      </span>
                    </div>
                    <Link
                      className="text-[color:var(--color-accent)] hover:underline hover:underline-offset-4 text-sm"
                      href="/studio/settings"
                    >
                      Edit targets
                    </Link>
                  </div>
                ) : (
                  <EmptyState className="bg-[color:var(--color-surface-strong)]/55 leading-6">
                    Configure `/studio/settings` before publishing a release.
                  </EmptyState>
                )}

                {publicationTargets.length > 1 ? (
                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                      Publication brand
                    </span>
                    <select
                      className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                      disabled={!canManagePublication}
                      onChange={(event) => {
                        setSelectedPublicationTargetId(
                          event.target.value || null
                        );
                      }}
                      value={selectedPublicationTarget?.brandId ?? ""}
                    >
                      {publicationTargets.map((target) => (
                        <option key={target.brandId} value={target.brandId}>
                          {target.brandName} · {target.publicBrandPath}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {selectedDraft.publication &&
                selectedPublicationTarget &&
                selectedDraft.publication.brandSlug !==
                  selectedPublicationTarget.brandSlug ? (
                  <CollectionStatusNote
                    body={`Republishing will move this release from ${selectedDraft.publication.publicPath} to ${selectedDraftPublicPath}.`}
                    title="Republish will move the route"
                    tone="info"
                  />
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <Pill>{selectedDraftPublicPath}</Pill>
                  {selectedPublicationTarget ? (
                    <Pill>{selectedPublicationTarget.brandSlug}</Pill>
                  ) : null}
                  {selectedDraft.publication ? (
                    <Pill>
                      Published{" "}
                      {formatCandidateTimestamp(
                        selectedDraft.publication.publishedAt
                      )}
                    </Pill>
                  ) : null}
                  {selectedDraft.publication ? (
                    <Pill>Order {selectedDraft.publication.displayOrder}</Pill>
                  ) : null}
                  {selectedDraft.publication?.isFeatured ? (
                    <Pill>Featured release</Pill>
                  ) : null}
                  {selectedDraft.publication?.priceLabel ? (
                    <Pill>{selectedDraft.publication.priceLabel}</Pill>
                  ) : null}
                </div>

                <form className="grid gap-3" onSubmit={handlePublishDraft}>
                  <div className={collectionActionRowClasses}>
                    <ActionButton
                      disabled={
                        !canManagePublication ||
                        !selectedPublicationTarget ||
                        publishingDraftId === selectedDraft.id ||
                        selectedDraft.status !== "review_ready" ||
                        selectedDraft.itemCount === 0
                      }
                      type="submit"
                    >
                      {publishingDraftId === selectedDraft.id
                        ? "Publishing…"
                        : selectedDraft.publication
                          ? "Republish release"
                          : "Publish release"}
                    </ActionButton>
                    <ActionButton
                      disabled={
                        !canManagePublication ||
                        !selectedDraft.publication ||
                        unpublishingDraftId === selectedDraft.id
                      }
                      onClick={() => {
                        void handleUnpublishDraft();
                      }}
                      tone="secondary"
                      type="button"
                    >
                      {unpublishingDraftId === selectedDraft.id
                        ? "Unpublishing…"
                        : "Unpublish"}
                    </ActionButton>
                  </div>
                </form>

                <div className={collectionLinkGridClasses}>
                  {!selectedPublicationTarget ? (
                    <Link
                      className="text-[color:var(--color-accent)] hover:underline hover:underline-offset-4 text-sm"
                      href="/studio/settings"
                    >
                      Configure publication targets
                    </Link>
                  ) : null}
                  {selectedDraft.publication ? (
                    <Link
                      className="text-[color:var(--color-accent)] hover:underline hover:underline-offset-4 text-sm"
                      href={selectedDraft.publication.publicPath}
                      target="_blank"
                    >
                      Open public route
                    </Link>
                  ) : null}
                  {selectedDraftContractPath ? (
                    <Link
                      className="text-[color:var(--color-accent)] hover:underline hover:underline-offset-4 text-sm"
                      href={selectedDraftContractPath}
                      target="_blank"
                    >
                      Open contract manifest
                    </Link>
                  ) : null}
                  {selectedDraftMetadataPath ? (
                    <Link
                      className="text-[color:var(--color-accent)] hover:underline hover:underline-offset-4 text-sm"
                      href={selectedDraftMetadataPath}
                      target="_blank"
                    >
                      Open metadata manifest
                    </Link>
                  ) : null}
                  {selectedDraft.publication && selectedDraft.items[0] ? (
                    <Link
                      className="text-[color:var(--color-accent)] hover:underline hover:underline-offset-4 text-sm"
                      href={createCollectionTokenUriPath({
                        brandSlug: selectedDraft.publication.brandSlug,
                        collectionSlug:
                          selectedDraft.publication.collectionSlug,
                        tokenId: selectedDraft.items[0].position
                      })}
                      target="_blank"
                    >
                      Open first token URI
                    </Link>
                  ) : null}
                  {selectedDraftMetadataPath && selectedDraft.items[0] ? (
                    <Link
                      className="text-[color:var(--color-accent)] hover:underline hover:underline-offset-4 text-sm"
                      href={`${selectedDraftMetadataPath}/${selectedDraft.items[0].position}`}
                      target="_blank"
                    >
                      Open first edition metadata
                    </Link>
                  ) : null}
                  {selectedDraft.publication && selectedPublicationTarget ? (
                    <Link
                      className="text-[color:var(--color-accent)] hover:underline hover:underline-offset-4 text-sm"
                      href={selectedPublicationTarget.publicBrandPath}
                      target="_blank"
                    >
                      Open brand landing
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : (
              <EmptyState className="bg-[color:var(--color-surface-strong)]/55 leading-6">
                Select a draft to inspect publication state and launch controls.
              </EmptyState>
            )}
          </SurfaceCard>

          {selectedDraft?.publication ? (
            <SurfaceCard
              body="Storefront metadata stays separate from the draft identity so operators can tune live presentation without losing track of the underlying release object."
              eyebrow="Storefront control"
              title="Merchandising and release timing"
            >
              <form
                className="grid gap-4"
                onSubmit={handleSavePublicationMerchandising}
              >
                <fieldset
                  className="grid gap-4"
                  disabled={
                    !canManagePublication ||
                    savingPublicationDraftId === selectedDraft.id
                  }
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Storefront status
                      </span>
                      <select
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        onChange={(event) => {
                          setPublicationMerchandisingState((current) => ({
                            ...current,
                            storefrontStatus: event.target.value as
                              | "upcoming"
                              | "live"
                              | "sold_out"
                              | "ended"
                          }));
                        }}
                        value={publicationMerchandisingState.storefrontStatus}
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="live">Live</option>
                        <option value="sold_out">Sold out</option>
                        <option value="ended">Ended</option>
                      </select>
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Display order
                      </span>
                      <input
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        min={0}
                        onChange={(event) => {
                          setPublicationMerchandisingState((current) => ({
                            ...current,
                            displayOrder: Number.parseInt(
                              event.target.value || "0",
                              10
                            )
                          }));
                        }}
                        type="number"
                        value={publicationMerchandisingState.displayOrder}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Launch time
                      </span>
                      <input
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        onChange={(event) => {
                          setPublicationMerchandisingState((current) => ({
                            ...current,
                            launchAt: event.target.value
                          }));
                        }}
                        type="datetime-local"
                        value={publicationMerchandisingState.launchAt}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        End time
                      </span>
                      <input
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        onChange={(event) => {
                          setPublicationMerchandisingState((current) => ({
                            ...current,
                            endAt: event.target.value
                          }));
                        }}
                        type="datetime-local"
                        value={publicationMerchandisingState.endAt}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Price label
                      </span>
                      <input
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        maxLength={60}
                        onChange={(event) => {
                          setPublicationMerchandisingState((current) => ({
                            ...current,
                            priceLabel: event.target.value
                          }));
                        }}
                        placeholder="0.08 ETH"
                        value={publicationMerchandisingState.priceLabel}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Price amount (minor)
                      </span>
                      <input
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        min={1}
                        onChange={(event) => {
                          setPublicationMerchandisingState((current) => ({
                            ...current,
                            priceAmountMinor: event.target.value
                          }));
                        }}
                        placeholder="1800"
                        type="number"
                        value={publicationMerchandisingState.priceAmountMinor}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Price currency
                      </span>
                      <input
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        maxLength={3}
                        onChange={(event) => {
                          setPublicationMerchandisingState((current) => ({
                            ...current,
                            priceCurrency: event.target.value.toUpperCase()
                          }));
                        }}
                        placeholder="USD"
                        value={publicationMerchandisingState.priceCurrency}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Total supply
                      </span>
                      <input
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        min={1}
                        onChange={(event) => {
                          setPublicationMerchandisingState((current) => ({
                            ...current,
                            totalSupply: event.target.value
                          }));
                        }}
                        type="number"
                        value={publicationMerchandisingState.totalSupply}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Sold count
                      </span>
                      <input
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        min={0}
                        onChange={(event) => {
                          setPublicationMerchandisingState((current) => ({
                            ...current,
                            soldCount: event.target.value
                          }));
                        }}
                        type="number"
                        value={publicationMerchandisingState.soldCount}
                      />
                    </label>
                    <label className="grid gap-1.5 md:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Hero asset
                      </span>
                      <select
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        onChange={(event) => {
                          setPublicationMerchandisingState((current) => ({
                            ...current,
                            heroGeneratedAssetId: event.target.value
                          }));
                        }}
                        value={
                          publicationMerchandisingState.heroGeneratedAssetId
                        }
                      >
                        <option value="">Use first published item</option>
                        {selectedDraft.items.map((item) => (
                          <option
                            key={item.generatedAsset.generatedAssetId}
                            value={item.generatedAsset.generatedAssetId}
                          >
                            {formatCandidateLabel(item.generatedAsset)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Storefront headline
                      </span>
                      <input
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        maxLength={120}
                        onChange={(event) => {
                          setPublicationMerchandisingState((current) => ({
                            ...current,
                            storefrontHeadline: event.target.value
                          }));
                        }}
                        placeholder="A midnight launch built for collectors."
                        value={publicationMerchandisingState.storefrontHeadline}
                      />
                    </label>
                    <label className="grid gap-1.5 md:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Storefront body
                      </span>
                      <textarea
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] min-h-[10rem] resize-y focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        maxLength={600}
                        onChange={(event) => {
                          setPublicationMerchandisingState((current) => ({
                            ...current,
                            storefrontBody: event.target.value
                          }));
                        }}
                        rows={4}
                        value={publicationMerchandisingState.storefrontBody}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Primary CTA label
                      </span>
                      <input
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        maxLength={40}
                        onChange={(event) => {
                          setPublicationMerchandisingState((current) => ({
                            ...current,
                            primaryCtaLabel: event.target.value
                          }));
                        }}
                        placeholder="Join the launch"
                        value={publicationMerchandisingState.primaryCtaLabel}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Primary CTA URL
                      </span>
                      <input
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        onChange={(event) => {
                          setPublicationMerchandisingState((current) => ({
                            ...current,
                            primaryCtaHref: event.target.value
                          }));
                        }}
                        placeholder="https://launch.example.com"
                        type="url"
                        value={publicationMerchandisingState.primaryCtaHref}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Secondary CTA label
                      </span>
                      <input
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        maxLength={40}
                        onChange={(event) => {
                          setPublicationMerchandisingState((current) => ({
                            ...current,
                            secondaryCtaLabel: event.target.value
                          }));
                        }}
                        placeholder="Read the story"
                        value={publicationMerchandisingState.secondaryCtaLabel}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Secondary CTA URL
                      </span>
                      <input
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        onChange={(event) => {
                          setPublicationMerchandisingState((current) => ({
                            ...current,
                            secondaryCtaHref: event.target.value
                          }));
                        }}
                        placeholder="https://launch.example.com/story"
                        type="url"
                        value={publicationMerchandisingState.secondaryCtaHref}
                      />
                    </label>
                  </div>
                  <label className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)]/55 px-4 py-3 text-sm text-[color:var(--color-text)]">
                    <input
                      checked={publicationMerchandisingState.isFeatured}
                      className="h-4 w-4 rounded border-[color:var(--color-line)] text-[color:var(--color-accent)] focus:ring-[color:var(--color-accent)]"
                      onChange={(event) => {
                        setPublicationMerchandisingState((current) => ({
                          ...current,
                          isFeatured: event.target.checked
                        }));
                      }}
                      type="checkbox"
                    />
                    <span>Feature this release on the brand landing page</span>
                  </label>
                  <div className={collectionActionRowClasses}>
                    <ActionButton
                      disabled={
                        !canManagePublication ||
                        savingPublicationDraftId === selectedDraft.id
                      }
                      type="submit"
                    >
                      {savingPublicationDraftId === selectedDraft.id
                        ? "Saving merchandising…"
                        : "Save merchandising"}
                    </ActionButton>
                  </div>
                </fieldset>
              </form>
            </SurfaceCard>
          ) : null}

          <SurfaceCard
            body="Prepare, sign, submit, confirm, and record deployment or mint transactions directly from the immutable published snapshot. The server verifies chain receipts before accepting any record."
            eyebrow="Onchain rail"
            title="Deployment and minting"
          >
            {selectedDraft?.publication ? (
              <div className="grid gap-4">
                {!canManageOnchain ? (
                  <CollectionStatusNote
                    body="Deployment and mint recording stay owner-only because they depend on verified owner wallet activity."
                    title="Owner action required"
                    tone="info"
                  />
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <Pill>
                    {walletProviderAvailable
                      ? "Wallet connector ready"
                      : "No wallet connector ready"}
                  </Pill>
                  <Pill>Owner {shortHex(ownerWalletAddress)}</Pill>
                  {connectedWalletAddress ? (
                    <Pill>
                      {connectedOwnerWallet ? "Connected" : "Wallet mismatch"}{" "}
                      {shortHex(connectedWalletAddress)}
                    </Pill>
                  ) : (
                    <Pill>Wallet not connected</Pill>
                  )}
                  {connectedWalletConnector ? (
                    <Pill>{connectedWalletConnector.name}</Pill>
                  ) : null}
                  {connectedWalletChainLabel ? (
                    <Pill>{connectedWalletChainLabel}</Pill>
                  ) : null}
                  {selectedDraft.publication.activeDeployment ? (
                    <>
                      <Pill>
                        {selectedDraft.publication.activeDeployment.chain.label}
                      </Pill>
                      <Pill>
                        {shortHex(
                          selectedDraft.publication.activeDeployment
                            .contractAddress
                        )}
                      </Pill>
                    </>
                  ) : (
                    <Pill>No deployment recorded</Pill>
                  )}
                  <Pill>
                    {selectedDraft.publication.mintedTokenCount} recorded mint
                    {selectedDraft.publication.mintedTokenCount === 1
                      ? ""
                      : "s"}
                  </Pill>
                </div>
                <fieldset className="grid gap-4" disabled={!canManageOnchain}>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                      Wallet path
                    </span>
                    <select
                      className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                      onChange={(event) => {
                        setSelectedWalletConnectorId(
                          event.target.value as SupportedWalletConnectorId
                        );
                      }}
                      value={selectedWalletConnectorId}
                    >
                      {baseAccountConnector ? (
                        <option value="baseAccount">Base Account</option>
                      ) : null}
                      {injectedWalletConnector ? (
                        <option value="injected">
                          {injectedWalletConnector.name}
                        </option>
                      ) : null}
                    </select>
                  </label>
                  <div className={collectionActionRowClasses}>
                    <ActionButton
                      disabled={!walletProviderAvailable}
                      onClick={() => {
                        void handleConnectWallet();
                      }}
                      tone="secondary"
                      type="button"
                    >
                      Connect selected wallet
                    </ActionButton>
                    {connectedWalletConnector ? (
                      <ActionButton
                        onClick={() => {
                          void handleDisconnectWallet();
                        }}
                        tone="ghost"
                        type="button"
                      >
                        Disconnect wallet
                      </ActionButton>
                    ) : null}
                  </div>
                  {onchainFlowState ? (
                    <CollectionStatusNote
                      body={`${onchainFlowState.message}${
                        onchainFlowState.txHash
                          ? ` Tx: ${onchainFlowState.txHash}`
                          : ""
                      }`}
                      title={
                        onchainFlowState.kind === "deployment"
                          ? "Deployment flow"
                          : "Mint flow"
                      }
                      tone={
                        onchainFlowState.status === "failed"
                          ? "error"
                          : onchainFlowState.status === "success"
                            ? "success"
                            : "info"
                      }
                    />
                  ) : null}
                  <label className="grid gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                      Deployment chain
                    </span>
                    <select
                      className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                      onChange={(event) => {
                        setDeploymentChainKey(
                          event.target.value as CollectionContractChainKey
                        );
                      }}
                      value={deploymentChainKey}
                    >
                      <option value="base-sepolia">Base Sepolia</option>
                      <option value="base">Base</option>
                    </select>
                  </label>
                  <div className={collectionActionRowClasses}>
                    <ActionButton
                      disabled={
                        deployingDraftId === selectedDraft.id ||
                        Boolean(selectedDraft.publication.activeDeployment)
                      }
                      onClick={() => {
                        void handleDeployWithWallet();
                      }}
                      type="button"
                    >
                      {deployingDraftId === selectedDraft.id
                        ? "Processing deployment…"
                        : "Deploy with wallet"}
                    </ActionButton>
                    {pendingDeploymentTxHash &&
                    !selectedDraft.publication.activeDeployment ? (
                      <ActionButton
                        disabled={deployingDraftId === selectedDraft.id}
                        onClick={() => {
                          void handleRetryDeploymentRecord();
                        }}
                        tone="secondary"
                        type="button"
                      >
                        Retry deployment confirmation
                      </ActionButton>
                    ) : null}
                  </div>
                  {deploymentIntentJson ? (
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Deployment intent JSON
                      </span>
                      <textarea
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] min-h-[10rem] resize-y focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        readOnly
                        rows={10}
                        value={deploymentIntentJson}
                      />
                    </label>
                  ) : null}
                  <div className={collectionFormSectionClasses}>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Recipient wallet
                      </span>
                      <input
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        onChange={(event) => {
                          setMintRequestState((current) => ({
                            ...current,
                            recipientWalletAddress: event.target.value
                          }));
                        }}
                        placeholder="0x..."
                        value={mintRequestState.recipientWalletAddress}
                      />
                    </label>
                    <label className="grid gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Token ID
                      </span>
                      <input
                        className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                        min={1}
                        onChange={(event) => {
                          setMintRequestState((current) => ({
                            ...current,
                            tokenId: event.target.value
                          }));
                        }}
                        type="number"
                        value={mintRequestState.tokenId}
                      />
                    </label>
                    <div className={collectionActionRowClasses}>
                      <ActionButton
                        disabled={
                          mintingDraftId === selectedDraft.id ||
                          !selectedDraft.publication.activeDeployment
                        }
                        onClick={() => {
                          void handleMintWithWallet();
                        }}
                        type="button"
                      >
                        {mintingDraftId === selectedDraft.id
                          ? "Processing mint…"
                          : "Mint with wallet"}
                      </ActionButton>
                      {pendingMintTxHash ? (
                        <ActionButton
                          disabled={mintingDraftId === selectedDraft.id}
                          onClick={() => {
                            void handleRetryMintRecord();
                          }}
                          tone="secondary"
                          type="button"
                        >
                          Retry mint confirmation
                        </ActionButton>
                      ) : null}
                    </div>
                    {mintIntentJson ? (
                      <label className="grid gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                          Mint intent JSON
                        </span>
                        <textarea
                          className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] placeholder:text-[color:var(--color-muted)] min-h-[10rem] resize-y focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                          readOnly
                          rows={10}
                          value={mintIntentJson}
                        />
                      </label>
                    ) : null}
                  </div>
                </fieldset>
                {selectedDraft.publication.mints.length > 0 ? (
                  <div className={collectionMintListClasses}>
                    {selectedDraft.publication.mints.map((mint) => (
                      <div className={collectionMintCardClasses} key={mint.id}>
                        <strong>Token #{mint.tokenId}</strong>
                        <span className="text-sm text-[color:var(--color-muted)]">
                          {mint.recipientWalletAddress}
                        </span>
                        <span className="text-sm text-[color:var(--color-muted)]">
                          {formatCandidateTimestamp(mint.mintedAt)}
                        </span>
                        <Pill>{shortHex(mint.txHash)}</Pill>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState className="bg-[color:var(--color-surface-strong)]/55 leading-6">
                Publish a release before preparing deployment or minting.
              </EmptyState>
            )}
          </SurfaceCard>
        </aside>
      </div>
    </PageShell>
  );
}
