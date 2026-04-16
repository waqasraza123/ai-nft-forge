"use client";

import {
  startTransition,
  type FormEvent,
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useState
} from "react";

import {
  generatedAssetDownloadIntentResponseSchema,
  generatedAssetModerationResponseSchema,
  generationRequestCreateResponseSchema,
  sourceAssetCompletionResponseSchema,
  sourceAssetContentTypeValues,
  sourceAssetListResponseSchema,
  type GeneratedAssetModerationStatus,
  sourceAssetUploadIntentResponseSchema,
  type SourceAssetContentType,
  type StudioSourceAssetSummary
} from "@ai-nft-forge/shared";
import {
  MetricTile,
  cn,
  PageShell,
  Pill,
  ActionButton,
  ActionLink,
  FieldLabel,
  FieldStack,
  InputField,
  StatusBanner,
  SurfaceCard,
  SurfaceGrid
} from "@ai-nft-forge/ui";

import { StudioAssetCard } from "./studio-asset-card";

type StudioAssetsClientProps = {
  initialAssets: StudioSourceAssetSummary[];
  ownerWalletAddress: string;
};

type NoticeTone = "error" | "info" | "success";

type NoticeState = {
  message: string;
  tone: NoticeTone;
} | null;

type UploadQueueItem = {
  fileName: string;
  id: string;
  message: string;
  progressPercent: number;
  status: "failed" | "preparing" | "succeeded" | "uploading" | "verifying";
};

type GeneratedAssetDownloadUrlMap = Record<string, string>;

const acceptedSourceAssetContentTypes = new Set<SourceAssetContentType>(
  sourceAssetContentTypeValues
);

const sourceAssetContentTypeByExtension = new Map<
  string,
  SourceAssetContentType
>([
  ["avif", "image/avif"],
  ["heic", "image/heic"],
  ["heif", "image/heif"],
  ["jpeg", "image/jpeg"],
  ["jpg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"]
]);

const acceptedSourceAssetInputValue = [
  ...sourceAssetContentTypeValues,
  ".avif",
  ".heic",
  ".heif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp"
].join(",");

const generationPollingIntervalMs = 5000;

function resolveSourceAssetContentType(
  file: File
): SourceAssetContentType | null {
  if (
    acceptedSourceAssetContentTypes.has(file.type as SourceAssetContentType)
  ) {
    return file.type as SourceAssetContentType;
  }

  const extensionMatch = /\.([A-Za-z0-9]+)$/u.exec(file.name);
  const extension = extensionMatch?.[1]?.toLowerCase();

  if (!extension) {
    return null;
  }

  return sourceAssetContentTypeByExtension.get(extension) ?? null;
}

function isGenerationActive(asset: StudioSourceAssetSummary) {
  return (
    asset.latestGeneration?.status === "queued" ||
    asset.latestGeneration?.status === "running"
  );
}

function getAssetWorkflowRank(asset: StudioSourceAssetSummary) {
  if (asset.latestGeneration?.status === "running") {
    return 0;
  }

  if (asset.latestGeneration?.status === "queued") {
    return 1;
  }

  if (asset.status !== "uploaded") {
    return 2;
  }

  if (asset.latestGeneration?.status === "failed") {
    return 3;
  }

  if (asset.latestGeneration?.status === "succeeded") {
    return 4;
  }

  return 5;
}

function sortAssetsForWorkspace(assets: StudioSourceAssetSummary[]) {
  return [...assets].sort((left, right) => {
    const leftRank = getAssetWorkflowRank(left);
    const rightRank = getAssetWorkflowRank(right);

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    const leftActivityAt =
      left.latestGeneration?.createdAt ?? left.uploadedAt ?? left.createdAt;
    const rightActivityAt =
      right.latestGeneration?.createdAt ?? right.uploadedAt ?? right.createdAt;

    return (
      new Date(rightActivityAt).getTime() - new Date(leftActivityAt).getTime()
    );
  });
}

function createFallbackErrorMessage(response: Response) {
  switch (response.status) {
    case 401:
      return "An active studio session is required.";
    case 404:
      return "The requested record was not found.";
    case 409:
      return "The requested action conflicts with the current asset state.";
    default:
      return "The request could not be completed.";
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

function uploadFileToSignedUrl(input: {
  contentType: SourceAssetContentType;
  file: File;
  onProgress: (progressPercent: number) => void;
  url: string;
}) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open("PUT", input.url);
    request.setRequestHeader("Content-Type", input.contentType);
    request.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || event.total <= 0) {
        return;
      }

      input.onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        input.onProgress(100);
        resolve();
        return;
      }

      reject(
        new Error(
          `Upload failed with status ${request.status} ${request.statusText}.`
        )
      );
    });
    request.addEventListener("error", () => {
      reject(new Error("Upload request failed."));
    });
    request.addEventListener("abort", () => {
      reject(new Error("Upload request was cancelled."));
    });
    request.send(input.file);
  });
}

function triggerBrowserDownload(url: string) {
  const link = document.createElement("a");

  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.append(link);
  link.click();
  link.remove();
}

function reconcileSelectedGenerationIds(input: {
  assets: StudioSourceAssetSummary[];
  current: Record<string, string>;
}) {
  const next: Record<string, string> = {};
  let hasChanged = false;

  for (const asset of input.assets) {
    const selectedGenerationId = input.current[asset.id];

    if (!selectedGenerationId) {
      continue;
    }

    if (
      asset.generationHistory.some(
        (generation) => generation.id === selectedGenerationId
      )
    ) {
      next[asset.id] = selectedGenerationId;
      continue;
    }

    hasChanged = true;
  }

  if (!hasChanged) {
    const currentAssetIds = Object.keys(input.current);

    if (currentAssetIds.length !== Object.keys(next).length) {
      hasChanged = true;
    } else {
      for (const assetId of currentAssetIds) {
        if (input.current[assetId] !== next[assetId]) {
          hasChanged = true;
          break;
        }
      }
    }
  }

  return hasChanged ? next : input.current;
}

function resolveSelectedGeneration(
  asset: StudioSourceAssetSummary,
  selectedGenerationId: string | null
) {
  if (!selectedGenerationId) {
    return asset.latestGeneration;
  }

  return (
    asset.generationHistory.find(
      (generation) => generation.id === selectedGenerationId
    ) ?? asset.latestGeneration
  );
}

function findGeneratedAssetById(input: {
  assets: StudioSourceAssetSummary[];
  generatedAssetId: string;
}) {
  for (const asset of input.assets) {
    for (const generation of asset.generationHistory) {
      const generatedAsset = generation.generatedAssets.find(
        (item) => item.id === input.generatedAssetId
      );

      if (generatedAsset) {
        return generatedAsset;
      }
    }
  }

  return null;
}

export function StudioAssetsClient({
  initialAssets,
  ownerWalletAddress
}: StudioAssetsClientProps) {
  const fileInputId = useId();
  const [assets, setAssets] = useState(initialAssets);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dispatchingAssetId, setDispatchingAssetId] = useState<string | null>(
    null
  );
  const [downloadingGeneratedAssetId, setDownloadingGeneratedAssetId] =
    useState<string | null>(null);
  const [moderatingGeneratedAssetId, setModeratingGeneratedAssetId] = useState<
    string | null
  >(null);
  const [retryingGenerationRequestId, setRetryingGenerationRequestId] =
    useState<string | null>(null);
  const [isPrimingPreviews, setIsPrimingPreviews] = useState(false);
  const [generatedAssetDownloadUrls, setGeneratedAssetDownloadUrls] =
    useState<GeneratedAssetDownloadUrlMap>({});
  const [selectedGenerationIdsByAssetId, setSelectedGenerationIdsByAssetId] =
    useState<Record<string, string>>({});
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(
    initialAssets[0]?.id ?? null
  );
  const [
    generationVariantCountsByAssetId,
    setGenerationVariantCountsByAssetId
  ] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const refreshInFlightRef = useRef(false);

  const sortedAssets = sortAssetsForWorkspace(assets);
  const selectedAsset = selectedAssetId
    ? (sortedAssets.find((asset) => asset.id === selectedAssetId) ??
      sortedAssets[0] ??
      null)
    : (sortedAssets[0] ?? null);
  const selectedGeneration = selectedAsset
    ? resolveSelectedGeneration(
        selectedAsset,
        selectedGenerationIdsByAssetId[selectedAsset.id] ?? null
      )
    : null;

  const activeGenerationAssets = assets.filter(isGenerationActive);
  const queuedAssets = assets.filter(
    (asset) => asset.latestGeneration?.status === "queued"
  ).length;
  const runningAssets = assets.filter(
    (asset) => asset.latestGeneration?.status === "running"
  ).length;
  const failedGenerationRunCount = assets.reduce(
    (count, asset) =>
      count +
      asset.generationHistory.filter(
        (generation) => generation.status === "failed"
      ).length,
    0
  );
  const generatedOutputCount = assets.reduce(
    (count, asset) =>
      count +
      asset.generationHistory.reduce(
        (assetCount, generation) =>
          assetCount + generation.generatedAssets.length,
        0
      ),
    0
  );
  const pendingReviewOutputCount = assets.reduce(
    (count, asset) =>
      count +
      asset.generationHistory.reduce(
        (assetCount, generation) =>
          assetCount +
          generation.generatedAssets.filter(
            (generatedAsset) =>
              generatedAsset.moderationStatus === "pending_review"
          ).length,
        0
      ),
    0
  );
  const uploadedAssets = assets.filter(
    (asset) => asset.status === "uploaded"
  ).length;

  const workspaceAssets = sortedAssets.filter(
    (asset) => asset.id !== selectedAsset?.id
  );

  useEffect(() => {
    if (
      selectedAssetId !== null &&
      !assets.some((asset) => asset.id === selectedAssetId)
    ) {
      setSelectedAssetId(sortedAssets[0]?.id ?? null);
    }
  }, [assets, selectedAssetId, sortedAssets]);

  useEffect(() => {
    if (!selectedGeneration) {
      setIsPrimingPreviews(false);
      return;
    }

    const generatedAssetsNeedingPreview =
      selectedGeneration.generatedAssets.filter(
        (generatedAsset) => !generatedAssetDownloadUrls[generatedAsset.id]
      );

    if (generatedAssetsNeedingPreview.length === 0) {
      setIsPrimingPreviews(false);
      return;
    }

    let isCancelled = false;
    setIsPrimingPreviews(true);

    void (async () => {
      const nextMap: GeneratedAssetDownloadUrlMap = {};

      for (const generatedAsset of generatedAssetsNeedingPreview) {
        try {
          const url = await requestGeneratedAssetDownloadUrl(generatedAsset.id);

          if (!url) {
            continue;
          }

          nextMap[generatedAsset.id] = url;
        } catch {
          continue;
        }
      }

      if (!isCancelled) {
        if (Object.keys(nextMap).length > 0) {
          setGeneratedAssetDownloadUrls(
            (currentGeneratedAssetDownloadUrls) => ({
              ...currentGeneratedAssetDownloadUrls,
              ...nextMap
            })
          );
        }

        setIsPrimingPreviews(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [selectedGeneration?.id, generatedAssetDownloadUrls]);

  const requestGeneratedAssetDownloadUrl = async (generatedAssetId: string) => {
    const cachedUrl = generatedAssetDownloadUrls[generatedAssetId];

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

    setGeneratedAssetDownloadUrls((currentGeneratedAssetDownloadUrls) => {
      if (currentGeneratedAssetDownloadUrls[generatedAssetId]) {
        return currentGeneratedAssetDownloadUrls;
      }

      return {
        ...currentGeneratedAssetDownloadUrls,
        [generatedAssetId]: result.download.url
      };
    });

    return result.download.url;
  };

  const refreshAssets = useEffectEvent(async (input?: { silent?: boolean }) => {
    if (refreshInFlightRef.current) {
      return;
    }

    refreshInFlightRef.current = true;

    if (!input?.silent) {
      setIsRefreshing(true);
    }

    try {
      const response = await fetch("/api/studio/assets", {
        cache: "no-store"
      });
      const result = await parseJsonResponse({
        response,
        schema: sourceAssetListResponseSchema
      });

      startTransition(() => {
        setAssets(result.assets);
        setSelectedGenerationIdsByAssetId((current) =>
          reconcileSelectedGenerationIds({
            assets: result.assets,
            current
          })
        );
        setSelectedAssetId((currentAssetId) => {
          if (!currentAssetId) {
            return result.assets[0]?.id ?? null;
          }

          return result.assets.some((asset) => asset.id === currentAssetId)
            ? currentAssetId
            : (result.assets[0]?.id ?? null);
        });
      });
    } catch (error) {
      if (!input?.silent) {
        setNotice({
          message:
            error instanceof Error
              ? error.message
              : "The latest studio assets could not be loaded.",
          tone: "error"
        });
      }
    } finally {
      refreshInFlightRef.current = false;
      if (!input?.silent) {
        setIsRefreshing(false);
      }
    }
  });

  useEffect(() => {
    if (activeGenerationAssets.length === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshAssets({
        silent: true
      });
    }, generationPollingIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeGenerationAssets.length, refreshAssets]);

  const handleUploadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedFiles.length === 0) {
      setNotice({
        message: "Select at least one supported source image before uploading.",
        tone: "error"
      });
      return;
    }

    setIsUploading(true);
    setNotice({
      message: "Preparing source asset uploads.",
      tone: "info"
    });

    const nextUploadQueue = selectedFiles.map((file, index) => ({
      fileName: file.name,
      id: `${Date.now()}-${index}-${file.name}`,
      message: "Preparing upload intent",
      progressPercent: 0,
      status: "preparing" as const
    }));

    setUploadQueue(nextUploadQueue);

    let completedUploadCount = 0;
    let failedUploadCount = 0;

    for (const [index, file] of selectedFiles.entries()) {
      const uploadQueueItem = nextUploadQueue[index];

      if (!uploadQueueItem) {
        failedUploadCount += 1;
        continue;
      }

      const contentType = resolveSourceAssetContentType(file);

      if (!contentType) {
        updateUploadQueueItem(uploadQueueItem.id, {
          message: "Unsupported file type",
          progressPercent: 0,
          status: "failed"
        });
        failedUploadCount += 1;
        continue;
      }

      try {
        const uploadIntentResponse = await fetch(
          "/api/studio/assets/upload-intents",
          {
            body: JSON.stringify({
              contentType,
              fileName: file.name
            }),
            headers: {
              "Content-Type": "application/json"
            },
            method: "POST"
          }
        );
        const uploadIntent = await parseJsonResponse({
          response: uploadIntentResponse,
          schema: sourceAssetUploadIntentResponseSchema
        });

        updateUploadQueueItem(uploadQueueItem.id, {
          message: "Uploading source image",
          progressPercent: 0,
          status: "uploading"
        });

        await uploadFileToSignedUrl({
          contentType,
          file,
          onProgress: (progressPercent) =>
            updateUploadQueueItem(uploadQueueItem.id, {
              message: `Uploading source image (${progressPercent}%)`,
              progressPercent,
              status: "uploading"
            }),
          url: uploadIntent.upload.url
        });

        updateUploadQueueItem(uploadQueueItem.id, {
          message: "Verifying uploaded object",
          progressPercent: 100,
          status: "verifying"
        });

        const completionResponse = await fetch(
          `/api/studio/assets/${uploadIntent.asset.id}/complete`,
          {
            method: "POST"
          }
        );

        await parseJsonResponse({
          response: completionResponse,
          schema: sourceAssetCompletionResponseSchema
        });

        updateUploadQueueItem(uploadQueueItem.id, {
          message: "Upload completed",
          progressPercent: 100,
          status: "succeeded"
        });

        completedUploadCount += 1;
      } catch (error) {
        updateUploadQueueItem(uploadQueueItem.id, {
          message:
            error instanceof Error
              ? error.message
              : "Upload could not be completed.",
          progressPercent: 0,
          status: "failed"
        });
        failedUploadCount += 1;
      }
    }

    await refreshAssets();
    setIsUploading(false);
    setSelectedFiles([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (completedUploadCount > 0 && failedUploadCount === 0) {
      setNotice({
        message: `Uploaded ${completedUploadCount} source asset${completedUploadCount === 1 ? "" : "s"}.`,
        tone: "success"
      });
      return;
    }

    if (completedUploadCount > 0 && failedUploadCount > 0) {
      setNotice({
        message: `Uploaded ${completedUploadCount} source asset${completedUploadCount === 1 ? "" : "s"} and failed ${failedUploadCount}.`,
        tone: "info"
      });
      return;
    }

    setNotice({
      message: "No source assets were uploaded successfully.",
      tone: "error"
    });
  };

  const startGeneration = async (assetId: string, variantCount: number) => {
    setDispatchingAssetId(assetId);
    setSelectedAssetId(assetId);
    setNotice({
      message: "Dispatching generation request.",
      tone: "info"
    });

    try {
      const response = await fetch("/api/studio/generations", {
        body: JSON.stringify({
          sourceAssetId: assetId,
          variantCount
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      const result = await parseJsonResponse({
        response,
        schema: generationRequestCreateResponseSchema
      });
      setSelectedGenerationIdsByAssetId(
        (currentSelectedGenerationIdsByAssetId) => ({
          ...currentSelectedGenerationIdsByAssetId,
          [assetId]: result.generation.id
        })
      );
      await refreshAssets();

      setNotice({
        message: "Generation request queued for worker processing.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Generation could not be started.",
        tone: "error"
      });
    } finally {
      setDispatchingAssetId(null);
    }
  };

  const retryGeneration = async (generationRequestId: string) => {
    setRetryingGenerationRequestId(generationRequestId);
    setNotice({
      message: "Retrying the failed generation request.",
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/generations/${generationRequestId}/retry`,
        {
          method: "POST"
        }
      );

      const result = await parseJsonResponse({
        response,
        schema: generationRequestCreateResponseSchema
      });
      setSelectedGenerationIdsByAssetId(
        (currentSelectedGenerationIdsByAssetId) => ({
          ...currentSelectedGenerationIdsByAssetId,
          [result.generation.sourceAssetId]: result.generation.id
        })
      );
      setSelectedAssetId(result.generation.sourceAssetId);
      await refreshAssets();

      setNotice({
        message: "Failed generation request re-queued for worker processing.",
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Generation retry could not be started.",
        tone: "error"
      });
    } finally {
      setRetryingGenerationRequestId(null);
    }
  };

  const downloadGeneratedAsset = async (generatedAssetId: string) => {
    setDownloadingGeneratedAssetId(generatedAssetId);
    setNotice({
      message: "Preparing generated asset download.",
      tone: "info"
    });

    try {
      const url = await requestGeneratedAssetDownloadUrl(generatedAssetId);
      triggerBrowserDownload(url);

      const generatedAsset = findGeneratedAssetById({
        assets,
        generatedAssetId
      });

      setNotice({
        message: `Download is ready for variant ${generatedAsset?.variantIndex ?? ""}.`,
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Download could not be prepared.",
        tone: "error"
      });
    } finally {
      setDownloadingGeneratedAssetId(null);
    }
  };

  const updateGeneratedAssetModeration = async (
    generatedAssetId: string,
    moderationStatus: GeneratedAssetModerationStatus
  ) => {
    setModeratingGeneratedAssetId(generatedAssetId);
    setNotice({
      message: `Setting output moderation to ${
        moderationStatus === "approved"
          ? "approved"
          : moderationStatus === "rejected"
            ? "rejected"
            : "pending review"
      }`,
      tone: "info"
    });

    try {
      const response = await fetch(
        `/api/studio/generated-assets/${generatedAssetId}/moderation`,
        {
          body: JSON.stringify({
            moderationStatus
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "PATCH"
        }
      );
      const result = await parseJsonResponse({
        response,
        schema: generatedAssetModerationResponseSchema
      });

      await refreshAssets({
        silent: true
      });
      setNotice({
        message: `Variant ${result.asset.variantIndex} is now ${
          result.asset.moderationStatus === "approved"
            ? "approved"
            : result.asset.moderationStatus === "rejected"
              ? "rejected"
              : "pending review"
        }.`,
        tone: "success"
      });
    } catch (error) {
      setNotice({
        message:
          error instanceof Error
            ? error.message
            : "Generated asset moderation could not be updated.",
        tone: "error"
      });
    } finally {
      setModeratingGeneratedAssetId(null);
    }
  };

  const updateUploadQueueItem = (
    uploadQueueItemId: string,
    updates: Partial<UploadQueueItem>
  ) => {
    setUploadQueue((currentUploadQueue) =>
      currentUploadQueue.map((item) =>
        item.id === uploadQueueItemId
          ? {
              ...item,
              ...updates
            }
          : item
      )
    );
  };

  return (
    <PageShell
      eyebrow="Studio assets"
      title="Upload, dispatch, review history, and retrieve generated outputs"
      lead="Use this as a lane-based operator workspace: upload sources quickly, run generation jobs, compare run history, and promote or retry outputs from a single panel."
      actions={
        <>
          <ActionLink href="/studio" tone="inline">
            Back to studio
          </ActionLink>
          <ActionButton
            disabled={isRefreshing}
            onClick={() => void refreshAssets()}
            type="button"
          >
            {isRefreshing ? "Refreshing..." : "Refresh assets"}
          </ActionButton>
        </>
      }
      tone="studio"
    >
      <SurfaceGrid>
        <SurfaceCard
          body="Select one or more supported image files to create source assets, send them into private storage, and verify each upload before dispatching generation jobs."
          eyebrow="Source intake"
          span={12}
          title="Pipeline command center"
        >
          <div className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-4 md:p-5">
            <form className="grid gap-3" onSubmit={handleUploadSubmit}>
              <FieldStack htmlFor={fileInputId}>
                <FieldLabel>Source files</FieldLabel>
                <InputField
                  accept={acceptedSourceAssetInputValue}
                  className="file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[color:var(--color-surface-strong)] file:px-3 file:py-2 file:text-sm file:text-[color:var(--color-text)] file:shadow-sm"
                  disabled={isUploading}
                  id={fileInputId}
                  multiple
                  onChange={(event) =>
                    setSelectedFiles(
                      event.target.files ? Array.from(event.target.files) : []
                    )
                  }
                  ref={fileInputRef}
                  tone="file"
                  type="file"
                />
              </FieldStack>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <ActionButton
                  disabled={isUploading || selectedFiles.length === 0}
                  tone="accent"
                  type="submit"
                >
                  {isUploading
                    ? "Uploading..."
                    : selectedFiles.length > 1
                      ? `Upload ${selectedFiles.length} files`
                      : "Upload source asset"}
                </ActionButton>
                <span className="max-w-sm text-sm text-[color:var(--color-muted)]">
                  Supports AVIF, HEIC, HEIF, JPEG, PNG, and WEBP.
                </span>
              </div>
            </form>
            {selectedFiles.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedFiles.map((file) => (
                  <Pill key={`${file.name}-${file.lastModified}`}>
                    {file.name}
                  </Pill>
                ))}
              </div>
            ) : null}
            {uploadQueue.length > 0 ? (
              <div className="mt-3 space-y-2">
                {uploadQueue.map((item) => (
                  <div
                    className="grid gap-2 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] px-4 py-3 text-sm"
                    key={item.id}
                  >
                    <div className="grid gap-1">
                      <strong>{item.fileName}</strong>
                      <span className="text-[color:var(--color-muted)]">
                        {item.message}
                      </span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
                      aria-hidden="true"
                    >
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          item.status === "succeeded"
                            ? "bg-emerald-500/80"
                            : item.status === "failed"
                              ? "bg-rose-500/80"
                              : item.status === "preparing"
                                ? "bg-indigo-400/80"
                                : "bg-[color:var(--color-accent)]/75"
                        )}
                        style={{
                          width: `${item.progressPercent}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-4">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <MetricTile label="Owner" value={ownerWalletAddress} />
                <MetricTile label="Assets" value={String(assets.length)} />
                <MetricTile label="Uploaded" value={String(uploadedAssets)} />
                <MetricTile label="Queued" value={String(queuedAssets)} />
                <MetricTile label="Running" value={String(runningAssets)} />
                <MetricTile
                  label="Failed runs"
                  value={String(failedGenerationRunCount)}
                />
                <MetricTile
                  label="Outputs"
                  value={String(generatedOutputCount)}
                />
                <MetricTile
                  label="Pending review"
                  value={String(pendingReviewOutputCount)}
                />
              </div>
            </div>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="Use the source list to pick the current workspace focus, compare history in the right pane, and move quickly between active generation runs and moderation actions."
          eyebrow="Source pipeline"
          span={12}
          title="Workspace composition"
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <section className="space-y-3" aria-live="polite">
              <FieldLabel>Source assets</FieldLabel>
              {workspaceAssets.length === 0 ? (
                <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-4 py-3">
                  <strong>
                    {selectedAsset
                      ? "No other source assets in the current workspace view."
                      : "No source assets yet."}
                  </strong>
                  <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                    {selectedAsset
                      ? "Start a new workflow to compare multiple source assets in one scan."
                      : "Upload one or more supported images to begin."}
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {workspaceAssets.map((asset) => (
                    <StudioAssetCard
                      asset={asset}
                      displayMode="lane"
                      downloadGeneratedAsset={downloadGeneratedAsset}
                      downloadingGeneratedAssetId={downloadingGeneratedAssetId}
                      generatedAssetDownloadUrls={generatedAssetDownloadUrls}
                      generationVariantCount={
                        generationVariantCountsByAssetId[asset.id] ?? 4
                      }
                      isDispatchingGeneration={dispatchingAssetId === asset.id}
                      isSelected={selectedAsset?.id === asset.id}
                      key={asset.id}
                      moderatingGeneratedAssetId={moderatingGeneratedAssetId}
                      onSelect={() => {
                        setSelectedAssetId(asset.id);
                      }}
                      retryGeneration={retryGeneration}
                      retryingGenerationRequestId={retryingGenerationRequestId}
                      selectedGenerationId={
                        selectedGenerationIdsByAssetId[asset.id] ?? null
                      }
                      setGenerationVariantCount={(variantCount) =>
                        setGenerationVariantCountsByAssetId(
                          (currentGenerationVariantCountsByAssetId) => ({
                            ...currentGenerationVariantCountsByAssetId,
                            [asset.id]: variantCount
                          })
                        )
                      }
                      setSelectedGenerationId={(generationRequestId) =>
                        setSelectedGenerationIdsByAssetId(
                          (currentSelectedGenerationIdsByAssetId) => ({
                            ...currentSelectedGenerationIdsByAssetId,
                            [asset.id]: generationRequestId
                          })
                        )
                      }
                      startGeneration={startGeneration}
                      updateGeneratedAssetModeration={
                        updateGeneratedAssetModeration
                      }
                    />
                  ))}
                </div>
              )}
            </section>
            <section className="space-y-3" aria-live="polite">
              {selectedAsset ? (
                <StudioAssetCard
                  asset={selectedAsset}
                  displayMode="detail"
                  downloadGeneratedAsset={downloadGeneratedAsset}
                  downloadingGeneratedAssetId={downloadingGeneratedAssetId}
                  generatedAssetDownloadUrls={generatedAssetDownloadUrls}
                  generationVariantCount={
                    generationVariantCountsByAssetId[selectedAsset.id] ?? 4
                  }
                  isDispatchingGeneration={
                    dispatchingAssetId === selectedAsset.id
                  }
                  isSelected
                  moderatingGeneratedAssetId={moderatingGeneratedAssetId}
                  onSelect={() => {
                    void refreshAssets({
                      silent: true
                    });
                  }}
                  retryGeneration={retryGeneration}
                  retryingGenerationRequestId={retryingGenerationRequestId}
                  selectedGenerationId={
                    selectedGenerationIdsByAssetId[selectedAsset.id] ?? null
                  }
                  setGenerationVariantCount={(variantCount) =>
                    setGenerationVariantCountsByAssetId(
                      (currentGenerationVariantCountsByAssetId) => ({
                        ...currentGenerationVariantCountsByAssetId,
                        [selectedAsset.id]: variantCount
                      })
                    )
                  }
                  setSelectedGenerationId={(generationRequestId) =>
                    setSelectedGenerationIdsByAssetId(
                      (currentSelectedGenerationIdsByAssetId) => ({
                        ...currentSelectedGenerationIdsByAssetId,
                        [selectedAsset.id]: generationRequestId
                      })
                    )
                  }
                  startGeneration={startGeneration}
                  updateGeneratedAssetModeration={
                    updateGeneratedAssetModeration
                  }
                />
              ) : (
                <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-4 py-3">
                  <strong>
                    Open a source asset to inspect history and outputs.
                  </strong>
                  <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                    Upload a source image first, then use a lane card on the
                    left.
                  </p>
                </div>
              )}
              {isPrimingPreviews ? (
                <p className="text-sm text-[color:var(--color-muted)]">
                  Preparing image previews for selected generation.
                </p>
              ) : null}
            </section>
          </div>
        </SurfaceCard>
        {notice ? (
          <SurfaceCard
            body={notice.message}
            eyebrow={notice.tone}
            span={12}
            title="Workflow status"
          >
            <StatusBanner tone={notice.tone}>
              <span>{notice.message}</span>
            </StatusBanner>
          </SurfaceCard>
        ) : null}
      </SurfaceGrid>
    </PageShell>
  );
}
