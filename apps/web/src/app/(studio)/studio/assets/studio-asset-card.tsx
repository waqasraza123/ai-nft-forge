import {
  type GenerationRequestSummary,
  type StudioSourceAssetSummary
} from "@ai-nft-forge/shared";
import { Pill, SurfaceCard } from "@ai-nft-forge/ui";

type StudioAssetCardProps = {
  asset: StudioSourceAssetSummary;
  downloadGeneratedAsset: (generatedAssetId: string) => Promise<void>;
  downloadingGeneratedAssetId: string | null;
  generationVariantCount: number;
  isDispatchingGeneration: boolean;
  retryingGenerationRequestId: string | null;
  retryGeneration: (generationRequestId: string) => Promise<void>;
  selectedGenerationId: string | null;
  setGenerationVariantCount: (variantCount: number) => void;
  setSelectedGenerationId: (generationRequestId: string) => void;
  startGeneration: (assetId: string, variantCount: number) => Promise<void>;
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

function resolveGenerationTerminalDate(
  generation: GenerationRequestSummary | null
) {
  if (!generation) {
    return null;
  }

  if (generation.status === "failed") {
    return generation.failedAt;
  }

  if (generation.status === "succeeded") {
    return generation.completedAt;
  }

  return generation.startedAt;
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

export function StudioAssetCard({
  asset,
  downloadGeneratedAsset,
  downloadingGeneratedAssetId,
  generationVariantCount,
  isDispatchingGeneration,
  retryingGenerationRequestId,
  retryGeneration,
  selectedGenerationId,
  setGenerationVariantCount,
  setSelectedGenerationId,
  startGeneration
}: StudioAssetCardProps) {
  const generationStatusLabel = asset.latestGeneration
    ? `Generation ${asset.latestGeneration.status}`
    : "No generation request";
  const latestGenerationRequestedAt = asset.latestGeneration?.createdAt ?? null;
  const latestGenerationTerminalDate = resolveGenerationTerminalDate(
    asset.latestGeneration
  );
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

  return (
    <SurfaceCard
      body={`${asset.contentType} · ${formatAssetByteSize(asset.byteSize)}`}
      eyebrow={asset.status}
      span={4}
      title={asset.originalFilename}
      footer={
        canStartGeneration(asset) ? (
          <div className="studio-action-stack">
            <label
              className="field-stack"
              htmlFor={`variant-count-${asset.id}`}
            >
              <span className="field-label">Variant count</span>
              <select
                className="input-field"
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
            </label>
            <button
              className="button-action button-action--accent"
              disabled={isDispatchingGeneration}
              onClick={() =>
                void startGeneration(asset.id, generationVariantCount)
              }
              type="button"
            >
              {resolveGenerationActionLabel(asset)}
            </button>
          </div>
        ) : null
      }
    >
      <div className="pill-row">
        <Pill>{asset.id}</Pill>
        <Pill>{formatIsoDateTime(asset.uploadedAt)}</Pill>
        <Pill>{generationStatusLabel}</Pill>
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
            : "No generation history"}
        </Pill>
        <Pill>
          {totalStoredOutputCount > 0
            ? `${totalStoredOutputCount} stored outputs`
            : "No stored outputs"}
        </Pill>
        <Pill>{formatIsoDateTime(latestGenerationRequestedAt)}</Pill>
        {asset.latestGeneration ? (
          <Pill>{asset.latestGeneration.pipelineKey}</Pill>
        ) : null}
        {asset.latestGeneration?.queueJobId ? (
          <Pill>{asset.latestGeneration.queueJobId}</Pill>
        ) : null}
        {latestGenerationTerminalDate ? (
          <Pill>{formatIsoDateTime(latestGenerationTerminalDate)}</Pill>
        ) : null}
      </div>
      {generationRunCount > 0 ? (
        <div className="generation-detail-stack">
          <div className="status-banner status-banner--info">
            <strong>
              {selectedGeneration?.id === asset.latestGeneration?.id
                ? "Viewing the latest generation run."
                : "Viewing an archived generation run."}
            </strong>
            <span>{succeededRunCount} succeeded</span>
            <span>{failedRunCount} failed</span>
            <span>{totalStoredOutputCount} stored outputs across history</span>
          </div>
          <div className="generation-history-list">
            {asset.generationHistory.map((generation, index) => {
              const isSelected = generation.id === selectedGeneration?.id;

              return (
                <div
                  className={`generation-history-item${isSelected ? " generation-history-item--selected" : ""}`}
                  key={generation.id}
                >
                  <div className="generation-history-item__header">
                    <div className="generation-history-item__copy">
                      <strong>
                        {index === 0 ? "Latest run" : `Run ${index + 1}`}
                      </strong>
                      <span>{generation.id}</span>
                    </div>
                    <div className="generation-history-item__actions">
                      <Pill>{generation.status}</Pill>
                      <button
                        className="button-action"
                        onClick={() => setSelectedGenerationId(generation.id)}
                        type="button"
                      >
                        {isSelected ? "Viewing run" : "Inspect run"}
                      </button>
                    </div>
                  </div>
                  <div className="generation-history-meta">
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
              <div className="pill-row">
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
                  {selectedGeneration.generatedAssets.length} stored output
                  {selectedGeneration.generatedAssets.length === 1 ? "" : "s"}
                </Pill>
                {selectedGeneration.queueJobId ? (
                  <Pill>{selectedGeneration.queueJobId}</Pill>
                ) : null}
              </div>
              {selectedGeneration.result ? (
                <div className="status-banner status-banner--success">
                  <strong>Generation completed.</strong>
                  <span>
                    {selectedGeneration.result.generatedVariantCount} variants
                    requested
                  </span>
                  <span>
                    {selectedGeneration.result.storedAssetCount} stored outputs
                  </span>
                  <span className="asset-output-key">
                    {selectedGeneration.result.outputGroupKey}
                  </span>
                </div>
              ) : null}
              {selectedGeneration.failureMessage ? (
                <div className="status-banner status-banner--error">
                  <strong>Generation failed.</strong>
                  {selectedGeneration.failureCode ? (
                    <span>{selectedGeneration.failureCode}</span>
                  ) : null}
                  <span>{selectedGeneration.failureMessage}</span>
                  {canRetrySelectedGeneration ? (
                    <button
                      className="button-action"
                      disabled={
                        retryingGenerationRequestId === selectedGeneration.id
                      }
                      onClick={() =>
                        void retryGeneration(selectedGeneration.id)
                      }
                      type="button"
                    >
                      {retryingGenerationRequestId === selectedGeneration.id
                        ? "Retrying..."
                        : "Retry failed run"}
                    </button>
                  ) : null}
                </div>
              ) : null}
              {selectedGeneration.generatedAssets.length > 0 ? (
                <div className="asset-output-list">
                  {selectedGeneration.generatedAssets.map((generatedAsset) => {
                    const isDownloading =
                      downloadingGeneratedAssetId === generatedAsset.id;

                    return (
                      <div
                        className="asset-output-item"
                        key={generatedAsset.id}
                      >
                        <div className="asset-output-copy">
                          <strong>{`Variant ${generatedAsset.variantIndex}`}</strong>
                          <span>
                            {formatAssetByteSize(generatedAsset.byteSize)}
                          </span>
                          <span className="asset-output-key">
                            {generatedAsset.storageObjectKey}
                          </span>
                        </div>
                        <button
                          className="button-action"
                          disabled={isDownloading}
                          onClick={() =>
                            void downloadGeneratedAsset(generatedAsset.id)
                          }
                          type="button"
                        >
                          {isDownloading ? "Preparing..." : "Download"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="asset-placeholder">
                  {resolveOutputPlaceholderMessage(selectedGeneration)}
                </div>
              )}
            </>
          ) : null}
        </div>
      ) : (
        <div className="asset-placeholder">
          Stored generated outputs will appear here after worker processing
          succeeds.
        </div>
      )}
    </SurfaceCard>
  );
}
