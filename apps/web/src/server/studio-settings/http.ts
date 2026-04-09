import { studioSettingsErrorResponseSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  parseStudioJsonBody,
  requireStudioApiSession as requireStudioApiSessionBase
} from "../studio/http";

import { StudioSettingsServiceError } from "./error";

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await parseStudioJsonBody(request);
  } catch {
    throw new StudioSettingsServiceError(
      "INVALID_REQUEST",
      "Request body must be valid JSON.",
      400
    );
  }
}

export async function requireStudioApiSession() {
  const session = await requireStudioApiSessionBase();

  if (!session) {
    throw new StudioSettingsServiceError(
      "SESSION_REQUIRED",
      "An active studio session is required.",
      401
    );
  }

  return session;
}

export function createStudioSettingsErrorResponse(error: unknown): NextResponse {
  if (error instanceof StudioSettingsServiceError) {
    return NextResponse.json(
      studioSettingsErrorResponseSchema.parse({
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
    studioSettingsErrorResponseSchema.parse({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected studio settings error."
      }
    }),
    {
      status: 500
    }
  );
}
