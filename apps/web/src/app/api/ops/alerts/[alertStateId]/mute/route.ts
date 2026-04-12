import {
  opsAlertMuteRequestSchema,
  type OpsAlertMuteRequest
} from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createOpsErrorResponse,
  requireOpsApiSession
} from "../../../../../../server/ops/http";
import { createRuntimeOpsService } from "../../../../../../server/ops/runtime-service";

type MuteAlertRouteContext = {
  params: Promise<{
    alertStateId: string;
  }>;
};

async function parseMuteRequest(
  request: Request
): Promise<OpsAlertMuteRequest> {
  const payload = await request.json();

  return opsAlertMuteRequestSchema.parse(payload);
}

export async function POST(request: Request, context: MuteAlertRouteContext) {
  try {
    const session = await requireOpsApiSession();
    const { alertStateId } = await context.params;
    const payload = await parseMuteRequest(request);
    const result = await createRuntimeOpsService().muteAlert({
      alertStateId,
      durationHours: payload.durationHours,
      ownerUserId: session.ownerUserId,
      workspaceId: session.workspace.id
    });

    return NextResponse.json(result, {
      status: 200
    });
  } catch (error) {
    return createOpsErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  context: MuteAlertRouteContext
) {
  try {
    const session = await requireOpsApiSession();
    const { alertStateId } = await context.params;
    const result = await createRuntimeOpsService().unmuteAlert({
      alertStateId,
      ownerUserId: session.ownerUserId,
      workspaceId: session.workspace.id
    });

    return NextResponse.json(result, {
      status: 200
    });
  } catch (error) {
    return createOpsErrorResponse(error);
  }
}
