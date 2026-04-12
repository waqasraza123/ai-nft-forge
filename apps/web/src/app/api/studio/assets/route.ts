import { NextResponse } from "next/server";

import {
  createSourceAssetErrorResponse,
  requireStudioApiSession
} from "../../../../server/source-assets/http";
import { createRuntimeSourceAssetService } from "../../../../server/source-assets/runtime";

export async function GET() {
  try {
    const session = await requireStudioApiSession();
    const result = await createRuntimeSourceAssetService().listSourceAssets({
      workspaceId: session.workspace.id
    });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return createSourceAssetErrorResponse(error);
  }
}
