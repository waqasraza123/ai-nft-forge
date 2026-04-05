import { NextResponse } from "next/server";

import {
  createSourceAssetErrorResponse,
  requireStudioApiSession
} from "../../../../../../server/source-assets/http";
import { createRuntimeSourceAssetService } from "../../../../../../server/source-assets/runtime";

type RouteContext = {
  params: Promise<{
    assetId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  try {
    const session = await requireStudioApiSession();
    const { assetId } = await context.params;
    const result = await createRuntimeSourceAssetService().completeUpload({
      assetId,
      ownerUserId: session.user.id
    });

    return NextResponse.json(result);
  } catch (error) {
    return createSourceAssetErrorResponse(error);
  }
}
