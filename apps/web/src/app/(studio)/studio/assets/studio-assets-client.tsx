"use client";

import Link from "next/link";
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
  generationRequestCreateResponseSchema,
  sourceAssetCompletionResponseSchema,
  sourceAssetContentTypeValues,
  sourceAssetListResponseSchema,
  sourceAssetUploadIntentResponseSchema,
  type SourceAssetContentType,
  type StudioSourceAssetSummary
} from "@ai-nft-forge/shared";
import {
  MetricTile,
  PageShell,
  Pill,
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

  const extensionMatch = /\.([A-Za-z0-9]+)$/.exec(file.name);
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
  const [retryingGenerationRequestId, setRetryingGenerationRequestId] =
    useState<string | null>(null);
  const [
    generationVariantCountsByAssetId,
    setGenerationVariantCountsByAssetId
  ] = useState<Record<string, number>>({});
  const [selectedGenerationIdsByAssetId, setSelectedGenerationIdsByAssetId] =
    useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const refreshInFlightRef = useRef(false);

  const queuedAssets = assets.filter(
    (asset) => asset.latestGeneration?.status === "queued"
  ).length;
  const runningAssets = assets.filter(
    (asset) => asset.latestGeneration?.status === "running"
  ).length;
  const totalGenerationRunCount = assets.reduce(
    (count, asset) => count + asset.generationHistory.length,
    0
  );
  const failedGenerationRunCount = assets.reduce(
    (count, asset) =>
      count +
      asset.generationHistory.filter(
        (generation) => generation.status === "failed"
      ).length,
    0
  );
  const succeededGenerationRunCount = assets.reduce(
    (count, asset) =>
      count +
      asset.generationHistory.filter(
        (generation) => generation.status === "succeeded"
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
  const uploadedAssets = assets.filter(
    (asset) => asset.status === "uploaded"
  ).length;
  const hasActiveGenerations = assets.some((asset) =>
    isGenerationActive(asset)
  );

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
    if (!hasActiveGenerations) {
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
  }, [hasActiveGenerations, refreshAssets]);

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

      triggerBrowserDownload(result.download.url);
      setNotice({
        message: `Download is ready for variant ${result.asset.variantIndex}.`,
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

  return (
    <PageShell
      eyebrow="Studio assets"
      title="Upload, dispatch, review history, and retrieve generated outputs"
      lead="The studio asset workflow now runs end to end in the browser: source images upload directly into private storage through signed intents, generation requests dispatch into BullMQ, active jobs poll automatically, and each asset keeps a browsable generation history so prior runs can be compared and retried without leaving the studio."
      actions={
        <>
          <Link className="action-link" href="/studio">
            Back to studio
          </Link>
          <button
            className="button-action"
            disabled={isRefreshing}
            onClick={() => void refreshAssets()}
            type="button"
          >
            {isRefreshing ? "Refreshing..." : "Refresh assets"}
          </button>
        </>
      }
      tone="studio"
    >
      <SurfaceGrid>
        <SurfaceCard
          body="Select one or more supported image files to create source assets, stream them into private storage, and verify each upload before the asset becomes generation-ready."
          eyebrow="Upload"
          span={8}
          title="Source asset intake"
        >
          <form className="studio-form" onSubmit={handleUploadSubmit}>
            <label className="field-stack" htmlFor={fileInputId}>
              <span className="field-label">Source files</span>
              <input
                accept={acceptedSourceAssetInputValue}
                className="input-field input-field--file"
                disabled={isUploading}
                id={fileInputId}
                multiple
                onChange={(event) =>
                  setSelectedFiles(
                    event.target.files ? Array.from(event.target.files) : []
                  )
                }
                ref={fileInputRef}
                type="file"
              />
            </label>
            <div className="studio-action-row">
              <button
                className="button-action button-action--accent"
                disabled={isUploading || selectedFiles.length === 0}
                type="submit"
              >
                {isUploading
                  ? "Uploading..."
                  : selectedFiles.length > 1
                    ? `Upload ${selectedFiles.length} files`
                    : "Upload source asset"}
              </button>
              <span className="field-hint">
                Supports AVIF, HEIC, HEIF, JPEG, PNG, and WEBP.
              </span>
            </div>
          </form>
          {selectedFiles.length > 0 ? (
            <div className="pill-row">
              {selectedFiles.map((file) => (
                <Pill key={`${file.name}-${file.lastModified}`}>
                  {file.name}
                </Pill>
              ))}
            </div>
          ) : null}
          {uploadQueue.length > 0 ? (
            <div className="upload-queue">
              {uploadQueue.map((item) => (
                <div className="upload-queue-item" key={item.id}>
                  <div className="upload-queue-copy">
                    <strong>{item.fileName}</strong>
                    <span>{item.message}</span>
                  </div>
                  <div className="progress-track" aria-hidden="true">
                    <span
                      className={`progress-bar progress-bar--${item.status}`}
                      style={{
                        width: `${item.progressPercent}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </SurfaceCard>
        <SurfaceCard
          body="Uploads are owner-scoped and private. Generations dispatch per asset, polling only runs while work is queued or running, retries stay bound to explicit failed runs, and every asset now retains its full generation history."
          eyebrow="Workflow"
          span={4}
          title="Operator guardrails"
        >
          <div className="pill-row">
            <Pill>Owner scoped</Pill>
            <Pill>Polling on demand</Pill>
            <Pill>Signed downloads</Pill>
            <Pill>Variant count 1-8</Pill>
            <Pill>Retry failed runs</Pill>
            <Pill>Per-asset history</Pill>
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="Current source asset state stays live below. Dispatch controls unlock after upload verification, the latest run still drives active-state polling, and each asset now exposes full run history plus archived-output comparison."
          eyebrow="Summary"
          span={8}
          title="Current source asset and generation records"
        >
          <div className="metric-list">
            <MetricTile label="Owner" value={ownerWalletAddress} />
            <MetricTile label="Assets" value={String(assets.length)} />
            <MetricTile label="Uploaded" value={String(uploadedAssets)} />
            <MetricTile
              label="Generation runs"
              value={String(totalGenerationRunCount)}
            />
            <MetricTile label="Queued assets" value={String(queuedAssets)} />
            <MetricTile label="Running assets" value={String(runningAssets)} />
            <MetricTile
              label="Succeeded runs"
              value={String(succeededGenerationRunCount)}
            />
            <MetricTile
              label="Failed runs"
              value={String(failedGenerationRunCount)}
            />
            <MetricTile
              label="Generated outputs"
              value={String(generatedOutputCount)}
            />
          </div>
        </SurfaceCard>
        <SurfaceCard
          body="The route surface now supports not only upload, dispatch, retry, and protected retrieval, but also a richer studio read model where assets carry generation history suitable for in-browser comparison."
          eyebrow="Routes"
          span={4}
          title="Live browser boundary"
        >
          <div className="pill-row">
            <Pill>GET /api/studio/assets</Pill>
            <Pill>POST /api/studio/assets/upload-intents</Pill>
            <Pill>POST /api/studio/assets/[assetId]/complete</Pill>
            <Pill>POST /api/studio/generations</Pill>
            <Pill>
              POST /api/studio/generations/[generationRequestId]/retry
            </Pill>
            <Pill>
              POST
              /api/studio/generated-assets/[generatedAssetId]/download-intent
            </Pill>
          </div>
        </SurfaceCard>
        {notice ? (
          <SurfaceCard
            body={notice.message}
            eyebrow={notice.tone}
            span={12}
            title="Workflow status"
          >
            <div className={`status-banner status-banner--${notice.tone}`}>
              <span>{notice.message}</span>
            </div>
          </SurfaceCard>
        ) : null}
        {assets.length === 0 ? (
          <SurfaceCard
            body="No source assets have been created for this studio owner yet. Use the upload surface above to create the first source asset and unlock generation dispatch."
            eyebrow="Empty state"
            span={12}
            title="No assets yet"
          />
        ) : (
          assets.map((asset) => (
            <StudioAssetCard
              asset={asset}
              downloadGeneratedAsset={downloadGeneratedAsset}
              downloadingGeneratedAssetId={downloadingGeneratedAssetId}
              generationVariantCount={
                generationVariantCountsByAssetId[asset.id] ?? 4
              }
              isDispatchingGeneration={dispatchingAssetId === asset.id}
              key={asset.id}
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
            />
          ))
        )}
      </SurfaceGrid>
    </PageShell>
  );
}
