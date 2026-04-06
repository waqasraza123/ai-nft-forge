export type MaterializedGeneratedAsset = {
  byteSize: number | null;
  contentType: string;
  storageBucket: string;
  storageObjectKey: string;
  variantIndex: number;
};

export type MaterializeGenerationOutputsInput = {
  generationRequest: {
    id: string;
    ownerUserId: string;
    pipelineKey: string;
    requestedVariantCount: number;
    sourceAssetId: string;
  };
  sourceAsset: {
    contentType: string;
    originalFilename: string;
    storageBucket: string;
    storageObjectKey: string;
  };
};

export type MaterializeGenerationOutputsResult = {
  generatedAssets: MaterializedGeneratedAsset[];
  outputGroupKey: string;
};

export type GenerationAdapter = {
  cleanupMaterializedOutputs(
    outputs: MaterializedGeneratedAsset[]
  ): Promise<void>;
  materializeGenerationOutputs(
    input: MaterializeGenerationOutputsInput
  ): Promise<MaterializeGenerationOutputsResult>;
};

export function resolveGenerationOutputGroupKey(input: {
  generationRequestId: string;
  ownerUserId: string;
}) {
  return [
    "generated-assets",
    input.ownerUserId,
    input.generationRequestId
  ].join("/");
}
