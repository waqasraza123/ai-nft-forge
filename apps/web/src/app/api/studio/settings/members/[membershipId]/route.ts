import { studioWorkspaceMemberUpdateRequestSchema } from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createStudioSettingsErrorResponse,
  parseJsonBody,
  requireStudioActiveOwnerApiSession
} from "../../../../../../server/studio-settings/http";
import { createRuntimeStudioSettingsService } from "../../../../../../server/studio-settings/runtime";

type RouteContext = {
  params: Promise<{
    membershipId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireStudioActiveOwnerApiSession();
    const { membershipId } = await context.params;
    const result =
      await createRuntimeStudioSettingsService().removeWorkspaceMember({
        membershipId,
        ownerUserId: session.ownerUserId,
        role: session.role,
        workspaceId: session.workspace?.id ?? null
      });

    return NextResponse.json(result);
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireStudioActiveOwnerApiSession();
    const { membershipId } = await context.params;
    const body = studioWorkspaceMemberUpdateRequestSchema.parse(
      await parseJsonBody(request)
    );
    const result =
      await createRuntimeStudioSettingsService().updateWorkspaceMemberRole({
        memberRole: body.role,
        membershipId,
        ownerUserId: session.ownerUserId,
        role: session.role,
        workspaceId: session.workspace?.id ?? null
      });

    return NextResponse.json(result);
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
