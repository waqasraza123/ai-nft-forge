import { NextResponse } from "next/server";

import {
  createOpsErrorResponse,
  requireActiveOpsApiSession
} from "../../../../../server/ops/http";
import { createRuntimeOpsService } from "../../../../../server/ops/runtime-service";

export async function POST() {
  try {
    const session = await requireActiveOpsApiSession();
    const result = await createRuntimeOpsService().runReconciliation({
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
