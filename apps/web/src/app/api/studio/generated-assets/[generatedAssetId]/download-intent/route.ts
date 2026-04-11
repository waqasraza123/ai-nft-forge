import { NextResponse } from "next/server";

import {
  createGeneratedAssetErrorResponse,
  requireStudioApiSession
} from "../../../../../../server/generated-assets/http";
import { createRuntimeGeneratedAssetService } from "../../../../../../server/generated-assets/runtime";

type RouteContext = {
  params: Promise<{
    generatedAssetId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  try {
    const session = await requireStudioApiSession();
    const { generatedAssetId } = await context.params;
    const result =
      await createRuntimeGeneratedAssetService().createDownloadIntent({
        generatedAssetId,
        ownerUserId: session.ownerUserId
      });

    return NextResponse.json(result);
  } catch (error) {
    return createGeneratedAssetErrorResponse(error);
  }
}
