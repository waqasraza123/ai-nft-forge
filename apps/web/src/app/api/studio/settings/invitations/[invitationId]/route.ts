import { NextResponse } from "next/server";

import {
  createStudioSettingsErrorResponse,
  requireStudioActiveOwnerApiSession
} from "../../../../../../server/studio-settings/http";
import { createRuntimeStudioSettingsService } from "../../../../../../server/studio-settings/runtime";

type RouteContext = {
  params: Promise<{
    invitationId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireStudioActiveOwnerApiSession();
    const { invitationId } = await context.params;
    const result =
      await createRuntimeStudioSettingsService().remindWorkspaceInvitation({
        invitationId,
        ownerUserId: session.ownerUserId,
        role: session.role,
        workspaceId: session.workspace?.id ?? null
      });

    return NextResponse.json(result);
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireStudioActiveOwnerApiSession();
    const { invitationId } = await context.params;
    const result =
      await createRuntimeStudioSettingsService().cancelWorkspaceInvitation({
        invitationId,
        ownerUserId: session.ownerUserId,
        role: session.role,
        workspaceId: session.workspace?.id ?? null
      });

    return NextResponse.json(result);
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
