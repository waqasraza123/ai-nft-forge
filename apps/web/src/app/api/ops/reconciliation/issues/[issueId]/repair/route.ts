import { NextResponse } from "next/server";

import {
  createOpsErrorResponse,
  requireOpsApiSession
} from "../../../../../../../server/ops/http";
import { createRuntimeOpsService } from "../../../../../../../server/ops/runtime-service";

type RepairReconciliationIssueRouteContext = {
  params: Promise<{
    issueId: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RepairReconciliationIssueRouteContext
) {
  try {
    const session = await requireOpsApiSession();
    const { issueId } = await context.params;
    const result = await createRuntimeOpsService().repairReconciliationIssue({
      issueId,
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
