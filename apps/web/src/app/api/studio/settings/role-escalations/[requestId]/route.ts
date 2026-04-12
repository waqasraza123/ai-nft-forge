import { NextResponse } from "next/server";

import {
  createStudioSettingsErrorResponse,
  requireStudioActiveApiSession
} from "../../../../../../server/studio-settings/http";
import { createRuntimeStudioSettingsService } from "../../../../../../server/studio-settings/runtime";

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireStudioActiveApiSession();
    const { requestId } = await context.params;
    const result =
      await createRuntimeStudioSettingsService().cancelWorkspaceRoleEscalation({
        actorUserId: session.session.user.id,
        ownerUserId: session.ownerUserId,
        requestId,
        role: session.role,
        workspaceId: session.workspace?.id ?? null
      });

    return NextResponse.json(result);
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
