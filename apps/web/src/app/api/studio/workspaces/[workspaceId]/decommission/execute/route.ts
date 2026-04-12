import {
  workspaceDecommissionExecuteRequestSchema,
  workspaceDecommissionExecutionResponseSchema
} from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createClearedWorkspaceSelectionCookieDefinition,
  createWorkspaceSelectionCookieDefinition
} from "../../../../../../../lib/session/cookie";
import {
  ACTIVE_WORKSPACE_COOKIE_NAME,
  createRuntimeStudioAccessService
} from "../../../../../../../server/studio/access";
import {
  createStudioSettingsErrorResponse,
  parseJsonBody,
  requireStudioOwnerApiSession
} from "../../../../../../../server/studio-settings/http";
import { resolvePreferredAccessibleWorkspace } from "../../../../../../../server/studio/workspace-state";
import { createRuntimeWorkspaceDecommissionService } from "../../../../../../../server/workspaces/decommission-service";

const workspaceSelectionCookieDurationDays = 365;

type RouteContext = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await requireStudioOwnerApiSession();
    const { workspaceId } = await context.params;
    const body = workspaceDecommissionExecuteRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeWorkspaceDecommissionService().executeWorkspaceDecommission(
        {
          ...body,
          ownerUserId: session.ownerUserId,
          workspaceId
        }
      );
    const response = NextResponse.json(
      workspaceDecommissionExecutionResponseSchema.parse(result)
    );

    if (session.workspace?.id === workspaceId) {
      const accessibleWorkspaces =
        await createRuntimeStudioAccessService().listAccessibleWorkspacesForSession(
          {
            session: session.session
          }
        );
      const preferredWorkspace =
        resolvePreferredAccessibleWorkspace(accessibleWorkspaces);

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
      } else {
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
