import type {
  GenerationBackendProviderConfiguration,
  GenerationBackendReadinessProbe,
  GenerationBackendRequest,
  GenerationPipelineKey,
  StorageObjectData
} from "@ai-nft-forge/shared";

export type GeneratedVariantArtifact = {
  body: Uint8Array;
  contentType: string;
  fileExtension: string;
  variantIndex: number;
};

export type GenerateVariantArtifactsInput = {
  generationRequest: GenerationBackendRequest;
  outputGroupKey: string;
  sourceObject: StorageObjectData;
};

export type GenerationArtifactProvider = {
  checkReadiness: () => Promise<GenerationBackendReadinessProbe>;
  describeConfiguration: () => GenerationBackendProviderConfiguration;
  kind: "comfyui" | "deterministic_transform";
  generateArtifacts: (
    input: GenerateVariantArtifactsInput
  ) => Promise<GeneratedVariantArtifact[]>;
};

export function resolvePipelinePrompts(pipelineKey: GenerationPipelineKey): {
  negativePrompt: string;
  positivePrompt: string;
} {
  switch (pipelineKey) {
    case "collectible-portrait-v1":
      return {
        negativePrompt:
          "blurry, low quality, deformed hands, extra limbs, watermark, text, frame, duplicate subject",
        positivePrompt:
          "premium collectible portrait artwork, tasteful stylization, cinematic rim light, centered subject, detailed face, refined nft finish"
      };
  }

  throw new Error(`Unsupported generation pipeline key: ${pipelineKey}`);
}
