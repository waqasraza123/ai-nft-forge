import {
  opsAlertEscalationPolicyRequestSchema,
  type OpsAlertEscalationPolicyRequest
} from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createOpsErrorResponse,
  requireOpsOwnerApiSession
} from "../../../../server/ops/http";
import { createRuntimeOpsService } from "../../../../server/ops/runtime-service";

async function parseAlertEscalationPolicyRequest(
  request: Request
): Promise<OpsAlertEscalationPolicyRequest> {
  const payload = await request.json();

  return opsAlertEscalationPolicyRequestSchema.parse(payload);
}

export async function POST(request: Request) {
  try {
    const session = await requireOpsOwnerApiSession();
    const payload = await parseAlertEscalationPolicyRequest(request);
    const result = await createRuntimeOpsService().updateAlertEscalationPolicy({
      firstReminderDelayMinutes: payload.firstReminderDelayMinutes,
      ownerUserId: session.ownerUserId,
      repeatReminderIntervalMinutes: payload.repeatReminderIntervalMinutes,
      workspaceId: session.workspace.id
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
    const session = await requireOpsOwnerApiSession();
    const result = await createRuntimeOpsService().resetAlertEscalationPolicy({
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
