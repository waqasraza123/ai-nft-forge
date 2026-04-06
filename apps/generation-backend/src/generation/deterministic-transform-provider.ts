import sharp from "sharp";

import type { GenerationArtifactProvider } from "./provider.js";
import { GenerationBackendServiceError } from "./error.js";

const outputContentType = "image/png";
const outputFileExtension = "png";

function applyVariantTransform(image: sharp.Sharp, variantIndex: number) {
  switch (((variantIndex - 1) % 8) + 1) {
    case 1:
      return image.modulate({
        brightness: 1.03,
        hue: 8,
        saturation: 1.16
      });
    case 2:
      return image.greyscale().tint("#8db1d8").linear(1.08, -4);
    case 3:
      return image.flop().modulate({
        brightness: 1.02,
        hue: -16,
        saturation: 1.24
      });
    case 4:
      return image.blur(0.35).gamma(1.12).modulate({
        brightness: 0.96,
        saturation: 0.9
      });
    case 5:
      return image.tint("#f6a95d").modulate({
        brightness: 1.01,
        saturation: 1.12
      });
    case 6:
      return image.greyscale().linear(1.24, -10).sharpen();
    case 7:
      return image.tint("#67b8ff").modulate({
        brightness: 1.04,
        saturation: 1.18
      });
    case 8:
      return image.modulate({
        brightness: 0.98,
        hue: 22,
        saturation: 1.08
      });
    default:
      return image;
  }
}

async function renderVariantImage(input: {
  sourceBytes: Uint8Array;
  variantIndex: number;
}) {
  try {
    return await applyVariantTransform(
      sharp(input.sourceBytes, {
        limitInputPixels: 40_000_000
      })
        .rotate()
        .resize({
          fit: "inside",
          height: 1536,
          width: 1536,
          withoutEnlargement: true
        }),
      input.variantIndex
    )
      .sharpen()
      .png({
        compressionLevel: 9
      })
      .toBuffer();
  } catch (error) {
    throw new GenerationBackendServiceError(
      "SOURCE_ASSET_UNSUPPORTED",
      "The source asset could not be transformed by the generation backend.",
      422,
      {
        cause: error
      }
    );
  }
}

export function createDeterministicTransformProvider(): GenerationArtifactProvider {
  return {
    async checkReadiness() {
      return {
        checkedAt: new Date().toISOString(),
        latencyMs: 0,
        message:
          "Deterministic transform rendering is available inside the generation backend process.",
        status: "ready"
      };
    },
    describeConfiguration() {
      return {
        baseUrl: null,
        checkpointName: null,
        kind: "deterministic_transform",
        mode: "deterministic_transform",
        workflowSource: null
      };
    },
    async generateArtifacts(input) {
      const artifacts = [];

      for (
        let variantIndex = 1;
        variantIndex <= input.generationRequest.requestedVariantCount;
        variantIndex += 1
      ) {
        const body = await renderVariantImage({
          sourceBytes: input.sourceObject.body,
          variantIndex
        });

        artifacts.push({
          body,
          contentType: outputContentType,
          fileExtension: outputFileExtension,
          variantIndex
        });
      }

      return artifacts;
    },
    kind: "deterministic_transform"
  };
}
