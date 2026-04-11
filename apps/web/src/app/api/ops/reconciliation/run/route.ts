import { NextResponse } from "next/server";

import {
  createOpsErrorResponse,
  requireOpsApiSession
} from "../../../../../server/ops/http";
import { createRuntimeOpsService } from "../../../../../server/ops/runtime-service";

export async function POST() {
  try {
    const session = await requireOpsApiSession();
    const result = await createRuntimeOpsService().runReconciliation({
      ownerUserId: session.ownerUserId
    });

    return NextResponse.json(result, {
      status: 200
    });
  } catch (error) {
    return createOpsErrorResponse(error);
  }
}
