"use client";

import Link from "next/link";
import {
  startTransition,
  type FormEvent,
  useEffect,
  useEffectEvent,
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
  type CollectionContractChainKey,
  type CollectionDraftStatus,
  type CollectionDraftSummary,
  type CollectionGeneratedAssetCandidate,
  type GeneratedAssetModerationStatus
} from "@ai-nft-forge/shared";
import {
  MetricTile,
  PageShell,
  Pill,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";

import {
  createWalletAddChainParameters,
  getWalletChainByKey,
  getWalletChainLabel
} from "../../../../lib/wallet/chains";

type StudioCollectionsClientProps = {
  initialDrafts: CollectionDraftSummary[];
  initialGeneratedAssetCandidates: CollectionGeneratedAssetCandidate[];
  initialPublicationTarget: {
    brandName: string;
    brandSlug: string;
    publicBrandPath: string;
  } | null;
  ownerWalletAddress: string;
};

type NoticeState = {
  message: string;
  tone: "error" | "info" | "success";
} | null;

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

export function StudioCollectionsClient({
  initialDrafts,
  initialGeneratedAssetCandidates,
  initialPublicationTarget,
  ownerWalletAddress
}: StudioCollectionsClientProps) {
  const walletConnection = useConnection();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const [drafts, setDrafts] = useState(() => sortDrafts(initialDrafts));
  const [generatedAssetCandidates, setGeneratedAssetCandidates] = useState(
    initialGeneratedAssetCandidates
  );
  const [publicationTarget, setPublicationTarget] = useState(
    initialPublicationTarget
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

  const selectedDraft =
    drafts.find((draft) => draft.id === selectedDraftId) ?? drafts[0] ?? null;
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
        setPublicationTarget(result.publicationTarget);
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
  const curatedAssetCount = drafts.reduce(
    (count, draft) => count + draft.itemCount,
    0
  );
  const approvedCandidateCount = generatedAssetCandidates.filter(
    (candidate) => candidate.moderationStatus === "approved"
  ).length;

  return (
    <PageShell
      eyebrow="Collections"
      title="Curate release-ready collection drafts"
      lead="This collection surface now covers curation and publication: create owner-scoped drafts, assemble an ordered set of generated variants, mark the draft review-ready, and publish it to a live public brand route."
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
            {isRefreshing ? "Refreshing…" : "Refresh data"}
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
      <SurfaceGrid>
        <SurfaceCard
          body="Drafts are still owner-scoped at this stage, and collection curation is now gated to approved generated outputs so review-ready and publication flows inherit a moderation safeguard."
          eyebrow="Phase 3"
          span={12}
          title="Collection draft foundation"
        >
          <div className="metric-list">
            <MetricTile label="Drafts" value={drafts.length.toString()} />
            <MetricTile
              label="Review ready"
              value={reviewReadyCount.toString()}
            />
            <MetricTile label="Published" value={publishedCount.toString()} />
            <MetricTile
              label="Featured"
              value={featuredPublishedCount.toString()}
            />
            <MetricTile
              label="Curated assets"
              value={curatedAssetCount.toString()}
            />
          </div>
          <div className="pill-row">
            <Pill>{ownerWalletAddress}</Pill>
            <Pill>
              {generatedAssetCandidates.length} recent generated assets
            </Pill>
            <Pill>{approvedCandidateCount} approved for curation</Pill>
            <Pill>/studio/collections</Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="Create a draft shell first, then refine its metadata and curate generated variants into an ordered collection."
          eyebrow="Create"
          span={4}
          title="New collection draft"
        >
          <form className="studio-form" onSubmit={handleCreateDraft}>
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
              <span className="field-label">Description</span>
              <textarea
                className="input-field input-field--multiline"
                maxLength={1000}
                onChange={(event) => {
                  setCreateDescription(event.target.value);
                }}
                placeholder="Internal curation notes for this draft collection."
                rows={5}
                value={createDescription}
              />
            </label>
            <div className="studio-action-row">
              <button
                className="button-action button-action--accent"
                disabled={isCreating}
                type="submit"
              >
                {isCreating ? "Creating…" : "Create draft"}
              </button>
            </div>
          </form>
        </SurfaceCard>
        <SurfaceCard
          body="Select a draft to edit its metadata, curate its ordered asset list, and move it toward release review."
          eyebrow="Roster"
          span={8}
          title="Draft roster"
        >
          <div className="collection-draft-list">
            {drafts.length === 0 ? (
              <div className="collection-empty-state">
                No collection drafts exist yet.
              </div>
            ) : (
              drafts.map((draft) => {
                const isSelected = draft.id === selectedDraft?.id;

                return (
                  <button
                    className={`collection-draft-list__button${
                      isSelected
                        ? " collection-draft-list__button--selected"
                        : ""
                    }`}
                    key={draft.id}
                    onClick={() => {
                      setSelectedDraftId(draft.id);
                      setNotice(null);
                    }}
                    type="button"
                  >
                    <span className="collection-draft-list__title">
                      {draft.title}
                    </span>
                    <span className="collection-draft-list__meta">
                      {formatDraftStatus(draft.status)} · {draft.itemCount}{" "}
                      items
                    </span>
                    <span className="collection-draft-list__meta">
                      {draft.publication?.isFeatured
                        ? "Featured release"
                        : draft.publication
                          ? `Display order ${draft.publication.displayOrder}`
                          : "Not published"}
                    </span>
                    <span className="collection-draft-list__meta">
                      {draft.publication?.publicPath ??
                        `/collections/${draft.slug}`}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="Edit the draft metadata that anchors review status and the eventual public collection route."
          eyebrow="Metadata"
          span={6}
          title={
            selectedDraft ? selectedDraft.title : "Select a collection draft"
          }
        >
          {selectedDraft ? (
            <form className="studio-form" onSubmit={handleSaveDraft}>
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
                <span className="field-label">Status</span>
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
              <label className="field-stack">
                <span className="field-label">Description</span>
                <textarea
                  className="input-field input-field--multiline"
                  maxLength={1000}
                  onChange={(event) => {
                    setEditorState((current) => ({
                      ...current,
                      description: event.target.value
                    }));
                  }}
                  rows={6}
                  value={editorState.description}
                />
              </label>
              <div className="pill-row">
                <Pill>{formatDraftStatus(selectedDraft.status)}</Pill>
                <Pill>{selectedDraft.itemCount} curated assets</Pill>
                {selectedDraftHasInvalidItems ? (
                  <Pill>
                    {selectedDraftInvalidItems.length} invalid curated asset
                    {selectedDraftInvalidItems.length === 1 ? "" : "s"}
                  </Pill>
                ) : null}
                {selectedDraft.publication ? <Pill>Published</Pill> : null}
                {selectedDraft.publication?.isFeatured ? (
                  <Pill>Featured release</Pill>
                ) : null}
                <Pill>
                  Updated {formatCandidateTimestamp(selectedDraft.updatedAt)}
                </Pill>
              </div>
              {selectedDraftHasInvalidItems ? (
                <div className="status-banner status-banner--error">
                  <strong>
                    {selectedDraftNeedsRepairDowngrade
                      ? "Review-ready draft is no longer valid"
                      : "Draft contains unapproved assets"}
                  </strong>
                  <span>
                    {selectedDraftNeedsRepairDowngrade
                      ? "At least one curated asset was later rejected or reset, so this draft should be returned to draft before publication."
                      : "One or more curated assets are no longer approved. Replace them or remove them before moving this draft forward."}
                  </span>
                </div>
              ) : null}
              <div className="studio-action-row">
                <button
                  className="button-action button-action--accent"
                  disabled={savingDraftId === selectedDraft.id}
                  type="submit"
                >
                  {savingDraftId === selectedDraft.id
                    ? "Saving…"
                    : "Save draft"}
                </button>
              </div>
            </form>
          ) : (
            <div className="collection-empty-state">
              Create a draft to start curation.
            </div>
          )}
        </SurfaceCard>
        <SurfaceCard
          body="Only review-ready drafts can be published. Publication now uses the saved owner brand profile from studio settings, and published drafts can carry durable storefront merchandising controls for feature placement and ordering."
          eyebrow="Publication"
          span={6}
          title={
            selectedDraft?.publication
              ? "Published route"
              : "Publish review-ready draft"
          }
        >
          {selectedDraft ? (
            <form className="studio-form" onSubmit={handlePublishDraft}>
              {publicationTarget ? (
                <div className="publication-target-card">
                  <div className="publication-target-card__copy">
                    <strong>{publicationTarget.brandName}</strong>
                    <span>{publicationTarget.publicBrandPath}</span>
                    <span>
                      Draft route:{" "}
                      {selectedDraft.publication?.publicPath ??
                        `${publicationTarget.publicBrandPath}/collections/${selectedDraft.slug}`}
                    </span>
                  </div>
                  <Link className="inline-link" href="/studio/settings">
                    Edit studio settings
                  </Link>
                </div>
              ) : (
                <div className="collection-empty-state">
                  Configure `/studio/settings` before publishing any
                  review-ready drafts.
                </div>
              )}
              <div className="pill-row">
                <Pill>
                  {selectedDraft.publication?.publicPath ??
                    (publicationTarget
                      ? `${publicationTarget.publicBrandPath}/collections/${selectedDraft.slug}`
                      : "/brands/[brandSlug]/collections/[collectionSlug]")}
                </Pill>
                {publicationTarget ? (
                  <Pill>{publicationTarget.brandSlug}</Pill>
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
                {selectedDraft.publication ? (
                  <Pill>{selectedDraft.publication.storefrontStatus}</Pill>
                ) : null}
                {selectedDraft.publication?.activeDeployment ? (
                  <Pill>
                    {selectedDraft.publication.activeDeployment.chain.label}
                  </Pill>
                ) : null}
                {selectedDraft.publication?.activeDeployment ? (
                  <Pill>
                    {shortHex(
                      selectedDraft.publication.activeDeployment.contractAddress
                    )}
                  </Pill>
                ) : null}
                {selectedDraft.publication ? (
                  <Pill>
                    {selectedDraft.publication.mintedTokenCount} minted
                  </Pill>
                ) : null}
                {selectedDraft.publication?.priceLabel ? (
                  <Pill>{selectedDraft.publication.priceLabel}</Pill>
                ) : null}
                {selectedDraft.publication?.totalSupply !== null &&
                selectedDraft.publication?.totalSupply !== undefined ? (
                  <Pill>
                    {selectedDraft.publication.soldCount}/
                    {selectedDraft.publication.totalSupply} claimed
                  </Pill>
                ) : null}
                {selectedDraft.publication ? (
                  <Pill>
                    {buildPublishedCollectionMetadataPath(
                      selectedDraft.publication.publicPath
                    )}
                  </Pill>
                ) : null}
                {selectedDraft.publication ? (
                  <Pill>
                    {buildPublishedCollectionContractPath({
                      brandSlug: selectedDraft.publication.brandSlug,
                      collectionSlug: selectedDraft.publication.collectionSlug
                    })}
                  </Pill>
                ) : null}
              </div>
              <div className="studio-action-row">
                <button
                  className="button-action button-action--accent"
                  disabled={
                    !publicationTarget ||
                    publishingDraftId === selectedDraft.id ||
                    selectedDraft.status !== "review_ready" ||
                    selectedDraft.itemCount === 0
                  }
                  type="submit"
                >
                  {publishingDraftId === selectedDraft.id
                    ? "Publishing…"
                    : selectedDraft.publication
                      ? "Republish draft"
                      : "Publish draft"}
                </button>
                <button
                  className="button-action"
                  disabled={
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
                {!publicationTarget ? (
                  <Link className="inline-link" href="/studio/settings">
                    Configure settings
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
                {selectedDraft.publication ? (
                  <Link
                    className="inline-link"
                    href={buildPublishedCollectionContractPath({
                      brandSlug: selectedDraft.publication.brandSlug,
                      collectionSlug: selectedDraft.publication.collectionSlug
                    })}
                    target="_blank"
                  >
                    Open contract manifest
                  </Link>
                ) : null}
                {selectedDraft.publication ? (
                  <Link
                    className="inline-link"
                    href={buildPublishedCollectionMetadataPath(
                      selectedDraft.publication.publicPath
                    )}
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
                {selectedDraft.publication && selectedDraft.items[0] ? (
                  <Link
                    className="inline-link"
                    href={`${buildPublishedCollectionMetadataPath(
                      selectedDraft.publication.publicPath
                    )}/${selectedDraft.items[0].position}`}
                    target="_blank"
                  >
                    Open first edition metadata
                  </Link>
                ) : null}
                {selectedDraft.publication && publicationTarget ? (
                  <Link
                    className="inline-link"
                    href={publicationTarget.publicBrandPath}
                    target="_blank"
                  >
                    Open brand landing
                  </Link>
                ) : null}
              </div>
              {selectedDraftHasInvalidItems ? (
                <div className="status-banner status-banner--error">
                  <strong>Publication warning</strong>
                  <span>
                    This draft has curated assets that are no longer approved.
                    Reconciliation will flag it, and review-ready publication
                    should be downgraded until the invalid items are fixed.
                  </span>
                </div>
              ) : null}
              {selectedDraft.publication ? (
                <form
                  className="studio-form publication-merchandising-form"
                  onSubmit={handleSavePublicationMerchandising}
                >
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
                  <label className="field-stack">
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
                  <label className="field-stack">
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
                      disabled={savingPublicationDraftId === selectedDraft.id}
                      type="submit"
                    >
                      {savingPublicationDraftId === selectedDraft.id
                        ? "Saving merchandising…"
                        : "Save merchandising"}
                    </button>
                  </div>
                </form>
              ) : null}
            </form>
          ) : (
            <div className="collection-empty-state">
              Select a draft to publish it.
            </div>
          )}
        </SurfaceCard>
        <SurfaceCard
          body="Prepare, sign, submit, confirm, and record owner-signed deployment and mint transactions directly from the immutable published snapshot. The server now verifies chain receipts before it accepts any deployment or mint record."
          eyebrow="Onchain"
          span={6}
          title="Deployment and minting"
        >
          {selectedDraft?.publication ? (
            <div className="studio-form">
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
                      {
                        selectedDraft.publication.activeDeployment.chain.label
                      }
                    </Pill>
                    <Pill>
                      {shortHex(
                        selectedDraft.publication.activeDeployment
                          .contractAddress
                      )}
                    </Pill>
                    <Pill>
                      {shortHex(
                        selectedDraft.publication.activeDeployment.deployTxHash
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
                        : ""
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
              {selectedDraft.publication.mints.length > 0 ? (
                <div className="collection-item-list">
                  {selectedDraft.publication.mints.map((mint) => (
                    <div className="collection-item-card" key={mint.id}>
                      <div className="collection-item-card__copy">
                        <strong>Token #{mint.tokenId}</strong>
                        <span>{mint.recipientWalletAddress}</span>
                        <span>{formatCandidateTimestamp(mint.mintedAt)}</span>
                      </div>
                      <div className="collection-item-card__actions">
                        <Pill>{shortHex(mint.txHash)}</Pill>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="collection-empty-state">
              Publish a collection before preparing deployment or minting.
            </div>
          )}
        </SurfaceCard>
        <SurfaceCard
          body="The ordered item list is the curated backbone for this draft. Review-ready status requires at least one included generated asset, and every included asset must remain approved."
          eyebrow="Curated order"
          span={6}
          title="Draft items"
        >
          {selectedDraft ? (
            <div className="collection-item-list">
              {selectedDraft.items.length === 0 ? (
                <div className="collection-empty-state">
                  No generated assets have been curated into this draft yet.
                </div>
              ) : (
                selectedDraft.items.map((item, index) => (
                  <div className="collection-item-card" key={item.id}>
                    <div className="collection-item-card__copy">
                      <strong>
                        {formatCandidateLabel(item.generatedAsset)}
                      </strong>
                      <span>
                        {item.generatedAsset.pipelineKey} · position{" "}
                        {item.position}
                      </span>
                      <span>
                        Added from source asset{" "}
                        {item.generatedAsset.sourceAssetId}
                      </span>
                    </div>
                    <div className="collection-item-card__actions">
                      <Pill>
                        {formatModerationStatus(
                          item.generatedAsset.moderationStatus
                        )}
                      </Pill>
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
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="collection-empty-state">
              Select a draft to curate assets.
            </div>
          )}
        </SurfaceCard>
        <SurfaceCard
          body="Recent generated outputs stay available as curation candidates so the operator can turn generation throughput into a deliberate collection, but only approved outputs can be added."
          eyebrow="Candidates"
          span={12}
          title="Recent generated assets"
        >
          <div className="candidate-list">
            {generatedAssetCandidates.length === 0 ? (
              <div className="collection-empty-state">
                No generated assets are available yet. Generate variants from
                `/studio/assets` first.
              </div>
            ) : (
              generatedAssetCandidates.map((candidate) => {
                const isIncluded = includedGeneratedAssetIds.has(
                  candidate.generatedAssetId
                );
                const isApproved =
                  candidate.moderationStatus === "approved";

                return (
                  <div
                    className="candidate-card"
                    key={candidate.generatedAssetId}
                  >
                    <div className="candidate-card__copy">
                      <strong>{formatCandidateLabel(candidate)}</strong>
                      <span>{candidate.pipelineKey}</span>
                      <span>
                        {formatCandidateTimestamp(candidate.createdAt)}
                      </span>
                      <span>
                        {formatModerationStatus(candidate.moderationStatus)}
                      </span>
                    </div>
                    <div className="candidate-card__actions">
                      <Pill>Source {candidate.sourceAssetId}</Pill>
                      <Pill>
                        {formatModerationStatus(candidate.moderationStatus)}
                      </Pill>
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
                            ? "Add to selected draft"
                            : "Awaiting approval"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
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
