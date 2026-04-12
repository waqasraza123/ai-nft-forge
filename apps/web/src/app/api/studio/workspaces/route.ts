import {
  studioWorkspaceCreateRequestSchema,
  studioWorkspaceCreateResponseSchema
} from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import { createWorkspaceSelectionCookieDefinition } from "../../../../lib/session/cookie";
import { ACTIVE_WORKSPACE_COOKIE_NAME } from "../../../../server/studio/access";
import {
  createStudioSettingsErrorResponse,
  parseJsonBody,
  requireStudioOwnerApiSession
} from "../../../../server/studio-settings/http";
import { createRuntimeStudioSettingsService } from "../../../../server/studio-settings/runtime";

const workspaceSelectionCookieDurationDays = 365;

export async function POST(request: Request) {
  try {
    const session = await requireStudioOwnerApiSession();
    const body = studioWorkspaceCreateRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result = await createRuntimeStudioSettingsService().createWorkspace({
      brandName: body.brandName,
      brandSlug: body.brandSlug,
      ownerUserId: session.ownerUserId,
      role: session.role,
      workspaceName: body.workspaceName,
      workspaceSlug: body.workspaceSlug,
      ...(body.accentColor !== undefined
        ? {
            accentColor: body.accentColor
          }
        : {}),
      ...(body.themePreset !== undefined
        ? {
            themePreset: body.themePreset
          }
        : {})
    });
    const response = NextResponse.json(
      studioWorkspaceCreateResponseSchema.parse(result)
    );

    response.cookies.set(
      createWorkspaceSelectionCookieDefinition({
        expiresAt: new Date(
          Date.now() +
            workspaceSelectionCookieDurationDays * 24 * 60 * 60 * 1000
        ),
        name: ACTIVE_WORKSPACE_COOKIE_NAME,
        nodeEnvironment: process.env.NODE_ENV,
        value: result.workspace.slug
      })
    );

    return response;
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
