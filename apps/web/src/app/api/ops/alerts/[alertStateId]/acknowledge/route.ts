import { NextResponse } from "next/server";

import {
  createOpsErrorResponse,
  requireOpsApiSession
} from "../../../../../../server/ops/http";
import { createRuntimeOpsService } from "../../../../../../server/ops/runtime-service";

type AcknowledgeAlertRouteContext = {
  params: Promise<{
    alertStateId: string;
  }>;
};

export async function POST(
  _request: Request,
  context: AcknowledgeAlertRouteContext
) {
  try {
    const session = await requireOpsApiSession();
    const { alertStateId } = await context.params;
    const result = await createRuntimeOpsService().acknowledgeAlert({
      alertStateId,
      ownerUserId: session.ownerUserId
    });

    return NextResponse.json(result, {
      status: 200
    });
  } catch (error) {
    return createOpsErrorResponse(error);
  }
}
