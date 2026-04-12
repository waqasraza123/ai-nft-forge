import { studioSettingsErrorResponseSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  parseStudioJsonBody,
  requireStudioApiSession as requireStudioApiSessionBase
} from "../studio/http";
import { assertWorkspaceIsActive } from "../studio/workspace-state";

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

export async function requireStudioOwnerApiSession() {
  const session = await requireStudioApiSession();

  if (session.role !== "owner") {
    throw new StudioSettingsServiceError(
      "FORBIDDEN",
      "Only workspace owners can change these settings.",
      403
    );
  }

  return session;
}

export async function requireStudioActiveApiSession() {
  const session = await requireStudioApiSession();

  if (!session.workspace) {
    throw new StudioSettingsServiceError(
      "WORKSPACE_REQUIRED",
      "Create the workspace profile before managing operators.",
      409
    );
  }

  assertWorkspaceIsActive(session.workspace, (message) => {
    return new StudioSettingsServiceError("WORKSPACE_NOT_ACTIVE", message, 409);
  });

  return session;
}

export async function requireStudioActiveOwnerApiSession() {
  const session = await requireStudioOwnerApiSession();

  if (!session.workspace) {
    throw new StudioSettingsServiceError(
      "WORKSPACE_REQUIRED",
      "Create the workspace profile before managing operators.",
      409
    );
  }

  assertWorkspaceIsActive(session.workspace, (message) => {
    return new StudioSettingsServiceError("WORKSPACE_NOT_ACTIVE", message, 409);
  });

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
