import { collectionDraftErrorResponseSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  parseStudioJsonBody,
  requireStudioApiSession as requireStudioApiSessionBase
} from "../studio/http";

import { CollectionDraftServiceError } from "./error";

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await parseStudioJsonBody(request);
  } catch {
    throw new CollectionDraftServiceError(
      "INVALID_REQUEST",
      "Request body must be valid JSON.",
      400
    );
  }
}

export async function requireStudioApiSession() {
  const session = await requireStudioApiSessionBase();

  if (!session) {
    throw new CollectionDraftServiceError(
      "SESSION_REQUIRED",
      "An active studio session is required.",
      401
    );
  }

  return session;
}

export async function requireStudioOwnerApiSession() {
  const session = await requireStudioApiSession();

  if (session.role !== "owner") {
    throw new CollectionDraftServiceError(
      "FORBIDDEN",
      "Only workspace owners can publish or manage onchain collection state.",
      403
    );
  }

  return session;
}

export function createCollectionDraftErrorResponse(
  error: unknown
): NextResponse {
  if (error instanceof CollectionDraftServiceError) {
    return NextResponse.json(
      collectionDraftErrorResponseSchema.parse({
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
    collectionDraftErrorResponseSchema.parse({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected collection draft error."
      }
    }),
    {
      status: 500
    }
  );
}
