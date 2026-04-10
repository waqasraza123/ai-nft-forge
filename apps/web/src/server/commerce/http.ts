import { collectionCommerceErrorResponseSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  parseStudioJsonBody,
  requireStudioApiSession as requireStudioApiSessionBase
} from "../studio/http";

import { CommerceServiceError } from "./error";

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await parseStudioJsonBody(request);
  } catch {
    throw new CommerceServiceError(
      "INVALID_REQUEST",
      "Request body must be valid JSON.",
      400
    );
  }
}

export async function requireStudioApiSession() {
  const session = await requireStudioApiSessionBase();

  if (!session) {
    throw new CommerceServiceError(
      "SESSION_REQUIRED",
      "An active studio session is required.",
      401
    );
  }

  return session;
}

export function createCommerceErrorResponse(error: unknown): NextResponse {
  if (error instanceof CommerceServiceError) {
    return NextResponse.json(
      collectionCommerceErrorResponseSchema.parse({
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
    collectionCommerceErrorResponseSchema.parse({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected commerce error."
      }
    }),
    {
      status: 500
    }
  );
}
