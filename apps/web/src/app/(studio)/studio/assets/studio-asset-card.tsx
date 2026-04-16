import {
  type GeneratedAssetModerationStatus,
  type GenerationRequestSummary,
  type StudioSourceAssetSummary
} from "@ai-nft-forge/shared";
import {
  ActionButton,
  FieldLabel,
  FieldStack,
  Pill,
  StatusBanner,
  SurfaceCard
} from "@ai-nft-forge/ui";

type AssetImage = {
  label: string;
  url?: string;
  variantIndex: number;
};

type GeneratedAssetDownloadUrlMap = Record<string, string>;

type StudioAssetCardProps = {
  asset: StudioSourceAssetSummary;
  downloadGeneratedAsset: (generatedAssetId: string) => Promise<void>;
  downloadingGeneratedAssetId: string | null;
  generatedAssetDownloadUrls?: GeneratedAssetDownloadUrlMap;
  generationVariantCount: number;
  isDispatchingGeneration: boolean;
  isSelected?: boolean;
  moderatingGeneratedAssetId: string | null;
  onSelect?: () => void;
  retryGeneration: (generationRequestId: string) => Promise<void>;
  retryingGenerationRequestId: string | null;
  selectedGenerationId: string | null;
  setGenerationVariantCount: (variantCount: number) => void;
  setSelectedGenerationId: (generationRequestId: string) => void;
  startGeneration: (assetId: string, variantCount: number) => Promise<void>;
  updateGeneratedAssetModeration: (
    generatedAssetId: string,
    moderationStatus: GeneratedAssetModerationStatus
  ) => Promise<void>;
  displayMode?: "detail" | "lane";
};

function formatAssetByteSize(byteSize: number | null) {
  if (typeof byteSize !== "number" || Number.isNaN(byteSize)) {
    return "Size pending";
  }

  if (byteSize < 1024) {
    return `${byteSize} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = byteSize / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatIsoDateTime(value: string | null) {
  if (!value) {
    return "Pending";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function isGenerationActive(asset: StudioSourceAssetSummary) {
  return (
    asset.latestGeneration?.status === "queued" ||
    asset.latestGeneration?.status === "running"
  );
}

function canStartGeneration(asset: StudioSourceAssetSummary) {
  return asset.status === "uploaded" && !isGenerationActive(asset);
}

function resolveGenerationActionLabel(asset: StudioSourceAssetSummary) {
  if (!asset.latestGeneration) {
    return "Generate outputs";
  }

  if (asset.latestGeneration.status === "failed") {
    return "Start new run";
  }

  return "Regenerate";
}

function resolveGenerationLifecycleLabel(generation: GenerationRequestSummary) {
  if (generation.status === "failed") {
    return `Failed ${formatIsoDateTime(generation.failedAt)}`;
  }

  if (generation.status === "succeeded") {
    return `Completed ${formatIsoDateTime(generation.completedAt)}`;
  }

  if (generation.status === "running") {
    return `Started ${formatIsoDateTime(generation.startedAt)}`;
  }

  return "Queued for worker processing";
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

function resolveOutputPlaceholderMessage(
  generation: GenerationRequestSummary | null
) {
  if (!generation) {
    return "Stored generated outputs will appear here after worker processing succeeds.";
  }

  if (generation.status === "failed") {
    return "This generation run failed before any stored outputs were recorded.";
  }

  if (generation.status === "queued" || generation.status === "running") {
    return "Stored generated outputs will appear here after worker processing succeeds.";
  }

  return "This generation run completed without any stored outputs.";
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

function resolveImageMeta(
  generatedAssetDownloadUrls: GeneratedAssetDownloadUrlMap,
  fallbackAsset: { id: string; variantIndex: number } | null
): AssetImage {
  const url = fallbackAsset
    ? generatedAssetDownloadUrls[fallbackAsset.id]
    : null;

  if (fallbackAsset === null) {
    return {
      label: "No generated output",
      variantIndex: 0
    };
  }

  if (!url) {
    return {
      label: `Variant ${fallbackAsset.variantIndex}`,
      variantIndex: fallbackAsset.variantIndex
    };
  }

  return {
    label: `Variant ${fallbackAsset.variantIndex}`,
    url,
    variantIndex: fallbackAsset.variantIndex
  };
}

export function StudioAssetCard({
  asset,
  downloadGeneratedAsset,
  downloadingGeneratedAssetId,
  generatedAssetDownloadUrls,
  generationVariantCount,
  isDispatchingGeneration,
  isSelected,
  moderatingGeneratedAssetId,
  onSelect,
  retryGeneration,
  retryingGenerationRequestId,
  selectedGenerationId,
  setGenerationVariantCount,
  setSelectedGenerationId,
  startGeneration,
  updateGeneratedAssetModeration,
  displayMode = "lane"
}: StudioAssetCardProps) {
  const selectedGeneration = resolveSelectedGeneration(
    asset,
    selectedGenerationId
  );
  const canRetrySelectedGeneration =
    selectedGeneration?.status === "failed" && canStartGeneration(asset);
  const generationRunCount = asset.generationHistory.length;
  const failedRunCount = asset.generationHistory.filter(
    (generation) => generation.status === "failed"
  ).length;
  const succeededRunCount = asset.generationHistory.filter(
    (generation) => generation.status === "succeeded"
  ).length;
  const totalStoredOutputCount = asset.generationHistory.reduce(
    (count, generation) => count + generation.generatedAssets.length,
    0
  );
  const previewAsset =
    asset.latestGeneratedAssets[0] ??
    selectedGeneration?.generatedAssets[0] ??
    null;
  const primaryPreview = resolveImageMeta(
    generatedAssetDownloadUrls ?? {},
    previewAsset
      ? {
          id: previewAsset.id,
          variantIndex: previewAsset.variantIndex
        }
      : null
  );
  const latestStatusLabel = asset.latestGeneration
    ? `Generation ${asset.latestGeneration.status}`
    : "No generation request";

  if (displayMode === "lane") {
    return (
      <SurfaceCard
        body={`${asset.contentType} · ${formatAssetByteSize(asset.byteSize)}`}
        eyebrow={asset.status}
        title={asset.originalFilename}
        footer={
          <div className="grid gap-2.5">
            <div className="flex flex-wrap gap-2">
              <FieldStack>
                <FieldLabel>Variant count</FieldLabel>
                <select
                  className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                  disabled={isDispatchingGeneration}
                  id={`variant-count-${asset.id}`}
                  onChange={(event) =>
                    setGenerationVariantCount(Number(event.target.value))
                  }
                  value={generationVariantCount}
                >
                  {Array.from({ length: 8 }, (_, index) => index + 1).map(
                    (variantCount) => (
                      <option key={variantCount} value={variantCount}>
                        {variantCount} variant{variantCount === 1 ? "" : "s"}
                      </option>
                    )
                  )}
                </select>
              </FieldStack>
              {canStartGeneration(asset) ? (
                <ActionButton
                  disabled={isDispatchingGeneration}
                  onClick={() =>
                    void startGeneration(asset.id, generationVariantCount)
                  }
                  tone="accent"
                  type="button"
                >
                  {resolveGenerationActionLabel(asset)}
                </ActionButton>
              ) : null}
            </div>
            <div>
              <ActionButton
                onClick={() => {
                  onSelect?.();
                }}
                type="button"
                tone="ghost"
              >
                {isSelected ? "Inspecting now" : "Inspect in workflow"}
              </ActionButton>
            </div>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-[1fr_1.4fr]">
          <div className="relative overflow-hidden rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)] p-2">
            {primaryPreview.url ? (
              <img
                alt={`Latest generated output for ${asset.originalFilename}`}
                className="h-full min-h-40 w-full rounded-lg object-cover"
                loading="lazy"
                src={primaryPreview.url}
              />
            ) : (
              <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-xs text-[color:var(--color-muted)]">
                {asset.contentType}
              </div>
            )}
            <span className="absolute left-2 top-2 inline-flex items-center rounded-full bg-[color:var(--color-surface)]/85 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
              {latestStatusLabel}
            </span>
          </div>
          <div className="grid gap-2">
            <FieldLabel>State</FieldLabel>
            <p>
              {asset.id} · {formatIsoDateTime(asset.uploadedAt)}
            </p>
            <div className="flex flex-wrap gap-2">
              <Pill>
                {asset.latestGeneration
                  ? `${asset.latestGeneration.requestedVariantCount} variants`
                  : "Not yet generated"}
              </Pill>
              <Pill>
                {generationRunCount > 0
                  ? `${generationRunCount} run${generationRunCount === 1 ? "" : "s"}`
                  : "No history"}
              </Pill>
              <Pill>
                {totalStoredOutputCount > 0
                  ? `${totalStoredOutputCount} output${totalStoredOutputCount === 1 ? "" : "s"}`
                  : "No outputs"}
              </Pill>
            </div>
            <p className="text-xs text-[color:var(--color-muted)]">
              Source size {formatAssetByteSize(asset.byteSize)}
            </p>
          </div>
        </div>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard
      body={`${asset.contentType} · ${formatAssetByteSize(asset.byteSize)}`}
      eyebrow={asset.status}
      title={asset.originalFilename}
      footer={
        canStartGeneration(asset) ? (
          <div className="flex flex-wrap gap-2">
            <FieldStack>
              <FieldLabel>Variant count</FieldLabel>
              <select
                className="w-full rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] focus:border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
                disabled={isDispatchingGeneration}
                id={`variant-count-${asset.id}`}
                onChange={(event) =>
                  setGenerationVariantCount(Number(event.target.value))
                }
                value={generationVariantCount}
              >
                {Array.from({ length: 8 }, (_, index) => index + 1).map(
                  (variantCount) => (
                    <option key={variantCount} value={variantCount}>
                      {variantCount} variant{variantCount === 1 ? "" : "s"}
                    </option>
                  )
                )}
              </select>
            </FieldStack>
            <ActionButton
              disabled={isDispatchingGeneration}
              onClick={() =>
                void startGeneration(asset.id, generationVariantCount)
              }
              tone="accent"
              type="button"
            >
              {resolveGenerationActionLabel(asset)}
            </ActionButton>
          </div>
        ) : null
      }
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-2">
          <Pill>{asset.id}</Pill>
          <Pill>{formatIsoDateTime(asset.uploadedAt)}</Pill>
          <Pill>{latestStatusLabel}</Pill>
          <Pill>
            {asset.latestGeneration
              ? `${asset.latestGeneration.requestedVariantCount} variants`
              : asset.status === "uploaded"
                ? "Ready for dispatch"
                : "Upload in progress"}
          </Pill>
          <Pill>
            {generationRunCount > 0
              ? `${generationRunCount} generation run${generationRunCount === 1 ? "" : "s"}`
              : "No history"}
          </Pill>
          <Pill>
            {totalStoredOutputCount > 0
              ? `${totalStoredOutputCount} stored output${totalStoredOutputCount === 1 ? "" : "s"}`
              : "No stored outputs"}
          </Pill>
          <Pill>
            {formatIsoDateTime(asset.latestGeneration?.createdAt ?? null)}
          </Pill>
          {asset.latestGeneration ? (
            <Pill>{asset.latestGeneration.pipelineKey}</Pill>
          ) : null}
          {asset.latestGeneration?.queueJobId ? (
            <Pill>{asset.latestGeneration.queueJobId}</Pill>
          ) : null}
        </div>
        {generationRunCount > 0 ? (
          <div className="grid gap-3">
            <StatusBanner tone="info">
              <strong>
                {selectedGeneration?.id === asset.latestGeneration?.id
                  ? "Viewing the latest generation run."
                  : "Viewing an archived generation run."}
              </strong>
              <span>{succeededRunCount} succeeded</span>
              <span>{failedRunCount} failed</span>
              <span>
                {totalStoredOutputCount} stored outputs across history
              </span>
            </StatusBanner>
            <div className="space-y-3">
              {asset.generationHistory.map((generation, index) => {
                const isSelected = generation.id === selectedGeneration?.id;

                return (
                  <div
                    className={`rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 ${
                      isSelected ? "border-[color:var(--color-accent)]" : ""
                    }`}
                    key={generation.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="grid gap-1">
                        <strong>
                          {index === 0 ? "Latest run" : `Run ${index + 1}`}
                        </strong>
                        <span>{generation.id}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Pill>{generation.status}</Pill>
                        <ActionButton
                          onClick={() => setSelectedGenerationId(generation.id)}
                          tone="ghost"
                          type="button"
                        >
                          {isSelected ? "Viewing run" : "Inspect run"}
                        </ActionButton>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-[color:var(--color-muted)]">
                      <span>
                        Requested {formatIsoDateTime(generation.createdAt)}
                      </span>
                      <span>{resolveGenerationLifecycleLabel(generation)}</span>
                      <span>
                        {generation.requestedVariantCount} requested variant
                        {generation.requestedVariantCount === 1 ? "" : "s"}
                      </span>
                      <span>
                        {generation.generatedAssets.length} stored output
                        {generation.generatedAssets.length === 1 ? "" : "s"}
                      </span>
                      {generation.failureCode ? (
                        <span>{generation.failureCode}</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedGeneration ? (
              <>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Pill>{selectedGeneration.id}</Pill>
                  <Pill>
                    Requested {formatIsoDateTime(selectedGeneration.createdAt)}
                  </Pill>
                  <Pill>
                    Started {formatIsoDateTime(selectedGeneration.startedAt)}
                  </Pill>
                  <Pill>
                    {resolveGenerationLifecycleLabel(selectedGeneration)}
                  </Pill>
                  <Pill>
                    {selectedGeneration.generatedAssets.length} output
                    {selectedGeneration.generatedAssets.length === 1 ? "" : "s"}
                  </Pill>
                  {selectedGeneration.queueJobId ? (
                    <Pill>{selectedGeneration.queueJobId}</Pill>
                  ) : null}
                </div>
                {selectedGeneration.result ? (
                  <StatusBanner tone="success">
                    <strong>Generation completed.</strong>
                    <span>
                      {selectedGeneration.result.generatedVariantCount} variants
                      requested
                    </span>
                    <span>
                      {selectedGeneration.result.storedAssetCount} stored outputs
                    </span>
                    <span className="text-xs text-[color:var(--color-muted)]">
                      {selectedGeneration.result.outputGroupKey}
                    </span>
                  </StatusBanner>
                ) : null}
                {selectedGeneration.failureMessage ? (
                  <StatusBanner tone="error">
                    <strong>Generation failed.</strong>
                    {selectedGeneration.failureCode ? (
                      <span>{selectedGeneration.failureCode}</span>
                    ) : null}
                    <span>{selectedGeneration.failureMessage}</span>
                    {canRetrySelectedGeneration ? (
                      <ActionButton
                        disabled={
                          retryingGenerationRequestId === selectedGeneration.id
                        }
                        onClick={() =>
                          void retryGeneration(selectedGeneration.id)
                        }
                        tone="secondary"
                        type="button"
                      >
                        {retryingGenerationRequestId === selectedGeneration.id
                          ? "Retrying..."
                          : "Retry failed run"}
                      </ActionButton>
                    ) : null}
                  </StatusBanner>
                ) : null}
                {selectedGeneration.generatedAssets.length > 0 ? (
                  <div className="grid gap-3">
                    {selectedGeneration.generatedAssets.map(
                      (generatedAsset) => {
                        const isDownloading =
                          downloadingGeneratedAssetId === generatedAsset.id;
                        const isModerating =
                          moderatingGeneratedAssetId === generatedAsset.id;
                        const generatedAssetImage = resolveImageMeta(
                          generatedAssetDownloadUrls ?? {},
                          {
                            id: generatedAsset.id,
                            variantIndex: generatedAsset.variantIndex
                          }
                        );

                        return (
                          <article
                            className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3"
                            key={generatedAsset.id}
                          >
                            <div className="overflow-hidden rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface-strong)]">
                              {generatedAssetImage.url ? (
                                <img
                                  alt={`Variant ${generatedAssetImage.variantIndex} output`}
                                  className="h-full min-h-40 w-full object-cover"
                                  loading="lazy"
                                  src={generatedAssetImage.url}
                                />
                              ) : (
                                <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-3 text-xs text-[color:var(--color-muted)]">
                                  {generatedAssetImage.label}
                                </div>
                              )}
                            </div>
                            <div className="mt-3 grid gap-1">
                              <strong>
                                Variant {generatedAsset.variantIndex}
                              </strong>
                              <span>
                                {formatAssetByteSize(generatedAsset.byteSize)}
                              </span>
                              <span>
                                {formatModerationStatus(
                                  generatedAsset.moderationStatus
                                )}
                              </span>
                              {generatedAsset.moderatedAt ? (
                                <span>
                                  Reviewed{" "}
                                  {formatIsoDateTime(generatedAsset.moderatedAt)}
                                </span>
                              ) : null}
                              <span className="text-xs text-[color:var(--color-muted)]">
                                {generatedAsset.storageObjectKey}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Pill>
                                {formatModerationStatus(
                                  generatedAsset.moderationStatus
                                )}
                              </Pill>
                              <ActionButton
                                disabled={isModerating}
                                onClick={() =>
                                  void updateGeneratedAssetModeration(
                                    generatedAsset.id,
                                    "approved"
                                  )
                                }
                                tone="secondary"
                                type="button"
                              >
                                {isModerating &&
                                generatedAsset.moderationStatus !== "approved"
                                  ? "Saving..."
                                  : "Approve"}
                              </ActionButton>
                              <ActionButton
                                disabled={isModerating}
                                onClick={() =>
                                  void updateGeneratedAssetModeration(
                                    generatedAsset.id,
                                    "rejected"
                                  )
                                }
                                tone="secondary"
                                type="button"
                              >
                                {isModerating &&
                                generatedAsset.moderationStatus !== "rejected"
                                  ? "Saving..."
                                  : "Reject"}
                              </ActionButton>
                              <ActionButton
                                disabled={isModerating}
                                onClick={() =>
                                  void updateGeneratedAssetModeration(
                                    generatedAsset.id,
                                    "pending_review"
                                  )
                                }
                                tone="secondary"
                                type="button"
                              >
                                {isModerating &&
                                generatedAsset.moderationStatus !==
                                  "pending_review"
                                  ? "Saving..."
                                  : "Reset"}
                              </ActionButton>
                              <ActionButton
                                disabled={isDownloading}
                                onClick={() =>
                                  void downloadGeneratedAsset(generatedAsset.id)
                                }
                                tone="primary"
                                type="button"
                              >
                                {isDownloading ? "Preparing..." : "Download"}
                              </ActionButton>
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-4 text-sm text-[color:var(--color-muted)]">
                    {resolveOutputPlaceholderMessage(selectedGeneration)}
                  </div>
                )}
              </>
            ) : null}
          </div>
    ) : (
      <div className="rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-surface)] p-4 text-sm text-[color:var(--color-muted)]">
        Stored generated outputs will appear here after worker processing succeeds.
      </div>
    )}
      </div>
    </SurfaceCard>
  );
}
