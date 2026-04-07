import { NextResponse } from "next/server";

import {
  createOpsErrorResponse,
  requireOpsApiSession
} from "../../../../../server/ops/http";
import { createRuntimeOpsService } from "../../../../../server/ops/runtime-service";

type ClearAlertMuteRouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function DELETE(
  _request: Request,
  context: ClearAlertMuteRouteContext
) {
  try {
    const session = await requireOpsApiSession();
    const { code } = await context.params;
    const result = await createRuntimeOpsService().unmuteAlertByCode({
      code,
      ownerUserId: session.user.id
    });

    return NextResponse.json(result, {
      status: 200
    });
  } catch (error) {
    return createOpsErrorResponse(error);
  }
}
