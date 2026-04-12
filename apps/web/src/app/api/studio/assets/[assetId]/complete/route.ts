import { NextResponse } from "next/server";

import {
  createSourceAssetErrorResponse,
  requireStudioActiveApiSession
} from "../../../../../../server/source-assets/http";
import { createRuntimeSourceAssetService } from "../../../../../../server/source-assets/runtime";

type RouteContext = {
  params: Promise<{
    assetId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  try {
    const session = await requireStudioActiveApiSession();
    const { assetId } = await context.params;
    const result = await createRuntimeSourceAssetService().completeUpload({
      assetId,
      workspaceId: session.workspace.id
    });

    return NextResponse.json(result);
  } catch (error) {
    return createSourceAssetErrorResponse(error);
  }
}
