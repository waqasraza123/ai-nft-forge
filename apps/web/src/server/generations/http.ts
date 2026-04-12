import { generationErrorResponseSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  parseStudioJsonBody,
  requireStudioApiSession as requireStudioApiSessionBase
} from "../studio/http";
import { assertWorkspaceIsActive } from "../studio/workspace-state";

import { GenerationServiceError } from "./error";

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await parseStudioJsonBody(request);
  } catch {
    throw new GenerationServiceError(
      "INVALID_REQUEST",
      "Request body must be valid JSON.",
      400
    );
  }
}

export async function requireStudioApiSession() {
  const session = await requireStudioApiSessionBase();

  if (!session) {
    throw new GenerationServiceError(
      "SESSION_REQUIRED",
      "An active studio session is required.",
      401
    );
  }

  if (!session.workspace) {
    throw new GenerationServiceError(
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
    return new GenerationServiceError("WORKSPACE_NOT_ACTIVE", message, 409);
  });

  return session;
}

export function createGenerationErrorResponse(error: unknown): NextResponse {
  if (error instanceof GenerationServiceError) {
    return NextResponse.json(
      generationErrorResponseSchema.parse({
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
    generationErrorResponseSchema.parse({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected generation error."
      }
    }),
    {
      status: 500
    }
  );
}
