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
import { MetricTile, PageShell, Pill, SurfaceCard } from "@ai-nft-forge/ui";

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

type NoticeState = {
  message: string;
  tone: "error" | "info" | "success";
} | null;

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
    input.publicationTargets.some((target) => target.brandId === input.currentTargetId)
  ) {
    return input.currentTargetId;
  }

  const publicationBrandTarget = input.draft?.publication
    ? input.publicationTargets.find(
        (target) => target.brandSlug === input.draft?.publication?.brandSlug
      )
    : null;

  return publicationBrandTarget?.brandId ?? input.publicationTargets[0]?.brandId ?? null;
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
      className={`studio-collections-draft-card${
        isSelected ? " studio-collections-draft-card--selected" : ""
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="studio-collections-draft-card__media">
        {previewUrl ? (
          <img
            alt={draft.title}
            className="studio-collections-draft-card__image"
            src={previewUrl}
          />
        ) : (
          <div className="studio-collections-draft-card__placeholder">
            <span>{draft.slug}</span>
          </div>
        )}
        <div className="studio-collections-draft-card__state">
          <span>{attentionLabel}</span>
        </div>
      </div>
      <div className="studio-collections-draft-card__copy">
        <div className="studio-collections-draft-card__eyebrow">
          <span>{formatDraftStatus(draft.status)}</span>
          {draft.publication ? <span>Published</span> : <span>Draft only</span>}
          {hasInvalidItems ? <span>Blocked</span> : null}
        </div>
        <strong>{draft.title}</strong>
        <p>
          {draft.description?.trim() || "No internal release framing has been saved yet."}
        </p>
        <div className="studio-collections-draft-card__meta">
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
  return (
    <div className="studio-collections-art-card">
      <div className="studio-collections-art-card__media">
        {previewUrl ? (
          <img
            alt={title}
            className="studio-collections-art-card__image"
            src={previewUrl}
          />
        ) : (
          <div className="studio-collections-art-card__placeholder">
            <span>{subtitle}</span>
          </div>
        )}
        <div
          className={`studio-collections-art-card__status studio-collections-art-card__status--${statusTone}`}
        >
          {statusLabel}
        </div>
      </div>
      <div className="studio-collections-art-card__copy">
        <strong>{title}</strong>
        <span>{subtitle}</span>
        <div className="studio-collections-art-card__meta">{meta}</div>
      </div>
      <div className="studio-collections-art-card__actions">{actions}</div>
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
      initialPublicationTarget?.brandId ?? initialPublicationTargets[0]?.brandId ?? null
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
  const [deployingDraftId, setDeployingDraftId] = useState<string | null>(
    null
  );
  const [mintingDraftId, setMintingDraftId] = useState<
    string | null
  >(null);
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
      const draftPreviewGeneratedAssetId = getDraftPreviewGeneratedAssetId(draft);

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
      const provider = (await connectedWalletConnector.getProvider()) as
        | BrowserEthereumProvider
        | null;

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

    const provider = (await connector.getProvider()) as BrowserEthereumProvider | null;

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
          current?.chainLabel ??
          getWalletChainByKey(deploymentChainKey).name,
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
          (selectedDraft.publication?.activeDeployment?.chain.label ??
            getWalletChainByKey(deploymentChainKey).name),
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
        error instanceof Error ? error.message : "Mint confirmation retry failed.";

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
    ? generatedAssetPreviewUrls[selectedDraftPreviewGeneratedAssetId] ?? null
    : null;
  const selectedDraftPublicPath = selectedDraft
    ? selectedDraft.publication?.publicPath ??
      (selectedPublicationTarget
        ? `${selectedPublicationTarget.publicBrandPath}/collections/${selectedDraft.slug}`
        : "/brands/[brandSlug]/collections/[collectionSlug]")
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

    if (selectedDraft.publication && !selectedDraft.publication.activeDeployment) {
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
          <button
            className="button-action"
            disabled={isRefreshing}
            onClick={() => {
              void refreshDrafts();
            }}
            type="button"
          >
            {isRefreshing ? "Refreshing…" : "Refresh workspace"}
          </button>
          <Link className="action-link" href="/studio/assets">
            Open assets
          </Link>
          <Link className="action-link" href="/studio/settings">
            Open settings
          </Link>
          <Link className="inline-link" href="/studio">
            Back to studio
          </Link>
        </>
      }
      tone="studio"
    >
      <div className="studio-collections-workspace">
        <aside className="studio-collections-workspace__browser">
          <SurfaceCard
            body="Drafts, attention, and creation live together here so the operator can see what exists, what is blocked, and what is nearest to launch."
            eyebrow="Release browser"
            title="Draft inventory"
          >
            <div className="studio-collections-browser">
              <div className="metric-list">
                <MetricTile label="Drafts" value={drafts.length.toString()} />
                <MetricTile
                  label="Review ready"
                  value={reviewReadyCount.toString()}
                />
                <MetricTile label="Published" value={publishedCount.toString()} />
                <MetricTile
                  label="Deployed"
                  value={deployedCount.toString()}
                />
                <MetricTile
                  label="Featured"
                  value={featuredPublishedCount.toString()}
                />
                <MetricTile
                  label="Curated items"
                  value={curatedAssetCount.toString()}
                />
              </div>
              <div className="studio-collections-browser__cues">
                <Pill>{approvedCandidateCount} approved outputs ready</Pill>
                <Pill>{generatedAssetCandidates.length} recent candidates</Pill>
                <Pill>Owner {shortHex(ownerWalletAddress)}</Pill>
              </div>
              <form
                className="studio-form studio-collections-create-panel"
                onSubmit={handleCreateDraft}
              >
                <div className="studio-collections-create-panel__copy">
                  <p className="field-label">Create draft</p>
                  <h2>Start a new release object</h2>
                  <p>
                    Create the shell first, then shape its story, composition,
                    publication state, and onchain path.
                  </p>
                </div>
                <label className="field-stack">
                  <span className="field-label">Title</span>
                  <input
                    className="input-field"
                    maxLength={120}
                    onChange={(event) => {
                      setCreateTitle(event.target.value);
                    }}
                    placeholder="Genesis Portrait Set"
                    required
                    value={createTitle}
                  />
                </label>
                <label className="field-stack">
                  <span className="field-label">Internal framing</span>
                  <textarea
                    className="input-field input-field--multiline"
                    maxLength={1000}
                    onChange={(event) => {
                      setCreateDescription(event.target.value);
                    }}
                    placeholder="What kind of release is this and why does it exist?"
                    rows={4}
                    value={createDescription}
                  />
                </label>
                <div className="studio-action-row">
                  <button
                    className="button-action button-action--accent"
                    disabled={isCreating}
                    type="submit"
                  >
                    {isCreating ? "Creating…" : "Create release draft"}
                  </button>
                </div>
              </form>
              <div className="studio-collections-browser__list">
                {drafts.length === 0 ? (
                  <div className="collection-empty-state">
                    No collection drafts exist yet. Create one to begin the
                    release workflow.
                  </div>
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
                      previewUrl={
                        (() => {
                          const previewGeneratedAssetId =
                            getDraftPreviewGeneratedAssetId(draft);

                          return previewGeneratedAssetId
                            ? generatedAssetPreviewUrls[previewGeneratedAssetId] ??
                                null
                            : null;
                        })()
                      }
                    />
                  ))
                )}
              </div>
            </div>
          </SurfaceCard>
        </aside>

        <section className="studio-collections-workspace__main">
          {selectedDraft ? (
            <>
              <SurfaceCard
                body="Define the release identity here, then use the composition board beneath it to turn approved outputs into an ordered edition."
                eyebrow="Active release"
                title={selectedDraft.title}
              >
                <div className="studio-collections-focus">
                  <div className="studio-collections-focus__hero">
                    <div className="studio-collections-focus__media">
                      {selectedDraftPreviewUrl ? (
                        <img
                          alt={selectedDraft.title}
                          className="studio-collections-focus__image"
                          src={selectedDraftPreviewUrl}
                        />
                      ) : (
                        <div className="studio-collections-focus__placeholder">
                          <strong>{selectedDraft.slug}</strong>
                          <span>Curate art to give this release a visual center.</span>
                        </div>
                      )}
                    </div>
                    <div className="studio-collections-focus__summary">
                      <div className="pill-row">
                        <Pill>{formatDraftStatus(selectedDraft.status)}</Pill>
                        <Pill>{selectedDraft.itemCount} curated items</Pill>
                        <Pill>
                          Updated {formatCandidateTimestamp(selectedDraft.updatedAt)}
                        </Pill>
                        {selectedDraft.publication ? <Pill>Published</Pill> : null}
                        {selectedDraft.publication?.isFeatured ? (
                          <Pill>Featured release</Pill>
                        ) : null}
                        {selectedDraftHasInvalidItems ? (
                          <Pill>
                            {selectedDraftInvalidItems.length} invalid item
                            {selectedDraftInvalidItems.length === 1 ? "" : "s"}
                          </Pill>
                        ) : null}
                      </div>
                      <div className="studio-collections-focus__headline">
                        <h2>{selectedDraft.title}</h2>
                        <p>
                          {selectedDraft.description?.trim() ||
                            "Add internal story framing so reviewers and operators understand the release intent."}
                        </p>
                      </div>
                      <div className="studio-collections-release-stats">
                        <div className="studio-collections-release-stat">
                          <span>Route</span>
                          <strong>{selectedDraftPublicPath}</strong>
                        </div>
                        <div className="studio-collections-release-stat">
                          <span>Publication</span>
                          <strong>
                            {selectedDraft.publication
                              ? formatStorefrontStatus(
                                  selectedDraft.publication.storefrontStatus
                                )
                              : "Not published"}
                          </strong>
                        </div>
                        <div className="studio-collections-release-stat">
                          <span>Onchain</span>
                          <strong>
                            {selectedDraft.publication?.activeDeployment
                              ? selectedDraft.publication.activeDeployment.chain.label
                              : "No deployment"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                  <form className="studio-form" onSubmit={handleSaveDraft}>
                    <div className="studio-collections-form-grid">
                      <label className="field-stack">
                        <span className="field-label">Title</span>
                        <input
                          className="input-field"
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
                      </label>
                      <label className="field-stack">
                        <span className="field-label">Slug</span>
                        <input
                          className="input-field"
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
                      </label>
                      <label className="field-stack">
                        <span className="field-label">Workflow state</span>
                        <select
                          className="input-field"
                          onChange={(event) => {
                            setEditorState((current) => ({
                              ...current,
                              status: event.target.value as CollectionDraftStatus
                            }));
                          }}
                          value={editorState.status}
                        >
                          <option value="draft">Draft</option>
                          <option value="review_ready">Review ready</option>
                        </select>
                      </label>
                      <label className="field-stack studio-collections-form-grid__full">
                        <span className="field-label">Internal story</span>
                        <textarea
                          className="input-field input-field--multiline"
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
                      </label>
                    </div>
                    <div className="studio-action-row">
                      <button
                        className="button-action button-action--accent"
                        disabled={savingDraftId === selectedDraft.id}
                        type="submit"
                      >
                        {savingDraftId === selectedDraft.id
                          ? "Saving…"
                          : "Save release identity"}
                      </button>
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
                  <div className="collection-empty-state">
                    No generated assets have been curated into this release yet.
                    Add approved outputs from the candidate rail.
                  </div>
                ) : (
                  <div className="studio-collections-art-grid">
                    {selectedDraft.items.map((item, index) => (
                      <CollectionArtworkCard
                        actions={
                          <>
                            <button
                              className="button-action"
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
                            </button>
                            <button
                              className="button-action"
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
                            </button>
                            <button
                              className="button-action"
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
                            </button>
                          </>
                        }
                        key={item.id}
                        meta={
                          <>
                            <span>{item.generatedAsset.pipelineKey}</span>
                            <span>Source {item.generatedAsset.sourceAssetId}</span>
                            <span>
                              Added {formatCandidateTimestamp(item.generatedAsset.createdAt)}
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
                  <div className="collection-empty-state">
                    No generated assets are available yet. Generate variants in
                    `/studio/assets` first.
                  </div>
                ) : (
                  <div className="studio-collections-art-grid studio-collections-art-grid--candidates">
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
                              <button
                                className="button-action"
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
                              </button>
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
                                {formatModerationStatus(candidate.moderationStatus)}
                              </span>
                            </>
                          }
                          previewUrl={
                            generatedAssetPreviewUrls[candidate.generatedAssetId] ??
                            null
                          }
                          statusLabel={
                            isIncluded
                              ? "Included"
                              : formatModerationStatus(candidate.moderationStatus)
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
              <div className="collection-empty-state">
                The launch workspace is ready, but no active release is selected yet.
              </div>
            </SurfaceCard>
          )}
        </section>

        <aside className="studio-collections-workspace__rail">
          {notice ? (
            <SurfaceCard
              body={notice.message}
              eyebrow="Workflow status"
              title={notice.tone === "error" ? "Action failed" : "Latest update"}
            >
              <div className={`status-banner status-banner--${notice.tone}`}>
                <span>{notice.message}</span>
              </div>
            </SurfaceCard>
          ) : null}

          <SurfaceCard
            body="Publication state, blockers, and release links stay in one control rail so operators can decide quickly whether this draft needs curation, publication, or onchain work."
            eyebrow="Launch rail"
            title={
              selectedDraft?.publication ? "Published release control" : "Release control"
            }
          >
            {selectedDraft ? (
              <div className="studio-form">
                <div className="studio-collections-launch-grid">
                  <div className="studio-collections-launch-card">
                    <span>Draft state</span>
                    <strong>{formatDraftStatus(selectedDraft.status)}</strong>
                    <small>{selectedDraft.itemCount} curated items</small>
                  </div>
                  <div className="studio-collections-launch-card">
                    <span>Publication</span>
                    <strong>
                      {selectedDraft.publication
                        ? formatStorefrontStatus(
                            selectedDraft.publication.storefrontStatus
                          )
                        : "Not published"}
                    </strong>
                    <small>{selectedDraftPublicPath}</small>
                  </div>
                  <div className="studio-collections-launch-card">
                    <span>Onchain</span>
                    <strong>
                      {selectedDraft.publication?.activeDeployment
                        ? selectedDraft.publication.activeDeployment.chain.label
                        : "No deployment"}
                    </strong>
                    <small>
                      {selectedDraft.publication
                        ? `${selectedDraft.publication.mintedTokenCount} recorded mints`
                        : "Publish first"}
                    </small>
                  </div>
                </div>

                {!canManagePublication ? (
                  <div className="status-banner status-banner--info">
                    <strong>Owner action required</strong>
                    <span>
                      Operators can shape the release, but publication and
                      merchandising stay owner-only.
                    </span>
                  </div>
                ) : null}

                {selectedDraftLaunchNotes.map((note) => (
                  <div
                    className={`status-banner ${
                      note.tone === "error"
                        ? "status-banner--error"
                        : note.tone === "success"
                          ? "status-banner--success"
                          : "status-banner--info"
                    }`}
                    key={`${note.title}-${note.body}`}
                  >
                    <strong>{note.title}</strong>
                    <span>{note.body}</span>
                  </div>
                ))}

                {selectedPublicationTarget ? (
                  <div className="publication-target-card">
                    <div className="publication-target-card__copy">
                      <strong>{selectedPublicationTarget.brandName}</strong>
                      <span>{selectedPublicationTarget.publicBrandPath}</span>
                      <span>Selected route: {selectedDraftPublicPath}</span>
                    </div>
                    <Link className="inline-link" href="/studio/settings">
                      Edit targets
                    </Link>
                  </div>
                ) : (
                  <div className="collection-empty-state">
                    Configure `/studio/settings` before publishing a release.
                  </div>
                )}

                {publicationTargets.length > 1 ? (
                  <label className="field-stack">
                    <span className="field-label">Publication brand</span>
                    <select
                      className="input-field"
                      disabled={!canManagePublication}
                      onChange={(event) => {
                        setSelectedPublicationTargetId(event.target.value || null);
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
                  <div className="status-banner status-banner--info">
                    <strong>Republish will move the route</strong>
                    <span>
                      Republishing will move this release from{" "}
                      {selectedDraft.publication.publicPath} to {selectedDraftPublicPath}.
                    </span>
                  </div>
                ) : null}

                <div className="pill-row">
                  <Pill>{selectedDraftPublicPath}</Pill>
                  {selectedPublicationTarget ? (
                    <Pill>{selectedPublicationTarget.brandSlug}</Pill>
                  ) : null}
                  {selectedDraft.publication ? (
                    <Pill>
                      Published{" "}
                      {formatCandidateTimestamp(selectedDraft.publication.publishedAt)}
                    </Pill>
                  ) : null}
                  {selectedDraft.publication ? (
                    <Pill>
                      Order {selectedDraft.publication.displayOrder}
                    </Pill>
                  ) : null}
                  {selectedDraft.publication?.isFeatured ? (
                    <Pill>Featured release</Pill>
                  ) : null}
                  {selectedDraft.publication?.priceLabel ? (
                    <Pill>{selectedDraft.publication.priceLabel}</Pill>
                  ) : null}
                </div>

                <form className="studio-form" onSubmit={handlePublishDraft}>
                  <div className="studio-action-row">
                    <button
                      className="button-action button-action--accent"
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
                    </button>
                    <button
                      className="button-action"
                      disabled={
                        !canManagePublication ||
                        !selectedDraft.publication ||
                        unpublishingDraftId === selectedDraft.id
                      }
                      onClick={() => {
                        void handleUnpublishDraft();
                      }}
                      type="button"
                    >
                      {unpublishingDraftId === selectedDraft.id
                        ? "Unpublishing…"
                        : "Unpublish"}
                    </button>
                  </div>
                </form>

                <div className="studio-collections-link-grid">
                  {!selectedPublicationTarget ? (
                    <Link className="inline-link" href="/studio/settings">
                      Configure publication targets
                    </Link>
                  ) : null}
                  {selectedDraft.publication ? (
                    <Link
                      className="inline-link"
                      href={selectedDraft.publication.publicPath}
                      target="_blank"
                    >
                      Open public route
                    </Link>
                  ) : null}
                  {selectedDraftContractPath ? (
                    <Link
                      className="inline-link"
                      href={selectedDraftContractPath}
                      target="_blank"
                    >
                      Open contract manifest
                    </Link>
                  ) : null}
                  {selectedDraftMetadataPath ? (
                    <Link
                      className="inline-link"
                      href={selectedDraftMetadataPath}
                      target="_blank"
                    >
                      Open metadata manifest
                    </Link>
                  ) : null}
                  {selectedDraft.publication && selectedDraft.items[0] ? (
                    <Link
                      className="inline-link"
                      href={createCollectionTokenUriPath({
                        brandSlug: selectedDraft.publication.brandSlug,
                        collectionSlug: selectedDraft.publication.collectionSlug,
                        tokenId: selectedDraft.items[0].position
                      })}
                      target="_blank"
                    >
                      Open first token URI
                    </Link>
                  ) : null}
                  {selectedDraftMetadataPath && selectedDraft.items[0] ? (
                    <Link
                      className="inline-link"
                      href={`${selectedDraftMetadataPath}/${selectedDraft.items[0].position}`}
                      target="_blank"
                    >
                      Open first edition metadata
                    </Link>
                  ) : null}
                  {selectedDraft.publication && selectedPublicationTarget ? (
                    <Link
                      className="inline-link"
                      href={selectedPublicationTarget.publicBrandPath}
                      target="_blank"
                    >
                      Open brand landing
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="collection-empty-state">
                Select a draft to inspect publication state and launch controls.
              </div>
            )}
          </SurfaceCard>

          {selectedDraft?.publication ? (
            <SurfaceCard
              body="Storefront metadata stays separate from the draft identity so operators can tune live presentation without losing track of the underlying release object."
              eyebrow="Storefront control"
              title="Merchandising and release timing"
            >
              <form
                className="studio-form"
                onSubmit={handleSavePublicationMerchandising}
              >
                <fieldset
                  className="studio-collections-fieldset"
                  disabled={
                    !canManagePublication ||
                    savingPublicationDraftId === selectedDraft.id
                  }
                >
                  <div className="studio-collections-form-grid">
                    <label className="field-stack">
                      <span className="field-label">Storefront status</span>
                      <select
                        className="input-field"
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
                    <label className="field-stack">
                      <span className="field-label">Display order</span>
                      <input
                        className="input-field"
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
                    <label className="field-stack">
                      <span className="field-label">Launch time</span>
                      <input
                        className="input-field"
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
                    <label className="field-stack">
                      <span className="field-label">End time</span>
                      <input
                        className="input-field"
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
                    <label className="field-stack">
                      <span className="field-label">Price label</span>
                      <input
                        className="input-field"
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
                    <label className="field-stack">
                      <span className="field-label">Price amount (minor)</span>
                      <input
                        className="input-field"
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
                    <label className="field-stack">
                      <span className="field-label">Price currency</span>
                      <input
                        className="input-field"
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
                    <label className="field-stack">
                      <span className="field-label">Total supply</span>
                      <input
                        className="input-field"
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
                    <label className="field-stack">
                      <span className="field-label">Sold count</span>
                      <input
                        className="input-field"
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
                    <label className="field-stack studio-collections-form-grid__full">
                      <span className="field-label">Hero asset</span>
                      <select
                        className="input-field"
                        onChange={(event) => {
                          setPublicationMerchandisingState((current) => ({
                            ...current,
                            heroGeneratedAssetId: event.target.value
                          }));
                        }}
                        value={publicationMerchandisingState.heroGeneratedAssetId}
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
                    <label className="field-stack">
                      <span className="field-label">Storefront headline</span>
                      <input
                        className="input-field"
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
                    <label className="field-stack studio-collections-form-grid__full">
                      <span className="field-label">Storefront body</span>
                      <textarea
                        className="input-field input-field--multiline"
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
                    <label className="field-stack">
                      <span className="field-label">Primary CTA label</span>
                      <input
                        className="input-field"
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
                    <label className="field-stack">
                      <span className="field-label">Primary CTA URL</span>
                      <input
                        className="input-field"
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
                    <label className="field-stack">
                      <span className="field-label">Secondary CTA label</span>
                      <input
                        className="input-field"
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
                    <label className="field-stack">
                      <span className="field-label">Secondary CTA URL</span>
                      <input
                        className="input-field"
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
                  <label className="toggle-field">
                    <input
                      checked={publicationMerchandisingState.isFeatured}
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
                  <div className="studio-action-row">
                    <button
                      className="button-action"
                      disabled={
                        !canManagePublication ||
                        savingPublicationDraftId === selectedDraft.id
                      }
                      type="submit"
                    >
                      {savingPublicationDraftId === selectedDraft.id
                        ? "Saving merchandising…"
                        : "Save merchandising"}
                    </button>
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
              <div className="studio-form">
                {!canManageOnchain ? (
                  <div className="status-banner status-banner--info">
                    <strong>Owner action required</strong>
                    <span>
                      Deployment and mint recording stay owner-only because they
                      depend on verified owner wallet activity.
                    </span>
                  </div>
                ) : null}
                <div className="pill-row">
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
                          selectedDraft.publication.activeDeployment.contractAddress
                        )}
                      </Pill>
                    </>
                  ) : (
                    <Pill>No deployment recorded</Pill>
                  )}
                  <Pill>
                    {selectedDraft.publication.mintedTokenCount} recorded mint
                    {selectedDraft.publication.mintedTokenCount === 1 ? "" : "s"}
                  </Pill>
                </div>
                <fieldset
                  className="studio-collections-fieldset"
                  disabled={!canManageOnchain}
                >
                  <label className="field-stack">
                    <span className="field-label">Wallet path</span>
                    <select
                      className="input-field"
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
                  <div className="studio-action-row">
                    <button
                      className="button-action"
                      disabled={!walletProviderAvailable}
                      onClick={() => {
                        void handleConnectWallet();
                      }}
                      type="button"
                    >
                      Connect selected wallet
                    </button>
                    {connectedWalletConnector ? (
                      <button
                        className="button-action"
                        onClick={() => {
                          void handleDisconnectWallet();
                        }}
                        type="button"
                      >
                        Disconnect wallet
                      </button>
                    ) : null}
                  </div>
                  {onchainFlowState ? (
                    <div
                      className={`status-banner ${
                        onchainFlowState.status === "failed"
                          ? "status-banner--error"
                          : onchainFlowState.status === "success"
                            ? "status-banner--success"
                            : "status-banner--info"
                      }`}
                    >
                      <strong>
                        {onchainFlowState.kind === "deployment"
                          ? "Deployment flow"
                          : "Mint flow"}
                      </strong>
                      <span>{onchainFlowState.message}</span>
                      {onchainFlowState.txHash ? (
                        <span>Tx: {onchainFlowState.txHash}</span>
                      ) : null}
                    </div>
                  ) : null}
                  <label className="field-stack">
                    <span className="field-label">Deployment chain</span>
                    <select
                      className="input-field"
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
                  <div className="studio-action-row">
                    <button
                      className="button-action"
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
                    </button>
                    {pendingDeploymentTxHash &&
                    !selectedDraft.publication.activeDeployment ? (
                      <button
                        className="button-action"
                        disabled={deployingDraftId === selectedDraft.id}
                        onClick={() => {
                          void handleRetryDeploymentRecord();
                        }}
                        type="button"
                      >
                        Retry deployment confirmation
                      </button>
                    ) : null}
                  </div>
                  {deploymentIntentJson ? (
                    <label className="field-stack">
                      <span className="field-label">Deployment intent JSON</span>
                      <textarea
                        className="input-field input-field--multiline"
                        readOnly
                        rows={10}
                        value={deploymentIntentJson}
                      />
                    </label>
                  ) : null}
                  <div className="studio-form">
                    <label className="field-stack">
                      <span className="field-label">Recipient wallet</span>
                      <input
                        className="input-field"
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
                    <label className="field-stack">
                      <span className="field-label">Token ID</span>
                      <input
                        className="input-field"
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
                    <div className="studio-action-row">
                      <button
                        className="button-action"
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
                      </button>
                      {pendingMintTxHash ? (
                        <button
                          className="button-action"
                          disabled={mintingDraftId === selectedDraft.id}
                          onClick={() => {
                            void handleRetryMintRecord();
                          }}
                          type="button"
                        >
                          Retry mint confirmation
                        </button>
                      ) : null}
                    </div>
                    {mintIntentJson ? (
                      <label className="field-stack">
                        <span className="field-label">Mint intent JSON</span>
                        <textarea
                          className="input-field input-field--multiline"
                          readOnly
                          rows={10}
                          value={mintIntentJson}
                        />
                      </label>
                    ) : null}
                  </div>
                </fieldset>
                {selectedDraft.publication.mints.length > 0 ? (
                  <div className="studio-collections-mint-list">
                    {selectedDraft.publication.mints.map((mint) => (
                      <div className="studio-collections-mint-card" key={mint.id}>
                        <strong>Token #{mint.tokenId}</strong>
                        <span>{mint.recipientWalletAddress}</span>
                        <span>{formatCandidateTimestamp(mint.mintedAt)}</span>
                        <Pill>{shortHex(mint.txHash)}</Pill>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="collection-empty-state">
                Publish a release before preparing deployment or minting.
              </div>
            )}
          </SurfaceCard>
        </aside>
      </div>
    </PageShell>
  );
}
