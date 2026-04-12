import {
  studioWorkspaceSelectionRequestSchema,
  studioWorkspaceSelectionResponseSchema
} from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createClearedWorkspaceSelectionCookieDefinition,
  createWorkspaceSelectionCookieDefinition
} from "../../../../lib/session/cookie";
import {
  ACTIVE_WORKSPACE_COOKIE_NAME,
  createRuntimeStudioAccessService
} from "../../../../server/studio/access";
import {
  createStudioSettingsErrorResponse,
  parseJsonBody,
  requireStudioApiSession
} from "../../../../server/studio-settings/http";
import { StudioSettingsServiceError } from "../../../../server/studio-settings/error";

const workspaceSelectionCookieDurationDays = 365;

export async function POST(request: Request) {
  try {
    const currentAccess = await requireStudioApiSession();
    const body = studioWorkspaceSelectionRequestSchema.parse(
      await parseJsonBody(request)
    );
    const selectedAccess =
      await createRuntimeStudioAccessService().resolveForSession({
        session: currentAccess.session,
        ...(body.workspaceSlug
          ? {
              workspaceSlug: body.workspaceSlug
            }
          : {})
      });

    if (
      body.workspaceSlug &&
      selectedAccess.workspace?.slug !== body.workspaceSlug
    ) {
      throw new StudioSettingsServiceError(
        "WORKSPACE_NOT_FOUND",
        "The requested workspace is not available to this actor.",
        404
      );
    }

    const selectedWorkspace =
      selectedAccess.workspace === null
        ? null
        : (selectedAccess.availableWorkspaces.find(
            (workspace) => workspace.slug === selectedAccess.workspace?.slug
          ) ?? null);
    const response = NextResponse.json(
      studioWorkspaceSelectionResponseSchema.parse({
        workspace: selectedWorkspace
      })
    );

    if (body.workspaceSlug) {
      response.cookies.set(
        createWorkspaceSelectionCookieDefinition({
          expiresAt: new Date(
            Date.now() +
              workspaceSelectionCookieDurationDays * 24 * 60 * 60 * 1000
          ),
          name: ACTIVE_WORKSPACE_COOKIE_NAME,
          nodeEnvironment: process.env.NODE_ENV,
          value: body.workspaceSlug
        })
      );
    } else {
      response.cookies.set(
        createClearedWorkspaceSelectionCookieDefinition({
          name: ACTIVE_WORKSPACE_COOKIE_NAME,
          nodeEnvironment: process.env.NODE_ENV
        })
      );
    }

    return response;
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
