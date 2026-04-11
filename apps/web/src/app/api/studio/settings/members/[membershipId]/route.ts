import { NextResponse } from "next/server";

import {
  createStudioSettingsErrorResponse,
  requireStudioOwnerApiSession
} from "../../../../../../server/studio-settings/http";
import { createRuntimeStudioSettingsService } from "../../../../../../server/studio-settings/runtime";

type RouteContext = {
  params: Promise<{
    membershipId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireStudioOwnerApiSession();
    const { membershipId } = await context.params;
    const result =
      await createRuntimeStudioSettingsService().removeWorkspaceMember({
        membershipId,
        ownerUserId: session.ownerUserId,
        role: session.role
      });

    return NextResponse.json(result);
  } catch (error) {
    return createStudioSettingsErrorResponse(error);
  }
}
