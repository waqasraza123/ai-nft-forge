import { studioWorkspaceRoleEscalationCreateRequestSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createStudioSettingsErrorResponse,
  parseJsonBody,
  requireStudioActiveApiSession
} from "../../../../../server/studio-settings/http";
import { createRuntimeStudioSettingsService } from "../../../../../server/studio-settings/runtime";

export async function POST(request: Request) {
  try {
    const session = await requireStudioActiveApiSession();
    const body = studioWorkspaceRoleEscalationCreateRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeStudioSettingsService().requestWorkspaceRoleEscalation(
        {
          actorUserId: session.session.user.id,
          ownerUserId: session.ownerUserId,
          role: session.role,
          workspaceId: session.workspace?.id ?? null,
          ...(body.justification !== undefined
            ? {
                justification: body.justification
              }
            : {})
        }
      );

    return NextResponse.json(result, {
      status: 201
    });
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
