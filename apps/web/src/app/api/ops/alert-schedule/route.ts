import {
  opsAlertSchedulePolicyRequestSchema,
  type OpsAlertSchedulePolicyRequest
} from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createOpsErrorResponse,
  requireOpsApiSession
} from "../../../../server/ops/http";
import { createRuntimeOpsService } from "../../../../server/ops/runtime-service";

async function parseAlertSchedulePolicyRequest(
  request: Request
): Promise<OpsAlertSchedulePolicyRequest> {
  const payload = await request.json();

  return opsAlertSchedulePolicyRequestSchema.parse(payload);
}

export async function POST(request: Request) {
  try {
    const session = await requireOpsApiSession();
    const payload = await parseAlertSchedulePolicyRequest(request);
    const result = await createRuntimeOpsService().updateAlertSchedulePolicy({
      activeDays: payload.activeDays,
      endMinuteOfDay: payload.endMinuteOfDay,
      ownerUserId: session.user.id,
      startMinuteOfDay: payload.startMinuteOfDay,
      timezone: payload.timezone
    });

    return NextResponse.json(result, {
      status: 200
    });
  } catch (error) {
    return createOpsErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    const session = await requireOpsApiSession();
    const result = await createRuntimeOpsService().resetAlertSchedulePolicy({
      ownerUserId: session.user.id
    });

    return NextResponse.json(result, {
      status: 200
    });
  } catch (error) {
    return createOpsErrorResponse(error);
  }
}
