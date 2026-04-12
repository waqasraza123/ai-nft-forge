import { generatedAssetErrorResponseSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import { requireStudioApiSession as requireStudioApiSessionBase } from "../studio/http";
import { assertWorkspaceIsActive } from "../studio/workspace-state";

import { GeneratedAssetServiceError } from "./error";

export async function requireStudioApiSession() {
  const session = await requireStudioApiSessionBase();

  if (!session) {
    throw new GeneratedAssetServiceError(
      "SESSION_REQUIRED",
      "An active studio session is required.",
      401
    );
  }

  if (!session.workspace) {
    throw new GeneratedAssetServiceError(
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
    return new GeneratedAssetServiceError(
      "WORKSPACE_NOT_ACTIVE",
      message,
      409
    );
  });

  return session;
}

export function createGeneratedAssetErrorResponse(
  error: unknown
): NextResponse {
  if (error instanceof GeneratedAssetServiceError) {
    return NextResponse.json(
      generatedAssetErrorResponseSchema.parse({
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
    generatedAssetErrorResponseSchema.parse({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected generated asset error."
      }
    }),
    {
      status: 500
    }
  );
}
