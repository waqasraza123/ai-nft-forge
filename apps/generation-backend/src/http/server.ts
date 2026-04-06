import {
  createServer,
  type IncomingMessage,
  type ServerResponse
} from "node:http";

import {
  generationBackendErrorResponseSchema,
  generationBackendRequestSchema,
  type GenerationBackendErrorResponse,
  type GenerationBackendResponse
} from "@ai-nft-forge/shared";

import { createGenerationBackendHealthSnapshot } from "../lib/health.js";
import type { Logger } from "../lib/logger.js";
import { GenerationBackendServiceError } from "../generation/error.js";

import { resolveAuthorizationResult } from "./auth.js";

type GenerationBackendServerDependencies = {
  authToken?: string;
  generationService: {
    generate(input: {
      generationRequestId: string;
      ownerUserId: string;
      pipelineKey: string;
      requestedVariantCount: number;
      sourceAsset: {
        contentType: string;
        originalFilename: string;
        storageBucket: string;
        storageObjectKey: string;
      };
      target: {
        bucket: string;
        outputGroupKey: string;
      };
    }): Promise<GenerationBackendResponse>;
  };
  logger: Logger;
};

const requestBodyByteLimit = 64 * 1024;

class InvalidRequestBodyError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "InvalidRequestBodyError";
  }
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload:
    | GenerationBackendErrorResponse
    | GenerationBackendResponse
    | ReturnType<typeof createGenerationBackendHealthSnapshot>
) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(`${JSON.stringify(payload)}\n`);
}

function sendBackendError(
  response: ServerResponse,
  input: {
    code:
      | "BACKEND_AUTH_INVALID"
      | "BACKEND_AUTH_REQUIRED"
      | "INTERNAL_SERVER_ERROR"
      | "INVALID_REQUEST"
      | "MODEL_BACKEND_ERROR"
      | "MODEL_BACKEND_TIMEOUT"
      | "SOURCE_ASSET_UNSUPPORTED"
      | "SOURCE_OBJECT_MISSING";
    message: string;
    statusCode: 400 | 401 | 404 | 422 | 500 | 502 | 504;
  }
) {
  sendJson(
    response,
    input.statusCode,
    generationBackendErrorResponseSchema.parse({
      error: {
        code: input.code,
        message: input.message
      }
    })
  );
}

function readJsonBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let bodyByteLength = 0;

    request.on("data", (chunk: Buffer) => {
      bodyByteLength += chunk.byteLength;

      if (bodyByteLength > requestBodyByteLimit) {
        request.destroy(
          new InvalidRequestBodyError(
            `Request body exceeded ${requestBodyByteLimit} bytes.`
          )
        );
        return;
      }

      chunks.push(chunk);
    });
    request.on("end", () => {
      const rawBody = Buffer.concat(chunks).toString("utf8");

      if (rawBody.length === 0) {
        reject(new InvalidRequestBodyError("Request body must not be empty."));
        return;
      }

      try {
        resolve(JSON.parse(rawBody));
      } catch (error) {
        reject(
          new InvalidRequestBodyError("Request body must be valid JSON.", {
            cause: error
          })
        );
      }
    });
    request.on("error", (error) => {
      reject(error);
    });
  });
}

export function createGenerationBackendServer(
  dependencies: GenerationBackendServerDependencies
) {
  return createServer(async (request, response) => {
    const requestUrl = new URL(
      request.url ?? "/",
      `http://${request.headers.host ?? "127.0.0.1"}`
    );

    if (request.method === "GET" && requestUrl.pathname === "/health") {
      sendJson(
        response,
        200,
        createGenerationBackendHealthSnapshot(process.env)
      );
      return;
    }

    if (request.method !== "POST" || requestUrl.pathname !== "/generate") {
      sendBackendError(response, {
        code: "INVALID_REQUEST",
        message: "Route was not found.",
        statusCode: 400
      });
      return;
    }

    const authorizationResult = resolveAuthorizationResult({
      authorizationHeader: request.headers.authorization,
      ...(dependencies.authToken
        ? {
            expectedBearerToken: dependencies.authToken
          }
        : {})
    });

    if (authorizationResult.status === "missing") {
      sendBackendError(response, {
        code: "BACKEND_AUTH_REQUIRED",
        message: "A bearer token is required.",
        statusCode: 401
      });
      return;
    }

    if (authorizationResult.status === "invalid") {
      sendBackendError(response, {
        code: "BACKEND_AUTH_INVALID",
        message: "The bearer token is invalid.",
        statusCode: 401
      });
      return;
    }

    try {
      const result = await dependencies.generationService.generate(
        generationBackendRequestSchema.parse(await readJsonBody(request))
      );

      sendJson(response, 200, result);
    } catch (error) {
      if (error instanceof InvalidRequestBodyError) {
        sendBackendError(response, {
          code: "INVALID_REQUEST",
          message: error.message,
          statusCode: 400
        });
        return;
      }

      if (error instanceof GenerationBackendServiceError) {
        sendBackendError(response, {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode
        });
        return;
      }

      dependencies.logger.error("Unhandled generation backend error", {
        error: error instanceof Error ? error.message : "Unknown error"
      });

      sendBackendError(response, {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected generation backend error.",
        statusCode: 500
      });
    }
  });
}
