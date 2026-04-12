import { NextResponse } from "next/server";

import {
  createOpsErrorResponse,
  requireActiveOpsApiSession
} from "../../../../../../../server/ops/http";
import { createRuntimeOpsService } from "../../../../../../../server/ops/runtime-service";

type IgnoreReconciliationIssueRouteContext = {
  params: Promise<{
    issueId: string;
  }>;
};

export async function POST(
  _request: Request,
  context: IgnoreReconciliationIssueRouteContext
) {
  try {
    const session = await requireActiveOpsApiSession();
    const { issueId } = await context.params;
    const result = await createRuntimeOpsService().ignoreReconciliationIssue({
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
