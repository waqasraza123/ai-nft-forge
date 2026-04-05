import { sourceAssetErrorResponseSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import { getCurrentAuthSession } from "../auth/session";

import { SourceAssetServiceError } from "./error";

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new SourceAssetServiceError(
      "INVALID_REQUEST",
      "Request body must be valid JSON.",
      400
    );
  }
}

export async function requireStudioApiSession() {
  const session = await getCurrentAuthSession();

  if (!session) {
    throw new SourceAssetServiceError(
      "SESSION_REQUIRED",
      "An active studio session is required.",
      401
    );
  }

  return session;
}

export function createSourceAssetErrorResponse(error: unknown): NextResponse {
  if (error instanceof SourceAssetServiceError) {
    return NextResponse.json(
      sourceAssetErrorResponseSchema.parse({
        error: {
          code: error.code,
          message: error.message
        }
      }),
      {
        status: error.statusCode
      }
    );
  }

  return NextResponse.json(
    sourceAssetErrorResponseSchema.parse({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected source asset error."
      }
    }),
    {
      status: 500
    }
  );
}
