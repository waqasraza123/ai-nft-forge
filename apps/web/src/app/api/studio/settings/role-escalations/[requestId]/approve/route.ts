import { NextResponse } from "next/server";

import {
  createStudioSettingsErrorResponse,
  requireStudioOwnerApiSession
} from "../../../../../../../server/studio-settings/http";
import { createRuntimeStudioSettingsService } from "../../../../../../../server/studio-settings/runtime";

type RouteContext = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireStudioOwnerApiSession();
    const { requestId } = await context.params;
    const result =
      await createRuntimeStudioSettingsService().approveWorkspaceRoleEscalation(
        {
          ownerUserId: session.ownerUserId,
          requestId,
          role: session.role,
          workspaceId: session.workspace?.id ?? null
        }
      );

    return NextResponse.json(result);
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
