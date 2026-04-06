import { describe, expect, it, vi } from "vitest";

import { generationBackendRequestSchema } from "@ai-nft-forge/shared";

import {
  createDefaultComfyWorkflowTemplate,
  materializeComfyWorkflowTemplate,
  validateComfyWorkflowTemplate
} from "./comfyui-workflow.js";
import { createComfyUiProvider } from "./comfyui-provider.js";

describe("ComfyUI workflow templating", () => {
  it("materializes all workflow placeholders into runtime values", () => {
    const template = materializeComfyWorkflowTemplate({
      checkpointName: "flux.safetensors",
      cfgScale: 7.5,
      denoise: 0.45,
      negativePrompt: "bad anatomy",
      outputPrefix: "forge-output",
      positivePrompt: "premium portrait",
      samplerName: "euler",
      scheduler: "normal",
      seed: 1234,
      sourceImage: "source.png",
      steps: 30,
      template: createDefaultComfyWorkflowTemplate()
    });

    expect(template["4"]).toMatchObject({
      inputs: {
        ckpt_name: "flux.safetensors"
      }
    });
    expect(template["10"]).toMatchObject({
      inputs: {
        image: "source.png"
      }
    });
    expect(template["3"]).toMatchObject({
      inputs: {
        cfg: 7.5,
        denoise: 0.45,
        sampler_name: "euler",
        scheduler: "normal",
        seed: 1234,
        steps: 30
      }
    });
  });

  it("rejects workflow templates that do not expose required placeholders", () => {
    expect(() =>
      validateComfyWorkflowTemplate({
        "10": {
          class_type: "LoadImage",
          inputs: {
            image: "__COMFY_SOURCE_IMAGE__"
          }
        }
      })
    ).toThrow("ComfyUI workflow template is missing required placeholders");
  });
});

describe("createComfyUiProvider", () => {
  it("uploads the source image, submits prompts, polls history, and fetches outputs", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ name: "ai-nft-forge-upload.png" }), {
          headers: {
            "content-type": "application/json"
          },
          status: 200
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ prompt_id: "prompt-1" }), {
          headers: {
            "content-type": "application/json"
          },
          status: 200
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            "prompt-1": {
              outputs: {
                "9": {
                  images: [
                    {
                      filename: "forge-output-1.png",
                      subfolder: "",
                      type: "output"
                    }
                  ]
                }
              },
              status: {
                completed: true,
                status_str: "success"
              }
            }
          }),
          {
            headers: {
              "content-type": "application/json"
            },
            status: 200
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(new Uint8Array([137, 80, 78, 71]), {
          headers: {
            "content-type": "image/png"
          },
          status: 200
        })
      );
    const provider = createComfyUiProvider({
      baseUrl: "http://127.0.0.1:8188",
      checkpointName: "flux.safetensors",
      cfgScale: 7,
      denoise: 0.42,
      fetchFn,
      logger: {
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn()
      },
      negativePrompt: "bad anatomy",
      pollIntervalMs: 1,
      positivePrompt: "premium portrait",
      readinessTimeoutMs: 2000,
      samplerName: "euler",
      scheduler: "normal",
      steps: 30,
      timeoutMs: 5000,
      workflowSource: "embedded_default",
      workflowTemplate: createDefaultComfyWorkflowTemplate()
    });

    const artifacts = await provider.generateArtifacts({
      generationRequest: generationBackendRequestSchema.parse({
        generationRequestId: "generation_1",
        ownerUserId: "user_1",
        pipelineKey: "collectible-portrait-v1",
        requestedVariantCount: 1,
        sourceAsset: {
          contentType: "image/png",
          originalFilename: "portrait.png",
          storageBucket: "ai-nft-forge-private",
          storageObjectKey: "source-assets/user_1/portrait.png"
        },
        target: {
          bucket: "ai-nft-forge-private",
          outputGroupKey: "generated-assets/user_1/generation_1"
        }
      }),
      outputGroupKey: "generated-assets/user_1/generation_1",
      sourceObject: {
        body: new Uint8Array([1, 2, 3, 4]),
        byteSize: 4,
        contentType: "image/png"
      }
    });

    expect(artifacts).toHaveLength(1);
    expect(artifacts[0]).toMatchObject({
      contentType: "image/png",
      fileExtension: "png",
      variantIndex: 1
    });
    expect(fetchFn).toHaveBeenCalledTimes(4);
    expect(String(fetchFn.mock.calls[0]?.[0])).toBe(
      "http://127.0.0.1:8188/upload/image"
    );
    expect(String(fetchFn.mock.calls[1]?.[0])).toBe(
      "http://127.0.0.1:8188/prompt"
    );
    expect(String(fetchFn.mock.calls[2]?.[0])).toBe(
      "http://127.0.0.1:8188/history/prompt-1"
    );
    expect(String(fetchFn.mock.calls[3]?.[0])).toContain(
      "http://127.0.0.1:8188/view?"
    );
  });

  it("returns a backend timeout error when ComfyUI polling does not complete in time", async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ name: "ai-nft-forge-upload.png" }), {
          status: 200
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ prompt_id: "prompt-1" }), {
          status: 200
        })
      )
      .mockImplementation(
        async () =>
          new Response(
            JSON.stringify({
              "prompt-1": {
                outputs: {},
                status: {
                  completed: false,
                  status_str: "running"
                }
              }
            }),
            {
              status: 200
            }
          )
      );
    const provider = createComfyUiProvider({
      baseUrl: "http://127.0.0.1:8188",
      checkpointName: "flux.safetensors",
      cfgScale: 7,
      denoise: 0.42,
      fetchFn,
      logger: {
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn()
      },
      negativePrompt: "bad anatomy",
      pollIntervalMs: 1,
      positivePrompt: "premium portrait",
      readinessTimeoutMs: 2000,
      samplerName: "euler",
      scheduler: "normal",
      steps: 30,
      timeoutMs: 5,
      workflowSource: "embedded_default",
      workflowTemplate: createDefaultComfyWorkflowTemplate()
    });

    await expect(
      provider.generateArtifacts({
        generationRequest: generationBackendRequestSchema.parse({
          generationRequestId: "generation_1",
          ownerUserId: "user_1",
          pipelineKey: "collectible-portrait-v1",
          requestedVariantCount: 1,
          sourceAsset: {
            contentType: "image/png",
            originalFilename: "portrait.png",
            storageBucket: "ai-nft-forge-private",
            storageObjectKey: "source-assets/user_1/portrait.png"
          },
          target: {
            bucket: "ai-nft-forge-private",
            outputGroupKey: "generated-assets/user_1/generation_1"
          }
        }),
        outputGroupKey: "generated-assets/user_1/generation_1",
        sourceObject: {
          body: new Uint8Array([1, 2, 3, 4]),
          byteSize: 4,
          contentType: "image/png"
        }
      })
    ).rejects.toThrow("ComfyUI generation timed out");
  });

  it("reports readiness when the ComfyUI API responds to the probe", async () => {
    const provider = createComfyUiProvider({
      baseUrl: "http://127.0.0.1:8188",
      checkpointName: "flux.safetensors",
      cfgScale: 7,
      denoise: 0.42,
      fetchFn: vi.fn<typeof fetch>().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            devices: [],
            system: {
              hostname: "gpu-worker"
            }
          }),
          {
            headers: {
              "content-type": "application/json"
            },
            status: 200
          }
        )
      ),
      logger: {
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn()
      },
      negativePrompt: "bad anatomy",
      pollIntervalMs: 1,
      positivePrompt: "premium portrait",
      readinessTimeoutMs: 2000,
      samplerName: "euler",
      scheduler: "normal",
      steps: 30,
      timeoutMs: 5000,
      workflowSource: "embedded_default",
      workflowTemplate: createDefaultComfyWorkflowTemplate()
    });

    await expect(provider.checkReadiness()).resolves.toMatchObject({
      message: "ComfyUI API responded to the readiness probe.",
      status: "ready"
    });
    expect(provider.describeConfiguration()).toMatchObject({
      baseUrl: "http://127.0.0.1:8188",
      checkpointName: "flux.safetensors",
      kind: "comfyui",
      mode: "remote_comfyui",
      workflowSource: "embedded_default"
    });
  });
});
