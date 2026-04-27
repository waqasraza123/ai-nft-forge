import { sourceAssetErrorResponseSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  parseStudioJsonBody,
  requireStudioApiSession as requireStudioApiSessionBase
} from "../studio/http";
import { assertWorkspaceIsActive } from "../studio/workspace-state";

import { SourceAssetServiceError } from "./error";

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await parseStudioJsonBody(request);
  } catch {
    throw new SourceAssetServiceError(
      "INVALID_REQUEST",
      "Request body must be valid JSON.",
      400
    );
  }
}

export async function requireStudioApiSession() {
  const session = await requireStudioApiSessionBase();

  if (!session) {
    throw new SourceAssetServiceError(
      "SESSION_REQUIRED",
      "An active studio session is required.",
      401
    );
  }

  if (!session.workspace) {
    throw new SourceAssetServiceError(
      "SESSION_REQUIRED",
      "An active workspace selection is required.",
      401
    );
  }

  return session as typeof session & {
    workspace: NonNullable<typeof session.workspace>;
  };
}

export async function requireStudioActiveApiSession() {
  const session = await requireStudioApiSession();

  assertWorkspaceIsActive(session.workspace, (message) => {
    return new SourceAssetServiceError("WORKSPACE_NOT_ACTIVE", message, 409);
  });

  if (session.role === "viewer") {
    throw new SourceAssetServiceError(
      "FORBIDDEN",
      "Workspace viewers can inspect assets but cannot upload or modify them.",
      403
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
