import { opsErrorResponseSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import { requireStudioApiSession as requireStudioApiSessionBase } from "../studio/http";
import { assertWorkspaceIsActive } from "../studio/workspace-state";

import { OpsServiceError } from "./error";

export async function requireOpsApiSession() {
  const session = await requireStudioApiSessionBase();

  if (!session) {
    throw new OpsServiceError(
      "SESSION_REQUIRED",
      "An active studio session is required.",
      401
    );
  }

  if (!session.workspace) {
    throw new OpsServiceError(
      "SESSION_REQUIRED",
      "An active workspace selection is required.",
      401
    );
  }

  return session as typeof session & {
    workspace: NonNullable<typeof session.workspace>;
  };
}

export async function requireActiveOpsApiSession() {
  const session = await requireOpsApiSession();

  assertWorkspaceIsActive(session.workspace, (message) => {
    return new OpsServiceError("WORKSPACE_NOT_ACTIVE", message, 409);
  });

  return session;
}

export async function requireOpsOwnerApiSession() {
  const session = await requireActiveOpsApiSession();

  if (session.role !== "owner") {
    throw new OpsServiceError(
      "FORBIDDEN",
      "Only workspace owners can manage ops policy.",
      403
    );
  }

  return session;
}

export function createOpsErrorResponse(error: unknown): NextResponse {
  if (error instanceof OpsServiceError) {
    return NextResponse.json(
      opsErrorResponseSchema.parse({
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

  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "ZodError"
  ) {
    return NextResponse.json(
      opsErrorResponseSchema.parse({
        error: {
          code: "INVALID_REQUEST",
          message: "The ops request payload is invalid."
        }
      }),
      {
        status: 400
      }
    );
  }

  return NextResponse.json(
    opsErrorResponseSchema.parse({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected ops error."
      }
    }),
    {
      status: 500
    }
  );
}
