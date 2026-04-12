import {
  opsAlertRoutingPolicyRequestSchema,
  type OpsAlertRoutingPolicyRequest
} from "@ai-nft-forge/shared";
import { NextResponse } from "next/server";

import {
  createOpsErrorResponse,
  requireOpsOwnerApiSession
} from "../../../../server/ops/http";
import { createRuntimeOpsService } from "../../../../server/ops/runtime-service";

async function parseAlertRoutingPolicyRequest(
  request: Request
): Promise<OpsAlertRoutingPolicyRequest> {
  const payload = await request.json();

  return opsAlertRoutingPolicyRequestSchema.parse(payload);
}

export async function POST(request: Request) {
  try {
    const session = await requireOpsOwnerApiSession();
    const payload = await parseAlertRoutingPolicyRequest(request);
    const result = await createRuntimeOpsService().updateAlertRoutingPolicy({
      ownerUserId: session.ownerUserId,
      webhookMode: payload.webhookMode,
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
    const result = await createRuntimeOpsService().resetAlertRoutingPolicy({
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
