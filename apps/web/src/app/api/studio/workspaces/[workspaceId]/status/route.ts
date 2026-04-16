import {
  studioWorkspaceStatusUpdateRequestSchema,
  studioWorkspaceStatusUpdateResponseSchema
} from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createClearedWorkspaceSelectionCookieDefinition,
  createWorkspaceSelectionCookieDefinition
} from "../../../../../../lib/session/cookie";
import {
  ACTIVE_WORKSPACE_COOKIE_NAME,
  createRuntimeStudioAccessService
} from "../../../../../../server/studio/access";
import {
  createStudioSettingsErrorResponse,
  parseJsonBody,
  requireStudioOwnerApiSession
} from "../../../../../../server/studio-settings/http";
import { createRuntimeStudioSettingsService } from "../../../../../../server/studio-settings/runtime";
import { resolvePreferredAccessibleWorkspace } from "../../../../../../server/studio/workspace-state";

const workspaceSelectionCookieDurationDays = 365;

type RouteContext = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await requireStudioOwnerApiSession();
    const { workspaceId } = await context.params;
    const body = studioWorkspaceStatusUpdateRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeStudioSettingsService().updateWorkspaceStatus({
        ownerUserId: session.ownerUserId,
        role: session.role,
        status: body.status,
        workspaceId
      });
    const response = NextResponse.json(
      studioWorkspaceStatusUpdateResponseSchema.parse(result)
    );

    if (session.workspace?.id === workspaceId) {
      const accessibleWorkspaces =
        await createRuntimeStudioAccessService().listAccessibleWorkspacesForSession(
          {
            session: session.session
          }
        );
      const preferredWorkspace =
        body.status === "active"
          ? (accessibleWorkspaces.find(
              (workspace) => workspace.id === workspaceId
            ) ?? null)
          : resolvePreferredAccessibleWorkspace(
              accessibleWorkspaces.filter(
                (workspace) => workspace.id !== workspaceId
              )
            );

      if (preferredWorkspace) {
        response.cookies.set(
          createWorkspaceSelectionCookieDefinition({
            expiresAt: new Date(
              Date.now() +
                workspaceSelectionCookieDurationDays * 24 * 60 * 60 * 1000
            ),
            name: ACTIVE_WORKSPACE_COOKIE_NAME,
            nodeEnvironment: process.env.NODE_ENV,
            value: preferredWorkspace.slug
          })
        );
      } else if (body.status !== "active") {
        response.cookies.set(
          createClearedWorkspaceSelectionCookieDefinition({
            name: ACTIVE_WORKSPACE_COOKIE_NAME,
            nodeEnvironment: process.env.NODE_ENV
          })
        );
      }
    }

    return response;
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
